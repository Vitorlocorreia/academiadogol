'use server'

import { requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// ─── Schemas ────────────────────────────────────────────────────────────────

const contractSchema = z.object({
  customer_name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  customer_phone: z.string().min(8, 'Telefone inválido').transform((val) => val.replace(/\D/g, '')),
  customer_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  secondary_name: z.string().optional().or(z.literal('')),
  secondary_phone: z.string().optional().or(z.literal('')).transform((val) => (val ? val.replace(/\D/g, '') : '')),
  field_id: z.string().uuid('Campo obrigatório'),
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  monthly_amount: z.coerce.number().min(0, 'Valor mensal inválido'),
  starts_at: z.string().transform((val) => {
    const parts = val.trim().split('-')
    if (parts.length === 3) {
      let year = parseInt(parts[0], 10)
      if (year < 100) year += 2000
      else if (year < 2000) year = 2026
      return `${year}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    }
    return val
  }),
  ends_at: z.string().optional().or(z.literal('')).transform((val) => {
    if (!val) return ''
    const parts = val.trim().split('-')
    if (parts.length === 3) {
      let year = parseInt(parts[0], 10)
      if (year < 100) year += 2000
      else if (year < 2000) year = 2026
      return `${year}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    }
    return val
  }),
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Calcula duração em minutos entre dois horários HH:MM
function calcDuration(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

// Gera datas futuras para um determinado dia da semana a partir de uma data de início
// até um limite de semanas (default: 52 semanas = 1 ano)
function generateFutureDates(
  dayOfWeek: number,
  startsAt: string,
  endsAt: string | null,
  maxWeeks = 52
): string[] {
  const dates: string[] = []
  const start = new Date(startsAt + 'T12:00:00')
  const limit = endsAt ? new Date(endsAt + 'T12:00:00') : null

  // Avança até o próximo dia da semana desejado
  const current = new Date(start)
  // Encontra o primeiro dia da semana correto a partir de starts_at (inclusive)
  while (current.getDay() !== dayOfWeek) {
    current.setDate(current.getDate() + 1)
  }

  let count = 0
  while (count < maxWeeks) {
    const dateStr = current.toISOString().split('T')[0]
    if (limit && current > limit) break
    dates.push(dateStr)
    current.setDate(current.getDate() + 7)
    count++
  }

  return dates
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export interface ContractSchedule {
  field_id: string
  day_of_week: number
  start_time: string
  end_time: string
  duration_minutes: number
  field_name?: string
}

function parseContractSchedules(contract: any): ContractSchedule[] {
  const primaryDuration =
    contract.duration_minutes ||
    (contract.start_time && contract.end_time ? calcDuration(contract.start_time, contract.end_time) : 60)

  const primarySlot: ContractSchedule = {
    field_id: contract.field_id,
    day_of_week: Number(contract.day_of_week ?? 0),
    start_time: contract.start_time || '00:00',
    end_time: contract.end_time || '00:00',
    duration_minutes: primaryDuration,
    field_name: contract.field?.name,
  }

  // 1. Se schedules já existir no contrato como array válido
  if (Array.isArray(contract.schedules) && contract.schedules.length > 0) {
    return contract.schedules.map((s: any) => ({
      field_id: s.field_id || contract.field_id,
      day_of_week: Number(s.day_of_week),
      start_time: s.start_time,
      end_time: s.end_time,
      duration_minutes:
        s.duration_minutes || (s.start_time && s.end_time ? calcDuration(s.start_time, s.end_time) : 60),
      field_name: s.field_name,
    }))
  }

  // 2. Se estiver embutido no secondary_organizer_name
  if (contract.secondary_organizer_name && typeof contract.secondary_organizer_name === 'string' && contract.secondary_organizer_name.includes('__SCHEDULES__')) {
    try {
      const parts = contract.secondary_organizer_name.split('__SCHEDULES__')
      const extra = JSON.parse(parts[1] || '[]')
      if (Array.isArray(extra) && extra.length > 0) {
        return [
          primarySlot,
          ...extra.map((s: any) => ({
            field_id: s.field_id || contract.field_id,
            day_of_week: Number(s.day_of_week),
            start_time: s.start_time,
            end_time: s.end_time,
            duration_minutes:
              s.duration_minutes || (s.start_time && s.end_time ? calcDuration(s.start_time, s.end_time) : 60),
            field_name: s.field_name,
          })),
        ]
      }
    } catch {
      // fallback
    }
  }

  return [primarySlot]
}

function parseCleanSecondaryOrganizer(name: string | null | undefined): string | null {
  if (!name) return null
  if (name.includes('__SCHEDULES__')) {
    const clean = name.split('__SCHEDULES__')[0].trim()
    return clean || null
  }
  return name
}

export interface FieldContractStat {
  id: string
  name: string
  description?: string | null
  photo_urls: string[] | null
  hourly_rate: number
  is_active: boolean
  total_contracts: number
  active_contracts: number
  total_monthly_amount: number
}

// Busca todos os campos com contagem e faturamento de contratos
export async function getFieldsWithContractStats(): Promise<FieldContractStat[]> {
  const { supabase } = await requireAdmin()

  // 1. Busca todos os campos
  const { data: fields, error: fieldsError } = await supabase
    .from('fields')
    .select('id, name, description, photo_urls, hourly_rate, is_active')
    .order('name', { ascending: true })

  if (fieldsError) throw new Error(fieldsError.message)

  // 2. Busca contratos para agregação
  const { data: contracts, error: contractsError } = await supabase
    .from('fixed_contracts')
    .select('id, field_id, monthly_amount, is_active')

  if (contractsError) throw new Error(contractsError.message)

  const statsMap: Record<string, { total: number; active: number; amount: number }> = {}
  for (const c of contracts ?? []) {
    if (!statsMap[c.field_id]) {
      statsMap[c.field_id] = { total: 0, active: 0, amount: 0 }
    }
    statsMap[c.field_id].total += 1
    if (c.is_active) {
      statsMap[c.field_id].active += 1
      statsMap[c.field_id].amount += Number(c.monthly_amount || 0)
    }
  }

  return (fields ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    photo_urls: f.photo_urls,
    hourly_rate: Number(f.hourly_rate || 0),
    is_active: f.is_active ?? true,
    total_contracts: statsMap[f.id]?.total ?? 0,
    active_contracts: statsMap[f.id]?.active ?? 0,
    total_monthly_amount: statsMap[f.id]?.amount ?? 0,
  }))
}

// Busca contratos com joins de cliente e campo (opcionalmente filtrado por campo)
export async function getContracts(fieldId?: string) {
  const { supabase } = await requireAdmin()
  let query = supabase
    .from('fixed_contracts')
    .select('*, customer:customers(id, name, phone, email), field:fields(id, name, photo_urls)')
    .order('created_at', { ascending: false })

  if (fieldId && fieldId !== 'todos') {
    query = query.eq('field_id', fieldId)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  return (data ?? []).map((c) => ({
    ...c,
    secondary_organizer_name: parseCleanSecondaryOrganizer(c.secondary_organizer_name),
    schedules: parseContractSchedules(c),
  }))
}

// Busca um contrato específico por ID com seus pagamentos
export async function getContractById(id: string) {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from('fixed_contracts')
    .select('*, customer:customers(*), field:fields(*)')
    .eq('id', id)
    .single()

  if (error || !data) return null

  // Busca os nomes de campos caso algum schedule seja de outro campo
  const { data: allFields } = await supabase.from('fields').select('id, name')
  const fieldNameMap = new Map((allFields ?? []).map((f) => [f.id, f.name]))

  const rawSchedules = parseContractSchedules(data)
  const schedules = rawSchedules.map((s) => ({
    ...s,
    field_name: fieldNameMap.get(s.field_id) || s.field_name || data.field?.name,
  }))

  return {
    ...data,
    secondary_organizer_name: parseCleanSecondaryOrganizer(data.secondary_organizer_name),
    schedules,
  }
}

// Busca mensalidades de um contrato
export async function getContractPayments(contractId: string) {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from('fixed_payments')
    .select('*')
    .eq('contract_id', contractId)
    .order('reference_month', { ascending: false })

  if (error) return []
  return data ?? []
}

// Busca campos ativos para o formulário
export async function getActiveFieldsForContract() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase
    .from('fields')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  return data ?? []
}

// Cria um novo contrato fixo e gera os blocked_slots automáticos para todos os dias/horários
export async function createContractAction(
  _prev: { error: string; success?: boolean } | null,
  formData: FormData
) {
  const { supabase } = await requireAdmin()

  const raw = {
    customer_name: formData.get('customer_name'),
    customer_phone: formData.get('customer_phone'),
    customer_email: formData.get('customer_email') ?? '',
    secondary_name: formData.get('secondary_name') ?? '',
    secondary_phone: formData.get('secondary_phone') ?? '',
    field_id: formData.get('field_id'),
    day_of_week: formData.get('day_of_week'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    monthly_amount: formData.get('monthly_amount'),
    starts_at: formData.get('starts_at'),
    ends_at: formData.get('ends_at') ?? '',
  }

  const parsed = contractSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const {
    customer_name,
    customer_phone,
    customer_email,
    secondary_name,
    secondary_phone,
    field_id,
    day_of_week,
    start_time,
    end_time,
    monthly_amount,
    starts_at,
    ends_at,
  } = parsed.data

  if (start_time >= end_time) {
    return { error: 'O horário de início do 1º slot deve ser menor que o horário de término.' }
  }

  // Processa slots/peladas adicionais caso tenham sido cadastrados
  const additionalRaw = formData.get('additional_schedules')
  let additionalSlots: Array<{
    field_id: string
    day_of_week: number
    start_time: string
    end_time: string
    duration_minutes: number
  }> = []

  if (additionalRaw && typeof additionalRaw === 'string') {
    try {
      const parsedAdd = JSON.parse(additionalRaw)
      if (Array.isArray(parsedAdd)) {
        for (let i = 0; i < parsedAdd.length; i++) {
          const item = parsedAdd[i]
          if (!item.field_id || item.day_of_week === undefined || !item.start_time || !item.end_time) {
            return { error: `Preencha todos os campos da pelada adicional nº ${i + 2}.` }
          }
          if (item.start_time >= item.end_time) {
            return { error: `Na pelada adicional nº ${i + 2}, o início deve ser menor que o término.` }
          }
          additionalSlots.push({
            field_id: String(item.field_id),
            day_of_week: Number(item.day_of_week),
            start_time: String(item.start_time),
            end_time: String(item.end_time),
            duration_minutes: calcDuration(item.start_time, item.end_time),
          })
        }
      }
    } catch {
      return { error: 'Formato inválido de horários adicionais.' }
    }
  }

  const duration_minutes = calcDuration(start_time, end_time)
  const endsAtValue = ends_at || null

  const primarySlot: ContractSchedule = {
    field_id,
    day_of_week,
    start_time,
    end_time,
    duration_minutes,
  }

  const allSchedules: ContractSchedule[] = [primarySlot, ...additionalSlots]

  // 1. Upsert do cliente pelo telefone
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .upsert(
      {
        phone: customer_phone,
        name: customer_name,
        email: customer_email || null,
      },
      { onConflict: 'phone' }
    )
    .select('id')
    .single()

  if (custErr || !customer) {
    return { error: 'Erro ao registrar cliente: ' + (custErr?.message ?? '') }
  }

  // Prepara os dados de organizador secundário com schedules embutidos para compatibilidade retroativa
  let secNameCombined = secondary_name ? secondary_name.trim() : ''
  if (additionalSlots.length > 0) {
    secNameCombined = `${secNameCombined}__SCHEDULES__${JSON.stringify(additionalSlots)}`
  }

  const isCourtesy = formData.get('is_courtesy') === 'true' || formData.get('is_courtesy') === 'on' || monthly_amount === 0
  const finalMonthlyAmount = isCourtesy ? 0 : monthly_amount

  // 2. Cria o contrato
  const baseContractData = {
    customer_id: customer.id,
    field_id,
    day_of_week,
    start_time,
    end_time,
    duration_minutes,
    monthly_amount: finalMonthlyAmount,
    starts_at,
    ends_at: endsAtValue,
    secondary_organizer_name: secNameCombined || null,
    secondary_organizer_phone: secondary_phone ? secondary_phone.trim() : null,
    is_active: true,
  }

  // Tenta salvar com o campo schedules (caso a migration já tenha sido aplicada)
  let contractResult = await supabase
    .from('fixed_contracts')
    .insert({
      ...baseContractData,
      schedules: allSchedules,
    })
    .select('id')
    .single()

  // Se der erro por ausência da coluna schedules no banco, insere o baseContractData normalmente
  if (
    contractResult.error &&
    contractResult.error.message.includes('column') &&
    contractResult.error.message.includes('schedules')
  ) {
    contractResult = await supabase
      .from('fixed_contracts')
      .insert(baseContractData)
      .select('id')
      .single()
  }

  if (contractResult.error || !contractResult.data) {
    return { error: 'Erro ao criar contrato: ' + (contractResult.error?.message ?? '') }
  }

  const contract = contractResult.data

  // 3. Gera bloqueios automáticos na agenda para TODOS os slots/peladas
  const allBlockedSlots: Array<{
    field_id: string
    date: string
    start_time: string
    end_time: string
    reason: string
    is_recurring: boolean
  }> = []

  for (let idx = 0; idx < allSchedules.length; idx++) {
    const slot = allSchedules[idx]
    const dates = generateFutureDates(slot.day_of_week, starts_at, endsAtValue)
    const slotLabel = allSchedules.length > 1 ? ` (Pelada ${idx + 1})` : ''
    for (const d of dates) {
      allBlockedSlots.push({
        field_id: slot.field_id,
        date: d,
        start_time: slot.start_time,
        end_time: slot.end_time,
        reason: `Contrato Fixo — cliente ${customer_name}${slotLabel}`,
        is_recurring: false,
      })
    }
  }

  if (allBlockedSlots.length > 0) {
    // Insere em lotes de 100 para evitar limites do payload
    for (let i = 0; i < allBlockedSlots.length; i += 100) {
      const batch = allBlockedSlots.slice(i, i + 100)
      const { error: slotsErr } = await supabase.from('blocked_slots').insert(batch)
      if (slotsErr) {
        console.error('Erro ao gerar bloqueios automáticos:', slotsErr.message)
      }
    }
  }

  // 4. Gera uma ÚNICA mensalidade do mês corrente cobrindo todo o contrato
  const nowBrt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const refMonth = `${nowBrt.slice(0, 7)}-01`

  await supabase.from('fixed_payments').insert({
    contract_id: contract.id,
    reference_month: refMonth,
    amount: finalMonthlyAmount,
    status: isCourtesy ? 'paid' : 'pending',
    payment_method: isCourtesy ? 'Cortesia' : null,
    paid_at: isCourtesy ? new Date().toISOString() : null,
  })

  revalidatePath('/admin/contratos')
  redirect('/admin/contratos')
}

// Encerrar um contrato (is_active = false) e remover bloqueios futuros da agenda
export async function deactivateContractAction(id: string) {
  const { supabase } = await requireAdmin()

  const { data: contract } = await supabase
    .from('fixed_contracts')
    .select('*, customer:customers(name)')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('fixed_contracts')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return { error: error.message }

  if (contract) {
    const todayBrt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
    const schedules = parseContractSchedules(contract)

    for (const sched of schedules) {
      await supabase
        .from('blocked_slots')
        .delete()
        .eq('field_id', sched.field_id)
        .eq('start_time', sched.start_time)
        .eq('end_time', sched.end_time)
        .gte('date', todayBrt)
    }

    if (contract.customer?.name) {
      await supabase
        .from('blocked_slots')
        .delete()
        .ilike('reason', `%Contrato Fixo%${contract.customer.name}%`)
        .gte('date', todayBrt)
    }
  }

  revalidatePath('/admin/contratos')
  revalidatePath(`/admin/contratos/${id}`)
  revalidatePath('/admin/agenda')
  return { success: true }
}

// Marcar mensalidade como paga
export async function markPaymentPaidAction(
  paymentId: string,
  method: string,
  contractId: string
) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('fixed_payments')
    .update({
      status: 'paid',
      payment_method: method,
      paid_at: new Date().toISOString(),
    })
    .eq('id', paymentId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/contratos/${contractId}`)
  return { success: true }
}

// Gera mensalidade do próximo mês para um contrato ativo
export async function generateNextMonthPaymentAction(
  contractId: string,
  monthlyAmount: number
) {
  const { supabase } = await requireAdmin()

  // Calcula o próximo mês de forma segura independente de fuso horário
  const nowBrt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const [year, month] = nowBrt.split('-').map(Number)
  const nextYear = month === 12 ? year + 1 : year
  const nextMonthNum = month === 12 ? 1 : month + 1
  const refMonth = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}-01`

  // Verifica se já existe para não duplicar
  const { data: existing } = await supabase
    .from('fixed_payments')
    .select('id')
    .eq('contract_id', contractId)
    .eq('reference_month', refMonth)
    .single()

  if (existing) {
    return { error: 'Mensalidade já gerada para este mês.' }
  }

  const { error } = await supabase.from('fixed_payments').insert({
    contract_id: contractId,
    reference_month: refMonth,
    amount: monthlyAmount,
    status: 'pending',
  })

  if (error) return { error: error.message }

  revalidatePath(`/admin/contratos/${contractId}`)
  return { success: true }
}

// Atualiza organizadores do contrato (1º e 2º organizador)
export async function updateContractOrganizersAction(
  contractId: string,
  data: {
    customer_name: string
    customer_phone: string
    customer_email?: string
    secondary_name?: string
    secondary_phone?: string
  }
) {
  const { supabase } = await requireAdmin()

  // 1. Obtém o contrato para identificar o customer_id
  const { data: contract, error: contractErr } = await supabase
    .from('fixed_contracts')
    .select('customer_id')
    .eq('id', contractId)
    .single()

  if (contractErr || !contract) {
    return { error: 'Contrato não encontrado.' }
  }

  // 2. Atualiza os dados do 1º Organizador (cliente titular)
  const cleanPhone = data.customer_phone.replace(/\D/g, '')
  if (contract.customer_id) {
    const { error: custErr } = await supabase
      .from('customers')
      .update({
        name: data.customer_name.trim(),
        phone: cleanPhone,
        email: data.customer_email?.trim() || null,
      })
      .eq('id', contract.customer_id)

    if (custErr) {
      return { error: 'Erro ao atualizar titular: ' + custErr.message }
    }
  }

  // 3. Atualiza os dados do 2º Organizador no contrato preservando schedules se existirem
  const { data: existingContract } = await supabase
    .from('fixed_contracts')
    .select('secondary_organizer_name')
    .eq('id', contractId)
    .single()

  let finalSecName = data.secondary_name?.trim() || ''
  if (existingContract?.secondary_organizer_name?.includes('__SCHEDULES__')) {
    const schedSuffix = existingContract.secondary_organizer_name.slice(
      existingContract.secondary_organizer_name.indexOf('__SCHEDULES__')
    )
    finalSecName = `${finalSecName}${schedSuffix}`
  }

  const cleanSecPhone = data.secondary_phone ? data.secondary_phone.replace(/\D/g, '') : null
  const { error: updErr } = await supabase
    .from('fixed_contracts')
    .update({
      secondary_organizer_name: finalSecName || null,
      secondary_organizer_phone: cleanSecPhone || null,
    })
    .eq('id', contractId)

  if (updErr) {
    return { error: 'Erro ao atualizar segundo organizador: ' + updErr.message }
  }

  revalidatePath(`/admin/contratos/${contractId}`)
  revalidatePath('/admin/contratos')
  revalidatePath('/admin/agenda')
  return { success: true }
}

// Gera cobrança e PIX online no Asaas para uma mensalidade
export async function generateContractPaymentPixAction(paymentId: string) {
  try {
    const { getOrGenerateContractPix } = await import('@/lib/asaas/client')
    const pix = await getOrGenerateContractPix(paymentId)
    return { success: true, pix }
  } catch (err: any) {
    return { error: err.message || 'Erro ao gerar PIX da mensalidade' }
  }
}

// Verifica ativamente o status de pagamento da mensalidade no Asaas
export async function checkContractPaymentStatusAction(paymentId: string) {
  const { supabase } = await requireAdmin()
  const { data: payment } = await supabase
    .from('fixed_payments')
    .select('id, status, asaas_charge_id, contract_id')
    .eq('id', paymentId)
    .single()

  if (!payment) return { error: 'Mensalidade não encontrada' }
  if (payment.status === 'paid') return { isPaid: true }

  if (payment.asaas_charge_id) {
    const { checkAsaasPaymentStatus } = await import('@/lib/asaas/client')
    const check = await checkAsaasPaymentStatus(payment.asaas_charge_id)
    if (check.isPaid) {
      await supabase
        .from('fixed_payments')
        .update({
          status: 'paid',
          payment_method: 'PIX (Asaas)',
          paid_at: new Date().toISOString(),
        })
        .eq('id', paymentId)

      revalidatePath(`/admin/contratos/${payment.contract_id}`)
      revalidatePath('/admin/financeiro')
      return { isPaid: true }
    }
  }

  return { isPaid: false }
}
