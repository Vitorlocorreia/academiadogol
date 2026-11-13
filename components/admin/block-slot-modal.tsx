'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createManualBookingAction, createBlockedSlotAction } from '@/app/admin/(dashboard)/agenda/actions'

interface Props {
  isOpen: boolean
  onClose: () => void
  fieldId: string
  fieldName: string
  date: string
  startTime: string
}

export function BlockSlotModal({
  isOpen,
  onClose,
  fieldId,
  fieldName,
  date,
  startTime,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'booking' | 'block'>('booking')
  const [duration, setDuration] = useState(60)
  const [blockEndTime, setBlockEndTime] = useState(() => {
    const [h, m] = startTime.split(':').map(Number)
    const endH = h + 1
    if (endH >= 24) return '00:00'
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  })
  const [isRecurring, setIsRecurring] = useState(false)
  const [isCourtesy, setIsCourtesy] = useState(false)
  const [isReposition, setIsReposition] = useState(false)
  const [customTotal, setCustomTotal] = useState('')
  const [customDeposit, setCustomDeposit] = useState('')
  const [depositPaid, setDepositPaid] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  const dayOfWeek = new Date(date + 'T12:00:00').getDay()
  const dayNames = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
  const dayName = dayNames[dayOfWeek]

  const handleToggleCourtesy = () => {
    const next = !isCourtesy
    setIsCourtesy(next)
    if (next) {
      setIsReposition(false)
      setCustomTotal('0')
      setCustomDeposit('0')
    } else {
      setCustomTotal('')
      setCustomDeposit('')
    }
  }

  const handleToggleReposition = () => {
    const next = !isReposition
    setIsReposition(next)
    if (next) {
      setIsCourtesy(false)
      setCustomTotal('0')
      setCustomDeposit('0')
    } else {
      setCustomTotal('')
      setCustomDeposit('')
    }
  }

  const handleSubmitBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('field_id', fieldId)
    formData.set('date', date)
    formData.set('start_time', startTime)
    formData.set('duration_minutes', String(duration))
    if (isCourtesy) {
      formData.set('is_courtesy', 'true')
    }
    if (isReposition) {
      formData.set('is_reposition', 'true')
    }
    if (customTotal !== '') {
      formData.set('total_amount', customTotal)
    }
    if (customDeposit !== '') {
      formData.set('deposit_amount', customDeposit)
    }
    formData.set('deposit_paid', depositPaid ? 'true' : 'false')

    startTransition(async () => {
      try {
        const res = await createManualBookingAction(null, formData)
        if (res?.error) {
          setError(res.error)
        } else {
          onClose()
          router.refresh()
        }
      } catch (err: any) {
        setError(err?.message || 'Erro ao processar reserva.')
      }
    })
  }

  const handleSubmitBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('field_id', fieldId)
    formData.set('date', date)
    formData.set('start_time', startTime)
    formData.set('end_time', blockEndTime)
    if (isRecurring) {
      formData.set('is_recurring', 'true')
      formData.set('recur_day_of_week', String(dayOfWeek))
    }

    startTransition(async () => {
      try {
        const res = await createBlockedSlotAction(null, formData)
        if (res?.error) {
          setError(res.error)
        } else {
          onClose()
          router.refresh()
        }
      } catch (err: any) {
        setError(err?.message || 'Erro ao aplicar bloqueio.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="rounded-[4px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div
          className="p-6 flex justify-between items-center"
          style={{
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h2 
              className="text-2xl font-black uppercase tracking-wider"
              style={{
                fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                color: 'var(--text-primary)',
              }}
            >
              {fieldName}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Horário selecionado: <strong>{startTime}</strong> em <strong>{new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-admin-secondary text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-[2px]"
          >
            Fechar
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex px-6"
          style={{
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <button
            onClick={() => { setActiveTab('booking'); setError(null) }}
            className="py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all mr-6 cursor-pointer"
            style={{
              borderColor: activeTab === 'booking' ? 'var(--brand)' : 'transparent',
              color: activeTab === 'booking' ? 'var(--brand)' : 'var(--text-secondary)',
            }}
          >
            Reserva Manual
          </button>
          <button
            onClick={() => { setActiveTab('block'); setError(null) }}
            className="py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer"
            style={{
              borderColor: activeTab === 'block' ? 'var(--brand)' : 'transparent',
              color: activeTab === 'block' ? 'var(--brand)' : 'var(--text-secondary)',
            }}
          >
            Bloquear Horário
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[2px] text-red-500 text-xs">
              {error}
            </div>
          )}

          {activeTab === 'booking' ? (
            /* Formulário de Reserva Manual */
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <input type="hidden" name="field_id" value={fieldId} />
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="start_time" value={startTime} />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Nome do Cliente
                </label>
                <input
                  name="customer_name"
                  type="text"
                  required
                  placeholder="Ex: Vitor Silva"
                  className="input-admin"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Telefone / WhatsApp
                </label>
                <input
                  name="customer_phone"
                  type="tel"
                  required
                  placeholder="Ex: 81999096142"
                  className="input-admin font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Duração
                  </label>
                  <div className="relative">
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="input-admin appearance-none pr-8 cursor-pointer"
                    >
                      <option value={60}>1h (60 min)</option>
                      <option value={90}>1h30 (90 min)</option>
                      <option value={120}>2h (120 min)</option>
                      <option value={180}>3h (180 min)</option>
                      <option value={240}>4h (240 min)</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Horário Início
                  </label>
                  <input
                    type="text"
                    disabled
                    value={startTime}
                    className="input-admin font-mono opacity-80 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Valores customizáveis: Total e Sinal */}
              {!isCourtesy && !isReposition && (
                <div className="p-3 rounded-[3px] border space-y-3" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-[var(--brand)]">
                    Valores da Reserva (Opcional - deixe vazio para usar o padrão da quadra)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Valor Total (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex: 250.00"
                        value={customTotal}
                        onChange={(e) => setCustomTotal(e.target.value)}
                        className="input-admin py-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Valor do Sinal (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex: 150.00"
                        value={customDeposit}
                        onChange={(e) => setCustomDeposit(e.target.value)}
                        className="input-admin py-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Sinal já foi pago no ato?
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={depositPaid}
                        onChange={(e) => setDepositPaid(e.target.checked)}
                        className="accent-[var(--brand)]"
                      />
                      <span>{depositPaid ? '✓ Sinal Pago' : '⏳ Sinal Pendente'}</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Observações / Notas
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Ex: Mensalista, Jogo beneficente, Reposição de chuva..."
                  className="input-admin"
                />
              </div>

              {/* Opção de Cortesia */}
              <div
                className="p-3 rounded-[3px] border flex items-center justify-between cursor-pointer transition-colors"
                style={{
                  background: isCourtesy ? 'var(--brand-subtle)' : 'var(--bg-subtle)',
                  borderColor: isCourtesy ? 'var(--brand-ring)' : 'var(--border)',
                }}
                onClick={handleToggleCourtesy}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🎁</span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                      Marcar como Cortesia
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {isCourtesy ? 'Valor zerado (R$ 0,00) — Cortesia da casa' : 'Isentar pagamento desta reserva'}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="is_courtesy"
                  name="is_courtesy"
                  checked={isCourtesy}
                  onChange={handleToggleCourtesy}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-[var(--brand)] cursor-pointer"
                />
              </div>

              {/* Opção de Reposição */}
              <div
                className="p-3 rounded-[3px] border flex items-center justify-between cursor-pointer transition-colors"
                style={{
                  background: isReposition ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-subtle)',
                  borderColor: isReposition ? 'rgba(59, 130, 246, 0.4)' : 'var(--border)',
                }}
                onClick={handleToggleReposition}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🔄</span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                      Marcar como Reposição
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {isReposition ? 'Valor zerado (R$ 0,00) — Reposição de pelada que não jogou' : 'Reposição de horário para mensalista ou cliente'}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="is_reposition"
                  name="is_reposition"
                  checked={isReposition}
                  onChange={handleToggleReposition}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Exibição de erro no final do formulário perto do botão */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[2px] text-red-500 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="btn-admin-primary w-full text-base uppercase tracking-widest font-bold mt-2 cursor-pointer"
                style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
              >
                {isPending
                  ? 'Salvando...'
                  : isCourtesy
                  ? 'Confirmar Reserva Cortesia (R$ 0,00)'
                  : isReposition
                  ? 'Confirmar Reposição de Pelada (R$ 0,00)'
                  : 'Confirmar Reserva Direta'}
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
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Início
                  </label>
                  <input
                    type="text"
                    disabled
                    value={startTime}
                    className="input-admin font-mono opacity-80 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Término
                  </label>
                  <input
                    name="end_time"
                    type="text"
                    required
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    placeholder="Ex: 19:00"
                    className="input-admin font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Motivo do Bloqueio
                </label>
                <input
                  name="reason"
                  type="text"
                  placeholder="Ex: Manutenção, Limpeza, Treinamento"
                  className="input-admin"
                />
              </div>

              {/* Recorrência semanal */}
              <div
                className="p-4 rounded-[4px] space-y-3"
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                      Tornar Bloqueio Recorrente
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Bloquear toda semana neste dia da semana
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setIsRecurring(!isRecurring)}
                    className="w-12 h-6 rounded-full p-1 transition-all cursor-pointer flex items-center"
                    style={{
                      background: isRecurring ? 'var(--brand)' : 'var(--border)',
                      justifyContent: isRecurring ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-sm"></span>
                  </button>
                </div>

                {isRecurring && (
                  <div className="text-[11px] text-[var(--brand)] bg-[var(--brand-subtle)] border border-[var(--brand-ring)] p-2.5 rounded-[2px] capitalize">
                    Este bloqueio será aplicado automaticamente em todas as <strong>{dayName}s</strong>.
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="btn-admin-primary w-full text-base uppercase tracking-widest font-bold mt-2 cursor-pointer"
                style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
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
