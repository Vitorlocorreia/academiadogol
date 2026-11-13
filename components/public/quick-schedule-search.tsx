'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Search,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  CalendarDays,
} from 'lucide-react'
import { checkTimeAvailabilityAction, type AvailableFieldResult } from '@/app/(public)/actions'

function getTodayBrt(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

function addDaysToBrt(baseDateStr: string, days: number): string {
  const d = new Date(baseDateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Gera slots de 30 em 30 minutos das 06:00 às 23:00
const TIME_SLOTS: string[] = Array.from({ length: 35 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const mm = String(totalMinutes % 60).padStart(2, '0')
  return `${hh}:${mm}`
})

const POPULAR_TIMES = ['18:00', '19:00', '20:00', '21:00', '22:00']

const DURATION_OPTIONS = [
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
]

/** Ícone geométrico de campo society — identidade visual Academia do Gol */
function PitchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="1.5" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <circle cx="12" cy="12" r="3" />
      <path d="M2 8.5h2.5v7H2" />
      <path d="M22 8.5h-2.5v7H22" />
    </svg>
  )
}

export function QuickScheduleSearch() {
  const todayStr = getTodayBrt()
  const tomorrowStr = addDaysToBrt(todayStr, 1)
  const afterTomorrowStr = addDaysToBrt(todayStr, 2)

  const [date, setDate] = useState<string>(todayStr)
  const [time, setTime] = useState<string>('19:00')
  const [duration, setDuration] = useState<number>(60)
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<AvailableFieldResult[]>([])
  const [searchedSlot, setSearchedSlot] = useState<{
    date: string
    time: string
    endTime: string
    duration: number
  } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleSearch = (overrideDate?: string, overrideTime?: string, overrideDuration?: number) => {
    const targetDate = overrideDate ?? date
    const targetTime = overrideTime ?? time
    const targetDuration = overrideDuration ?? duration
    setErrorMessage('')

    startTransition(async () => {
      const res = await checkTimeAvailabilityAction(targetDate, targetTime, targetDuration)
      setHasSearched(true)
      if (res.success) {
        setResults(res.availableFields)
        setSearchedSlot({
          date: res.date,
          time: res.time,
          endTime: res.endTime,
          duration: targetDuration,
        })
      } else {
        setErrorMessage(res.error || 'Erro ao consultar horários.')
        setResults([])
      }
    })
  }

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const fmtDisplayDate = (dStr: string) => {
    if (!dStr) return ''
    if (dStr === todayStr) return 'Hoje'
    if (dStr === tomorrowStr) return 'Amanhã'
    const [y, m, d] = dStr.split('-')
    return `${d}/${m}/${y}`
  }

  const dayShortcuts = [
    { label: 'Hoje', value: todayStr },
    { label: 'Amanhã', value: tomorrowStr },
    { label: 'Depois', value: afterTomorrowStr },
  ]

  return (
    <section
      id="busca-rapida"
      aria-label="Busca rápida de horários disponíveis"
      className="relative z-20 -mt-8 sm:-mt-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
    >
      <div
        className="rounded-[4px] border overflow-hidden transition-all"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
          borderTop: '3px solid var(--brand)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.38)',
        }}
      >
        <div className="p-5 sm:p-7 space-y-5">
          {/* ─── CABEÇALHO ─────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-[3px] flex items-center justify-center shrink-0 border"
                style={{
                  background: 'var(--brand-subtle)',
                  borderColor: 'var(--brand-ring)',
                  color: 'var(--brand)',
                }}
              >
                <PitchIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    className="text-xl sm:text-2xl font-black uppercase tracking-wide leading-none"
                    style={{
                      fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                      color: 'var(--text-primary)',
                      letterSpacing: '0.03em',
                    }}
                  >
                    Encontre um Campo Livre
                  </h2>
                </div>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Escolha o dia, o horário e a duração para ver na hora quais campos estão disponíveis.
                </p>
              </div>
            </div>

            {/* Atalhos de Dia (Segmented Pills) */}
            <div
              className="inline-flex p-1 rounded-[3px] border self-start md:self-auto"
              style={{
                background: 'var(--bg-subtle)',
                borderColor: 'var(--border)',
              }}
            >
              {dayShortcuts.map((shortcut) => {
                const isActive = date === shortcut.value
                return (
                  <button
                    key={shortcut.value}
                    type="button"
                    onClick={() => {
                      setDate(shortcut.value)
                      if (hasSearched) {
                        handleSearch(shortcut.value, time, duration)
                      }
                    }}
                    className="px-3 py-1.5 rounded-[2px] text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    style={
                      isActive
                        ? {
                            background: 'var(--brand)',
                            color: '#ffffff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }
                        : {
                            color: 'var(--text-secondary)',
                          }
                    }
                  >
                    {shortcut.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ─── BARRA DE BUSCA SEGMENTADA ─────────────────────────── */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch()
            }}
            className="rounded-[4px] border p-1.5 flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5"
            style={{
              background: 'var(--bg-subtle)',
              borderColor: 'var(--border)',
            }}
          >
            {/* Segmento 1: Data */}
            <div
              className="flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-[3px] border border-transparent focus-within:border-[var(--brand)] transition-colors"
              style={{ background: 'var(--bg-card)' }}
            >
              <Calendar className="w-4 h-4 shrink-0" style={{ color: 'var(--brand)' }} />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="quick-search-date"
                  className="block text-[10px] font-bold uppercase tracking-widest leading-none mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Data do Jogo
                </label>
                <input
                  id="quick-search-date"
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-transparent text-sm font-semibold font-mono focus:outline-none cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Segmento 2: Horário */}
            <div
              className="flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-[3px] border border-transparent focus-within:border-[var(--brand)] transition-colors"
              style={{ background: 'var(--bg-card)' }}
            >
              <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--brand)' }} />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="quick-search-time"
                  className="block text-[10px] font-bold uppercase tracking-widest leading-none mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Horário de Início
                </label>
                <select
                  id="quick-search-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold font-mono focus:outline-none cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {TIME_SLOTS.map((slot) => (
                    <option
                      key={slot}
                      value={slot}
                      style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    >
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Segmento 3: Duração (Pills táteis) */}
            <div
              className="flex items-center justify-between lg:justify-start gap-3 px-3.5 py-2.5 rounded-[3px]"
              style={{ background: 'var(--bg-card)' }}
            >
              <div>
                <span
                  className="block text-[10px] font-bold uppercase tracking-widest leading-none mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Duração
                </span>
                <div className="flex items-center gap-1">
                  {DURATION_OPTIONS.map((opt) => {
                    const active = duration === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setDuration(opt.value)
                          if (hasSearched) {
                            handleSearch(date, time, opt.value)
                          }
                        }}
                        className="px-2.5 py-1 rounded-[2px] text-xs font-bold font-mono transition-all cursor-pointer border"
                        style={
                          active
                            ? {
                                background: 'var(--brand-subtle)',
                                borderColor: 'var(--brand)',
                                color: 'var(--brand)',
                              }
                            : {
                                background: 'transparent',
                                borderColor: 'var(--border)',
                                color: 'var(--text-secondary)',
                              }
                        }
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Segmento 4: Botão Buscar */}
            <button
              type="submit"
              disabled={isPending}
              id="btn-buscar-horario-rapido"
              className="lg:w-auto w-full inline-flex items-center justify-center gap-2.5 px-7 py-3.5 lg:py-0 lg:self-stretch font-bold uppercase tracking-widest text-xs rounded-[3px] transition-all cursor-pointer hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
              style={{
                background: 'var(--brand)',
                color: '#ffffff',
                letterSpacing: '0.1em',
                boxShadow: '0 4px 14px rgba(26, 107, 46, 0.35)',
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consultando</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Ver Disponíveis</span>
                </>
              )}
            </button>
          </form>

          {/* ─── HORÁRIOS POPULARES (1 CLIQUE) ─────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Mais procurados:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {POPULAR_TIMES.map((t) => {
                  const isActive = time === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTime(t)
                        handleSearch(date, t, duration)
                      }}
                      className="px-2.5 py-1 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer border"
                      style={
                        isActive
                          ? {
                              background: 'var(--brand-subtle)',
                              borderColor: 'var(--brand)',
                              color: 'var(--brand)',
                            }
                          : {
                              background: 'var(--bg-subtle)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-secondary)',
                            }
                      }
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>

            {hasSearched && (
              <button
                type="button"
                onClick={() => {
                  setHasSearched(false)
                  setResults([])
                  setErrorMessage('')
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider hover:underline cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-3.5 h-3.5" />
                Limpar busca
              </button>
            )}
          </div>

          {/* ─── MENSAGEM DE ERRO ──────────────────────────────────── */}
          {errorMessage && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[3px] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ─── RESULTADOS EM TEMPO REAL ──────────────────────────── */}
          {hasSearched && !errorMessage && (
            <div
              className="pt-5 border-t space-y-4"
              style={{ borderColor: 'var(--border)' }}
            >
              {results.length > 0 ? (
                <>
                  {/* Resumo dos resultados */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="inline-flex items-center justify-center px-2 py-0.5 rounded-[2px] text-xs font-black font-mono"
                        style={{
                          background: 'var(--brand)',
                          color: '#ffffff',
                        }}
                      >
                        {results.length}
                      </span>
                      <p
                        className="text-sm font-bold uppercase tracking-wide"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {results.length === 1 ? 'Campo livre encontrado' : 'Campos livres encontrados'}
                      </p>
                    </div>

                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-[2px] border text-xs font-mono self-start sm:self-auto"
                      style={{
                        background: 'var(--bg-subtle)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <CalendarDays className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
                      <span>{fmtDisplayDate(searchedSlot?.date || date)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {searchedSlot?.time} – {searchedSlot?.endTime}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>({searchedSlot?.duration} min)</span>
                    </div>
                  </div>

                  {/* Grid de Campos Disponíveis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((field) => {
                      const foto = field.photo_urls?.[0]
                      return (
                        <div
                          key={field.id}
                          className="group rounded-[4px] border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand)]"
                          style={{
                            background: 'var(--bg-card)',
                            borderColor: 'var(--border)',
                            boxShadow: 'var(--shadow)',
                          }}
                        >
                          <div>
                            {/* Imagem ou Pitch SVG minimalista */}
                            <div className="h-36 w-full relative overflow-hidden">
                              {foto ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={foto}
                                  alt={field.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center"
                                  style={{
                                    background:
                                      'linear-gradient(135deg, var(--brand-dark) 0%, var(--brand) 100%)',
                                  }}
                                >
                                  <svg
                                    viewBox="0 0 120 80"
                                    className="w-20 h-14 opacity-30"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="1.5"
                                  >
                                    <rect x="2" y="2" width="116" height="76" rx="1" />
                                    <line x1="60" y1="2" x2="60" y2="78" />
                                    <circle cx="60" cy="40" r="12" />
                                    <rect x="2" y="22" width="18" height="36" />
                                    <rect x="100" y="22" width="18" height="36" />
                                    <circle cx="60" cy="40" r="2" fill="white" />
                                  </svg>
                                </div>
                              )}
                              <div
                                className="absolute inset-0"
                                style={{
                                  background:
                                    'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)',
                                }}
                              />

                              {/* Badge Livre */}
                              <div className="absolute top-2.5 right-2.5">
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-widest text-white shadow-md"
                                  style={{ background: 'var(--brand)' }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                  Livre às {searchedSlot?.time}
                                </span>
                              </div>
                            </div>

                            {/* Informações */}
                            <div className="p-4 space-y-2.5">
                              <div>
                                <h3
                                  className="text-lg font-black uppercase tracking-tight leading-tight group-hover:text-[var(--brand)] transition-colors"
                                  style={{
                                    fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                                    color: 'var(--text-primary)',
                                    letterSpacing: '0.03em',
                                  }}
                                >
                                  {field.name}
                                </h3>
                                {field.description && (
                                  <p
                                    className="text-xs line-clamp-1 mt-0.5"
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    {field.description}
                                  </p>
                                )}
                              </div>

                              <div
                                className="flex items-baseline justify-between pt-2.5 border-t"
                                style={{ borderColor: 'var(--border)' }}
                              >
                                <span
                                  className="text-[11px] font-bold uppercase tracking-wider"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  Valor ({searchedSlot?.duration} min)
                                </span>
                                <span
                                  className="font-bold font-mono text-base"
                                  style={{ color: 'var(--brand)' }}
                                >
                                  {fmtCurrency(field.calculated_price)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="px-4 pb-4 flex items-center gap-2">
                            <Link
                              href={field.booking_url}
                              id={`btn-reservar-rapido-${field.id}`}
                              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold uppercase tracking-widest rounded-[2px] transition-all duration-200 hover:opacity-90"
                              style={{
                                background: 'var(--brand)',
                                color: '#ffffff',
                              }}
                            >
                              <span>Reservar</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                              href={`/campos/${field.id}?data=${searchedSlot?.date || date}`}
                              className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-[2px] border transition-colors hover:border-[var(--brand)]"
                              style={{
                                background: 'var(--bg-subtle)',
                                borderColor: 'var(--border)',
                                color: 'var(--text-secondary)',
                              }}
                              title="Ver todos os horários deste campo"
                            >
                              Grade
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div
                  className="p-6 sm:p-8 rounded-[4px] border text-center space-y-4"
                  style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
                >
                  <div
                    className="w-11 h-11 rounded-[4px] flex items-center justify-center mx-auto border"
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderColor: 'rgba(245, 158, 11, 0.25)',
                      color: '#f59e0b',
                    }}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p
                      className="text-base font-bold uppercase tracking-wide"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Sem campos livres às {searchedSlot?.time || time} ({fmtDisplayDate(searchedSlot?.date || date)})
                    </p>
                    <p
                      className="text-xs sm:text-sm max-w-md mx-auto"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Todos os campos já estão reservados ou com mensalistas neste horário. Tente um horário próximo:
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const [h, m] = time.split(':').map(Number)
                        const newH = Math.max(6, h - 1)
                        const newT = `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
                        setTime(newT)
                        handleSearch(date, newT, duration)
                      }}
                      className="px-3.5 py-2 rounded-[2px] text-xs font-bold uppercase tracking-wider border transition-colors hover:border-[var(--brand)] cursor-pointer"
                      style={{
                        background: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Tentar 1h Antes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const [h, m] = time.split(':').map(Number)
                        const newH = Math.min(23, h + 1)
                        const newT = `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
                        setTime(newT)
                        handleSearch(date, newT, duration)
                      }}
                      className="px-3.5 py-2 rounded-[2px] text-xs font-bold uppercase tracking-wider border transition-colors hover:border-[var(--brand)] cursor-pointer"
                      style={{
                        background: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Tentar 1h Depois
                    </button>
                    <a
                      href="#campos"
                      className="px-4 py-2 rounded-[2px] text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 transition-opacity"
                      style={{ background: 'var(--brand)' }}
                    >
                      Ver Todos os Campos
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
