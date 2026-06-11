// Página de formulário de reserva — Área Pública

import { notFound } from 'next/navigation'
import { getFieldById } from '@/app/(public)/actions'
import { BookingForm } from '@/components/public/booking-form'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    date?: string
    start_time?: string
    duration?: string
  }>
}

export default async function ReservarPage({ params, searchParams }: Props) {
  const { id } = await params
  const { date, start_time: startTime, duration: durationStr } = await searchParams

  if (!date || !startTime || !durationStr) {
    notFound()
  }

  const field = await getFieldById(id)
  if (!field) {
    notFound()
  }

  const duration = Number(durationStr)
  if (isNaN(duration)) {
    notFound()
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-8 py-12">
      <div
        className="p-6 sm:p-8"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
        }}
      >
        <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h1
            className="uppercase leading-none"
            style={{
              fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
              fontSize: '2rem',
              letterSpacing: '0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Finalizar Reserva
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-secondary)' }}>
            Preencha seus dados para reservar o campo e pagar o sinal.
          </p>
        </div>

        <BookingForm
          fieldId={field.id}
          fieldName={field.name}
          date={date}
          startTime={startTime}
          duration={duration}
          hourlyRate={field.hourly_rate}
          depositType={field.deposit_type as 'fixed' | 'percentage'}
          depositValue={field.deposit_value}
        />
      </div>
    </div>
  )
}

