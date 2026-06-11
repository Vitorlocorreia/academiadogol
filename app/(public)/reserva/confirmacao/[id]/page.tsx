import { notFound, redirect } from 'next/navigation'
import { getBookingById } from '@/app/(public)/actions'
import { ConfirmationClient } from './confirmacao-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ConfirmacaoPage({ params }: Props) {
  const { id } = await params
  const booking = await getBookingById(id)

  if (!booking) {
    notFound()
  }

  // Se a reserva ainda estiver pendente de pagamento, redireciona para a página de checkout
  if (booking.status === 'pending') {
    redirect(`/reserva/pagamento/${id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <ConfirmationClient booking={booking} />
    </div>
  )
}
