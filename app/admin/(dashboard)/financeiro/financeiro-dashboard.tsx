'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  Building2,
  Calendar,
  Filter,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import type {
  FinanceiroData,
  BookingRow,
  FixedPaymentRow,
  FieldOption,
  FieldBreakdown,
} from './actions'

interface Props {
  data: FinanceiroData
  currentMonth: string
  currentYear: string
  currentFieldId: string
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'text-amber-500 bg-amber-500/10 border-amber-500/25' },
  confirmed: { label: 'Confirmado', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25' },
  completed: { label: 'Concluído', color: 'text-blue-500 bg-blue-500/10 border-blue-500/25' },
  cancelled: { label: 'Cancelado', color: 'text-red-500 bg-red-500/10 border-red-500/25' },
  paid: { label: 'Pago', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25' },
  refunded: { label: 'Estornado', color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/25' },
}

export function FinanceiroDashboard({
  data,
  currentMonth,
  currentYear,
  currentFieldId,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'reservas' | 'contratos'>('reservas')
  const [isPending, startTransition] = useTransition()

  const monthNum = parseInt(currentMonth, 10)
  const selectedFieldName = currentFieldId === 'all'
    ? 'Todos os Campos'
    : data.fields.find(f => f.id === currentFieldId)?.name ?? 'Campo'

  const navigate = (newMonth: string, newYear: string, newFieldId: string) => {
    startTransition(() => {
      const sp = new URLSearchParams()
      sp.set('month', newMonth)
      sp.set('year', newYear)
      if (newFieldId !== 'all') sp.set('fieldId', newFieldId)
      router.push(`/admin/financeiro?${sp.toString()}`)
    })
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigate(e.target.value, currentYear, currentFieldId)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigate(currentMonth, e.target.value, currentFieldId)
  }

  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigate(currentMonth, currentYear, e.target.value)
  }

  const handleFieldSelect = (fieldId: string) => {
    navigate(currentMonth, currentYear, fieldId)
  }

  const fmt = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const formatDate = (isoDate: string) => {
    const [y, m, d] = isoDate.split('-')
    return `${d}/${m}/${y}`
  }

  const formatTime = (time: string) => time.slice(0, 5)

  const years = []
  const currentY = new Date().getFullYear()
  for (let y = currentY - 2; y <= currentY + 1; y++) {
    years.push(String(y))
  }

  const totalGrand = data.totalRevenue + data.fixedTotal
  const totalCollectedGrand = data.totalCollected + data.fixedCollected
  const totalPendingGrand = data.totalPending + data.fixedPending

  const collectedPct = totalGrand > 0 ? (totalCollectedGrand / totalGrand) * 100 : 0

  const kpiCards = [
    {
      label: currentFieldId === 'all' ? 'Receita Total' : `Receita (${selectedFieldName})`,
      value: fmt(totalGrand),
      sub: 'Reservas + Mensalistas',
      icon: TrendingUp,
      borderColor: 'var(--brand)',
      textColor: 'var(--brand)',
    },
    {
      label: 'Valor Recebido',
      value: fmt(totalCollectedGrand),
      sub: `${collectedPct.toFixed(0)}% do faturamento`,
      icon: CheckCircle2,
      borderColor: '#3b82f6',
      textColor: '#3b82f6',
    },
    {
      label: 'Valor Pendente',
      value: fmt(totalPendingGrand),
      sub: `${(100 - collectedPct).toFixed(0)}% a receber`,
      icon: Clock,
      borderColor: '#eab308',
      textColor: '#eab308',
    },
    {
      label: 'Reservas Canceladas',
      value: fmt(data.totalCancelled),
      sub: `${data.bookings.filter((b) => b.status === 'cancelled').length} cancelamento(s)`,
      icon: XCircle,
      borderColor: '#ef4444',
      textColor: '#ef4444',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Barra de Filtros: Período + Campo */}
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-[4px]"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {/* Seletor de Mês e Ano */}
          <div
            className="flex items-center gap-2 rounded-[2px] px-3 py-2"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
            }}
          >
            <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Mês:</span>
            <div className="relative">
              <label htmlFor="month-select" className="sr-only">Mês</label>
              <select
                id="month-select"
                value={currentMonth}
                onChange={handleMonthChange}
                disabled={isPending}
                className="bg-transparent text-xs font-bold uppercase appearance-none pr-6 cursor-pointer focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              >
                {MONTHS.map((name, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>

            <span style={{ color: 'var(--border)' }}>/</span>

            <div className="relative">
              <label htmlFor="year-select" className="sr-only">Ano</label>
              <select
                id="year-select"
                value={currentYear}
                onChange={handleYearChange}
                disabled={isPending}
                className="bg-transparent text-xs font-bold uppercase appearance-none pr-6 cursor-pointer focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Seletor de Campo */}
          <div
            className="flex items-center gap-2 rounded-[2px] px-3 py-2"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
            }}
          >
            <Filter className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Campo:</span>
            <div className="relative">
              <label htmlFor="field-select" className="sr-only">Filtrar por Campo</label>
              <select
                id="field-select"
                value={currentFieldId}
                onChange={handleFieldChange}
                disabled={isPending}
                className="bg-transparent text-xs font-bold appearance-none pr-6 cursor-pointer focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              >
                <option value="all">Todos os Campos</option>
                {data.fields.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        {isPending && (
          <span className="text-[var(--brand)] text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 animate-spin" /> Atualizando dados...
          </span>
        )}
      </div>

      {/* Abas Rápidas de Campos (Pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => handleFieldSelect('all')}
          className="px-3.5 py-1.5 rounded-[2px] text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer"
          style={{
            background: currentFieldId === 'all' ? 'var(--brand-subtle)' : 'var(--bg-card)',
            color: currentFieldId === 'all' ? 'var(--brand)' : 'var(--text-secondary)',
            border: currentFieldId === 'all' ? '1px solid var(--brand-ring)' : '1px solid var(--border)',
          }}
        >
          ⚽ Todos os Campos
        </button>
        {data.fields.map((f) => {
          const breakdown = data.fieldBreakdown.find((b) => b.field_id === f.id)
          const isSelected = currentFieldId === f.id
          return (
            <button
              key={f.id}
              onClick={() => handleFieldSelect(f.id)}
              className="px-3.5 py-1.5 rounded-[2px] text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-2"
              style={{
                background: isSelected ? 'var(--brand-subtle)' : 'var(--bg-card)',
                color: isSelected ? 'var(--brand)' : 'var(--text-secondary)',
                border: isSelected ? '1px solid var(--brand-ring)' : '1px solid var(--border)',
              }}
            >
              <span>{f.name}</span>
              {breakdown && breakdown.total_revenue > 0 && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px]"
                  style={{
                    background: isSelected ? 'var(--brand)' : 'var(--bg-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  }}
                >
                  {fmt(breakdown.total_revenue)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <div
            key={card.label}
            className="rounded-[4px] p-5 space-y-2 transition-all shadow-sm"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderTop: `3px solid ${card.borderColor}`,
            }}
          >
            <div
              className="w-9 h-9 rounded-[2px] flex items-center justify-center mb-2"
              style={{
                background: 'var(--bg-subtle)',
                color: card.textColor,
              }}
            >
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-xl sm:text-2xl font-black leading-tight truncate font-mono" style={{ color: 'var(--text-primary)' }}>
              {card.value}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {card.label}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Desdobramento Financeiro por Campo (Cards Comparativos) */}
      <div
        className="rounded-[4px] p-5 space-y-4"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 
              className="text-xl font-black uppercase tracking-wider leading-none"
              style={{
                fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                color: 'var(--text-primary)',
              }}
            >
              Faturamento por Campo — {MONTHS[monthNum - 1]} {currentYear}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Clique em qualquer campo abaixo para filtrar o painel e ver os detalhes individuais.
            </p>
          </div>
          {currentFieldId !== 'all' && (
            <button
              onClick={() => handleFieldSelect('all')}
              className="text-xs font-bold text-[var(--brand)] hover:underline self-start sm:self-auto cursor-pointer"
            >
              ← Limpar filtro de campo
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {data.fieldBreakdown.map((item) => {
            const isSelected = currentFieldId === item.field_id
            const collPct = item.total_revenue > 0 ? (item.total_collected / item.total_revenue) * 100 : 0

            return (
              <div
                key={item.field_id}
                onClick={() => handleFieldSelect(isSelected ? 'all' : item.field_id)}
                className="p-4 rounded-[4px] transition-all cursor-pointer space-y-3"
                style={{
                  background: isSelected ? 'var(--brand-subtle)' : 'var(--bg-card-alt)',
                  border: isSelected ? '1px solid var(--brand)' : '1px solid var(--border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand)' }}></span>
                    {item.field_name}
                  </div>
                  <span className="text-[11px] font-mono font-bold" style={{ color: 'var(--text-muted)' }}>
                    {item.share_percentage.toFixed(1)}% do total
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-2xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>
                    {fmt(item.total_revenue)}
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">✓ Recebido: {fmt(item.total_collected)}</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">⏳ Pend: {fmt(item.total_pending)}</span>
                  </div>
                </div>

                {/* Mini barra de progresso */}
                <div className="h-1.5 rounded-[2px] overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-[2px] transition-all"
                    style={{
                      background: 'var(--brand)',
                      width: `${Math.min(collPct, 100)}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <span>{item.bookings_count} reservas / {item.fixed_count} fixos</span>
                  <span className="font-semibold flex items-center gap-1" style={{ color: 'var(--brand)' }}>
                    {isSelected ? 'Filtrado' : 'Filtrar'} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex w-full md:w-fit gap-1 p-1 rounded-[4px]"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <button
          onClick={() => setActiveTab('reservas')}
          className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-[2px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          style={{
            background: activeTab === 'reservas' ? 'var(--brand-subtle)' : 'transparent',
            color: activeTab === 'reservas' ? 'var(--brand)' : 'var(--text-secondary)',
            border: activeTab === 'reservas' ? '1px solid var(--brand-ring)' : '1px solid transparent',
          }}
        >
          <Receipt className="w-4 h-4" />
          Reservas ({data.bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('contratos')}
          className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-[2px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          style={{
            background: activeTab === 'contratos' ? 'var(--brand-subtle)' : 'transparent',
            color: activeTab === 'contratos' ? 'var(--brand)' : 'var(--text-secondary)',
            border: activeTab === 'contratos' ? '1px solid var(--brand-ring)' : '1px solid transparent',
          }}
        >
          <Building2 className="w-4 h-4" />
          Contratos ({data.fixedPayments.length})
        </button>
      </div>

      {/* Tabela de Reservas */}
      {activeTab === 'reservas' && (
        <div
          className="rounded-[4px] overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{
              background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <h2 
                className="text-lg font-black uppercase tracking-wider leading-none"
                style={{
                  fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                  color: 'var(--text-primary)',
                }}
              >
                Reservas — {selectedFieldName} ({MONTHS[monthNum - 1]} {currentYear})
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              <span>Receita: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(data.totalRevenue)}</span></span>
              <span>Recebido: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(data.totalCollected)}</span></span>
              <span>Pendente: <span className="font-semibold text-amber-600 dark:text-amber-400">{fmt(data.totalPending)}</span></span>
            </div>
          </div>
          {data.bookings.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Nenhuma reserva encontrada para o filtro selecionado.</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Tente selecionar outro campo ou período.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="text-xs uppercase tracking-wider font-bold"
                      style={{
                        background: 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <th className="px-5 py-3 text-left">Data</th>
                      <th className="px-5 py-3 text-left">Cliente</th>
                      <th className="px-5 py-3 text-left">Campo</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-right">Total</th>
                      <th className="px-5 py-3 text-right">Sinal PIX</th>
                      <th className="px-5 py-3 text-right">No Balcão</th>
                      <th className="px-5 py-3 text-center">Sinal</th>
                      <th className="px-5 py-3 text-center">Restante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {data.bookings.map(b => {
                      const statusInfo = STATUS_LABELS[b.status] ?? { label: b.status, color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/25' }
                      const depositInfo = STATUS_LABELS[b.deposit_status] ?? STATUS_LABELS.pending
                      const remainingInfo = STATUS_LABELS[b.remaining_status] ?? STATUS_LABELS.pending
                      const isCancelled = b.status === 'cancelled'
                      return (
                        <tr
                          key={b.id}
                          className="transition-colors hover:bg-[var(--bg-subtle)]"
                          style={{
                            borderBottom: '1px solid var(--border)',
                            opacity: isCancelled ? 0.5 : 1,
                          }}
                        >
                          <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs">
                            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(b.date)}</div>
                            <div style={{ color: 'var(--text-muted)' }}>{formatTime(b.start_time)}–{formatTime(b.end_time)}</div>
                          </td>
                          <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--text-primary)' }}>{b.customer_name}</td>
                          <td className="px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>{b.field_name}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{fmt(b.total_amount)}</td>
                          <td className="px-5 py-3.5 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{fmt(b.deposit_amount)}</td>
                          <td className="px-5 py-3.5 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{fmt(b.remaining_amount)}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase border ${depositInfo.color}`}>
                              {depositInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase border ${remainingInfo.color}`}>
                              {remainingInfo.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
                {data.bookings.map(b => {
                  const statusInfo = STATUS_LABELS[b.status] ?? { label: b.status, color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/25' }
                  const isCancelled = b.status === 'cancelled'
                  return (
                    <div
                      key={b.id}
                      className="p-4 space-y-3"
                      style={{ opacity: isCancelled ? 0.5 : 1 }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{b.customer_name}</div>
                          <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(b.date)} | {formatTime(b.start_time)}–{formatTime(b.end_time)}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div
                        className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-[2px]"
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div>
                          <span className="font-medium block" style={{ color: 'var(--text-muted)' }}>Campo</span>
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{b.field_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium block" style={{ color: 'var(--text-muted)' }}>Total</span>
                          <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{fmt(b.total_amount)}</span>
                        </div>
                        <div className="pt-1.5 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
                          <span className="font-medium block" style={{ color: 'var(--text-muted)' }}>Sinal PIX</span>
                          <span className="font-mono text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                            {fmt(b.deposit_amount)} ({b.deposit_status === 'paid' ? 'Pago' : 'Pend.'})
                          </span>
                        </div>
                        <div className="pt-1.5 mt-1 text-right" style={{ borderTop: '1px solid var(--border)' }}>
                          <span className="font-medium block" style={{ color: 'var(--text-muted)' }}>No Balcão</span>
                          <span className="font-mono text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                            {fmt(b.remaining_amount)} ({b.remaining_status === 'paid' ? 'Pago' : 'Pend.'})
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tabela de Contratos Fixos */}
      {activeTab === 'contratos' && (
        <div
          className="rounded-[4px] overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{
              background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <h2 
                className="text-lg font-black uppercase tracking-wider leading-none"
                style={{
                  fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                  color: 'var(--text-primary)',
                }}
              >
                Contratos Fixos — {selectedFieldName} ({MONTHS[monthNum - 1]} {currentYear})
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              <span>Total: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(data.fixedTotal)}</span></span>
              <span>Recebido: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(data.fixedCollected)}</span></span>
              <span>Pendente: <span className="font-semibold text-amber-600 dark:text-amber-400">{fmt(data.fixedPending)}</span></span>
            </div>
          </div>
          {data.fixedPayments.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Nenhum contrato fixo encontrado para o filtro selecionado.</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Os pagamentos de mensalistas são vinculados a cada campo.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="text-xs uppercase tracking-wider font-bold"
                      style={{
                        background: 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <th className="px-5 py-3 text-left">Mês Ref.</th>
                      <th className="px-5 py-3 text-left">Cliente</th>
                      <th className="px-5 py-3 text-left">Campo</th>
                      <th className="px-5 py-3 text-right">Valor</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-left">Método</th>
                      <th className="px-5 py-3 text-left">Data Pgto.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {data.fixedPayments.map(fp => {
                      const statusInfo = fp.status === 'paid'
                        ? STATUS_LABELS.paid
                        : STATUS_LABELS.pending
                      const [refY, refM] = fp.reference_month.split('-')
                      return (
                        <tr
                          key={fp.id}
                          className="transition-colors hover:bg-[var(--bg-subtle)]"
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          <td className="px-5 py-3.5 font-mono text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {MONTHS[parseInt(refM) - 1]}/{refY}
                          </td>
                          <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--text-primary)' }}>{fp.customer_name}</td>
                          <td className="px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>{fp.field_name}</td>
                          <td className="px-5 py-3.5 text-right font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{fmt(fp.amount)}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {fp.payment_method ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                            {fp.paid_at ? formatDate(fp.paid_at.slice(0, 10)) : <span>—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
                {data.fixedPayments.map(fp => {
                  const statusInfo = fp.status === 'paid'
                    ? STATUS_LABELS.paid
                    : STATUS_LABELS.pending
                  const [refY, refM] = fp.reference_month.split('-')
                  return (
                    <div key={fp.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{fp.customer_name}</div>
                          <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            Ref: {MONTHS[parseInt(refM) - 1]}/{refY}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div
                        className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-[2px]"
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div>
                          <span className="font-medium block" style={{ color: 'var(--text-muted)' }}>Campo</span>
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{fp.field_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium block" style={{ color: 'var(--text-muted)' }}>Valor</span>
                          <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{fmt(fp.amount)}</span>
                        </div>
                        <div
                          className="col-span-2 pt-1.5 mt-1 flex justify-between text-[10px]"
                          style={{ borderTop: '1px solid var(--border)' }}
                        >
                          <div>
                            <span className="font-medium inline" style={{ color: 'var(--text-muted)' }}>Método: </span>
                            <span style={{ color: 'var(--text-secondary)' }}>{fp.payment_method ?? '—'}</span>
                          </div>
                          <div>
                            <span className="font-medium inline" style={{ color: 'var(--text-muted)' }}>Pago em: </span>
                            <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{fp.paid_at ? formatDate(fp.paid_at.slice(0, 10)) : '—'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
