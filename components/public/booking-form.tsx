'use client'

// Formulário de dados do cliente para completar a reserva

import { useActionState, useEffect } from 'react'
import { createBookingAction } from '@/app/(public)/actions'
import { getFieldPrice } from '@/lib/pricing'

interface Props {
  fieldId: string
  fieldName: string
  date: string
  startTime: string
  duration: number
  hourlyRate: number
  depositType: 'fixed' | 'percentage'
  depositValue: number
}

const INIT = { error: '' }

export function BookingForm({
  fieldId,
  fieldName,
  date,
  startTime,
  duration,
  hourlyRate,
  depositType,
  depositValue,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof INIT, fd: FormData) => {
      const r = await createBookingAction(_prev, fd)
      return r ?? INIT
    },
    INIT
  )

  const total = getFieldPrice(fieldName, duration, hourlyRate)
  const deposit =
    depositType === 'fixed' ? depositValue : (total * depositValue) / 100

  // Calcula horário de fim para exibição
  const [hh, mm] = startTime.split(':').map(Number)
  const endMin = hh * 60 + mm + duration
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

  const dateDisplay = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden fields */}
      <input type="hidden" name="field_id" value={fieldId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="start_time" value={startTime} />
      <input type="hidden" name="duration_minutes" value={duration} />

      {/* Resumo da reserva */}
      <div
        className="p-5 space-y-3"
        style={{
          background: 'var(--bg-card-alt)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
        }}
      >
        <h3
          className="font-bold uppercase tracking-wider mb-1"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.25rem',
            color: 'var(--text-primary)',
          }}
        >
          Resumo da reserva
        </h3>
        <div className="space-y-2 text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <span>Campo</span>
            <span style={{ color: 'var(--text-primary)' }}>{fieldName}</span>
          </div>
          <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <span>Data</span>
            <span style={{ color: 'var(--text-primary)' }}>{dateDisplay}</span>
          </div>
          <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <span>Horário</span>
            <span style={{ color: 'var(--text-primary)' }}>{startTime} → {endTime} ({duration}min)</span>
          </div>
          <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <span>Total</span>
            <span style={{ color: 'var(--text-primary)' }}>R$ {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 text-sm font-black" style={{ color: 'var(--brand)' }}>
            <span>Sinal PIX agora</span>
            <span>R$ {deposit.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Dados do cliente */}
      <div className="space-y-4">
        <h3
          className="font-bold uppercase tracking-wider"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.25rem',
            color: 'var(--text-primary)',
          }}
        >
          Seus dados
        </h3>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Nome completo <span className="text-red-500">*</span>
          </label>
          <input
            name="customer_name"
            type="text"
            required
            autoComplete="name"
            placeholder="Digite seu nome completo"
            className="w-full px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-all"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            WhatsApp / Telefone <span className="text-red-500">*</span>
          </label>
          <input
            name="customer_phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="(81) 99999-9999"
            className="w-full px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-all"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              color: 'var(--text-primary)',
            }}
          />
          <p className="text-[10px] uppercase font-semibold tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Usado para consultar e cancelar sua reserva</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            E-mail
          </label>
          <input
            name="customer_email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className="w-full px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-all"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Data de nascimento
          </label>
          <input
            name="customer_birth_date"
            type="date"
            className="w-full px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-all"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Erro */}
      {state?.error && (
        <div className="px-4 py-3 text-red-500 bg-red-500/10 border border-red-500/20 text-xs font-bold uppercase tracking-wider text-center" style={{ borderRadius: '2px' }}>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        id="btn-confirmar-reserva"
        disabled={isPending}
        className="w-full py-4 text-white font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:opacity-90 disabled:opacity-50 cursor-pointer"
        style={{
          background: 'var(--brand)',
          borderRadius: '2px',
          letterSpacing: '0.15em',
        }}
      >
        {isPending ? 'Processando...' : `Confirmar e pagar R$ ${deposit.toFixed(2)} via PIX`}
      </button>

      <p className="text-center text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
        Ao confirmar, você concorda com as regras de cancelamento do complexo.
      </p>
    </form>
  )
}
