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
  field_id: z.string().uuid('Campo obrigatório'),
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  monthly_amount: z.coerce.number().positive('Valor mensal obrigatório'),
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
  return data ?? []
}

// Busca um contrato específico por ID com seus pagamentos
export async function getContractById(id: string) {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from('fixed_contracts')
    .select('*, customer:customers(*), field:fields(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data
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

// Cria um novo contrato fixo e gera os blocked_slots automáticos
export async function createContractAction(
  _prev: { error: string; success?: boolean } | null,
  formData: FormData
) {
  const { supabase } = await requireAdmin()

  const raw = {
    customer_name: formData.get('customer_name'),
    customer_phone: formData.get('customer_phone'),
    customer_email: formData.get('customer_email') ?? '',
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
    field_id,
    day_of_week,
    start_time,
    end_time,
    monthly_amount,
    starts_at,
    ends_at,
  } = parsed.data

  if (start_time >= end_time) {
    return { error: 'O horário de início deve ser menor que o horário de término.' }
  }

  const duration_minutes = calcDuration(start_time, end_time)
  const endsAtValue = ends_at || null

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

  // 2. Cria o contrato
  const { data: contract, error: contractErr } = await supabase
    .from('fixed_contracts')
    .insert({
      customer_id: customer.id,
      field_id,
      day_of_week,
      start_time,
      end_time,
      duration_minutes,
      monthly_amount,
      starts_at,
      ends_at: endsAtValue,
      is_active: true,
    })
    .select('id')
    .single()

  if (contractErr || !contract) {
    return { error: 'Erro ao criar contrato: ' + (contractErr?.message ?? '') }
  }

  // 3. Gera bloqueios automáticos na agenda para o próximo 1 ano (ou até ends_at)
  const dates = generateFutureDates(day_of_week, starts_at, endsAtValue)
  if (dates.length > 0) {
    const slots = dates.map((date) => ({
      field_id,
      date,
      start_time,
      end_time,
      reason: `Contrato Fixo — cliente ${customer_name}`,
      is_recurring: false,
    }))

    const { error: slotsErr } = await supabase.from('blocked_slots').insert(slots)
    if (slotsErr) {
      console.error('Erro ao gerar bloqueios automáticos:', slotsErr.message)
      // Não retorna erro ao usuário — contrato foi criado, apenas log
    }
  }

  // 4. Gera a mensalidade do mês corrente (fuso America/Sao_Paulo)
  const nowBrt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const refMonth = `${nowBrt.slice(0, 7)}-01`

  await supabase.from('fixed_payments').insert({
    contract_id: contract.id,
    reference_month: refMonth,
    amount: monthly_amount,
    status: 'pending',
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
    await supabase
      .from('blocked_slots')
      .delete()
      .eq('field_id', contract.field_id)
      .eq('start_time', contract.start_time)
      .eq('end_time', contract.end_time)
      .gte('date', todayBrt)
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
