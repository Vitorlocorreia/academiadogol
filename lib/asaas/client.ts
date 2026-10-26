/**
 * Integração com a API do Asaas (v3) para cobrança PIX automática
 * Suporta ambiente de Produção e Sandbox
 */

import { createAdminClient } from '@/lib/supabase/admin'

const ASAAS_API_KEY = process.env.ASAAS_API_KEY
const ASAAS_ENV = process.env.ASAAS_ENVIRONMENT || 'production'

const BASE_URL =
  ASAAS_ENV === 'sandbox' || ASAAS_API_KEY?.startsWith('$aact_YTU')
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/api/v3'

interface AsaasCustomerPayload {
  name: string
  phone: string
  email?: string | null
}

interface PixQrCodeResponse {
  encodedImage: string
  payload: string
  expirationDate: string
}

/**
 * Cria ou recupera um cliente no Asaas pelo telefone/e-mail
 */
export async function getOrCreateAsaasCustomer(data: AsaasCustomerPayload): Promise<string> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada no ambiente.')
  }

  const cleanPhone = data.phone.replace(/\D/g, '')

  // 1. Tenta buscar cliente existente pelo telefone celular
  try {
    const searchRes = await fetch(`${BASE_URL}/customers?mobilePhone=${cleanPhone}`, {
      headers: {
        access_token: ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (searchRes.ok) {
      const searchData = await searchRes.json()
      if (searchData.data && searchData.data.length > 0) {
        return searchData.data[0].id
      }
    }
  } catch (err) {
    console.warn('[Asaas] Falha ao consultar cliente existente:', err)
  }

  // 2. Se não existir, cadastra novo cliente
  const createRes = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      access_token: ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      mobilePhone: cleanPhone,
      email: data.email || undefined,
    }),
    cache: 'no-store',
  })

  if (!createRes.ok) {
    const errBody = await createRes.text()
    throw new Error(`Erro ao cadastrar cliente no Asaas (${createRes.status}): ${errBody}`)
  }

  const createdData = await createRes.json()
  return createdData.id
}

/**
 * Cria a cobrança PIX no Asaas e obtém o QR Code + Copia e Cola
 */
export async function createAsaasPixCharge({
  customerId,
  amount,
  description,
  externalReference,
}: {
  customerId: string
  amount: number
  description: string
  externalReference: string
}) {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada no ambiente.')
  }

  // Vencimento de hoje
  const today = new Date().toISOString().split('T')[0]

  // 1. Cria a cobrança
  const paymentRes = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      access_token: ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value: amount,
      dueDate: today,
      description,
      externalReference,
    }),
    cache: 'no-store',
  })

  if (!paymentRes.ok) {
    const errBody = await paymentRes.text()
    throw new Error(`Erro ao criar cobrança PIX no Asaas (${paymentRes.status}): ${errBody}`)
  }

  const paymentData = await paymentRes.json()
  const paymentId = paymentData.id

  // 2. Obtém os dados do QR Code PIX
  const qrRes = await fetch(`${BASE_URL}/payments/${paymentId}/pixQrCode`, {
    headers: {
      access_token: ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!qrRes.ok) {
    const errBody = await qrRes.text()
    throw new Error(`Erro ao buscar QR Code PIX no Asaas (${qrRes.status}): ${errBody}`)
  }

  const qrData: PixQrCodeResponse = await qrRes.json()

  // Garante o prefixo data:image/png;base64 caso o Asaas retorne apenas o base64 puro
  const qrImage = qrData.encodedImage.startsWith('data:')
    ? qrData.encodedImage
    : `data:image/png;base64,${qrData.encodedImage}`

  return {
    chargeId: paymentId,
    pixQrCode: qrImage,
    pixCopyPaste: qrData.payload,
    expirationDate: qrData.expirationDate,
  }
}

/**
 * Orquestra a geração do PIX para uma reserva:
 * Se o Asaas estiver configurado, cria o PIX real e salva no Supabase.
 * Se já existir cobrança salva, reutiliza para não duplicar.
 * Se não houver ASAAS_API_KEY configurada, gera dados de simulação.
 */
export async function getOrGenerateBookingPix(booking: any) {
  // Se a reserva já tem os dados do PIX salvos no banco, retorna diretamente
  if (booking.asaas_charge_id && booking.pix_copy_paste) {
    return {
      chargeId: booking.asaas_charge_id,
      pixQrCode: booking.pix_qr_code,
      pixCopyPaste: booking.pix_copy_paste,
      isReal: true,
    }
  }

  // Se não tiver ASAAS_API_KEY no ambiente, retorna modo simulado
  if (!ASAAS_API_KEY) {
    const mockCopyPaste = `00020101021226830014br.gov.bcb.pix2561pix.academiadogol.com.br/qr/${booking.id}5204000053039865405${Number(booking.deposit_amount).toFixed(2)}5802BR5916Academia do Gol6009Sao Paulo62070503***6304`
    return {
      chargeId: null,
      pixQrCode: null,
      pixCopyPaste: mockCopyPaste,
      isReal: false,
    }
  }

  try {
    const customer = booking.customer
    const field = booking.field

    const asaasCustomerId = await getOrCreateAsaasCustomer({
      name: customer?.name || 'Cliente Academia do Gol',
      phone: customer?.phone || '',
      email: customer?.email || null,
    })

    const pixDetails = await createAsaasPixCharge({
      customerId: asaasCustomerId,
      amount: Number(booking.deposit_amount),
      description: `Sinal Reserva - ${field?.name || 'Campo'} - Academia do Gol`,
      externalReference: booking.id,
    })

    // Salva na reserva no Supabase para persistência imediata
    const supabase = createAdminClient()
    await supabase
      .from('bookings')
      .update({
        asaas_charge_id: pixDetails.chargeId,
        pix_qr_code: pixDetails.pixQrCode,
        pix_copy_paste: pixDetails.pixCopyPaste,
      })
      .eq('id', booking.id)

    return {
      ...pixDetails,
      isReal: true,
    }
  } catch (error: any) {
    console.error('[Asaas] Erro ao gerar PIX dinâmico:', error)
    // Fallback gracioso para modo simulado se a API falhar
    const fallbackCopyPaste = `00020101021226830014br.gov.bcb.pix2561pix.academiadogol.com.br/qr/${booking.id}5204000053039865405${Number(booking.deposit_amount).toFixed(2)}5802BR5916Academia do Gol6009Sao Paulo62070503***6304`
    return {
      chargeId: null,
      pixQrCode: null,
      pixCopyPaste: fallbackCopyPaste,
      isReal: false,
      error: error.message,
    }
  }
}
