// Página pública de pagamento de mensalidade (PIX) — Academia do Gol

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrGenerateContractPix } from '@/lib/asaas/client'
import { MensalidadeClient } from './mensalidade-client'
import { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Pagamento de Mensalidade | Academia do Gol`,
    description: `Realize o pagamento seguro via PIX da sua mensalidade na Academia do Gol.`,
  }
}

export default async function MensalidadePage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()

  // Busca os dados da mensalidade
  const { data: payment, error } = await supabase
    .from('fixed_payments')
    .select(`
      id,
      contract_id,
      reference_month,
      amount,
      status,
      payment_method,
      paid_at,
      asaas_charge_id,
      pix_copy_paste,
      pix_qr_code_url,
      invoice_url,
      contract:fixed_contracts(
        id,
        day_of_week,
        start_time,
        end_time,
        duration_minutes,
        secondary_organizer_name,
        secondary_organizer_phone,
        customer:customers(id, name, phone, email),
        field:fields(id, name, photo_urls)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !payment) {
    notFound()
  }

  // Gera ou busca os dados do PIX
  let pixData = {
    chargeId: payment.asaas_charge_id,
    pixQrCode: payment.pix_qr_code_url,
    pixCopyPaste: payment.pix_copy_paste || '',
    invoiceUrl: payment.invoice_url,
    isReal: true,
  }

  if (payment.status === 'pending') {
    try {
      const generated = await getOrGenerateContractPix(payment.id)
      pixData = {
        chargeId: generated.chargeId,
        pixQrCode: generated.pixQrCode,
        pixCopyPaste: generated.pixCopyPaste || '',
        invoiceUrl: (generated as any).invoiceUrl || null,
        isReal: generated.isReal,
      }
    } catch (err) {
      console.error('[MensalidadePage] Erro ao obter PIX:', err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <MensalidadeClient payment={payment} pixData={pixData} />
    </div>
  )
}
