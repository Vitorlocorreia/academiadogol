'use client'

import { useState, useEffect, useTransition } from 'react'
import { Bell, BellOff, CheckCircle2, AlertCircle, Smartphone, Send, Loader2 } from 'lucide-react'
import {
  getVapidPublicKeyAction,
  savePushSubscriptionAction,
  removePushSubscriptionAction,
  testAdminPushAction,
} from '@/lib/web-push/actions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationCard() {
  const [isSupported, setIsSupported] = useState<boolean>(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
      // Verifica se já existe inscrição ativa no service worker
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub)
        })
      }).catch(() => {})
    }
  }, [])

  const handleSubscribe = async () => {
    setFeedback(null)

    if (!isSupported) {
      setFeedback({ type: 'error', message: 'Seu navegador não suporta notificações Push.' })
      return
    }

    startTransition(async () => {
      try {
        // 1. Solicita permissão do navegador
        const userPerm = await Notification.requestPermission()
        setPermission(userPerm)

        if (userPerm !== 'granted') {
          setFeedback({
            type: 'error',
            message: 'Permissão de notificação negada. Ative nas permissões do seu navegador.',
          })
          return
        }

        // 2. Registra o Service Worker
        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        // 3. Obtém a chave pública VAPID
        const { publicKey } = await getVapidPublicKeyAction()
        if (!publicKey) {
          throw new Error('Chave VAPID não configurada no servidor.')
        }

        // 4. Cria a inscrição no PushManager
        const applicationServerKey = urlBase64ToUint8Array(publicKey)
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        })

        const subJson = sub.toJSON()
        if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
          throw new Error('Inscrição push inválida gerada pelo navegador.')
        }

        // 5. Salva no banco de dados
        const saveRes = await savePushSubscriptionAction(
          {
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            },
          },
          navigator.userAgent
        )

        if (!saveRes.success) {
          throw new Error(saveRes.error || 'Erro ao registrar dispositivo no servidor.')
        }

        setIsSubscribed(true)
        setFeedback({
          type: 'success',
          message: 'Dispositivo ativado! Você receberá alertas push em tempo real.',
        })
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Falha ao ativar notificações push.' })
      }
    })
  }

  const handleUnsubscribe = async () => {
    setFeedback(null)
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await removePushSubscriptionAction(sub.endpoint)
          await sub.unsubscribe()
        }
        setIsSubscribed(false)
        setFeedback({ type: 'success', message: 'Notificações desativadas para este dispositivo.' })
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Erro ao desativar notificações.' })
      }
    })
  }

  const handleTestPush = () => {
    setFeedback(null)
    startTransition(async () => {
      const res = await testAdminPushAction()
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Notificação de teste disparada! Verifique a tela do seu celular/PC.',
        })
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Erro ao disparar notificação de teste.',
        })
      }
    })
  }

  if (!isSupported) {
    return (
      <div 
        className="p-4 border rounded-[4px] text-xs flex items-center gap-2.5"
        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Seu navegador ou dispositivo atual não possui suporte nativo à API Web Push.</span>
      </div>
    )
  }

  return (
    <div 
      className="border rounded-[4px] p-5 space-y-4 shadow-sm"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div 
            className={`w-10 h-10 rounded-[4px] flex items-center justify-center shrink-0 border transition-colors ${
              isSubscribed
                ? 'bg-[var(--brand-subtle)] border-[var(--brand-ring)] text-[var(--brand)]'
                : 'border'
            }`}
            style={!isSubscribed ? { background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-muted)' } : undefined}
          >
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 
              className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Notificações Push no Celular / PC
              {isSubscribed ? (
                <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]">
                  Dispositivo Ativo
                </span>
              ) : (
                <span 
                  className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                >
                  Inativo
                </span>
              )}
            </h4>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Receba avisos imediatos na tela de bloqueio e barra de status quando houver novas reservas pagas ou horários liberados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isSubscribed ? (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={isPending}
              className="btn-admin-primary px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
              Ativar no Dispositivo
            </button>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleTestPush}
                disabled={isPending}
                className="px-3.5 py-2 border rounded-[2px] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                title="Testa a notificação push no seu dispositivo"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-[var(--brand)]" />}
                Testar Push
              </button>
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={isPending}
                className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-[2px] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <BellOff className="w-3.5 h-3.5" />
                Desativar
              </button>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-[4px] text-xs flex items-center gap-2 border ${
          feedback.type === 'success'
            ? 'bg-[var(--brand-subtle)] border-[var(--brand-ring)] text-[var(--brand)]'
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  )
}
