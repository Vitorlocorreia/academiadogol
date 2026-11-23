// Implementação da Meta Conversions API (CAPI) - Server-Side
// Documentação Oficial: https://developers.facebook.com/docs/marketing-api/conversions-api

import crypto from 'crypto'

export interface CapiUserData {
  email?: string | null
  phone?: string | null
  name?: string | null
  clientIp?: string | null
  clientUserAgent?: string | null
  fbp?: string | null
  fbc?: string | null
  [key: string]: any
}

export interface CapiCustomData {
  currency?: string
  value?: number
  content_name?: string
  content_ids?: string[]
  content_type?: string
  num_items?: number
  [key: string]: any
}

export interface CapiEventParams {
  eventName: 'ViewContent' | 'InitiateCheckout' | 'Purchase' | string
  eventId: string
  eventSourceUrl?: string
  userData?: CapiUserData
  customData?: CapiCustomData
}

/**
 * Função utilitária para gerar hash SHA-256 nos formatos exigidos pela Meta
 */
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

/**
 * Normaliza e gera hash de e-mail
 */
function hashEmail(email?: string | null): string | undefined {
  if (!email || !email.includes('@')) return undefined
  return sha256(email)
}

/**
 * Normaliza telefone para formato internacional e gera hash
 */
function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) return undefined
  const intlPhone = digits.startsWith('55') ? digits : `55${digits}`
  return sha256(intlPhone)
}

/**
 * Normaliza primeiro nome e gera hash
 */
function hashName(name?: string | null): string | undefined {
  if (!name || name.trim().length === 0) return undefined
  const firstName = name.trim().split(' ')[0]
  return sha256(firstName)
}

/**
 * Envia evento server-side para a Conversions API da Meta (Graph API v21.0)
 */
export async function sendMetaCapiEvent({
  eventName,
  eventId,
  eventSourceUrl,
  userData = {},
  customData = {},
}: CapiEventParams): Promise<{ success: boolean; eventId: string; response?: any; error?: string }> {
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || '1485967226930847'
  const accessToken =
    process.env.META_CONVERSIONS_API_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    process.env.FB_ACCESS_TOKEN

  const testEventCode = process.env.META_TEST_EVENT_CODE

  // Constrói objeto de user_data com hashes compatíveis com a Meta
  const normalizedUserData: Record<string, any> = {}

  const emHash = hashEmail(userData.email)
  if (emHash) normalizedUserData.em = [emHash]

  const phHash = hashPhone(userData.phone)
  if (phHash) normalizedUserData.ph = [phHash]

  const fnHash = hashName(userData.name)
  if (fnHash) normalizedUserData.fn = [fnHash]

  if (userData.clientIp) normalizedUserData.client_ip_address = userData.clientIp
  if (userData.clientUserAgent) normalizedUserData.client_user_agent = userData.clientUserAgent
  if (userData.fbp) normalizedUserData.fbp = userData.fbp
  if (userData.fbc) normalizedUserData.fbc = userData.fbc

  const payload: Record<string, any> = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url:
          eventSourceUrl ||
          process.env.NEXT_PUBLIC_APP_URL ||
          'https://academiadogol.vercel.app',
        action_source: 'website',
        user_data: normalizedUserData,
        custom_data: {
          currency: customData.currency || 'BRL',
          value: customData.value !== undefined ? Number(customData.value) : undefined,
          content_name: customData.content_name,
          content_ids: customData.content_ids,
          content_type: customData.content_type || 'product',
        },
      },
    ],
  }

  if (testEventCode) {
    payload.test_event_code = testEventCode
  }

  // Se o token ainda não estiver configurado nas variáveis de ambiente, registra aviso informativo
  if (!accessToken) {
    console.log(
      `[Meta CAPI] Evento preparado: ${eventName} (event_id: ${eventId}). Para envio em produção, configure a variável META_CONVERSIONS_API_TOKEN.`
    )
    return { success: true, eventId, response: 'token_not_configured_logged' }
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error(`[Meta CAPI Error] HTTP ${res.status}:`, data)
      return { success: false, eventId, error: data?.error?.message || 'Erro na requisição CAPI' }
    }

    console.log(`[Meta CAPI Sucesso] Evento ${eventName} enviado com event_id: ${eventId}`, data)
    return { success: true, eventId, response: data }
  } catch (err: any) {
    console.error(`[Meta CAPI Exception] Falha ao enviar evento ${eventName}:`, err)
    return { success: false, eventId, error: err?.message || 'Falha de conexão com a Meta API' }
  }
}
