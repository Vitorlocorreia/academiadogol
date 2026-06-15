'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Calendar, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react'
import { cancelBookingAction, deleteBlockedSlotAction } from '@/app/admin/(dashboard)/agenda/actions'
import { BlockSlotModal } from './block-slot-modal'

interface Props {
  initialDate: string
  fields: any[]
  bookings: any[]
  blockedSlots: any[]
  settings: any
}

// Gera todos os slots de meia-hora entre openTime e closeTime
function generateHalfHourSlots(open: string, close: string): string[] {
  const slots: string[] = []
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  while (cur < end) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0')
    const m = String(cur % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    cur += 30
  }
  return slots
}

// Converte "HH:MM" para minutos desde a meia-noite
function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function AgendaGrid({ initialDate, fields, bookings, blockedSlots, settings }: Props) {
  const [date, setDate] = useState(initialDate)
  const [activeFieldId, setActiveFieldId] = useState<string>(fields[0]?.id || '')
  const [isPending, startTransition] = useTransition()

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState<string>('')
  const [selectedStartTime, setSelectedStartTime] = useState<string>('')

  const openTime = settings?.open_time?.slice(0, 5) ?? '08:00'
  const closeTime = settings?.close_time?.slice(0, 5) ?? '23:00'
  const slots = generateHalfHourSlots(openTime, closeTime)

  const handleNavigateDate = (offset: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + offset)
    const newDate = d.toISOString().split('T')[0]
    setDate(newDate)
    
    // Atualiza a URL para que o Next.js atualize os dados no servidor
    const url = new URL(window.location.href)
    url.searchParams.set('date', newDate)
    window.history.pushState({}, '', url.toString())
    // Força recarregamento suave
    window.location.href = url.toString()
  }

  const handleCancelBooking = (id: string) => {
    if (!confirm('Deseja realmente cancelar esta reserva?')) return
    startTransition(async () => {
      await cancelBookingAction(id)
    })
  }

  const handleRemoveBlock = (id: string) => {
    if (!confirm('Deseja remover este bloqueio de horário?')) return
    startTransition(async () => {
      await deleteBlockedSlotAction(id)
    })
  }

  const openModal = (fieldId: string, startTime: string) => {
    setSelectedFieldId(fieldId)
    setSelectedStartTime(startTime)
    setModalOpen(true)
  }

  // Verifica ocupação de um slot específico (30min) de um campo específico
  const getSlotOccupant = (fieldId: string, slotTime: string) => {
    const slotM = toMins(slotTime)
    
    // 1. Procurar bloqueio ativo
    const block = blockedSlots.find((b) => {
      if (b.field_id !== fieldId) return false
      const startM = toMins(b.start_time)
      const endM = toMins(b.end_time)
      return slotM >= startM && slotM < endM
    })
    if (block) {
      return { type: 'block', data: block }
    }

    // 2. Procurar reserva ativa
    const booking = bookings.find((b) => {
      if (b.field_id !== fieldId) return false
      const startM = toMins(b.start_time)
      const endM = toMins(b.end_time)
      return slotM >= startM && slotM < endM
    })
    if (booking) {
      return { type: 'booking', data: booking }
    }

    return null
  }

  return (
    <div className="space-y-6">
      {/* Controles de Data */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-[4px]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavigateDate(-1)}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-[2px] transition-all font-bold text-xs uppercase tracking-wider"
          >
            ← Dia Anterior
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950 rounded-[2px] border border-zinc-800">
            <Calendar className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-sm font-bold text-white uppercase">
              {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </span>
          </div>

          <button
            onClick={() => handleNavigateDate(1)}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-[2px] transition-all font-bold text-xs uppercase tracking-wider"
          >
            Próximo Dia →
          </button>
        </div>

        {/* Abas de Campos para versão Mobile */}
        <div className="flex lg:hidden overflow-x-auto w-full gap-1.5 pb-2">
          {fields.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFieldId(f.id)}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-bold shrink-0 transition-all ${
                activeFieldId === f.id
                  ? 'bg-[var(--brand)] text-white shadow-md'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Grande - Desktop (Visualização Unificada de 7 Quadras) */}
      <div className="hidden lg:block overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-[4px] shadow-xl">
        <table className="w-full border-collapse text-left min-w-[900px]">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950">
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider w-24 border-r border-zinc-800">
                Horário
              </th>
              {fields.map((f) => (
                <th key={f.id} className="p-4 text-sm font-black text-white text-center border-r border-zinc-800 last:border-r-0">
                  {f.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slotTime) => (
              <tr key={slotTime} className="border-b border-zinc-800/60 hover:bg-zinc-950/20 transition-all">
                {/* Horário */}
                <td className="p-3 text-xs font-bold text-zinc-300 font-mono text-center bg-zinc-950/40 border-r border-zinc-800">
                  {slotTime}
                </td>

                {/* Células de cada campo */}
                {fields.map((f) => {
                  const occupant = getSlotOccupant(f.id, slotTime)
                  
                  return (
                    <td
                      key={f.id}
                      className="p-1 border-r border-zinc-800 last:border-r-0 h-16 w-32 relative group"
                    >
                      {occupant ? (
                        occupant.type === 'booking' ? (
                          /* Reserva ativa */
                          <div className={`w-full h-full rounded-[2px] p-2 text-xs flex flex-col justify-between border transition-all ${
                            occupant.data.status === 'pending'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              : 'bg-[var(--brand-subtle)] border-[var(--brand-ring)] text-[var(--brand)]'
                          }`}>
                            <div className="flex items-center justify-between font-bold">
                              <span className="truncate max-w-[80px]">
                                {occupant.data.customer?.name}
                              </span>
                              <button
                                onClick={() => handleCancelBooking(occupant.data.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-0.5 cursor-pointer"
                                title="Cancelar Reserva"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-medium truncate">
                              {occupant.data.customer?.phone}
                            </div>
                          </div>
                        ) : (
                          /* Bloqueio de horário */
                          <div className="w-full h-full rounded-[2px] p-2 text-xs bg-zinc-800/60 border border-zinc-700/60 text-zinc-400 flex flex-col justify-between">
                            <div className="flex items-center justify-between font-semibold text-zinc-300">
                              <span className="truncate max-w-[80px]">
                                {occupant.data.reason || 'Bloqueado'}
                              </span>
                              <button
                                onClick={() => handleRemoveBlock(occupant.data.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-0.5 cursor-pointer"
                                title="Remover Bloqueio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[9px] text-zinc-500 font-bold tracking-wide uppercase">
                              {occupant.data.is_recurring ? 'Recorrente' : 'Pontual'}
                            </div>
                          </div>
                        )
                      ) : (
                        /* Botão para criar */
                        <button
                          onClick={() => openModal(f.id, slotTime)}
                          className="w-full h-full rounded-[2px] border border-dashed border-zinc-800 hover:border-[var(--brand-ring)] hover:bg-[var(--brand-subtle)] text-transparent hover:text-[var(--brand)] transition-all flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid Mobile - Apenas o Campo Selecionado */}
      <div className="lg:hidden bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
        <div 
          className="p-4 bg-zinc-950 border-b border-zinc-800 font-black text-white text-base text-center uppercase tracking-wider"
          style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
        >
          {fields.find((f) => f.id === activeFieldId)?.name}
        </div>
        
        <div className="divide-y divide-zinc-800/60">
          {slots.map((slotTime) => {
            const occupant = getSlotOccupant(activeFieldId, slotTime)
            
            return (
              <div key={slotTime} className="flex items-center p-3 gap-4 min-h-[4.5rem]">
                <span className="text-xs font-bold text-zinc-400 font-mono w-12 text-center">
                  {slotTime}
                </span>
                
                <div className="flex-1">
                  {occupant ? (
                    occupant.type === 'booking' ? (
                      <div className={`rounded-[2px] p-3 text-xs flex items-center justify-between border ${
                        occupant.data.status === 'pending'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-[var(--brand-subtle)] border-[var(--brand-ring)] text-[var(--brand)]'
                      }`}>
                        <div className="space-y-0.5">
                          <div className="font-bold flex items-center gap-1.5">
                            {occupant.data.customer?.name}
                            {occupant.data.status === 'pending' ? (
                              <span className="text-[9px] bg-amber-500/20 px-1 py-0.5 rounded-[2px] text-amber-400 border border-amber-500/20">Pend.</span>
                            ) : (
                              <span className="text-[9px] bg-[var(--brand-subtle)] px-1 py-0.5 rounded-[2px] text-[var(--brand)] border border-[var(--brand-ring)]">Conf.</span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-medium">
                            {occupant.data.customer?.phone}
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancelBooking(occupant.data.id)}
                          className="text-zinc-500 hover:text-red-400 p-1.5 bg-zinc-950 rounded-[2px] border border-zinc-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-[2px] p-3 text-xs bg-zinc-800/60 border border-zinc-700/60 text-zinc-300 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-zinc-200">
                            {occupant.data.reason || 'Bloqueado'}
                          </div>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide">
                            {occupant.data.is_recurring ? 'Recorrente semanal' : 'Bloqueio único'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRemoveBlock(occupant.data.id)}
                          className="text-zinc-500 hover:text-red-400 p-1.5 bg-zinc-950 rounded-[2px] border border-zinc-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={() => openModal(activeFieldId, slotTime)}
                      className="w-full py-2.5 border border-dashed border-zinc-800 hover:border-[var(--brand-ring)] hover:bg-[var(--brand-subtle)] rounded-[2px] text-xs font-bold text-zinc-500 hover:text-[var(--brand)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Reservar ou Bloquear
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal para Criar Bloqueio / Reserva */}
      {modalOpen && (
        <BlockSlotModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          fieldId={selectedFieldId}
          fieldName={fields.find((f) => f.id === selectedFieldId)?.name || ''}
          date={date}
          startTime={selectedStartTime}
        />
      )}
    </div>
  )
}
