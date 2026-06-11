'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { Field, BlockedSlot } from '@/lib/supabase/types'

// ─── Campos ─────────────────────────────────────────────────────────────────

// Busca todos os campos ativos para exibição pública
export async function getActiveFields(): Promise<Field[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

// Busca um campo específico pelo ID
export async function getFieldById(id: string): Promise<Field | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}

// ─── Disponibilidade ─────────────────────────────────────────────────────────

// Retorna os slots já ocupados para um campo em uma data específica
// Inclui reservas ativas/pendentes + bloqueios pontuais + bloqueios recorrentes
export async function getOccupiedSlots(
  fieldId: string,
  date: string // formato ISO: 'YYYY-MM-DD'
): Promise<Array<{ start_time: string; end_time: string }>> {
  const supabase = createAdminClient()
  const dayOfWeek = new Date(date + 'T12:00:00').getDay() // evita problema de fuso

  // Reservas ativas e pendentes
  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('field_id', fieldId)
    .eq('date', date)
    .in('status', ['pending', 'confirmed'])

  // Bloqueios pontuais para a data específica
  const { data: pointBlocks } = await supabase
    .from('blocked_slots')
    .select('start_time, end_time')
    .eq('field_id', fieldId)
    .eq('date', date)
    .eq('is_recurring', false)

  // Bloqueios recorrentes válidos para o dia da semana
  const { data: recurBlocks } = await supabase
    .from('blocked_slots')
    .select('start_time, end_time, recur_ends_at')
    .eq('field_id', fieldId)
    .eq('is_recurring', true)
    .eq('recur_day_of_week', dayOfWeek)

  // Filtra bloqueios recorrentes que já expiraram
  const activeRecurBlocks = (recurBlocks ?? []).filter((b) => {
    if (!b.recur_ends_at) return true
    return b.recur_ends_at >= date
  })

  const all = [
    ...(bookings ?? []),
    ...(pointBlocks ?? []),
    ...activeRecurBlocks,
  ]

  return all.map(({ start_time, end_time }) => ({ start_time, end_time }))
}

// ─── Reserva ─────────────────────────────────────────────────────────────────

const reservationSchema = z.object({
  field_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration_minutes: z.coerce.number().int().positive(),
  customer_name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  customer_phone: z.string().min(8, 'Telefone inválido'),
  customer_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  customer_birth_date: z.string().optional().or(z.literal('')),
})

// Cria uma intenção de reserva com status 'pending'
// Realiza upsert no cliente pelo telefone (chave de identificação)
export async function createBookingAction(
  _prev: { error: string } | null,
  formData: FormData
) {
  const raw = {
    field_id: formData.get('field_id'),
    date: formData.get('date'),
    start_time: formData.get('start_time'),
    duration_minutes: formData.get('duration_minutes'),
    customer_name: formData.get('customer_name'),
    customer_phone: formData.get('customer_phone'),
    customer_email: formData.get('customer_email') ?? '',
    customer_birth_date: formData.get('customer_birth_date') ?? '',
  }

  const parsed = reservationSchema.safeParse(raw)
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
    customer_birth_date,
  } = parsed.data

  const supabase = createAdminClient()

  // Busca dados do campo para calcular valores
  const { data: field, error: fieldError } = await supabase
    .from('fields')
    .select('hourly_rate, deposit_type, deposit_value')
    .eq('id', field_id)
    .single()

  if (fieldError || !field) {
    return { error: 'Campo não encontrado.' }
  }

  // Calcula horário de fim e valor total
  const [hh, mm] = start_time.split(':').map(Number)
  const endMinutes = hh * 60 + mm + duration_minutes
  const end_time = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
  const total_amount = (field.hourly_rate * duration_minutes) / 60
  const deposit_amount =
    field.deposit_type === 'fixed'
      ? field.deposit_value
      : (total_amount * field.deposit_value) / 100
  const remaining_amount = total_amount - deposit_amount

  // Verifica sobreposição antes de inserir (defesa dupla — trigger no banco)
  const occupied = await getOccupiedSlots(field_id, date)
  const conflict = occupied.some((slot) => {
    return slot.start_time < end_time && slot.end_time > start_time
  })
  if (conflict) {
    return { error: 'Este horário não está mais disponível. Escolha outro.' }
  }

  // Upsert do cliente pelo telefone
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .upsert(
      {
        phone: customer_phone,
        name: customer_name,
        email: customer_email || null,
        birth_date: customer_birth_date || null,
      },
      { onConflict: 'phone' }
    )
    .select('id')
    .single()

  if (customerError || !customer) {
    return { error: 'Erro ao registrar cliente.' }
  }

  // Cria a reserva com status pending
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      field_id,
      customer_id: customer.id,
      date,
      start_time,
      end_time,
      duration_minutes,
      total_amount,
      deposit_amount,
      remaining_amount,
      status: 'pending',
      deposit_status: 'pending',
      remaining_status: 'pending',
    })
    .select('id')
    .single()

  if (bookingError || !booking) {
    return { error: 'Erro ao criar reserva. Tente novamente.' }
  }

  // Dispara o evento de expiração para o Inngest em background
  try {
    const { inngest } = await import('@/inngest/client')
    await inngest.send({
      name: 'booking.created',
      data: {
        bookingId: booking.id,
      },
    })
  } catch (inngestErr) {
    console.error('Erro ao enviar evento para o Inngest:', inngestErr)
  }

  redirect(`/reserva/pagamento/${booking.id}`)
}

// ─── Consulta de Reserva ─────────────────────────────────────────────────────

const consultSchema = z.object({
  phone: z.string().min(8, 'Telefone inválido'),
})

export async function consultBookingAction(
  _prev: { error: string; bookings?: unknown[] } | null,
  formData: FormData
) {
  const raw = { phone: formData.get('phone') }
  const parsed = consultSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, bookings: [] }
  }

  const supabase = createAdminClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', parsed.data.phone)
    .single()

  if (!customer) {
    return { error: 'Nenhuma reserva encontrada para este telefone.', bookings: [] }
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, field:fields(name)')
    .eq('customer_id', customer.id)
    .order('date', { ascending: false })
    .limit(10)

  return { error: '', bookings: bookings ?? [] }
}

// Busca uma reserva específica pelo ID (com joins de campo e cliente)
export async function getBookingById(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*, field:fields(*), customer:customers(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

// Simula a confirmação de pagamento PIX (atualizando status)
export async function confirmSimulatedPixPayment(bookingId: string) {
  const supabase = createAdminClient()

  // Busca os dados completos da reserva (com relações de campo e cliente) para o e-mail
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('*, field:fields(*), customer:customers(*)')
    .eq('id', bookingId)
    .single()

  if (fetchErr || !booking) {
    return { error: 'Reserva não encontrada.' }
  }

  // Atualiza os status no banco de dados
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      deposit_status: 'paid',
    })
    .eq('id', bookingId)

  if (error) {
    return { error: error.message }
  }

  // Dispara o e-mail de confirmação em background
  try {
    const { sendConfirmationEmail } = await import('@/lib/resend/emails')
    // Atualiza o objeto em memória com o status correto para o e-mail
    booking.status = 'confirmed'
    booking.deposit_status = 'paid'
    await sendConfirmationEmail(booking)
  } catch (emailErr) {
    console.error('Erro ao enviar e-mail de confirmação:', emailErr)
  }

  revalidatePath(`/reserva/pagamento/${bookingId}`)
  return { success: true }
}

