'use server'

import { requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ALLOWED_METHODS = ['pix_manual', 'cash', 'card_machine', 'cortesia'] as const

// Marcar reserva como cortesia (100% gratuita)
export async function markBookingAsCortesiaAction(bookingId: string) {
  const { supabase } = await requireAdmin()

  const { data: booking } = await supabase
    .from('bookings')
    .select('notes')
    .eq('id', bookingId)
    .single()

  const existingNotes = booking?.notes || ''
  const updatedNotes = existingNotes.includes('[CORTESIA]')
    ? existingNotes
    : `[CORTESIA] ${existingNotes}`.trim()

  const { error } = await supabase
    .from('bookings')
    .update({
      total_amount: 0,
      deposit_amount: 0,
      remaining_amount: 0,
      status: 'confirmed',
      deposit_status: 'paid',
      remaining_status: 'paid',
      remaining_payment_method: 'Cortesia',
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  revalidatePath('/admin/reservas')
  revalidatePath('/admin/agenda')
  return { success: true }
}

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


// Estornar sinal da reserva via PIX no Asaas e cancelar reserva
export async function refundBookingDepositAction(
  bookingId: string,
  options?: { forceOverride?: boolean; reason?: string }
) {
  const { supabase } = await requireAdmin()

  // 1. Busca os dados completos da reserva
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('*, field:fields(*), customer:customers(*)')
    .eq('id', bookingId)
    .single()

  if (fetchErr || !booking) {
    return { error: 'Reserva não encontrada.' }
  }

  if (booking.deposit_status === 'refunded') {
    return { error: 'O sinal desta reserva já foi estornado.' }
  }

  // 2. Validação da antecedência de 48 horas (fuso horário de Brasília UTC-3)
  const [hh, mm] = (booking.start_time || '00:00').split(':').map(Number)
  const [year, month, day] = booking.date.split('-').map(Number)
  const bookingTimeMs = new Date(Date.UTC(year, month - 1, day, hh + 3, mm || 0)).getTime()
  const nowMs = Date.now()
  const hoursLeft = (bookingTimeMs - nowMs) / (1000 * 60 * 60)

  const { data: settings } = await supabase
    .from('settings')
    .select('cancellation_hours')
    .single()
  const cancellationHours = settings?.cancellation_hours ?? 48

  if (hoursLeft < cancellationHours && !options?.forceOverride) {
    return {
      error: `Prazo expirado: esta partida acontece em menos de ${cancellationHours}h (${Math.max(0, hoursLeft).toFixed(1)}h restantes). Pela política oficial da arena, o estorno só é permitido com antecedência mínima de ${cancellationHours}h. Para autorizar em caráter de exceção, confirme a autorização de Gerente.`,
      requiresOverride: true,
      hoursLeft: Math.max(0, hoursLeft),
      cancellationHours,
    }
  }

  // 3. Executa o estorno no gateway Asaas se houver cobrança registrada
  if (booking.asaas_charge_id) {
    const { refundAsaasPayment } = await import('@/lib/asaas/client')
    const refundRes = await refundAsaasPayment({
      chargeId: booking.asaas_charge_id,
      value: Number(booking.deposit_amount),
      description: options?.reason || `Estorno de reserva - ${booking.field?.name || 'Academia do Gol'}`,
    })

    if (!refundRes.success) {
      return {
        error: `Falha no gateway Asaas: ${refundRes.error}`,
      }
    }
  }

  // 4. Atualiza os status no banco de dados
  const { error: updateErr } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      deposit_status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  if (updateErr) {
    return { error: 'Erro ao registrar estorno no banco: ' + updateErr.message }
  }

  // 5. Notificações automáticas
  try {
    const { sendBookingCancelledPush } = await import('@/lib/web-push/push')
    await sendBookingCancelledPush(booking, 'Sinal PIX estornado e horário liberado')
  } catch (pushErr) {
    console.error('Erro ao enviar push de estorno:', pushErr)
  }

  try {
    const { sendRefundConfirmationEmail } = await import('@/lib/resend/emails')
    booking.status = 'cancelled'
    booking.deposit_status = 'refunded'
    await sendRefundConfirmationEmail(booking)
  } catch (emailErr) {
    console.error('Erro ao enviar e-mail de estorno ao cliente:', emailErr)
  }

  revalidatePath('/admin/reservas')
  revalidatePath('/admin/agenda')
  revalidatePath('/admin/financeiro')

  return {
    success: true,
    message: `Sinal de R$ ${Number(booking.deposit_amount).toFixed(2).replace('.', ',')} estornado com sucesso via PIX para ${booking.customer?.name || 'o cliente'}. O horário foi liberado na agenda.`,
  }
}
