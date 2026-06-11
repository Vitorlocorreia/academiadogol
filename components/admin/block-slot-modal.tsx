'use client'

import { useState, useTransition, useEffect } from 'react'
import { createManualBookingAction, createBlockedSlotAction } from '@/app/admin/(dashboard)/agenda/actions'

interface Props {
  isOpen: boolean
  onClose: () => void
  fieldId: string
  fieldName: string
  date: string
  startTime: string
}

export function BlockSlotModal({ isOpen, onClose, fieldId, fieldName, date, startTime }: Props) {
  const [activeTab, setActiveTab] = useState<'booking' | 'block'>('booking')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Estados dos inputs
  const [duration, setDuration] = useState(60)
  const [blockEndTime, setBlockEndTime] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)

  // Calcula o horário de fim padrão para bloqueio (1 hora depois)
  useEffect(() => {
    if (startTime) {
      const [h, m] = startTime.split(':').map(Number)
      const endMin = h * 60 + m + 60
      const endH = String(Math.floor(endMin / 60)).padStart(2, '0')
      const endM = String(endMin % 60).padStart(2, '0')
      setBlockEndTime(`${endH}:${endM}`)
    }
  }, [startTime])

  if (!isOpen) return null

  // Dia da semana do bloqueio recorrente
  const recurDayOfWeek = new Date(date + 'T12:00:00').getDay()
  const dayName = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })

  const handleSubmitBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await createManualBookingAction(null, fd)
      if (res.error) {
        setError(res.error)
      } else {
        onClose()
      }
    })
  }

  const handleSubmitBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.append('is_recurring', String(isRecurring))
    fd.append('recur_day_of_week', String(recurDayOfWeek))

    startTransition(async () => {
      const res = await createBlockedSlotAction(null, fd)
      if (res.error) {
        setError(res.error)
      } else {
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-white">{fieldName}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Horário selecionado: <strong>{startTime}</strong> em <strong>{new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-sm font-semibold px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg transition-all"
          >
            Fechar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-950 border-b border-zinc-800 px-6">
          <button
            onClick={() => { setActiveTab('booking'); setError(null) }}
            className={`py-3 text-sm font-bold border-b-2 transition-all mr-6 ${
              activeTab === 'booking'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Reserva Manual
          </button>
          <button
            onClick={() => { setActiveTab('block'); setError(null) }}
            className={`py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'block'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Bloquear Horário
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              {error}
            </div>
          )}

          {activeTab === 'booking' ? (
            /* Formulário de Reserva */
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <input type="hidden" name="field_id" value={fieldId} />
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="start_time" value={startTime} />

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nome do Cliente
                </label>
                <input
                  name="customer_name"
                  type="text"
                  required
                  placeholder="Nome completo"
                  className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  WhatsApp / Celular
                </label>
                <input
                  name="customer_phone"
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  E-mail (Opcional)
                </label>
                <input
                  name="customer_email"
                  type="email"
                  placeholder="cliente@email.com"
                  className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Duração
                  </label>
                  <select
                    name="duration_minutes"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Horário Início
                  </label>
                  <input
                    type="text"
                    disabled
                    value={startTime}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-500 text-sm cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Observações / Notas
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Ex: Mensalista, Jogo beneficente, Pago adiantado..."
                  className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm transition-all"
              >
                {isPending ? 'Salvando...' : 'Confirmar Reserva Directa'}
              </button>
            </form>
          ) : (
            /* Formulário de Bloqueio */
            <form onSubmit={handleSubmitBlock} className="space-y-4">
              <input type="hidden" name="field_id" value={fieldId} />
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="start_time" value={startTime} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Início
                  </label>
                  <input
                    type="text"
                    disabled
                    value={startTime}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-500 text-sm cursor-not-allowed font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Término
                  </label>
                  <input
                    name="end_time"
                    type="text"
                    required
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    placeholder="Ex: 19:00"
                    className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Motivo do Bloqueio
                </label>
                <input
                  name="reason"
                  type="text"
                  placeholder="Ex: Manutenção, Limpeza, Treinamento"
                  className="w-full px-4 py-2.5 bg-zinc-850 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Recorrência semanal */}
              <div className="p-4 bg-zinc-950/40 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Tornar Bloqueio Recorrente</span>
                    <span className="text-[11px] text-zinc-500">Bloquear toda semana neste dia da semana</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setIsRecurring(!isRecurring)}
                    className={`w-12 h-6 rounded-full p-1 transition-all ${
                      isRecurring ? 'bg-emerald-500 flex justify-end' : 'bg-zinc-800 flex justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full"></span>
                  </button>
                </div>

                {isRecurring && (
                  <div className="text-[11px] text-zinc-400 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg capitalize">
                    Este bloqueio será aplicado automaticamente em todas as <strong>{dayName}s</strong>.
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-all border border-zinc-700"
              >
                {isPending ? 'Salvando...' : 'Aplicar Bloqueio'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
