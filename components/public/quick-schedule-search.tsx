'use client'

import { useState, useTransition, useId } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  MapPin,
  ImageOff,
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

const POPULAR_TIMES = ['18:00', '19:00', '20:00', '21:00', '22:00']

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
  const [searchedSlot, setSearchedSlot] = useState<{ date: string; time: string; endTime: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleSearch = (overrideDate?: string, overrideTime?: string) => {
    const targetDate = overrideDate || date
    const targetTime = overrideTime || time
    setErrorMessage('')

    startTransition(async () => {
      const res = await checkTimeAvailabilityAction(targetDate, targetTime, duration)
      setHasSearched(true)
      if (res.success) {
        setResults(res.availableFields)
        setSearchedSlot({ date: res.date, time: res.time, endTime: res.endTime })
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

  return (
    <div
      className="relative z-20 -mt-10 sm:-mt-14 max-w-5xl mx-auto px-4 sm:px-6 w-full"
      id="busca-rapida"
    >
      <div
        className="rounded-[6px] border p-5 sm:p-7 shadow-2xl transition-all"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--brand-ring)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(26, 107, 46, 0.15)',
        }}
      >
        {/* Cabeçalho da Busca Rápida */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-[4px] flex items-center justify-center shrink-0 border"
              style={{
                background: 'var(--brand-subtle)',
                borderColor: 'var(--brand-ring)',
                color: 'var(--brand)',
              }}
            >
              <Sparkles className="w-4 h-4 text-[var(--brand)]" />
            </div>
            <div>
              <h2
                className="text-lg sm:text-xl font-black uppercase tracking-wider leading-none"
                style={{
                  fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                  color: 'var(--text-primary)',
                }}
              >
                Busca Rápida de Horários
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Digite ou selecione o horário desejado e veja onde tem campo livre na hora
              </p>
            </div>
          </div>

          {/* Atalhos Rápidos de Dias */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setDate(todayStr)
                handleSearch(todayStr, time)
              }}
              className={`px-2.5 py-1 rounded-[2px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                date === todayStr
                  ? 'bg-[var(--brand)] text-white shadow-xs'
                  : 'hover:opacity-80'
              }`}
              style={date !== todayStr ? { background: 'var(--bg-subtle)', color: 'var(--text-secondary)' } : undefined}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => {
                setDate(tomorrowStr)
                handleSearch(tomorrowStr, time)
              }}
              className={`px-2.5 py-1 rounded-[2px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                date === tomorrowStr
                  ? 'bg-[var(--brand)] text-white shadow-xs'
                  : 'hover:opacity-80'
              }`}
              style={date !== tomorrowStr ? { background: 'var(--bg-subtle)', color: 'var(--text-secondary)' } : undefined}
            >
              Amanhã
            </button>
            <button
              type="button"
              onClick={() => {
                setDate(afterTomorrowStr)
                handleSearch(afterTomorrowStr, time)
              }}
              className={`px-2.5 py-1 rounded-[2px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                date === afterTomorrowStr
                  ? 'bg-[var(--brand)] text-white shadow-xs'
                  : 'hover:opacity-80'
              }`}
              style={date !== afterTomorrowStr ? { background: 'var(--bg-subtle)', color: 'var(--text-secondary)' } : undefined}
            >
              Depois de Amanhã
            </button>
          </div>
        </div>

        {/* Formulário / Barra de Seleção */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
          {/* Data */}
          <div className="sm:col-span-4">
            <label
              className="block text-[11px] font-bold uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Data do Jogo
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand)' }}>
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="input-admin pl-10 font-mono text-sm w-full"
              />
            </div>
          </div>

          {/* Horário */}
          <div className="sm:col-span-3">
            <label
              className="block text-[11px] font-bold uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Horário Desejado
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand)' }}>
                <Clock className="w-4 h-4" />
              </span>
              <input
                type="time"
                step="1800"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="input-admin pl-10 font-mono text-sm w-full"
                placeholder="19:00"
              />
            </div>
          </div>

          {/* Duração */}
          <div className="sm:col-span-2">
            <label
              className="block text-[11px] font-bold uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Duração
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="input-admin text-sm w-full"
            >
              <option value={60}>1 hora (60 min)</option>
              <option value={90}>1h 30min</option>
              <option value={120}>2 horas</option>
            </select>
          </div>

          {/* Botão de Busca */}
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isPending}
              id="btn-buscar-horario-rapido"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 font-black uppercase tracking-wider text-xs rounded-[2px] transition-all cursor-pointer shadow-md hover:opacity-90 active:scale-[0.99]"
              style={{
                background: 'var(--brand)',
                color: '#ffffff',
                height: '42px',
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Buscar Onde Tem ⚽
                </>
              )}
            </button>
          </div>
        </form>

        {/* Chips de Horários Mais Procurados */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap text-xs" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Horários Populares:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {POPULAR_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTime(t)
                  handleSearch(date, t)
                }}
                className={`px-2 py-0.5 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer border ${
                  time === t
                    ? 'bg-[var(--brand-subtle)] text-[var(--brand)] border-[var(--brand-ring)]'
                    : 'hover:border-[var(--brand)]'
                }`}
                style={time !== t ? { background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-secondary)' } : undefined}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[3px] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ─── RESULTADOS DA BUSCA EM TEMPO REAL ─────────────────────────── */}
        {hasSearched && (
          <div className="mt-6 pt-5 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
            {results.length > 0 ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand)] animate-pulse" />
                    <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                      🎉 {results.length} {results.length === 1 ? 'campo disponível' : 'campos disponíveis'}{' '}
                      para <span className="text-[var(--brand)]">{fmtDisplayDate(searchedSlot?.date || date)}</span> às{' '}
                      <span className="text-[var(--brand)] font-mono">{searchedSlot?.time || time}</span>
                    </p>
                  </div>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    Slot: {searchedSlot?.time} às {searchedSlot?.endTime} ({duration} min)
                  </span>
                </div>

                {/* Grid de Campos Disponíveis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((field) => {
                    const foto = field.photo_urls?.[0]
                    return (
                      <div
                        key={field.id}
                        className="group rounded-[4px] border overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-[var(--brand)]"
                        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
                      >
                        <div>
                          {/* Foto e Badge Livre */}
                          <div className="h-32 w-full relative overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                            {foto ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={foto}
                                alt={field.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageOff className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
                              </div>
                            )}

                            <div className="absolute top-2.5 right-2.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-black uppercase tracking-wider bg-[var(--brand)] text-white shadow-md">
                                <CheckCircle2 className="w-3 h-3" />
                                Livre às {searchedSlot?.time}
                              </span>
                            </div>
                          </div>

                          {/* Info do Campo */}
                          <div className="p-3.5 space-y-2">
                            <div>
                              <h3
                                className="text-base font-bold uppercase tracking-wide group-hover:text-[var(--brand)] transition-colors leading-tight"
                                style={{
                                  fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {field.name}
                              </h3>
                              {field.description && (
                                <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  {field.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                              <span className="font-semibold uppercase text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                Valor da Partida:
                              </span>
                              <span className="font-bold font-mono text-sm" style={{ color: 'var(--brand)' }}>
                                {fmtCurrency(field.calculated_price)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botão de Ação Direta para Reserva */}
                        <div className="p-3 pt-0 space-y-1.5">
                          <Link
                            href={field.booking_url}
                            id={`btn-reservar-rapido-${field.id}`}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all duration-200 hover:opacity-90 shadow-sm"
                            style={{
                              background: 'var(--brand)',
                              color: '#ffffff',
                            }}
                          >
                            Reservar Agora ⚽
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/campos/${field.id}?data=${searchedSlot?.date || date}`}
                            className="block text-center text-[10px] uppercase font-bold tracking-wider hover:underline"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Ver grade completa deste campo
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div
                className="p-6 rounded-[4px] border text-center space-y-3"
                style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                    Todos os campos estão ocupados às {searchedSlot?.time || time} em {fmtDisplayDate(searchedSlot?.date || date)}
                  </p>
                  <p className="text-xs mt-1 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                    Esse horário já possui reservas confirmadas ou mensalistas fixos. Experimente pesquisar outro horário próximo ou consulte a grade completa de cada campo abaixo.
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
                      handleSearch(date, newT)
                    }}
                    className="px-3 py-1 rounded-[2px] text-xs font-bold uppercase tracking-wider border hover:bg-black/10 transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    1 Hora Antes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const [h, m] = time.split(':').map(Number)
                      const newH = Math.min(23, h + 1)
                      const newT = `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
                      setTime(newT)
                      handleSearch(date, newT)
                    }}
                    className="px-3 py-1 rounded-[2px] text-xs font-bold uppercase tracking-wider border hover:bg-black/10 transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    1 Hora Depois
                  </button>
                  <a
                    href="#campos"
                    className="px-3 py-1 rounded-[2px] text-xs font-bold uppercase tracking-wider bg-[var(--brand)] text-white hover:opacity-90 transition-opacity"
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
  )
}
