'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  confirmRemainingPaymentAction, 
  completeBookingAction, 
  adminCancelBookingAction 
} from './actions'
import { 
  Search, DollarSign, X, CheckSquare, Calendar, Clock, 
  ChevronDown, ChevronUp, Phone, Mail, User, Hash
} from 'lucide-react'

interface BookingListProps {
  initialBookings: any[]
}

export function BookingList({ initialBookings }: BookingListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const filteredBookings = initialBookings.filter(b => {
    const s = search.toLowerCase()
    const matchesSearch = 
      b.customer?.name?.toLowerCase().includes(s) || 
      b.customer?.phone?.includes(search) ||
      b.customer?.email?.toLowerCase().includes(s) ||
      b.field?.name?.toLowerCase().includes(s)
    
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleConfirmPayment = (bookingId: string) => {
    startTransition(async () => {
      const res = await confirmRemainingPaymentAction(bookingId, paymentMethod)
      if (res.success) {
        setSelectedBookingForPayment(null)
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  const handleCompletePartida = (bookingId: string) => {
    if (confirm('Deseja finalizar esta partida? Isso marcará a reserva como Concluída.')) {
      startTransition(async () => {
        const res = await completeBookingAction(bookingId)
        if (res.success) {
          router.refresh()
        } else {
          alert(res.error)
        }
      })
    }
  }

  const handleCancelReserva = (bookingId: string) => {
    if (confirm('Tem certeza que deseja cancelar esta reserva?')) {
      startTransition(async () => {
        const res = await adminCancelBookingAction(bookingId)
        if (res.success) {
          router.refresh()
        } else {
          alert(res.error)
        }
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pendente</span>
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Confirmado</span>
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Concluído</span>
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Cancelado</span>
      default:
        return null
    }
  }

  const displayPaymentMethod = (m: string) => {
    switch (m) {
      case 'pix_manual': return 'Pix Manual'
      case 'cash': return 'Dinheiro'
      case 'card_machine': return 'Cartão'
      default: return 'Online/Pix'
    }
  }

  const formatBirthDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div className="space-y-5">
      {/* Barra de busca + filtros */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Nome, celular, e-mail ou campo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'pending', label: 'Pendentes' },
            { value: 'confirmed', label: 'Confirmados' },
            { value: 'completed', label: 'Concluídos' },
            { value: 'cancelled', label: 'Cancelados' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                statusFilter === opt.value
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      <p className="text-xs text-zinc-500 px-1">
        {filteredBookings.length} reserva{filteredBookings.length !== 1 ? 's' : ''} encontrada{filteredBookings.length !== 1 ? 's' : ''}
      </p>

      {/* Lista de reservas */}
      <div className="space-y-2">
        {filteredBookings.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-14 text-center text-zinc-500">
            Nenhuma reserva encontrada.
          </div>
        ) : (
          filteredBookings.map((b) => {
            const isPendingPayment = b.remaining_status === 'pending' && b.status !== 'cancelled'
            const isExpanded = expandedRow === b.id
            const canAct = b.status === 'confirmed' || b.status === 'pending'

            return (
              <div
                key={b.id}
                className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all duration-200 ${
                  isExpanded ? 'border-emerald-500/30' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Linha principal — clicável para expandir */}
                <button
                  onClick={() => setExpandedRow(isExpanded ? null : b.id)}
                  className="w-full text-left px-5 py-4 grid grid-cols-[1fr_1fr_auto_auto_auto] sm:grid-cols-[1.5fr_1fr_1fr_auto_auto_auto] gap-4 items-center"
                >
                  {/* Partida */}
                  <div>
                    <div className="flex items-center gap-1.5 text-white font-semibold text-sm">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      {new Date(b.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs mt-0.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      {b.start_time.slice(0,5)} – {b.end_time.slice(0,5)}
                    </div>
                  </div>

                  {/* Campo */}
                  <div className="text-zinc-300 text-sm font-medium hidden sm:block">
                    {b.field?.name ?? 'Campo'}
                  </div>

                  {/* Cliente — resumo */}
                  <div>
                    <div className="font-bold text-white text-sm">{b.customer?.name}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">{b.customer?.phone}</div>
                  </div>

                  {/* Valores */}
                  <div className="text-right">
                    <div className="font-bold text-white text-sm">R$ {Number(b.total_amount).toFixed(2)}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">Sinal: R$ {Number(b.deposit_amount).toFixed(2)}</div>
                  </div>

                  {/* Status */}
                  <div>{getStatusBadge(b.status)}</div>

                  {/* Chevron */}
                  <div className="text-zinc-500">
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />
                    }
                  </div>
                </button>

                {/* Painel expandido */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Dados do cliente */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        Dados do Cliente
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span className="text-white font-semibold">{b.customer?.name ?? '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                          <a
                            href={`https://wa.me/55${b.customer?.phone?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            {b.customer?.phone ?? '—'}
                          </a>
                        </div>
                        {b.customer?.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                            <span className="text-zinc-300">{b.customer.email}</span>
                          </div>
                        )}
                        {b.customer?.birth_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                            <span className="text-zinc-400 text-xs">Nascimento: {formatBirthDate(b.customer.birth_date)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
                          <Hash className="w-3.5 h-3.5" />
                          Total de reservas: <span className="text-zinc-300 font-semibold ml-1">{b.customer?.total_bookings ?? 1}</span>
                        </div>
                        {b.notes && (
                          <div className="mt-2 text-xs text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
                            <span className="font-semibold text-zinc-300">Obs:</span> {b.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pagamento + Ações */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Pagamento
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Total</span>
                          <span className="text-white font-bold">R$ {Number(b.total_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Sinal (entrada)</span>
                          <span className={b.deposit_status === 'paid' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                            R$ {Number(b.deposit_amount).toFixed(2)} — {b.deposit_status === 'paid' ? '✓ Pago' : '⏳ Pendente'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Restante (balcão)</span>
                          <span className={b.remaining_status === 'paid' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                            R$ {Number(b.remaining_amount).toFixed(2)} — {b.remaining_status === 'paid' 
                              ? `✓ ${displayPaymentMethod(b.remaining_payment_method)}` 
                              : '⏳ Pendente'}
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      {canAct && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {isPendingPayment && (
                            <button
                              onClick={() => setSelectedBookingForPayment(b.id)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-xs font-semibold"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Dar Baixa no Restante
                            </button>
                          )}
                          <button
                            onClick={() => handleCompletePartida(b.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all text-xs font-semibold"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            Concluir Partida
                          </button>
                          <button
                            onClick={() => handleCancelReserva(b.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all text-xs font-semibold"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Modal de confirmação de pagamento */}
      {selectedBookingForPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Registrar Pagamento</h3>
              <p className="text-zinc-400 text-xs mt-1">Como o cliente pagou o restante do valor?</p>
            </div>

            <div className="space-y-3">
              {[
                { value: 'cash', label: 'Dinheiro', icon: '💵' },
                { value: 'pix_manual', label: 'Pix Manual', icon: '⚡' },
                { value: 'card_machine', label: 'Cartão (Maquineta)', icon: '💳' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === opt.value
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white font-semibold'
                      : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                    className="sr-only"
                  />
                  <span className="text-xl">{opt.icon}</span>
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedBookingForPayment(null)}
                className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmPayment(selectedBookingForPayment)}
                disabled={isPending}
                className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-white font-bold rounded-xl text-sm transition-all"
              >
                {isPending ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
