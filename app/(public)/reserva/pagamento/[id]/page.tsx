// Página de pagamento PIX (Checkout) — Área Pública

import { notFound, redirect } from 'next/navigation'
import { getBookingById } from '@/app/(public)/actions'
import { PixCheckoutClient } from './checkout-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PagamentoPage({ params }: Props) {
  const { id } = await params
  const booking = await getBookingById(id)

  if (!booking) {
    notFound()
  }

  // Se a reserva já estiver confirmada, redireciona diretamente para a tela de sucesso
  if (booking.status === 'confirmed' || booking.status === 'completed') {
    redirect(`/reserva/confirmacao/${id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <PixCheckoutClient booking={booking} />
    </div>
  )
}
