import { NextResponse } from 'next/server'
import { sendMetaCapiEvent } from '@/lib/tracking/capi'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { eventName, eventId, customData, userData = {}, eventSourceUrl } = body

    if (!eventName || !eventId) {
      return NextResponse.json({ error: 'eventName e eventId são obrigatórios' }, { status: 400 })
    }

    // Extrai IP do cliente através dos cabeçalhos de proxy
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || null

    // Extrai User Agent do cliente
    const clientUserAgent = request.headers.get('user-agent') || null

    // Extrai cookies do Facebook (_fbp e _fbc)
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, c) => {
      const [k, v] = c.trim().split('=')
      if (k && v) acc[k] = decodeURIComponent(v)
      return acc
    }, {})

    const fbp = cookies._fbp || null
    const fbc = cookies._fbc || null

    // Dispara via Conversions API
    const result = await sendMetaCapiEvent({
      eventName,
      eventId,
      eventSourceUrl,
      userData: {
        ...userData,
        clientIp,
        clientUserAgent,
        fbp,
        fbc,
      },
      customData,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Pixel Event API Error]:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
