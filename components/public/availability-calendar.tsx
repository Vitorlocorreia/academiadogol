'use client'

// Calendário de disponibilidade — seleção rápida de Pacote (Jogo vs. Festa) e Horários
// O cliente escolhe a categoria (Jogo ou Festa) → escolhe a duração → clica no horário de início

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getOccupiedSlots } from '@/app/(public)/actions'
import { getFieldPrice } from '@/lib/pricing'
import type { FieldPackage, BookingCategory } from '@/lib/supabase/types'

interface Props {
  fieldId: string
  fieldName: string
  openTime: string   // ex: '08:00'
  closeTime: string  // ex: '23:00'
  durationOptions: number[]  // mantido para compatibilidade
  hourlyRate: number
  depositType: 'fixed' | 'percentage'
  depositValue: number
  packages?: FieldPackage[]
}

// Gera todos os slots de meia-hora entre openTime e closeTime
function generateHalfHourSlots(open: string, close: string): string[] {
  const slots: string[] = []
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  while (cur <= end) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0')
    const m = String(cur % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    cur += 30
  }
  return slots
}

function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Verifica se o intervalo [start, end) colide com algum slot ocupado
function isRangeAvailable(
  startTime: string,
  endTime: string,
  occupied: Array<{ start_time: string; end_time: string }>
): boolean {
  return !occupied.some(
    (slot) => slot.start_time < endTime && slot.end_time > startTime
  )
}

