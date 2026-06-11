import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendConfirmationEmail } from '@/lib/resend/emails'

/**
 * Route Handler para receber webhooks do Asaas.
 * Quando o PIX for pago, o Asaas avisa este endpoint,
 * que confirma a reserva e dispara o e-mail para o cliente.
 */
export async function POST(request: Request) {
  try {
    const tokenHeader = request.headers.get('asaas-access-token')
    const configToken = process.env.ASAAS_WEBHOOK_TOKEN

    // Se o token estiver configurado, valida a origem da requisição
    if (configToken && tokenHeader !== configToken) {
      console.warn('[Asaas Webhook] Token de segurança inválido recebido.')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('[Asaas Webhook] Evento recebido:', body.event)

    // O Asaas envia 'PAYMENT_RECEIVED' ou 'PAYMENT_CONFIRMED' para pagamentos PIX compensados
    if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
      const chargeId = body.payment?.id || body.payment?.invoiceId

      if (!chargeId) {
        console.warn('[Asaas Webhook] ID de cobrança (payment.id) ausente no payload.')
        return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
      }

      const supabase = createAdminClient()

      // 1. Busca a reserva correspondente pelo asaas_charge_id
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*, field:fields(*), customer:customers(*)')
        .eq('asaas_charge_id', chargeId)
        .single()

      if (fetchErr || !booking) {
        console.warn(`[Asaas Webhook] Reserva com asaas_charge_id "${chargeId}" não encontrada.`)
        // Retornamos 200 para o Asaas parar de tentar re-enviar, mas registramos no log
        return NextResponse.json({ message: 'Cobrança não associada a nenhuma reserva ativa' })
      }

      // 2. Se já estiver confirmada, apenas retorna sucesso
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        return NextResponse.json({ message: 'Reserva já estava confirmada anteriormente' })
      }

      // 3. Atualiza os status da reserva no banco de dados (bypass RLS via admin client)
      const { error: updateErr } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          deposit_status: 'paid',
        })
        .eq('id', booking.id)

      if (updateErr) {
        console.error('[Asaas Webhook] Erro ao atualizar status da reserva no banco:', updateErr)
        return NextResponse.json({ error: 'Erro interno ao salvar no banco' }, { status: 500 })
      }

      // 4. Envia e-mail de confirmação ao cliente
      try {
        booking.status = 'confirmed'
        booking.deposit_status = 'paid'
        await sendConfirmationEmail(booking)
      } catch (emailErr) {
        console.error('[Asaas Webhook] Falha ao enviar e-mail de confirmação:', emailErr)
      }

      console.log(`[Asaas Webhook] Reserva ${booking.id} confirmada com sucesso via PIX automático.`)
      return NextResponse.json({ success: true, bookingId: booking.id })
    }

    // Retorna ok para outros tipos de eventos que não nos interessam (ex: cobrança criada, vencida)
    return NextResponse.json({ message: 'Evento ignorado' })
  } catch (error: any) {
    console.error('[Asaas Webhook] Erro geral ao processar webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
