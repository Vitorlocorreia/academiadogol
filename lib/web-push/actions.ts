'use server'

import {
  savePushSubscription,
  removePushSubscription,
  sendAdminWebPush,
  VAPID_PUBLIC_KEY,
  type StoredSubscription,
} from './push'

/**
 * Retorna a chave pública VAPID para o frontend
 */
export async function getVapidPublicKeyAction() {
  return { publicKey: VAPID_PUBLIC_KEY }
}

/**
 * Salva a inscrição do dispositivo no servidor
 */
export async function savePushSubscriptionAction(
  subscription: StoredSubscription,
  userAgent?: string
) {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return { success: false, error: 'Inscrição push inválida.' }
  }

  const result = await savePushSubscription(subscription, userAgent)
  return result
}

/**
 * Remove a inscrição quando o usuário desativa as notificações
 */
export async function removePushSubscriptionAction(endpoint: string) {
  if (!endpoint) return { success: false }
  await removePushSubscription(endpoint)
  return { success: true }
}

/**
 * Envia uma notificação push de teste para validar a entrega
 */
export async function testAdminPushAction() {
  try {
    const result = await sendAdminWebPush({
      title: '🎉 Notificações Web Push Ativas!',
      body: 'Seu dispositivo está configurado e receberá alertas em tempo real de novas reservas e cancelamentos.',
      url: '/admin/agenda',
      tag: 'test-push-' + Date.now(),
    })

    if (result.count === 0) {
      return {
        success: false,
        error: 'Nenhum dispositivo cadastrado. Clique no botão "Ativar Notificações" primeiro.',
      }
    }

    return { success: true, count: result.count }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
