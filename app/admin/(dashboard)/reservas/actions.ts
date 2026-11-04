'use server'

import { requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ALLOWED_METHODS = ['pix_manual', 'cash', 'card_machine'] as const

// Busca reservas com busca e filtro
export async function getBookingsData(search?: string, status?: string) {
  const { supabase } = await requireAdmin()

  let query = supabase
    .from('bookings')
    .select('*, field:fields(name), customer:customers(name, phone, email)')
    .order('date', { ascending: false })
    .order('start_time', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar reservas:', error.message)
    return []
  }

  // Se houver filtro de busca por nome/telefone do cliente
  let filtered = data ?? []
  if (search) {
    const s = search.toLowerCase().trim()
    filtered = filtered.filter((b) =>
      b.customer?.name?.toLowerCase().includes(s) ||
      b.customer?.phone?.includes(s)
    )
  }

  return filtered
}

// Confirmar manualmente o pagamento do sinal PIX pelo admin
export async function confirmDepositManuallyAction(bookingId: string) {
  const { supabase } = await requireAdmin()

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, field:fields(*), customer:customers(*)')
    .eq('id', bookingId)
    .single()

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      deposit_status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  if (error) {
    return { error: 'Erro ao confirmar sinal: ' + error.message }
  }

  if (booking) {
    try {
      const { sendConfirmationEmail } = await import('@/lib/resend/emails')
      booking.status = 'confirmed'
      booking.deposit_status = 'paid'
      await sendConfirmationEmail(booking)
    } catch (emailErr) {
      console.error('Erro ao enviar e-mail de confirmação ao cliente:', emailErr)
    }
  }

  revalidatePath('/admin/reservas')
  revalidatePath('/admin/agenda')
  return { success: true }
}

// Confirmar recebimento do valor restante presencial
export async function confirmRemainingPaymentAction(bookingId: string, method: string) {
  const { supabase } = await requireAdmin()

  if (!ALLOWED_METHODS.includes(method as any)) {
    return { error: 'Método de pagamento inválido.' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      remaining_status: 'paid',
      remaining_payment_method: method,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  if (error) {
    return { error: 'Erro ao confirmar pagamento: ' + error.message }
  }

  revalidatePath('/admin/reservas')
  revalidatePath('/admin/agenda')
  return { success: true }
}

// Finalizar partida (marcar como concluída e pagar restante)
export async function completeBookingAction(bookingId: string, method?: string) {
  const { supabase } = await requireAdmin()

  const updatePayload: any = {
    status: 'completed',
    updated_at: new Date().toISOString(),
  }

  // Se foi fornecido um método de pagamento, valida e assume que o restante foi pago
  if (method) {
    if (!ALLOWED_METHODS.includes(method as any)) {
      return { error: 'Método de pagamento inválido.' }
    }
    updatePayload.remaining_status = 'paid'
    updatePayload.remaining_payment_method = method
  }

  const { error } = await supabase
    .from('bookings')
    .update(updatePayload)
    .eq('id', bookingId)

  if (error) {
    return { error: 'Erro ao concluir reserva: ' + error.message }
  }

  revalidatePath('/admin/reservas')
  revalidatePath('/admin/agenda')
  return { success: true }
}

// Cancelar reserva
export async function adminCancelBookingAction(bookingId: string) {
  const { supabase } = await requireAdmin()

  // Busca os dados da reserva antes de cancelar
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, field:fields(*), customer:customers(*)')
    .eq('id', bookingId)
    .single()

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  if (error) {
    return { error: 'Erro ao cancelar reserva: ' + error.message }
  }

  // Notifica por e-mail e Web Push que o horário foi liberado
  if (booking) {
    try {
      const { sendAdminCancelledBookingEmail } = await import('@/lib/resend/emails')
      await sendAdminCancelledBookingEmail(booking, 'Cancelamento manual pelo painel administrativo')
    } catch (emailErr) {
      console.error('Erro ao enviar e-mail de cancelamento ao admin:', emailErr)
    }

    try {
      const { sendBookingCancelledPush } = await import('@/lib/web-push/push')
      await sendBookingCancelledPush(booking, 'Cancelamento efetuado no painel')
    } catch (pushErr) {
      console.error('Erro ao enviar push de cancelamento:', pushErr)
    }
  }

  revalidatePath('/admin/reservas')
  revalidatePath('/admin/agenda')
  return { success: true }
}