// Formata data para português
function formatDatePT(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function AvailabilityCalendar({
  fieldId,
  fieldName,
  openTime,
  closeTime,
  hourlyRate,
  depositType,
  depositValue,
  packages,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Separação de pacotes por categoria
  const jogoPackages = packages?.filter((p) => p.category === 'jogo' && p.is_active !== false) || []
  const festaPackages = packages?.filter((p) => p.category === 'festa' && p.is_active !== false) || []

  // 1. Estado da Categoria (Jogo vs. Festa)
  const [activeCategory, setActiveCategory] = useState<BookingCategory>('jogo')
  const availablePackages = activeCategory === 'festa' ? festaPackages : jogoPackages

  // 2. Pacote selecionado dentro da categoria
  const [selectedPackage, setSelectedPackage] = useState<FieldPackage | null>(() => {
    return jogoPackages[0] || null
  })

  // Estado do calendário e slots
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [startSlot, setStartSlot] = useState<string | null>(null)
  const [endSlot, setEndSlot] = useState<string | null>(null)
  const [occupied, setOccupied] = useState<Array<{ start_time: string; end_time: string }>>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Navegação do calendário mensal
  const [calMonth, setCalMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  // Carrega slots ocupados ao mudar data
  useEffect(() => {
    setLoadingSlots(true)
    setStartSlot(null)
    setEndSlot(null)
    getOccupiedSlots(fieldId, toISO(selectedDate)).then((data) => {
      setOccupied(data)
      setLoadingSlots(false)
    })
  }, [fieldId, selectedDate])

  const allSlots = generateHalfHourSlots(openTime, closeTime)

  // Calcula dias do mês para o mini-calendário
  const daysInMonth = (): Array<Date | null> => {
    const year = calMonth.getFullYear()
    const month = calMonth.getMonth()
    const first = new Date(year, month, 1).getDay()
    const total = new Date(year, month + 1, 0).getDate()
    const days: Array<Date | null> = Array(first).fill(null)
    for (let d = 1; d <= total; d++) days.push(new Date(year, month, d))
    return days
  }

  // Troca de categoria com auto-seleção do primeiro pacote
  const handleSelectCategory = (cat: BookingCategory) => {
    setActiveCategory(cat)
    const pkgs = cat === 'festa' ? festaPackages : jogoPackages
    setSelectedPackage(pkgs[0] || null)
    setStartSlot(null)
    setEndSlot(null)
  }

  // Seleção de pacote específico
  const handleSelectPackage = (pkg: FieldPackage) => {
    setSelectedPackage(pkg)
    if (startSlot) {
      const startMins = toMins(startSlot)
      const targetEndMins = startMins + pkg.duration_minutes
      if (targetEndMins <= 24 * 60) {
        const targetEndSlot = `${String(Math.floor(targetEndMins / 60)).padStart(2, '0')}:${String(targetEndMins % 60).padStart(2, '0')}`
        if (isRangeAvailable(startSlot, targetEndSlot, occupied)) {
          setEndSlot(targetEndSlot)
          return
        }
      }
      setEndSlot(null)
    }
  }

  // Cálculos derivados da seleção
  const duration = startSlot && endSlot
    ? toMins(endSlot) - toMins(startSlot)
    : selectedPackage?.duration_minutes ?? 0

  const isFesta = activeCategory === 'festa' || duration >= 180

  const matchedPkg = packages?.find(
    (p) => p.duration_minutes === duration && (p.category === (isFesta ? 'festa' : 'jogo') || !p.category) && p.is_active !== false
  ) || selectedPackage

  const total = matchedPkg
    ? Number(matchedPkg.total_price)
    : getFieldPrice(fieldName, duration, hourlyRate, packages)

  const deposit = matchedPkg && matchedPkg.deposit_price !== undefined
    ? Number(matchedPkg.deposit_price)
    : depositType === 'fixed'
      ? depositValue
      : (total * depositValue) / 100

  const selectionValid = Boolean(startSlot && endSlot && duration >= 30)

  // Ao clicar em um horário na grade
  const handleSlotClick = (slot: string) => {
    const pkgMins = selectedPackage?.duration_minutes

    // Se temos pacote pré-selecionado e clicou para iniciar (ou para escolher um novo início):
    if (pkgMins && (!startSlot || endSlot)) {
      const startMins = toMins(slot)
      const targetEndMins = startMins + pkgMins
      const targetEndSlot = `${String(Math.floor(targetEndMins / 60)).padStart(2, '0')}:${String(targetEndMins % 60).padStart(2, '0')}`

      if (targetEndMins <= 24 * 60 && isRangeAvailable(slot, targetEndSlot, occupied)) {
        setStartSlot(slot)
        setEndSlot(targetEndSlot)
        return
      } else {
        // Se a duração completa não cabe sem conflito, marca como início e deixa escolher o fim livremente
        setStartSlot(slot)
        setEndSlot(null)
        return
      }
    }

    // Se já havia início e clicou no segundo slot:
    if (startSlot && !endSlot) {
      const clickedMins = toMins(slot)
      const startMins = toMins(startSlot)
      if (clickedMins > startMins) {
        if (isRangeAvailable(startSlot, slot, occupied)) {
          setEndSlot(slot)
        } else {
          setStartSlot(slot)
          setEndSlot(null)
        }
      } else {
        setStartSlot(slot)
        setEndSlot(null)
      }
      return
    }

    // Fallback: reinicia seleção a partir deste slot
    setStartSlot(slot)
    setEndSlot(null)
  }

  const handleReservar = () => {
    if (!startSlot || !endSlot) return
    const params = new URLSearchParams({
      date: toISO(selectedDate),
      start_time: startSlot,
      duration: String(duration),
      booking_type: activeCategory,
    })
    startTransition(() => {
      router.push(`/reservar/${fieldId}?${params}`)
    })
  }

  const getSlotStyle = (slot: string) => {
    const isOccupied = occupied.some(
      (b) => b.start_time <= slot && b.end_time > slot
    )
    if (isOccupied) {
      return {
        style: {
          background: 'var(--bg-subtle)',
          color: 'var(--text-muted)',
          opacity: 0.5,
          textDecoration: 'line-through',
          cursor: 'not-allowed',
          border: '1px solid var(--border)',
          borderRadius: '2px',
        },
        className: 'py-2 text-xs font-semibold text-center'
      }
    }

    const slotMins = toMins(slot)

    if (slot === startSlot || (endSlot && slot === endSlot)) {
      return {
        style: {
          background: 'var(--brand)',
          color: 'white',
          border: '1px solid var(--brand)',
          borderRadius: '2px',
          fontWeight: 'bold',
          transform: 'scale(1.03)',
        },
        className: 'py-2 text-xs text-center transition-all shadow-md'
      }
    }

    if (startSlot && endSlot) {
      const startMins = toMins(startSlot)
      const endMins = toMins(endSlot)
      if (slotMins > startMins && slotMins < endMins) {
        return {
          style: {
            background: 'var(--brand-subtle)',
            color: 'var(--brand)',
            border: '1px solid var(--brand-ring)',
            borderRadius: '2px',
          },
          className: 'py-2 text-xs text-center'
        }
      }
    }

    if (startSlot && !endSlot) {
      const startMins = toMins(startSlot)
      if (slotMins > startMins) {
        const wouldBeAvailable = isRangeAvailable(startSlot, slot, occupied)
        if (wouldBeAvailable) {
          return {
            style: {
              background: 'var(--brand-subtle)',
              color: 'var(--brand)',
              border: '1px dashed var(--brand-ring)',
              borderRadius: '2px',
              cursor: 'pointer',
            },
            className: 'py-2 text-xs text-center hover:opacity-80 transition-colors'
          }
        }
      }
    }

    return {
      style: {
        background: 'var(--bg-subtle)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '2px',
        cursor: 'pointer',
      },
      className: 'py-2 text-xs text-center hover:border-zinc-500 transition-all'
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. SELETOR DE CATEGORIA: JOGO VS FESTA */}
      <div className="space-y-3">
        <div
          className="grid grid-cols-2 gap-1.5 p-1"
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => handleSelectCategory('jogo')}
            className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            style={{
              borderRadius: '2px',
              background: activeCategory === 'jogo' ? 'var(--brand)' : 'transparent',
              color: activeCategory === 'jogo' ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            <span>⚽</span>
            <span>Aluguel de Quadra</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectCategory('festa')}
            className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            style={{
              borderRadius: '2px',
              background: activeCategory === 'festa' ? 'var(--brand)' : 'transparent',
              color: activeCategory === 'festa' ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            <span>🎂</span>
            <span>Festa de Aniversário</span>
          </button>
        </div>

        {/* 2. CHIPS DE DURAÇÃO / PACOTE RÁPIDO */}
        {availablePackages.length > 0 && (
          <div className="space-y-2">
            <div
              className="flex items-center justify-between text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>{activeCategory === 'festa' ? '🎂 Escolha o Pacote de Festa:' : '⚽ Escolha o Tempo de Jogo:'}</span>
              {selectedPackage && (
                <span style={{ color: 'var(--brand)' }}>
                  Sinal PIX: R$ {Number(selectedPackage.deposit_price).toFixed(0)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {availablePackages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleSelectPackage(pkg)}
                    className="p-3 text-left transition-all cursor-pointer"
                    style={{
                      borderRadius: '4px',
                      background: isSelected ? 'var(--brand-subtle)' : 'var(--bg-card)',
                      border: isSelected ? '1px solid var(--brand)' : '1px solid var(--border)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-bold text-xs uppercase tracking-wide"
                        style={{ color: isSelected ? 'var(--brand)' : 'var(--text-primary)' }}
                      >
                        {pkg.name}
                      </span>
                      <span className="font-black text-xs" style={{ color: 'var(--text-primary)' }}>
                        R$ {Number(pkg.total_price).toFixed(0)}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold block mt-1" style={{ color: 'var(--text-muted)' }}>
                      {pkg.duration_minutes} min • Sinal R$ {Number(pkg.deposit_price).toFixed(0)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Banner informativo se for Festa */}
        {activeCategory === 'festa' && (
          <div
            className="p-3.5 space-y-1"
            style={{
              background: 'var(--bg-card-alt)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🎉</span>
              <span
                className="font-bold text-xs uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Estrutura Completa de Festa Incluída
              </span>
            </div>
            <p
              className="text-xs leading-relaxed pl-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              Campo society + área de churrasqueira, freezers e apoio para parabéns e convidados.
            </p>
          </div>
        )}
      </div>

      {/* Mini-calendário */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 font-bold"
            style={{
              border: '1px solid var(--border)',
              borderRadius: '2px',
              background: 'var(--bg-subtle)',
            }}
            disabled={calMonth <= new Date(today.getFullYear(), today.getMonth(), 1)}
          >
            ←
          </button>
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-primary)' }}
          >
            {calMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors font-bold"
            style={{
              border: '1px solid var(--border)',
              borderRadius: '2px',
              background: 'var(--bg-subtle)',
            }}
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-xs font-semibold text-zinc-500 py-1">{d}</div>
          ))}
          {daysInMonth().map((day, i) => {
            if (!day) return <div key={`e${i}`} />
            const isPast = day < today
            const isSelected = toISO(day) === toISO(selectedDate)
            return (
              <button
                key={day.toISOString()}
                disabled={isPast}
                onClick={() => setSelectedDate(new Date(day))}
                className={`aspect-square text-xs font-bold transition-all ${
                  isPast
                    ? 'text-zinc-500 dark:text-zinc-700 cursor-not-allowed opacity-30'
                    : isSelected
                    ? 'text-white font-bold shadow-md'
                    : 'hover:text-white transition-colors'
                }`}
                style={{
                  borderRadius: '2px',
                  background: isSelected
                    ? 'var(--brand)'
                    : isPast ? 'transparent' : 'var(--bg-subtle)',
                  border: isSelected
                    ? '1px solid var(--brand)'
                    : '1px solid var(--border)',
                }}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider mt-2 capitalize" style={{ color: 'var(--brand)' }}>
          {formatDatePT(selectedDate)}
        </p>
      </div>

      {/* Grade de horários */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
        <div className="flex items-center justify-between mb-1">
          <h3
            className="uppercase tracking-wider font-bold"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.1rem',
              color: 'var(--text-primary)',
            }}
          >
            Horários disponíveis
          </h3>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          {!startSlot
            ? `Toque no horário de início desejado (${selectedPackage?.name ?? `${duration} min`})`
            : !endSlot
            ? 'Agora selecione o horário de término'
            : `Período selecionado: ${startSlot} → ${endSlot} (${duration} min)`}
        </p>

        {loadingSlots ? (
          <div className="grid grid-cols-4 gap-2">
            {Array(16).fill(0).map((_, i) => (
              <div key={i} className="h-10 rounded bg-zinc-800 animate-pulse" style={{ borderRadius: '2px' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {allSlots.map((slot, idx) => {
              const isLastSlot = idx === allSlots.length - 1
              const isOccupied = occupied.some(
                (b) => b.start_time <= slot && b.end_time > slot
              )
              const disabled = isOccupied || (isLastSlot && !startSlot)
              const slotStyle = getSlotStyle(slot)

              return (
                <button
                  key={slot}
                  disabled={disabled}
                  onClick={() => !disabled && handleSlotClick(slot)}
                  className={slotStyle.className}
                  style={slotStyle.style}
                >
                  {slot}
                  {slot === startSlot && (
                    <span className="block text-[8px] opacity-70 font-bold uppercase tracking-wider leading-none mt-0.5">início</span>
                  )}
                  {slot === endSlot && (
                    <span className="block text-[8px] opacity-70 font-bold uppercase tracking-wider leading-none mt-0.5">fim</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {!loadingSlots && allSlots.length > 0 && (
          <p className="text-[10px] mt-3 text-center uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Horários riscados estão ocupados ou bloqueados
          </p>
        )}
      </div>

      {/* Resumo + Botão */}
      {selectionValid && startSlot && endSlot && (
        <div
          className="p-5 space-y-4"
          style={{
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
          }}
        >
          <div className="flex items-center justify-between pb-1" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3
              className="font-bold uppercase tracking-wider text-sm"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.25rem',
                color: 'var(--text-primary)',
              }}
            >
              Resumo da pré-reserva
            </h3>
            {isFesta ? (
              <span
                className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  borderRadius: '2px',
                  background: 'var(--brand-subtle)',
                  color: 'var(--brand)',
                  border: '1px solid var(--brand-ring)',
                }}
              >
                🎂 Festa / Evento
              </span>
            ) : (
              <span
                className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  borderRadius: '2px',
                  background: 'var(--brand-subtle)',
                  color: 'var(--brand)',
                  border: '1px solid var(--brand-ring)',
                }}
              >
                ⚽ Jogo Avulso
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs uppercase tracking-wider font-bold animate-fade-in" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>Data</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatDatePT(selectedDate)}</span>
            </div>
            <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>Horário</span>
              <span style={{ color: 'var(--text-primary)' }}>{startSlot} → {endSlot}</span>
            </div>
            <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>Duração</span>
              <span style={{ color: 'var(--text-primary)' }}>{duration} minutos</span>
            </div>
            {matchedPkg?.name && (
              <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <span>Pacote Selecionado</span>
                <span style={{ color: 'var(--text-primary)' }}>{matchedPkg.name}</span>
              </div>
            )}
            <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>Total da Locação</span>
              <span style={{ color: 'var(--text-primary)' }}>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 text-sm font-black" style={{ color: 'var(--brand)' }}>
              <span>Sinal PIX para Garantir Horário</span>
              <span>R$ {deposit.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={handleReservar}
            disabled={isPending}
            className="w-full py-3.5 text-white font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:opacity-90 cursor-pointer shadow-lg"
            style={{
              background: 'var(--brand)',
              borderRadius: '2px',
              letterSpacing: '0.15em',
            }}
          >
            {isPending ? 'Redirecionando...' : 'Continuar e pagar sinal →'}
          </button>
        </div>
      )}
    </div>
  )
}
