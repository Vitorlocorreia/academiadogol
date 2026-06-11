'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// ─── Schemas ────────────────────────────────────────────────────────────────

const contractSchema = z.object({
  customer_name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  customer_phone: z.string().min(8, 'Telefone inválido'),
  customer_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  field_id: z.string().uuid('Campo obrigatório'),
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  monthly_amount: z.coerce.number().positive('Valor mensal obrigatório'),
  starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início inválida'),
  ends_at: z.string().optional().or(z.literal('')),
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

// Busca todos os contratos com joins de cliente e campo
export async function getContracts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fixed_contracts')
    .select('*, customer:customers(id, name, phone, email), field:fields(id, name)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

// Busca um contrato específico por ID com seus pagamentos
export async function getContractById(id: string) {
  const supabase = await createClient()
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
  const supabase = await createClient()
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
  const supabase = await createClient()
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
  const supabase = await createClient()

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

  // 4. Gera a mensalidade do mês corrente
  const now = new Date()
  const refMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]

  await supabase.from('fixed_payments').insert({
    contract_id: contract.id,
    reference_month: refMonth,
    amount: monthly_amount,
    status: 'pending',
  })

  revalidatePath('/admin/contratos')
  redirect('/admin/contratos')
}

// Encerrar um contrato (is_active = false)
export async function deactivateContractAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('fixed_contracts')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/contratos')
  return { success: true }
}

// Marcar mensalidade como paga
export async function markPaymentPaidAction(
  paymentId: string,
  method: string,
  contractId: string
) {
  const supabase = await createClient()
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
  const supabase = await createClient()

  // Calcula o próximo mês
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const refMonth = nextMonth.toISOString().split('T')[0]

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
