'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  confirmDepositManuallyAction,
  confirmRemainingPaymentAction, 
  completeBookingAction, 
  adminCancelBookingAction,
  refundBookingDepositAction,
  markBookingAsCortesiaAction,
  markBookingAsReposicaoAction,
  updateBookingAmountsAction,
} from './actions'
import { 
  Search, DollarSign, X, CheckSquare, Calendar, Clock, 
  ChevronDown, ChevronUp, Phone, Mail, User, Hash, MessageCircle,
  RotateCcw, AlertTriangle, Edit2, Loader2, Check
} from 'lucide-react'

interface BookingListProps {
  initialBookings: any[]
}


function getWhatsAppMessageUrl(b: any): string {
  const phone = (b.customer?.phone || '').replace(/\D/g, '')
  if (!phone) return '#'

  const fullPhone = phone.startsWith('55') ? phone : `55${phone}`
  const customerName = b.customer?.name || 'Cliente'
  const fieldName = b.field?.name || 'Campo'
  const dataFormatada = new Date(b.date + 'T12:00:00').toLocaleDateString('pt-BR')
  const startTime = b.start_time ? b.start_time.slice(0, 5) : ''
  const endTime = b.end_time ? b.end_time.slice(0, 5) : ''
  const depositAmount = Number(b.deposit_amount).toFixed(2).replace('.', ',')
  const remainingAmount = Number(b.remaining_amount).toFixed(2).replace('.', ',')
  const isFesta = b.booking_type === 'festa' || b.duration_minutes >= 180
  const tipoLabel = isFesta ? '🎂 Festa de Aniversário / Evento' : '⚽ Aluguel de Quadra (Jogo)'

  let text = ''
  const isCortesia = b.remaining_payment_method === 'Cortesia' || b.remaining_payment_method === 'cortesia' || b.notes?.includes('[CORTESIA]') || Number(b.total_amount) === 0

  if (isCortesia && (b.status === 'confirmed' || b.status === 'completed')) {
    text = `Olá, *${customerName}*! Tudo bem? ⚽🏟️\n\nAqui é da equipe *Academia do Gol*.\nSua reserva de *CORTESIA* está *CONFIRMADA*! 🎁\n\n📋 *Detalhes da Reserva:*\n📍 *Unidade/Campo:* ${fieldName}\n🎟️ *Tipo:* ${tipoLabel}\n📅 *Data:* ${dataFormatada}\n⏰ *Horário:* ${startTime} às ${endTime} (${b.duration_minutes} min)\n🎁 *Valor:* CORTESIA (R$ 0,00 - Isenção Total)\n\nEstamos preparando tudo para receber você e sua turma! Se precisar de algo, só nos chamar por aqui. Nos vemos em campo! 🚀`
  } else if (b.status === 'confirmed' || b.deposit_status === 'paid') {
    text = `Olá, *${customerName}*! Tudo bem? ⚽🏟️\n\nAqui é da equipe *Academia do Gol*.\nSua reserva está *CONFIRMADA*!\n\n📋 *Detalhes da Reserva:*\n📍 *Unidade/Campo:* ${fieldName}\n🎟️ *Tipo:* ${tipoLabel}\n📅 *Data:* ${dataFormatada}\n⏰ *Horário:* ${startTime} às ${endTime} (${b.duration_minutes} min)\n\n💰 *Sinal PIX Pago:* R$ ${depositAmount}\n💵 *Saldo a Pagar no Balcão:* R$ ${remainingAmount}\n\nEstamos preparando tudo para receber você e sua turma! Se precisar de algo, só nos chamar por aqui. Nos vemos em campo! 🚀`
  } else if (b.status === 'pending') {
    text = `Olá, *${customerName}*! Tudo bem? ⚽🏟️\n\nAqui é da *Academia do Gol*.\nVimos que você iniciou a reserva para o campo *${fieldName}* no dia *${dataFormatada}* às *${startTime}*.\n\nFalta apenas concluir o pagamento do sinal PIX (R$ ${depositAmount}) para garantir seu horário antes que ele expire:\n🔗 https://academiadogol.vercel.app/reserva/pagamento/${b.id}\n\nQualquer dúvida estou à disposição!`
  } else {
    text = `Olá, *${customerName}*! Aqui é da equipe da *Academia do Gol*. Tudo bem? Entramos em contato referente à sua reserva do campo *${fieldName}* no dia *${dataFormatada}*. Como podemos te ajudar?`
  }

  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`
}

export function BookingList({ initialBookings }: BookingListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState<any | null>(null)
  const [forceOverride, setForceOverride] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [isRefunding, setIsRefunding] = useState(false)

  // Estado para Edição de Valores e Sinal da Reserva
  const [editingBooking, setEditingBooking] = useState<any | null>(null)
  const [editTotalAmount, setEditTotalAmount] = useState('')
  const [editDepositAmount, setEditDepositAmount] = useState('')
  const [editDepositStatus, setEditDepositStatus] = useState<'pending' | 'paid'>('pending')
  const [editRemainingStatus, setEditRemainingStatus] = useState<'pending' | 'paid'>('pending')
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('pix_manual')
  const [isSavingBooking, setIsSavingBooking] = useState(false)

  const handleOpenEditBooking = (b: any) => {
    setEditingBooking(b)
    setEditTotalAmount(String(b.total_amount ?? 0))
    setEditDepositAmount(String(b.deposit_amount ?? 0))
    setEditDepositStatus(b.deposit_status === 'paid' ? 'paid' : 'pending')
    setEditRemainingStatus(b.remaining_status === 'paid' ? 'paid' : 'pending')
    setEditPaymentMethod(b.remaining_payment_method || 'pix_manual')
  }

  const handleSaveBookingAmounts = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBooking) return
    setIsSavingBooking(true)
    try {
      const res = await updateBookingAmountsAction(editingBooking.id, {
        total_amount: Number(editTotalAmount) || 0,
        deposit_amount: Number(editDepositAmount) || 0,
        deposit_status: editDepositStatus,
        remaining_status: editRemainingStatus,
        remaining_payment_method: editRemainingStatus === 'paid' ? editPaymentMethod : null,
      })
      if (res?.error) {
        alert(res.error)
      } else {
        setEditingBooking(null)
        router.refresh()
      }
    } catch (err: any) {
      alert(err?.message || 'Erro ao atualizar valores da reserva.')
    } finally {
      setIsSavingBooking(false)
    }
  }

  const handleMarkAsReposicao = (bookingId: string) => {
    if (confirm('Deseja transformar esta reserva em REPOSIÇÃO DE PELADA (R$ 0,00)? O valor será zerado e ela ficará confirmada como Reposição.')) {
      startTransition(async () => {
        const res = await markBookingAsReposicaoAction(bookingId)
        if (res.success) {
          router.refresh()
        } else {
          alert(res.error)
        }
      })
    }
  }

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

  const handleConfirmDeposit = (bookingId: string) => {
    if (confirm('Confirmar manualmente o recebimento do sinal desta reserva?')) {
      startTransition(async () => {
        const res = await confirmDepositManuallyAction(bookingId)
        if (res.success) {
          router.refresh()
        } else {
          alert(res.error)
        }
      })
    }
  }

  const handleMarkAsCortesia = (bookingId: string) => {
    if (confirm('Deseja transformar esta reserva em CORTESIA (R$ 0,00)? O valor será zerado e ela ficará confirmada como Cortesia.')) {
      startTransition(async () => {
        const res = await markBookingAsCortesiaAction(bookingId)
        if (res.success) {
          router.refresh()
        } else {
          alert(res.error)
        }
      })
    }
  }

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

  const calculateHoursLeft = (date: string, startTime: string) => {
    try {
      const [hh, mm] = (startTime || '00:00').split(':').map(Number)
      const [y, m, d] = date.split('-').map(Number)
      const bookingMs = new Date(Date.UTC(y, m - 1, d, hh + 3, mm || 0)).getTime()
      const nowMs = Date.now()
      return (bookingMs - nowMs) / (1000 * 60 * 60)
    } catch {
      return 0
    }
  }

  const handleRefundSinal = async () => {
    if (!selectedBookingForRefund) return
    setIsRefunding(true)
    try {
      const res = await refundBookingDepositAction(selectedBookingForRefund.id, {
        forceOverride,
        reason: refundReason.trim() || undefined,
      })
      if (res.success) {
        alert(res.message || 'Sinal estornado com sucesso!')
        setSelectedBookingForRefund(null)
        setForceOverride(false)
        setRefundReason('')
        router.refresh()
      } else {
        alert(res.error || 'Erro ao estornar sinal.')
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + (err?.message || err))
    } finally {
      setIsRefunding(false)
    }
  }

  const getStatusBadge = (status: string, depositStatus?: string, booking?: any) => {
    if (booking?.notes?.includes('[REPOSIÇÃO]')) {
      return (
        <span className="px-2.5 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-500 border border-blue-500/30">
          🔄 Reposição
        </span>
      )
    }
    if (booking?.remaining_payment_method === 'Cortesia' || booking?.remaining_payment_method === 'cortesia' || (Number(booking?.total_amount) === 0 && (status === 'confirmed' || status === 'completed'))) {
      return (
        <span className="px-2.5 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
          🎁 Cortesia
        </span>
      )
    }
    if (depositStatus === 'refunded') {
      return (
        <span
          className="px-2.5 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          Estornado
        </span>
      )
    }
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/25">Pendente</span>
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]">Confirmado</span>
      case 'completed':
        return <span className="px-2.5 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/25">Concluído</span>
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/25">Cancelado</span>
      default:
        return null
    }
  }

  const displayPaymentMethod = (m: string) => {
    switch (m) {
      case 'pix_manual': return 'Pix Manual'
      case 'cash': return 'Dinheiro'
      case 'card_machine': return 'Cartão'
      case 'cortesia':
      case 'Cortesia':
        return '🎁 Cortesia'
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
      <div
        className="flex flex-col sm:flex-row gap-3 justify-between items-center p-4 rounded-[4px]"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="relative w-full sm:max-w-xs flex items-center">
          <Search className="pointer-events-none absolute left-3.5 w-4 h-4 z-10" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Nome, celular, e-mail ou campo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-admin py-2 text-xs"
            style={{ paddingLeft: '2.75rem', paddingRight: search ? '2.25rem' : '1rem' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 p-0.5 cursor-pointer z-10"
              style={{ color: 'var(--text-muted)' }}
              title="Limpar pesquisa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
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
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer"
              style={{
                background: statusFilter === opt.value ? 'var(--brand-subtle)' : 'var(--bg-subtle)',
                color: statusFilter === opt.value ? 'var(--brand)' : 'var(--text-secondary)',
                border: statusFilter === opt.value ? '1px solid var(--brand-ring)' : '1px solid var(--border)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
        {filteredBookings.length} reserva{filteredBookings.length !== 1 ? 's' : ''} encontrada{filteredBookings.length !== 1 ? 's' : ''}
      </p>

      {/* Lista de reservas */}
      <div className="space-y-2">
        {filteredBookings.length === 0 ? (
          <div
            className="rounded-[4px] py-14 text-center text-sm"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
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
                className="rounded-[4px] overflow-hidden transition-all duration-200"
                style={{
                  background: 'var(--bg-card)',
                  border: isExpanded ? '1px solid var(--brand)' : '1px solid var(--border)',
                }}
              >
                {/* Linha principal — clicável para expandir */}
                <button
                  onClick={() => setExpandedRow(isExpanded ? null : b.id)}
                  className="w-full text-left p-4 sm:px-5 sm:py-4 flex flex-col sm:grid sm:grid-cols-[1.5fr_1fr_1fr_auto_auto_auto] gap-3 sm:gap-4 items-stretch sm:items-center cursor-pointer transition-colors hover:bg-[var(--bg-subtle)]"
                >
                  {/* Mobile Row Layout (Visible below sm) */}
                  <div className="flex sm:hidden items-center justify-between">
                    <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {b.customer?.name}
                    </div>
                    <div>{getStatusBadge(b.status, b.deposit_status, b)}</div>
                  </div>
                  
                  <div className="flex sm:hidden items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                      {new Date(b.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {b.start_time.slice(0,5)}
                    </div>
                    <div className="font-medium flex items-center gap-1.5">
                      <span>{b.field?.name ?? 'Campo'}</span>
                      {b.booking_type === 'festa' || b.duration_minutes >= 180 ? (
                        <span className="text-[10px] text-purple-500 font-bold">🎂 Festa</span>
                      ) : (
                        <span className="text-[10px] text-emerald-500 font-bold">⚽ Jogo</span>
                      )}
                    </div>
                  </div>
                  
                  <div
                    className="flex sm:hidden items-center justify-between text-xs pt-2"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Total:</span>{' '}
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          R$ {Number(b.total_amount).toFixed(2)}
                        </span>
                      </div>
                      <a
                        href={getWhatsAppMessageUrl(b)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                    <div className="flex items-center gap-1 font-semibold" style={{ color: 'var(--brand)' }}>
                      <span>Detalhes</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Desktop Row Layout (Hidden below sm) */}
                  {/* Partida */}
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1.5 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                      {new Date(b.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="w-3 h-3 shrink-0" />
                      {b.start_time.slice(0,5)} – {b.end_time.slice(0,5)}
                    </div>
                  </div>

                  {/* Campo */}
                  <div className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-1.5">
                      <span>{b.field?.name ?? 'Campo'}</span>
                      {b.booking_type === 'festa' || b.duration_minutes >= 180 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-500 border border-purple-500/30">
                          🎂 Festa
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                          ⚽ Jogo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cliente — resumo */}
                  <div className="hidden sm:block">
                    <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {b.customer?.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {b.customer?.phone}
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="text-right hidden sm:block">
                    <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      R$ {Number(b.total_amount).toFixed(2)}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Sinal: R$ {Number(b.deposit_amount).toFixed(2)}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="hidden sm:block">{getStatusBadge(b.status, b.deposit_status, b)}</div>

                  {/* Botão rápido WhatsApp */}
                  <div className="hidden sm:block">
                    <a
                      href={getWhatsAppMessageUrl(b)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Enviar mensagem pronta pelo WhatsApp"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {/* Chevron */}
                  <div className="text-zinc-500 hidden sm:block">
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />
                    }
                  </div>
                </button>

                {/* Painel expandido */}
                {isExpanded && (
                  <div
                    className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    {/* Dados do cliente */}
                    <div className="space-y-3">
                      <h4
                        className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <User className="w-3.5 h-3.5" />
                        Dados do Cliente
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {b.customer?.name ?? '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                          <a
                            href={`https://wa.me/55${b.customer?.phone?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline transition-colors font-mono font-medium"
                            style={{ color: 'var(--brand)' }}
                          >
                            {b.customer?.phone ?? '—'}
                          </a>
                        </div>
                        {b.customer?.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{b.customer.email}</span>
                          </div>
                        )}
                        {b.customer?.birth_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              Nascimento: {formatBirthDate(b.customer.birth_date)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
                          <Hash className="w-3.5 h-3.5" />
                          Total de reservas: <span className="font-semibold ml-1" style={{ color: 'var(--text-primary)' }}>{b.customer?.total_bookings ?? 1}</span>
                        </div>
                        {b.notes && (
                          <div
                            className="mt-2 text-xs rounded-[2px] px-3 py-2"
                            style={{
                              background: 'var(--bg-subtle)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Obs:</span> {b.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pagamento + Ações */}
                    <div className="space-y-4">
                      <h4
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Pagamento
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span style={{ color: 'var(--text-muted)' }}>Total</span>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            R$ {Number(b.total_amount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span style={{ color: 'var(--text-muted)' }}>Sinal (entrada)</span>
                          <span className={b.deposit_status === 'paid' ? 'font-semibold' : 'text-amber-500 font-semibold'} style={b.deposit_status === 'paid' ? { color: 'var(--brand)' } : {}}>
                            R$ {Number(b.deposit_amount).toFixed(2)} — {b.deposit_status === 'paid' ? '✓ Pago' : '⏳ Pendente'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span style={{ color: 'var(--text-muted)' }}>Restante (balcão)</span>
                          <span className={b.remaining_status === 'paid' ? 'font-semibold' : 'text-amber-500 font-semibold'} style={b.remaining_status === 'paid' ? { color: 'var(--brand)' } : {}}>
                            R$ {Number(b.remaining_amount).toFixed(2)} — {b.remaining_status === 'paid' 
                              ? `✓ ${displayPaymentMethod(b.remaining_payment_method)}` 
                              : '⏳ Pendente'}
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      {canAct && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          <a
                            href={getWhatsAppMessageUrl(b)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-emerald-600/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Enviar Mensagem WhatsApp
                          </a>
                          {b.status === 'pending' && (
                            <button
                              onClick={() => handleConfirmDeposit(b.id)}
                              disabled={isPending}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              Confirmar Sinal (PIX)
                            </button>
                          )}
                          {isPendingPayment && (
                            <button
                              onClick={() => setSelectedBookingForPayment(b.id)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-[var(--brand-subtle)] border border-[var(--brand-ring)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Dar Baixa no Restante
                            </button>
                          )}
                          <button
                            onClick={() => handleCompletePartida(b.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            Concluir Partida
                          </button>
                          {/* Editar Valores / Sinal / Pagamento */}
                          <button
                            onClick={() => handleOpenEditBooking(b)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--brand)] transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                            title="Editar valor total, sinal ou registrar pagamento"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[var(--brand)]" />
                            Editar Valores / Pagamento
                          </button>

                          {b.status !== 'cancelled' && b.status !== 'completed' && !b.notes?.includes('[REPOSIÇÃO]') && (
                            <button
                              onClick={() => handleMarkAsReposicao(b.id)}
                              disabled={isPending}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-blue-500/15 border border-blue-500/30 text-blue-500 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                              title="Marcar como reposição de pelada (R$ 0,00)"
                            >
                              <span>🔄</span>
                              Marcar Reposição
                            </button>
                          )}

                          {b.status !== 'cancelled' && b.status !== 'completed' && b.remaining_payment_method !== 'Cortesia' && (
                            <button
                              onClick={() => handleMarkAsCortesia(b.id)}
                              disabled={isPending}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-purple-500/15 border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                              title="Zerar valores e marcar como Cortesia"
                            >
                              <span>🎁</span>
                              Marcar Cortesia
                            </button>
                          )}
                          {/* Estornar Sinal PIX direto no Asaas */}
                          {(b.deposit_status === 'paid' || b.status === 'confirmed') && b.deposit_status !== 'refunded' && (
                            <button
                              onClick={() => {
                                setSelectedBookingForRefund(b)
                                setForceOverride(false)
                                setRefundReason('')
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                              title="Estornar sinal PIX de volta para a conta do cliente via Asaas"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Estornar Sinal PIX
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelReserva(b.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
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
          <div
            className="rounded-[4px] p-6 max-w-sm w-full space-y-6 shadow-2xl"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <h3 
                className="text-2xl font-black uppercase tracking-wider"
                style={{
                  fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                  color: 'var(--text-primary)',
                }}
              >
                Registrar Pagamento
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Como o cliente pagou o restante do valor?
              </p>
            </div>

            <div className="space-y-3">
              {[
                { value: 'cash', label: 'Dinheiro', icon: '💵' },
                { value: 'pix_manual', label: 'Pix Manual', icon: '⚡' },
                { value: 'card_machine', label: 'Cartão (Maquineta)', icon: '💳' },
                { value: 'cortesia', label: 'Cortesia (Isenção Restante)', icon: '🎁' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 p-3 rounded-[2px] cursor-pointer transition-all"
                  style={{
                    background: paymentMethod === opt.value ? 'var(--brand-subtle)' : 'var(--bg-subtle)',
                    border: paymentMethod === opt.value ? '1px solid var(--brand)' : '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
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
                  <span className="text-sm font-semibold">{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedBookingForPayment(null)}
                className="btn-admin-secondary flex-1 text-center justify-center rounded-[2px]"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmPayment(selectedBookingForPayment)}
                disabled={isPending}
                className="btn-admin-primary flex-1 text-center justify-center rounded-[2px]"
              >
                {isPending ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Estorno PIX com Trava de 48h */}
      {selectedBookingForRefund && (() => {
        const hoursLeft = calculateHoursLeft(selectedBookingForRefund.date, selectedBookingForRefund.start_time)
        const isWithinPolicy = hoursLeft >= 48
        const depositFmt = Number(selectedBookingForRefund.deposit_amount).toFixed(2).replace('.', ',')

        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div
              className="rounded-lg p-6 max-w-md w-full space-y-5 shadow-2xl"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 
                    className="text-2xl font-black uppercase tracking-wider leading-none"
                    style={{
                      fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                      color: 'var(--text-primary)',
                    }}
                  >
                    Estornar Sinal PIX
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Devolução imediata para a conta bancária do cliente
                  </p>
                </div>
              </div>

              {/* Detalhes da Reserva */}
              <div
                className="rounded-lg p-4 space-y-2 text-xs"
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Cliente:</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedBookingForRefund.customer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Campo:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{selectedBookingForRefund.field?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Data e Horário:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {new Date(selectedBookingForRefund.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {selectedBookingForRefund.start_time?.slice(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-amber-500 font-bold uppercase tracking-wider">Valor do Sinal a Devolver:</span>
                  <span className="text-amber-500 font-black text-sm">R$ {depositFmt}</span>
                </div>
              </div>

              {/* Status do Prazo das 48 Horas */}
              {isWithinPolicy ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-md flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckSquare className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block">Dentro do Prazo Oficial (48h)</span>
                    Faltam <strong>{hoursLeft.toFixed(1)} horas</strong> para a partida. O estorno está em conformidade com as regras da arena.
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-md space-y-2 text-xs text-amber-600 dark:text-amber-400">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block">Fora do Prazo Oficial</span>
                      Faltam apenas <strong>{Math.max(0, hoursLeft).toFixed(1)} horas</strong> para a partida (o prazo mínimo é 48h).
                    </div>
                  </div>
                  <label className="flex items-center gap-2 pt-1.5 cursor-pointer text-[11px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={forceOverride}
                      onChange={(e) => setForceOverride(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>Autorizar estorno excepcional como Gerente</span>
                  </label>
                </div>
              )}

              {/* Motivo opcional */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Motivo do Estorno (Opcional):
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Ex: Cancelamento solicitado pelo cliente, chuva forte..."
                  className="input-admin py-1.5 text-xs"
                />
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForRefund(null)}
                  disabled={isRefunding}
                  className="btn-admin-secondary flex-1 text-center justify-center rounded-[2px]"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleRefundSinal}
                  disabled={isRefunding || (!isWithinPolicy && !forceOverride)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black text-xs uppercase tracking-wider rounded-[2px] flex-1 text-center justify-center flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                >
                  {isRefunding ? 'Processando PIX...' : 'Confirmar Estorno'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal de Edição de Valores e Pagamento */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div
            className="rounded-lg p-6 max-w-md w-full space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 
                    className="text-2xl font-black uppercase tracking-wider leading-none"
                    style={{
                      fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                      color: 'var(--text-primary)',
                    }}
                  >
                    Editar Valores / Pagamento
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {editingBooking.customer?.name} • {editingBooking.field?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBookingAmounts} className="space-y-4">
              {/* Data e hora */}
              <div className="p-3 rounded text-xs flex justify-between" style={{ background: 'var(--bg-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Horário agendado:</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {new Date(editingBooking.date + 'T12:00:00').toLocaleDateString('pt-BR')} das {editingBooking.start_time?.slice(0, 5)} às {editingBooking.end_time?.slice(0, 5)}
                </span>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                    Valor Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editTotalAmount}
                    onChange={(e) => setEditTotalAmount(e.target.value)}
                    className="input-admin py-2 text-sm w-full font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                    Valor do Sinal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editDepositAmount}
                    onChange={(e) => setEditDepositAmount(e.target.value)}
                    className="input-admin py-2 text-sm w-full font-bold"
                  />
                </div>
              </div>

              {/* Status do Sinal */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Status do Sinal (R$ {Number(editDepositAmount || 0).toFixed(2)})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDepositStatus('pending')}
                    className={`py-2 px-3 text-xs font-bold rounded border transition-all text-center ${
                      editDepositStatus === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    ⏳ Pendente
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDepositStatus('paid')}
                    className={`py-2 px-3 text-xs font-bold rounded border transition-all text-center ${
                      editDepositStatus === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    ✅ Sinal Pago
                  </button>
                </div>
              </div>

              {/* Status do Saldo Restante */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Saldo Restante (R$ {Math.max(0, (Number(editTotalAmount || 0) - Number(editDepositAmount || 0))).toFixed(2)})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRemainingStatus('pending')}
                    className={`py-2 px-3 text-xs font-bold rounded border transition-all text-center ${
                      editRemainingStatus === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    ⏳ A Pagar no Balcão
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRemainingStatus('paid')}
                    className={`py-2 px-3 text-xs font-bold rounded border transition-all text-center ${
                      editRemainingStatus === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    ✅ Total Quitado
                  </button>
                </div>
              </div>

              {/* Forma de Pagamento se Restante Pago */}
              {editRemainingStatus === 'paid' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Forma de Pagamento do Saldo
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'pix_manual', label: '⚡ PIX' },
                      { id: 'cash', label: '💵 Dinheiro' },
                      { id: 'card_machine', label: '💳 Cartão' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setEditPaymentMethod(m.id)}
                        className={`py-2 px-2 font-bold rounded border transition-all text-center ${
                          editPaymentMethod === m.id
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  disabled={isSavingBooking}
                  className="btn-admin-secondary flex-1 text-center justify-center rounded-[2px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingBooking}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black text-xs uppercase tracking-wider rounded-[2px] flex-1 text-center justify-center flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                >
                  {isSavingBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSavingBooking ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
