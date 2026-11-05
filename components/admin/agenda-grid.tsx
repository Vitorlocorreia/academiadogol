'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react'
import { BlockSlotModal } from './block-slot-modal'
import { cancelBookingAction, deleteBlockedSlotAction } from '@/app/admin/(dashboard)/agenda/actions'

interface Field {
  id: string
  name: string
  hourly_rate: number
}

interface Booking {
  id: string
  field_id: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: string
  total_amount: number
  customer?: {
    name: string
    phone: string
  }
}

interface BlockedSlot {
  id: string
  field_id: string
  date: string
  start_time: string
  end_time: string
  reason: string | null
  is_recurring: boolean
}

interface Settings {
  open_time: string
  close_time: string
}

interface Props {
  initialDate: string
  fields: Field[]
  bookings: Booking[]
  blockedSlots: BlockedSlot[]
  settings: Settings
}

export function AgendaGrid({
  initialDate,
  fields,
  bookings,
  blockedSlots,
  settings,
}: Props) {
  const router = useRouter()
  const [date, setDate] = useState(initialDate)
  const [activeFieldId, setActiveFieldId] = useState(fields[0]?.id || '')

  // Estado para Modal de Agendamento Manual / Bloqueio
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState('')
  const [selectedStartTime, setSelectedStartTime] = useState('')

  // Gera array de horários (30 em 30 min) entre open_time e close_time
  const generateTimeSlots = () => {
    const slots: string[] = []
    const [startH] = settings.open_time.split(':').map(Number)
    const [endH] = settings.close_time.split(':').map(Number)

    for (let h = startH; h <= endH; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`)
      if (h < endH) {
        slots.push(`${String(h).padStart(2, '0')}:30`)
      }
    }
    return slots
  }

  const slots = generateTimeSlots()

  const handleNavigateDate = (offsetDays: number) => {
    const current = new Date(date + 'T12:00:00')
    current.setDate(current.getDate() + offsetDays)
    const newDateStr = current.toISOString().split('T')[0]
    setDate(newDateStr)
    router.push(`/admin/agenda?date=${newDateStr}`)
  }

  const goToDate = (newDateStr: string) => {
    if (!newDateStr) return
    setDate(newDateStr)
    router.push(`/admin/agenda?date=${newDateStr}`)
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Tem certeza que deseja cancelar esta reserva? O horário será liberado.')) {
      await cancelBookingAction(bookingId)
      router.refresh()
    }
  }

  const handleRemoveBlock = async (slotId: string) => {
    if (confirm('Remover este bloqueio de horário?')) {
      await deleteBlockedSlotAction(slotId)
      router.refresh()
    }
  }

  const openModal = (fieldId: string, startTime: string) => {
    setSelectedFieldId(fieldId)
    setSelectedStartTime(startTime)
    setModalOpen(true)
  }

  // Identifica o que está ocupando o slot (reserva ou bloqueio)
  const getSlotOccupant = (fieldId: string, time: string) => {
    const booking = bookings.find(
      (b) =>
        b.field_id === fieldId &&
        b.status !== 'cancelled' &&
        time >= b.start_time.slice(0, 5) &&
        time < b.end_time.slice(0, 5)
    )
    if (booking) return { type: 'booking' as const, data: booking }

    const block = blockedSlots.find(
      (s) =>
        s.field_id === fieldId &&
        time >= s.start_time.slice(0, 5) &&
        time < s.end_time.slice(0, 5)
    )
    if (block) return { type: 'block' as const, data: block }

    return null
  }

  return (
    <div className="space-y-6">
      {/* Controles de Data */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-[4px]"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => handleNavigateDate(-1)}
            className="btn-admin-secondary px-3.5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            ← Dia Anterior
          </button>
          
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-[2px]"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
            }}
          >
            <Calendar className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-sm font-bold uppercase" style={{ color: 'var(--text-primary)' }}>
              {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => goToDate(e.target.value)}
              aria-label="Selecionar data"
              className="ml-2 text-xs font-mono px-2 py-1 rounded-[2px] cursor-pointer focus:outline-none"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
          </div>

          <button
            onClick={() => handleNavigateDate(1)}
            className="btn-admin-secondary px-3.5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
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
              className="px-3 py-1.5 rounded-[2px] text-xs font-bold shrink-0 transition-all cursor-pointer"
              style={{
                background: activeFieldId === f.id ? 'var(--brand)' : 'var(--bg-subtle)',
                color: activeFieldId === f.id ? '#ffffff' : 'var(--text-secondary)',
                border: activeFieldId === f.id ? '1px solid var(--brand)' : '1px solid var(--border)',
              }}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Grande - Desktop (Visualização Unificada de 7 Quadras) */}
      <div
        className="hidden lg:block overflow-x-auto rounded-[4px] shadow-lg"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <table className="w-full border-collapse text-left min-w-[900px]">
          <thead>
            <tr
              style={{
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <th
                className="p-4 text-xs font-bold uppercase tracking-wider w-24"
                style={{
                  color: 'var(--text-muted)',
                  borderRight: '1px solid var(--border)',
                }}
              >
                Horário
              </th>
              {fields.map((f) => (
                <th
                  key={f.id}
                  className="p-4 text-sm font-black text-center last:border-r-0"
                  style={{
                    color: 'var(--text-primary)',
                    borderRight: '1px solid var(--border)',
                  }}
                >
                  {f.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slotTime) => (
              <tr
                key={slotTime}
                className="transition-colors hover:bg-[var(--bg-subtle)]"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                {/* Horário */}
                <td
                  className="p-3 text-xs font-bold font-mono text-center"
                  style={{
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    borderRight: '1px solid var(--border)',
                  }}
                >
                  {slotTime}
                </td>

                {/* Células de cada campo */}
                {fields.map((f) => {
                  const occupant = getSlotOccupant(f.id, slotTime)
                  
                  return (
                    <td
                      key={f.id}
                      className="p-1 h-16 w-32 relative group last:border-r-0"
                      style={{ borderRight: '1px solid var(--border)' }}
                    >
                      {occupant ? (
                        occupant.type === 'booking' ? (
                          /* Reserva ativa */
                          <div
                            className="w-full h-full rounded-[2px] p-2 text-xs flex flex-col justify-between border transition-all"
                            style={{
                              background: occupant.data.status === 'pending'
                                ? 'rgba(245, 158, 11, 0.12)'
                                : 'var(--brand-subtle)',
                              borderColor: occupant.data.status === 'pending'
                                ? 'rgba(245, 158, 11, 0.3)'
                                : 'var(--brand-ring)',
                              color: occupant.data.status === 'pending'
                                ? '#d97706'
                                : 'var(--brand)',
                            }}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="truncate max-w-[80px]">
                                {occupant.data.customer?.name}
                              </span>
                              <button
                                onClick={() => handleCancelBooking(occupant.data.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-0.5 cursor-pointer"
                                title="Cancelar Reserva"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[10px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                              {occupant.data.customer?.phone}
                            </div>
                          </div>
                        ) : (
                          /* Bloqueio de horário */
                          <div
                            className="w-full h-full rounded-[2px] p-2 text-xs flex flex-col justify-between"
                            style={{
                              background: 'var(--bg-subtle)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <div className="flex items-center justify-between font-semibold" style={{ color: 'var(--text-primary)' }}>
                              <span className="truncate max-w-[80px]">
                                {occupant.data.reason || 'Bloqueado'}
                              </span>
                              <button
                                onClick={() => handleRemoveBlock(occupant.data.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-0.5 cursor-pointer"
                                title="Remover Bloqueio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[9px] font-bold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
                              {occupant.data.is_recurring ? 'Recorrente' : 'Pontual'}
                            </div>
                          </div>
                        )
                      ) : (
                        /* Botão para criar */
                        <button
                          onClick={() => openModal(f.id, slotTime)}
                          className="w-full h-full rounded-[2px] border border-dashed transition-all flex items-center justify-center cursor-pointer text-transparent hover:text-[var(--brand)]"
                          style={{
                            borderColor: 'var(--border)',
                          }}
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
      <div
        className="lg:hidden rounded-[4px] overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div 
          className="p-4 font-black text-base text-center uppercase tracking-wider"
          style={{
            fontFamily: "'Bebas Neue', Arial Black, sans-serif",
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {fields.find((f) => f.id === activeFieldId)?.name}
        </div>
        
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {slots.map((slotTime) => {
            const occupant = getSlotOccupant(activeFieldId, slotTime)
            
            return (
              <div
                key={slotTime}
                className="flex items-center p-3 gap-4 min-h-[4.5rem]"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <span className="text-xs font-bold font-mono w-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  {slotTime}
                </span>
                
                <div className="flex-1">
                  {occupant ? (
                    occupant.type === 'booking' ? (
                      <div
                        className="rounded-[2px] p-3 text-xs flex items-center justify-between border"
                        style={{
                          background: occupant.data.status === 'pending'
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'var(--brand-subtle)',
                          borderColor: occupant.data.status === 'pending'
                            ? 'rgba(245, 158, 11, 0.3)'
                            : 'var(--brand-ring)',
                          color: occupant.data.status === 'pending'
                            ? '#d97706'
                            : 'var(--brand)',
                        }}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{occupant.data.customer?.name}</span>
                            {occupant.data.status === 'pending' ? (
                              <span className="text-[9px] bg-amber-500/20 px-1 py-0.5 rounded-[2px] text-amber-600 dark:text-amber-400 border border-amber-500/30">Pend.</span>
                            ) : (
                              <span className="text-[9px] bg-[var(--brand-subtle)] px-1 py-0.5 rounded-[2px] text-[var(--brand)] border border-[var(--brand-ring)]">Conf.</span>
                            )}
                          </div>
                          <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                            {occupant.data.customer?.phone}
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancelBooking(occupant.data.id)}
                          className="p-1.5 rounded-[2px] transition-colors cursor-pointer"
                          style={{
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <Trash2 className="w-4 h-4 hover:text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="rounded-[2px] p-3 text-xs flex items-center justify-between"
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {occupant.data.reason || 'Bloqueado'}
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                            {occupant.data.is_recurring ? 'Recorrente semanal' : 'Bloqueio único'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRemoveBlock(occupant.data.id)}
                          className="p-1.5 rounded-[2px] transition-colors cursor-pointer"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <Trash2 className="w-4 h-4 hover:text-red-500" />
                        </button>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={() => openModal(activeFieldId, slotTime)}
                      className="w-full py-2.5 border border-dashed rounded-[2px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--text-muted)',
                      }}
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
