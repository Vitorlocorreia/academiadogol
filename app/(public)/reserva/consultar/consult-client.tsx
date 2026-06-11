'use client'

import { useActionState } from 'react'
import { consultBookingAction } from '@/app/(public)/actions'
import Link from 'next/link'

const INIT = { error: '', bookings: [] as any[] }

export function ConsultClient() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof INIT, fd: FormData) => {
      const res = await consultBookingAction(_prev, fd)
      return {
        error: res.error,
        bookings: (res.bookings as any[]) ?? [],
      }
    },
    INIT
  )

  const formatDateTime = (dateStr: string, timeStr: string, duration: number) => {
    const date = new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      weekday: 'short',
    })

    const [hh, mm] = timeStr.split(':').map(Number)
    const endMin = hh * 60 + mm + duration
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

    return {
      date,
      time: `${timeStr} → ${endTime}`,
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span
            className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider"
            style={{
              background: 'var(--brand-subtle)',
              color: 'var(--brand)',
              border: '1px solid var(--brand-ring)',
              borderRadius: '2px',
            }}
          >
            Confirmada
          </span>
        )
      case 'pending':
        return (
          <span
            className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider"
            style={{
              background: 'rgba(217,119,6,0.08)',
              color: '#d97706',
              border: '1px solid rgba(217,119,6,0.2)',
              borderRadius: '2px',
            }}
          >
            Pendente
          </span>
        )
      case 'cancelled':
        return (
          <span
            className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider"
            style={{
              background: 'var(--bg-subtle)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
            }}
          >
            Cancelada
          </span>
        )
      case 'completed':
        return (
          <span
            className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider"
            style={{
              background: 'rgba(59,130,246,0.08)',
              color: '#3b82f6',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '2px',
            }}
          >
            Finalizada
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Formulário de Busca */}
      <form action={formAction} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            name="phone"
            type="tel"
            required
            id="input-consultar-telefone"
            placeholder="Digite seu WhatsApp (ex: 81999096142)"
            className="w-full px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-all"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <button
          type="submit"
          id="btn-consultar"
          disabled={isPending}
          className="px-8 py-3.5 text-white font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:opacity-90 disabled:opacity-50 cursor-pointer"
          style={{
            background: 'var(--brand)',
            borderRadius: '2px',
            letterSpacing: '0.15em',
          }}
        >
          {isPending ? 'Buscando...' : 'Consultar'}
        </button>
      </form>

      {/* Erro */}
      {state.error && (
        <div className="px-4 py-3 text-red-500 bg-red-500/10 border border-red-500/20 text-xs font-bold uppercase tracking-wider text-center" style={{ borderRadius: '2px' }}>
          {state.error}
        </div>
      )}

      {/* Lista de Reservas */}
      {!isPending && state.bookings.length > 0 && (
        <div className="space-y-4">
          <h3
            className="uppercase tracking-wider font-bold"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.25rem',
              color: 'var(--text-primary)',
            }}
          >
            Reservas Encontradas ({state.bookings.length})
          </h3>
          
          <div className="grid grid-cols-1 gap-4 animate-fade-in">
            {state.bookings.map((booking) => {
              const { date, time } = formatDateTime(booking.date, booking.start_time, booking.duration_minutes)
              
              return (
                <div
                  key={booking.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-500 transition-colors"
                  style={{
                    background: 'var(--bg-card-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="uppercase tracking-wide font-black"
                        style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: '1.25rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {booking.field?.name}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      <span className="capitalize">{date}</span>
                      <span style={{ color: 'var(--border)' }}>•</span>
                      <span>{time}</span>
                      <span style={{ color: 'var(--border)' }}>•</span>
                      <span>Total: R$ {booking.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-0" style={{ borderColor: 'var(--border)' }}>
                    {booking.status === 'pending' && (
                      <Link
                        href={`/reserva/pagamento/${booking.id}`}
                        className="px-4 py-2 font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:opacity-90"
                        style={{
                          borderRadius: '2px',
                          border: '1px solid var(--brand-ring)',
                          background: 'var(--brand-subtle)',
                          color: 'var(--brand)',
                        }}
                      >
                        Pagar Sinal PIX →
                      </Link>
                    )}
                    {booking.status === 'confirmed' && (
                      <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--brand)' }}>
                        Sinal pago: R$ {booking.deposit_amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Caso sem reservas, mas consultado sem erro */}
      {!isPending && !state.error && state.bookings.length === 0 && (
        <p className="text-center text-xs font-semibold uppercase tracking-wider py-8" style={{ color: 'var(--text-muted)' }}>
          Digite o número cadastrado no campo acima para buscar suas reservas.
        </p>
      )}
    </div>
  )
}
