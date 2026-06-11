import { getBookingsData } from './actions'
import { BookingList } from './booking-list'
import { ClipboardList } from 'lucide-react'

interface Props {
  searchParams: Promise<{
    search?: string
    status?: string
  }>
}

export default async function AdminReservasPage({ searchParams }: Props) {
  const params = await searchParams
  const bookings = await getBookingsData(params.search, params.status)

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Painel de Reservas</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Pesquise por clientes, filtre por status de reservas e realize baixas financeiras ou cancelamentos.
          </p>
        </div>
      </div>

      <BookingList initialBookings={bookings} />
    </div>
  )
}
