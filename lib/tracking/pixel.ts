// Helper para disparo seguro de eventos do Meta Pixel no navegador
// Inclui suporte para deduplicação com Conversions API através do eventID

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    _fbq?: (...args: any[]) => void
  }
}

export interface PixelCustomData {
  currency?: string
  value?: number
  content_name?: string
  content_category?: string
  content_ids?: string[]
  content_type?: string
  num_items?: number
  [key: string]: any
}

export interface PixelUserData {
  em?: string
  ph?: string
  fn?: string
  [key: string]: any
}

/**
 * Dispara evento no Meta Pixel (Browser) e simultaneamente envia para a CAPI (Server-Side)
 * usando o mesmo eventId para garantir a deduplicação perfeita.
 */
export async function trackMetaEvent(
  eventName: 'ViewContent' | 'InitiateCheckout' | 'Purchase' | string,
  customData: PixelCustomData = {},
  eventId?: string,
  userData?: PixelUserData
) {
  // Gera um eventId único caso não tenha sido fornecido
  const finalEventId = eventId || `${eventName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // 1. Disparo no Browser (Meta Pixel)
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq('track', eventName, customData, { eventID: finalEventId })
    } catch (err) {
      console.warn('[Meta Pixel] Erro ao disparar no navegador:', err)
    }
  }

  // 2. Disparo na Conversions API (Server-side via endpoint interno)
  if (typeof window !== 'undefined') {
    try {
      fetch('/api/tracking/pixel-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          eventId: finalEventId,
          customData,
          userData,
          eventSourceUrl: window.location.href,
        }),
      }).catch((err) => {
        // Falha silenciosa para não impactar navegação do usuário
        console.warn('[Meta CAPI Client Dispatch] Aviso:', err)
      })
    } catch {
      // Ignora erro de fetch offline
    }
  }

  return finalEventId
}
