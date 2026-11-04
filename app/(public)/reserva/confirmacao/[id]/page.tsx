import { notFound, redirect } from 'next/navigation'
import { getBookingById } from '@/app/(public)/actions'
import { ConfirmationClient } from './confirmacao-client'
import { createAdminClient } from '@/lib/supabase/admin'

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

  // Busca o telefone oficial da Academia do Gol nas configurações
  const supabase = createAdminClient()
  const { data: settings } = await supabase
    .from('settings')
    .select('business_phone')
    .single()

  const businessPhone = settings?.business_phone || '(81) 99909-6142'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <ConfirmationClient booking={booking} businessPhone={businessPhone} />
    </div>
  )
}
