'use server'

import { requireAdmin } from '@/lib/supabase/server'
import { getFieldPrice } from '@/lib/pricing'
import { getOccupiedSlots } from '@/app/(public)/actions'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const bookingSchema = z.object({
  field_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration_minutes: z.coerce.number().int().min(30).max(240),
  customer_name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  customer_phone: z.string().transform((v) => v.replace(/\D/g, '')).refine((v) => v.length >= 8, 'Telefone inválido'),
  customer_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

const blockSchema = z.object({
  field_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().optional().or(z.literal('')),
  is_recurring: z.boolean(),
  recur_day_of_week: z.number().int().min(0).max(6).nullable(),
})

// Busca dados consolidados para renderizar a agenda de um dia
export async function getAgendaData(dateStr: string) {
  const { supabase } = await requireAdmin()
  const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay()

  // 1. Configurações gerais
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .single()

  // 2. Todos os campos ativos
  const { data: fields } = await supabase
    .from('fields')
    .select('*')
    .eq('is_active', true)
    .order('name')

  // 3. Reservas ativas do dia (não canceladas)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, customer:customers(name, phone)')
    .eq('date', dateStr)
    .neq('status', 'cancelled')

  // 4. Bloqueios pontuais do dia
  const { data: pointBlocks } = await supabase
    .from('blocked_slots')
    .select('*')
    .eq('date', dateStr)
    .eq('is_recurring', false)

  // 5. Bloqueios recorrentes para o dia da semana
  const { data: recurBlocks } = await supabase
    .from('blocked_slots')
    .select('*')
    .eq('is_recurring', true)
    .eq('recur_day_of_week', dayOfWeek)

  // Filtra expirados
  const activeRecurBlocks = (recurBlocks ?? []).filter((b) => {
    if (!b.recur_ends_at) return true
    return b.recur_ends_at >= dateStr
  })

  // 6. Contratos fixos de mensalistas ativos para este dia da semana e vigência
  const { data: fixedContracts } = await supabase
    .from('fixed_contracts')
    .select('id, field_id, start_time, end_time, starts_at, ends_at, secondary_organizer_name, secondary_organizer_phone, customer:customers(name, phone)')
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)

  const activeFixedContracts = (fixedContracts ?? []).filter((c) => {
    if (c.starts_at && c.starts_at > dateStr) return false
    if (c.ends_at && c.ends_at < dateStr) return false
    return true
  })

  // Filtra bloqueios pontuais que sejam duplicatas de contratos fixos já carregados dinamicamente
  const nonContractPointBlocks = (pointBlocks ?? []).filter((b) => {
    const isDup = activeFixedContracts.some(
      (c) =>
        c.field_id === b.field_id &&
        b.start_time >= c.start_time &&
        b.end_time <= c.end_time
    )
    return !isDup
  })

  const contractBlocks = activeFixedContracts.map((c: any) => ({
    id: `contract_${c.id}`,
    field_id: c.field_id,
    date: dateStr,
    start_time: c.start_time,
    end_time: c.end_time,
    reason: `Mensalista: ${c.customer?.name || 'Cliente'}`,
    is_recurring: true,
    is_contract: true,
    contract_id: c.id,
    customer: c.customer,
    secondary_organizer_name: c.secondary_organizer_name,
    secondary_organizer_phone: c.secondary_organizer_phone,
  }))

  return {
    settings: settings ?? null,
    fields: fields ?? [],
    bookings: bookings ?? [],
    blockedSlots: [...nonContractPointBlocks, ...activeRecurBlocks, ...contractBlocks],
  }
}

// Criar reserva manual direta pelo admin (já confirmada e com sinal pago)
export async function createManualBookingAction(
  _prev: { error: string; success?: boolean } | null,
  formData: FormData
) {
  const { supabase } = await requireAdmin()

  const raw = {
    field_id: formData.get('field_id'),
    date: formData.get('date'),
    start_time: formData.get('start_time'),
    duration_minutes: formData.get('duration_minutes'),
    customer_name: formData.get('customer_name'),
    customer_phone: formData.get('customer_phone'),
    customer_email: formData.get('customer_email') ?? '',
    notes: formData.get('notes') ?? '',
  }

  const parsed = bookingSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const {
    field_id,
    date,
    start_time,
    duration_minutes,
    customer_name,
    customer_phone,
    customer_email,
    notes,
  } = parsed.data

  // Busca detalhes do campo
  const { data: field } = await supabase
    .from('fields')
    .select('*')
    .eq('id', field_id)
    .single()

  if (!field) {
    return { error: 'Campo não encontrado.' }
  }

  // Calcula término e valores usando a tabela oficial de preços por unidade/pacote
  const [hh, mm] = start_time.split(':').map(Number)
  const endMinutes = hh * 60 + mm + duration_minutes
  if (endMinutes > 24 * 60) {
    return { error: 'O horário de término não pode ultrapassar 00:00.' }
  }
  const end_time = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

  const isCourtesy = formData.get('is_courtesy') === 'true' || formData.get('is_courtesy') === 'on'
  const total_amount = isCourtesy ? 0 : getFieldPrice(field.name, duration_minutes, field.hourly_rate)
  const notesCombined = isCourtesy
    ? `[CORTESIA] ${notes || 'Reserva gratuita concedida como cortesia.'}`.trim()
    : (notes || null)

  // Verifica conflito de horário na grade antes de inserir
  const occupied = await getOccupiedSlots(field_id, date)
  const hasConflict = occupied.some((slot) => slot.start_time < end_time && slot.end_time > start_time)
  if (hasConflict) {
    return { error: 'Conflito de horário: este período já está ocupado ou bloqueado neste campo.' }
  }

  // Realiza upsert no cliente pelo telefone normalizado
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .upsert({
      phone: customer_phone,
      name: customer_name,
      email: customer_email || null,
    }, { onConflict: 'phone' })
    .select('id')
    .single()

  if (custError || !customer) {
    return { error: 'Erro ao registrar cliente: ' + (custError?.message ?? 'erro desconhecido') }
  }

  // Insere a reserva (em cortesia total_amount=0 e notes contendo [CORTESIA], remaining_payment_method nulo para respeitar a constraint do banco)
  const { error: bookingError } = await supabase
    .from('bookings')
    .insert({
      field_id,
      customer_id: customer.id,
      date,
      start_time,
      end_time,
      duration_minutes,
      total_amount,
      deposit_amount: total_amount,
      remaining_amount: 0,
      status: 'confirmed',
      deposit_status: 'paid',
      remaining_status: 'paid',
      remaining_payment_method: null,
      notes: notesCombined,
    })

  if (bookingError) {
    return { error: 'Erro ao salvar reserva: ' + bookingError.message }
  }

  revalidatePath('/admin/agenda')
  return { error: '', success: true }
}

// Criar bloqueio pontual ou recorrente
export async function createBlockedSlotAction(
  _prev: { error: string; success?: boolean } | null,
  formData: FormData
) {
  const { supabase } = await requireAdmin()

  const is_recurring = formData.get('is_recurring') === 'true'
  const raw = {
    field_id: formData.get('field_id'),
    date: is_recurring ? null : formData.get('date'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    reason: formData.get('reason') ?? '',
    is_recurring,
    recur_day_of_week: is_recurring ? Number(formData.get('recur_day_of_week')) : null,
  }

  const parsed = blockSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const {
    field_id,
    date,
    start_time,
    end_time,
    reason,
    recur_day_of_week,
  } = parsed.data

  if (start_time >= end_time) {
    return { error: 'O horário de início deve ser menor que o horário de término.' }
  }

  const { error } = await supabase
    .from('blocked_slots')
    .insert({
      field_id,
      date,
      start_time,
      end_time,
      reason: reason || null,
      is_recurring,
      recur_day_of_week,
    })

  if (error) {
    return { error: 'Erro ao criar bloqueio: ' + error.message }
  }

  revalidatePath('/admin/agenda')
  return { error: '', success: true }
}

// Remover bloqueio
export async function deleteBlockedSlotAction(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('blocked_slots')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/agenda')
  return { success: true }
}

// Cancelar reserva pelo admin
export async function cancelBookingAction(id: string) {
  const { supabase } = await requireAdmin()

  // Busca os dados da reserva antes de cancelar
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, field:fields(*), customer:customers(*)')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  // Notifica por e-mail e Web Push que o horário foi liberado
  if (booking) {
    try {
      const { sendAdminCancelledBookingEmail } = await import('@/lib/resend/emails')
      await sendAdminCancelledBookingEmail(booking, 'Cancelamento efetuado pela grade da agenda')
    } catch (emailErr) {
      console.error('Erro ao enviar e-mail de cancelamento ao admin:', emailErr)
    }

    try {
      const { sendBookingCancelledPush } = await import('@/lib/web-push/push')
      await sendBookingCancelledPush(booking, 'Cancelamento efetuado na grade')
    } catch (pushErr) {
      console.error('Erro ao enviar push de cancelamento:', pushErr)
    }
  }

  revalidatePath('/admin/agenda')
  return { success: true }
}
