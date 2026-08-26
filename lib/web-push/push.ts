import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

// Chaves VAPID configuradas via variáveis de ambiente com fallback padrão pré-gerado
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BLUE4xO9FbM3KZu8FBobAmo3vBS4f4yVgohgCWsg9by0RTDtp9ieMlfP3zg15hLRTQblnY5wFzDYCykYWT5-Hi4'

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'zzrKnMUQEwMDCQvEsJfXRIuoUth_spHXGofMGTLY4Xg'

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ||
  'mailto:contato@academiadogol.com.br'

// Inicializa o WebPush com as credenciais VAPID
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

export interface StoredSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Busca todas as inscrições Push ativas de administradores no banco
 */
export async function getStoredPushSubscriptions(): Promise<StoredSubscription[]> {
  try {
    const supabase = createAdminClient()
    
    // 1. Tenta buscar da tabela dedicada `push_subscriptions`
    const { data: rows, error: tableError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')

    if (!tableError && rows && rows.length > 0) {
      return rows.map((r: any) => ({
        endpoint: r.endpoint,
        keys: {
          p256dh: r.p256dh,
          auth: r.auth,
        },
      }))
    }

    // 2. Fallback: busca do campo jsonb `push_subscriptions` em `settings`
    const { data: settings } = await supabase
      .from('settings')
      .select('push_subscriptions')
      .single()

    if (settings && Array.isArray((settings as any).push_subscriptions)) {
      return (settings as any).push_subscriptions
    }
  } catch (err) {
    console.warn('[WebPush] Não foi possível carregar inscrições do banco:', err)
  }

  return []
}

/**
 * Salva uma nova inscrição Push de um dispositivo no banco
 */
export async function savePushSubscription(sub: StoredSubscription, userAgent?: string) {
  try {
    const supabase = createAdminClient()

    // 1. Tenta salvar na tabela dedicada `push_subscriptions`
    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: userAgent || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' })

    if (!insertError) {
      return { success: true }
    }

    // 2. Fallback caso a tabela não exista: salva no campo jsonb em `settings`
    const existing = await getStoredPushSubscriptions()
    const filtered = existing.filter((s) => s.endpoint !== sub.endpoint)
    filtered.push(sub)

    await supabase
      .from('settings')
      .update({ push_subscriptions: filtered, updated_at: new Date().toISOString() })
      .not('id', 'is', null)

    return { success: true }
  } catch (err: any) {
    console.error('[WebPush] Erro ao salvar inscrição Push:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Remove uma inscrição Push (ex: quando o usuário revoga permissão ou 410 Gone)
 */
export async function removePushSubscription(endpoint: string) {
  try {
    const supabase = createAdminClient()

    // 1. Remove da tabela dedicada
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)

    // 2. Remove do JSONB em settings
    const existing = await getStoredPushSubscriptions()
    const filtered = existing.filter((s) => s.endpoint !== endpoint)
    await supabase
      .from('settings')
      .update({ push_subscriptions: filtered })
      .not('id', 'is', null)
  } catch (err) {
    console.warn('[WebPush] Erro ao remover inscrição expirada:', err)
  }
}

/**
 * Envia uma notificação Web Push para todos os dispositivos inscritos do administrador
 */
export async function sendAdminWebPush(payload: PushNotificationPayload) {
  const subscriptions = await getStoredPushSubscriptions()

  if (subscriptions.length === 0) {
    console.log('[WebPush] Nenhuma inscrição de push encontrada para envio.')
    return { count: 0 }
  }

  const notificationData = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/logo.png',
    badge: payload.badge || '/logo.png',
    url: payload.url || '/admin/reservas',
    tag: payload.tag || 'academia-gol-push',
  })

  let sentCount = 0

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          notificationData
        )
        sentCount++
      } catch (err: any) {
        // Se a inscrição expirou (410 Gone ou 404 Not Found), remove automaticamente
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[WebPush] Inscrição expirada (${err.statusCode}). Removendo: ${sub.endpoint.slice(0, 30)}...`)
          await removePushSubscription(sub.endpoint)
        } else {
          console.error('[WebPush] Erro ao enviar notificação push para endpoint:', err.message)
        }
      }
    })
  )

  console.log(`[WebPush] Push "${payload.title}" disparado para ${sentCount}/${subscriptions.length} dispositivo(s).`)
  return { count: sentCount }
}

/**
 * Envia notificação push de NOVA RESERVA CONFIRMADA (Sinal PIX Pago)
 */
export async function sendBookingConfirmedPush(booking: any) {
  const deposit = Number(booking.deposit_amount || 0).toFixed(2)
  const startTime = booking.start_time?.slice(0, 5) || ''
  const fieldName = booking.field?.name || 'Campo'
  const customerName = booking.customer?.name || 'Cliente'

  return sendAdminWebPush({
    title: `⚡ Nova Reserva Confirmada!`,
    body: `${customerName} reservou ${fieldName} para ${booking.date} às ${startTime}. Sinal de R$ ${deposit} pago!`,
    url: '/admin/reservas',
    tag: `booking-confirmed-${booking.id}`,
  })
}

/**
 * Envia notificação push de RESERVA CANCELADA / HORÁRIO LIBERADO
 */
export async function sendBookingCancelledPush(booking: any, reason?: string) {
  const startTime = booking.start_time?.slice(0, 5) || ''
  const fieldName = booking.field?.name || 'Campo'

  return sendAdminWebPush({
    title: `❌ Horário Liberado na Grade`,
    body: `${fieldName} - ${booking.date} às ${startTime} está disponível novamente. ${reason ? `(${reason})` : ''}`,
    url: `/admin/agenda?date=${booking.date}`,
    tag: `booking-cancelled-${booking.id}`,
  })
}

/**
 * Envia notificação push de RESUMO MATINAL
 */
export async function sendDailyDigestPush(bookings: any[], dateStr: string) {
  const total = bookings.length
  return sendAdminWebPush({
    title: `☀️ Resumo de Hoje: ${total} ${total === 1 ? 'partida agendada' : 'partidas agendadas'}`,
    body: `Confira a escala de jogos e o planejamento das quadras para o dia de hoje.`,
    url: `/admin/agenda?date=${dateStr}`,
    tag: `daily-digest-${dateStr}`,
  })
}
