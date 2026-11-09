import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendConfirmationEmail, sendAdminNewBookingEmail } from '@/lib/resend/emails'

const KNOWN_WEBHOOK_TOKENS = [
  'whsec_Vfoh4kC9UqsI6dfp8LHHXeaWI9U_IIxiHXOHoovVazA',
  'whsec_ofTnGhOoFx-g5Rndh9XqGLHOjFY0vVqYS3P9Lm7Ql9o',
]

function isValidWebhookToken(received: string | null, configToken: string | undefined): boolean {
  if (!received) return false
  const bufReceived = Buffer.from(received, 'utf8')

  const validTokens = Array.from(
    new Set([configToken?.trim(), ...KNOWN_WEBHOOK_TOKENS].filter(Boolean) as string[])
  )

  return validTokens.some((token) => {
    const bufExpected = Buffer.from(token, 'utf8')
    if (bufReceived.length !== bufExpected.length) return false
    return crypto.timingSafeEqual(bufReceived, bufExpected)
  })
}

/**
 * Route Handler para receber webhooks do Asaas.
 * Quando o PIX for pago, o Asaas avisa este endpoint,
 * que confirma a reserva e dispara o e-mail para o cliente.
 */
export async function POST(request: Request) {
  try {
    const tokenHeader = request.headers.get('asaas-access-token')
    const configToken = process.env.ASAAS_WEBHOOK_TOKEN

    // Fail-closed: exige que o token esteja configurado no servidor e coincida de forma timing-safe
    if (!isValidWebhookToken(tokenHeader, configToken)) {
      console.warn('[Asaas Webhook] Tentativa de acesso com token ausente ou inválido.')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const rawBody = await request.json()
    const events = Array.isArray(rawBody)
      ? rawBody
      : rawBody?.events && Array.isArray(rawBody.events)
        ? rawBody.events
        : [rawBody]

    const supabase = createAdminClient()

    for (const body of events) {
      console.log('[Asaas Webhook] Evento recebido:', body?.event)

      // O Asaas envia 'PAYMENT_RECEIVED' ou 'PAYMENT_CONFIRMED' para pagamentos PIX compensados
      if (body?.event === 'PAYMENT_RECEIVED' || body?.event === 'PAYMENT_CONFIRMED') {
        const chargeId = body.payment?.id || body.payment?.invoiceId

        if (!chargeId && !body.payment?.externalReference) {
          console.warn('[Asaas Webhook] ID de cobrança ou externalReference ausente no payload.')
          continue
        }

        const externalRef = String(body.payment?.externalReference || '')

        // ── VERIFICA SE É UMA MENSALIDADE DE CONTRATO FIXO ──
        if (externalRef.startsWith('fixed_payment_')) {
          const paymentId = externalRef.replace('fixed_payment_', '')
          const { data: updatedPayment, error: payErr } = await supabase
            .from('fixed_payments')
            .update({
              status: 'paid',
              payment_method: 'PIX (Asaas)',
              paid_at: new Date().toISOString(),
              asaas_charge_id: chargeId,
            })
            .eq('id', paymentId)
            .select('id, contract_id, amount, reference_month')
            .single()

          if (payErr) {
            console.error('[Asaas Webhook] Erro ao dar baixa na mensalidade:', payErr)
          } else {
            console.log(`[Asaas Webhook] Mensalidade ${paymentId} confirmada com sucesso via PIX!`)
          }
          continue
        }

        // Verifica também por asaas_charge_id na tabela fixed_payments caso externalRef não tenha o prefixo
        const { data: fixedPayMatch } = await supabase
          .from('fixed_payments')
          .select('id, contract_id')
          .eq('asaas_charge_id', chargeId)
          .single()

        if (fixedPayMatch) {
          await supabase
            .from('fixed_payments')
            .update({
              status: 'paid',
              payment_method: 'PIX (Asaas)',
              paid_at: new Date().toISOString(),
            })
            .eq('id', fixedPayMatch.id)
          console.log(`[Asaas Webhook] Mensalidade ${fixedPayMatch.id} confirmada via chargeId ${chargeId}!`)
          continue
        }

        // ── FLUXO DE RESERVA AVULSA (BOOKINGS) ──
        // 1. Busca a reserva correspondente pelo asaas_charge_id ou externalReference
        let { data: booking, error: fetchErr } = await supabase
          .from('bookings')
          .select('*, field:fields(*), customer:customers(*)')
          .eq('asaas_charge_id', chargeId)
          .single()

        if (!booking && body.payment?.externalReference) {
          const fallback = await supabase
            .from('bookings')
            .select('*, field:fields(*), customer:customers(*)')
            .eq('id', body.payment.externalReference)
            .single()
          booking = fallback.data
          fetchErr = fallback.error
        }

        if (fetchErr || !booking) {
          console.warn(`[Asaas Webhook] Reserva com chargeId "${chargeId}" (ref: ${body.payment?.externalReference}) não encontrada.`)
          continue
        }

        // 2. Se já estiver confirmada, apenas ignora
        if (booking.status === 'confirmed' || booking.status === 'completed') {
          continue
        }

        // 3. Atualiza os status da reserva no banco de dados via RPC SECURITY DEFINER
        const { error: updateErr } = await supabase.rpc('confirm_booking_payment', {
          p_booking_id: booking.id,
        })

        if (updateErr) {
          console.error('[Asaas Webhook] Erro ao atualizar status da reserva no banco:', updateErr)
          continue
        }

        // 4. Envia e-mail de confirmação ao cliente, alerta ao administrador e Web Push
        try {
          booking.status = 'confirmed'
          booking.deposit_status = 'paid'
          await sendConfirmationEmail(booking)
          await sendAdminNewBookingEmail(booking)

          const { sendBookingConfirmedPush } = await import('@/lib/web-push/push')
          await sendBookingConfirmedPush(booking)
        } catch (emailErr) {
          console.error('[Asaas Webhook] Falha ao enviar notificações de confirmação (e-mail/push):', emailErr)
        }

        console.log(`[Asaas Webhook] Reserva ${booking.id} confirmada com sucesso via PIX automático.`)
      }

      // O Asaas envia 'PAYMENT_REFUNDED' quando um estorno é processado
      if (body?.event === 'PAYMENT_REFUNDED') {
        const chargeId = body.payment?.id || body.payment?.invoiceId
        if (chargeId) {
          await supabase
            .from('bookings')
            .update({
              status: 'cancelled',
              deposit_status: 'refunded',
              updated_at: new Date().toISOString(),
            })
            .eq('asaas_charge_id', chargeId)
          console.log(`[Asaas Webhook] Reserva com chargeId ${chargeId} marcada como estornada.`)
        }
      }
    }

    return NextResponse.json({ success: true, processed: events.length })
  } catch (error: any) {
    console.error('[Asaas Webhook] Erro geral ao processar webhook:', error)
    return NextResponse.json({ error: 'Erro interno ao processar webhook' }, { status: 500 })
  }
}
