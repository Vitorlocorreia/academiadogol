'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Busca reservas com busca e filtro
export async function getBookingsData(search?: string, status?: string) {
  const supabase = await createClient()

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
    filtered = filtered.filter(b => 
      b.customer?.name?.toLowerCase().includes(s) || 
      b.customer?.phone?.includes(s)
    )
  }

  return filtered
}

// Confirmar recebimento do valor restante presencial
export async function confirmRemainingPaymentAction(bookingId: string, method: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('bookings')
    .update({
      remaining_status: 'paid',
      remaining_payment_method: method,
      updated_at: new Date().toISOString()
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
  const supabase = await createClient()

  const updatePayload: any = {
    status: 'completed',
    updated_at: new Date().toISOString()
  }

  // Se foi fornecido um método de pagamento, assume que o restante foi pago
  if (method) {
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
  const supabase = await createClient()

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)

  if (error) {
    return { error: 'Erro ao cancelar reserva: ' + error.message }
  }

  revalidatePath('/admin/reservas')
  revalidatePath('/admin/agenda')
  return { success: true }
}
