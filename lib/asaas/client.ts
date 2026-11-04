/**
 * Integração com a API do Asaas (v3) para cobrança PIX automática
 * Suporta ambiente de Produção e Sandbox
 */

import { createAdminClient } from '@/lib/supabase/admin'

function getAsaasApiKey(): string | undefined {
  let raw = process.env.ASAAS_API_KEY?.trim()
  if (!raw && process.env.ASAAS_API_KEY_B64) {
    try {
      raw = Buffer.from(process.env.ASAAS_API_KEY_B64.trim(), 'base64').toString('utf8').trim()
    } catch {
      // ignora erro de decode
    }
  }
  if (!raw) return undefined
  // Caso o $ inicial tenha sido omitido para evitar interpolação de variáveis em .env
  if (raw.startsWith('aact_')) {
    return `$${raw}`
  }
  return raw
}

function getBaseUrl(apiKey?: string): string {
  const env = (process.env.ASAAS_ENVIRONMENT || 'production').toLowerCase().trim()
  if (env === 'sandbox' || apiKey?.startsWith('$aact_YTU') || apiKey?.startsWith('$aact_hmlg')) {
    return 'https://sandbox.asaas.com/api/v3'
  }
  return 'https://api.asaas.com/v3'
}

function getAsaasHeaders(apiKey: string): Record<string, string> {
  return {
    access_token: apiKey,
    'User-Agent': 'AcademiaDoGol/1.0',
    'Content-Type': 'application/json',
  }
}

interface AsaasCustomerPayload {
  name: string
  phone: string
  cpfCnpj?: string | null
  email?: string | null
}

interface PixQrCodeResponse {
  encodedImage: string
  payload: string
  expirationDate: string
}

function getBrazilTodayStr(): string {
  const now = new Date()
  const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const y = brTime.getFullYear()
  const m = String(brTime.getMonth() + 1).padStart(2, '0')
  const d = String(brTime.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Cria ou recupera um cliente no Asaas pelo CPF ou telefone/e-mail
 */
export async function getOrCreateAsaasCustomer(data: AsaasCustomerPayload): Promise<string> {
  const apiKey = getAsaasApiKey()
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurada no ambiente.')
  }

  const baseUrl = getBaseUrl(apiKey)
  const headers = getAsaasHeaders(apiKey)
  const cleanPhone = data.phone.replace(/\D/g, '')
  const cleanCpf = data.cpfCnpj ? data.cpfCnpj.replace(/\D/g, '') : undefined

  // 1. Tenta buscar cliente existente pelo CPF (prioritário) ou telefone celular
  try {
    const queryParam = cleanCpf ? `cpfCnpj=${cleanCpf}` : `mobilePhone=${cleanPhone}`
    const searchRes = await fetch(`${baseUrl}/customers?${queryParam}`, {
      headers,
      cache: 'no-store',
    })

    if (searchRes.ok) {
      const searchData = await searchRes.json()
      if (searchData.data && searchData.data.length > 0) {
        const existing = searchData.data[0]
        // Se o cliente existente não tinha CPF e agora temos CPF, atualiza no Asaas
        if (!existing.cpfCnpj && cleanCpf) {
          await fetch(`${baseUrl}/customers/${existing.id}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: data.name,
              cpfCnpj: cleanCpf,
              mobilePhone: cleanPhone || undefined,
            }),
            cache: 'no-store',
          })
        }
        return existing.id
      }
    }
  } catch (err) {
    console.warn('[Asaas] Falha ao consultar cliente existente:', err)
  }

  // 2. Se não existir, cadastra novo cliente
  const createRes = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: data.name,
      cpfCnpj: cleanCpf,
      mobilePhone: cleanPhone || undefined,
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
 * Cria a cobrança PIX no Asaas e obtém o QR Code + Copia e Cola (com retry automático)
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
  const apiKey = getAsaasApiKey()
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurada no ambiente.')
  }

  const baseUrl = getBaseUrl(apiKey)
  const headers = getAsaasHeaders(apiKey)

  // Vencimento de hoje no fuso de Brasília (evita virada de dia UTC após 21h)
  const today = getBrazilTodayStr()

  // 1. Cria a cobrança PIX
  const paymentRes = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers,
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

  // 2. Obtém os dados do QR Code PIX (com retry caso o BACEN/Asaas leve ~1s para registrar o QR Code)
  let qrData: PixQrCodeResponse | null = null
  let lastErrorText = ''
  let lastStatus = 0

  for (let attempt = 1; attempt <= 4; attempt++) {
    const qrRes = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, {
      headers,
      cache: 'no-store',
    })

    if (qrRes.ok) {
      qrData = await qrRes.json()
      if (qrData?.encodedImage && qrData?.payload) {
        break
      }
    } else {
      lastStatus = qrRes.status
      lastErrorText = await qrRes.text()
    }

    if (attempt < 4) {
      await sleep(1000)
    }
  }

  if (!qrData || !qrData.encodedImage || !qrData.payload) {
    throw new Error(`Erro ao buscar QR Code PIX no Asaas (${lastStatus}): ${lastErrorText}`)
  }

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

  const apiKey = getAsaasApiKey()

  // Se não tiver ASAAS_API_KEY no ambiente, retorna modo simulado
  if (!apiKey) {
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

    // Extrai CPF da tabela customer ou das notes da reserva
    const cpfFromNotes = booking.notes?.startsWith('CPF:')
      ? booking.notes.replace('CPF:', '').trim()
      : null
    const cpfCnpj = customer?.cpf || cpfFromNotes || null

    const asaasCustomerId = await getOrCreateAsaasCustomer({
      name: customer?.name || 'Cliente Academia do Gol',
      phone: customer?.phone || '',
      cpfCnpj,
      email: customer?.email || null,
    })

    const pixDetails = await createAsaasPixCharge({
      customerId: asaasCustomerId,
      amount: Number(booking.deposit_amount),
      description: `Sinal Reserva - ${field?.name || 'Campo'} - Academia do Gol`,
      externalReference: booking.id,
    })

    // Salva na reserva no Supabase para persistência imediata via RPC SECURITY DEFINER
    const supabase = createAdminClient()
    await supabase.rpc('save_booking_pix', {
      p_booking_id: booking.id,
      p_charge_id: pixDetails.chargeId,
      p_qr_code: pixDetails.pixQrCode,
      p_copy_paste: pixDetails.pixCopyPaste,
    })

    return {
      ...pixDetails,
      isReal: true,
    }
  } catch (error: any) {
    console.error('[Asaas] Erro ao gerar PIX dinâmico:', error)
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
