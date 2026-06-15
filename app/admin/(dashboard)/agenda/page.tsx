// Página de Agenda Administrativa — Painel do Admin

import { getAgendaData } from './actions'
import { AgendaGrid } from '@/components/admin/agenda-grid'

interface Props {
  searchParams: Promise<{
    date?: string
  }>
}

export default async function AdminAgendaPage({ searchParams }: Props) {
  const { date: dateParam } = await searchParams

  // Se não passar data na URL, calcula o dia de hoje (no fuso local de SP/Brasil)
  let todayStr = dateParam
  if (!todayStr) {
    const spDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    todayStr = spDate.toISOString().split('T')[0]
  }

  const { settings, fields, bookings, blockedSlots } = await getAgendaData(todayStr)

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Título */}
      <div>
        <h1 
          className="text-3xl font-black text-white uppercase tracking-wider leading-none"
          style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
        >
          Agenda do Complexo
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Gerencie as reservas dos 7 campos, crie agendamentos manuais e gerencie bloqueios pontuais ou recorrentes.
        </p>
      </div>

      <AgendaGrid
        initialDate={todayStr}
        fields={fields}
        bookings={bookings}
        blockedSlots={blockedSlots}
        settings={settings}
      />
    </div>
  )
}
