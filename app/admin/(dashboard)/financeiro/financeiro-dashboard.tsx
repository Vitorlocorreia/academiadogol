'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  Building2,
  Calendar,
  Receipt,
  Layers,
  Filter,
  ArrowRight,
} from 'lucide-react'
import type { FinanceiroData } from './actions'

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
  pending: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  confirmed: { label: 'Confirmada', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  completed: { label: 'Concluída', color: 'text-[var(--brand)] bg-[var(--brand-subtle)] border-[var(--brand-ring)]' },
  cancelled: { label: 'Cancelada', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  paid: { label: 'Pago', color: 'text-[var(--brand)] bg-[var(--brand-subtle)] border-[var(--brand-ring)]' },
  refunded: { label: 'Estornado', color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' },
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5)
}

export function FinanceiroDashboard({
  data,
  currentMonth,
  currentYear,
  currentFieldId,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'reservas' | 'contratos' | 'campos'>('reservas')

  const years = Array.from({ length: 3 }, (_, i) => String(new Date().getFullYear() - i))
  const monthNum = parseInt(currentMonth)

  const selectedFieldObj = data.fields.find((f) => f.id === currentFieldId)
  const selectedFieldName = selectedFieldObj ? selectedFieldObj.name : 'Todos os Campos'

  function navigate(month: string, year: string, fieldId: string) {
    startTransition(() => {
      router.push(`/admin/financeiro?month=${month}&year=${year}&fieldId=${fieldId}`)
    })
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(e.target.value, currentYear, currentFieldId)
  }

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(currentMonth, e.target.value, currentFieldId)
  }

  function handleFieldChange(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(currentMonth, currentYear, e.target.value)
  }

  function handleFieldSelect(fieldId: string) {
    navigate(currentMonth, currentYear, fieldId)
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
      color: 'from-[var(--brand)]/15 to-zinc-950 border-[var(--brand-ring)]',
      iconColor: 'text-[var(--brand)]',
    },
    {
      label: 'Valor Recebido',
      value: fmt(totalCollectedGrand),
      sub: `${collectedPct.toFixed(0)}% do faturamento`,
      icon: CheckCircle2,
      color: 'from-blue-500/15 to-zinc-950 border-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Valor Pendente',
      value: fmt(totalPendingGrand),
      sub: `${(100 - collectedPct).toFixed(0)}% a receber`,
      icon: Clock,
      color: 'from-yellow-500/15 to-zinc-950 border-yellow-500/20',
      iconColor: 'text-yellow-400',
    },
    {
      label: 'Reservas Canceladas',
      value: fmt(data.totalCancelled),
      sub: `${data.bookings.filter((b) => b.status === 'cancelled').length} cancelamento(s)`,
      icon: XCircle,
      color: 'from-red-500/15 to-zinc-950 border-red-500/20',
      iconColor: 'text-red-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Barra de Filtros: Período + Campo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-[4px]">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Seletor de Mês e Ano */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-[2px] px-3 py-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-400 text-xs font-semibold uppercase">Mês:</span>
            <div className="relative">
              <label htmlFor="month-select" className="sr-only">Mês</label>
              <select
                id="month-select"
                value={currentMonth}
                onChange={handleMonthChange}
                disabled={isPending}
                className="bg-transparent text-white text-xs font-bold uppercase appearance-none pr-6 cursor-pointer focus:outline-none"
              >
                {MONTHS.map((name, i) => (
                  <option key={i + 1} value={String(i + 1)} className="bg-zinc-900">
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <span className="text-zinc-600">/</span>

            <div className="relative">
              <label htmlFor="year-select" className="sr-only">Ano</label>
              <select
                id="year-select"
                value={currentYear}
                onChange={handleYearChange}
                disabled={isPending}
                className="bg-transparent text-white text-xs font-bold uppercase appearance-none pr-6 cursor-pointer focus:outline-none"
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-zinc-900">{y}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Seletor de Campo */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-[2px] px-3 py-2">
            <Filter className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-zinc-400 text-xs font-semibold uppercase">Campo:</span>
            <div className="relative">
              <label htmlFor="field-select" className="sr-only">Filtrar por Campo</label>
              <select
                id="field-select"
                value={currentFieldId}
                onChange={handleFieldChange}
                disabled={isPending}
                className="bg-transparent text-white text-xs font-bold appearance-none pr-6 cursor-pointer focus:outline-none"
              >
                <option value="all" className="bg-zinc-900">Todos os Campos</option>
                {data.fields.map(f => (
                  <option key={f.id} value={f.id} className="bg-zinc-900">
                    {f.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
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
          className={`px-3.5 py-1.5 rounded-[2px] text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
            currentFieldId === 'all'
              ? 'bg-[var(--brand-subtle)] text-[var(--brand)] border-[var(--brand-ring)] shadow-sm'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
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
              className={`px-3.5 py-1.5 rounded-[2px] text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border flex items-center gap-2 ${
                isSelected
                  ? 'bg-[var(--brand-subtle)] text-[var(--brand)] border-[var(--brand-ring)] shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span>{f.name}</span>
              {breakdown && breakdown.total_revenue > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] ${
                  isSelected ? 'bg-[var(--brand)]/20 text-[var(--brand)]' : 'bg-zinc-800 text-zinc-400'
                }`}>
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
            className={`rounded-[4px] border bg-gradient-to-br p-4 ${card.color}`}
          >
            <div className={`w-9 h-9 rounded-[2px] bg-black/25 flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white leading-tight truncate">{card.value}</p>
            <p className="text-xs text-zinc-400 mt-1 font-medium">{card.label}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Desdobramento Financeiro por Campo (Cards Comparativos) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <h3 
              className="text-xl font-black text-white uppercase tracking-wider leading-none"
              style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
            >
              Faturamento por Campo — {MONTHS[monthNum - 1]} {currentYear}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
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
                className={`p-4 rounded-[4px] border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-zinc-950 border-[var(--brand-ring)] ring-1 ring-[var(--brand-ring)]'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--brand)]"></span>
                    {item.field_name}
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 font-bold">
                    {item.share_percentage.toFixed(1)}% do total
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-2xl font-black text-white font-mono">
                    {fmt(item.total_revenue)}
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span className="text-[var(--brand)] font-medium">✓ Recebido: {fmt(item.total_collected)}</span>
                    <span className="text-yellow-400 font-medium">⏳ Pend: {fmt(item.total_pending)}</span>
                  </div>
                </div>

                {/* Mini barra de progresso */}
                <div className="h-1.5 bg-zinc-800 rounded-[2px] overflow-hidden">
                  <div
                    className="h-full bg-[var(--brand)] rounded-[2px] transition-all"
                    style={{ width: `${Math.min(collPct, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                  <span>{item.bookings_count} reservas / {item.fixed_count} fixos</span>
                  <span className="text-[var(--brand)] font-semibold flex items-center gap-1">
                    {isSelected ? 'Filtrado' : 'Filtrar'} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-full md:w-fit gap-1 bg-zinc-900 border border-zinc-800 rounded-[4px] p-1">
        <button
          onClick={() => setActiveTab('reservas')}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-[2px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'reservas'
              ? 'bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]'
              : 'text-zinc-400 hover:text-white border border-transparent'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Reservas ({data.bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('contratos')}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-[2px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'contratos'
              ? 'bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]'
              : 'text-zinc-400 hover:text-white border border-transparent'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Contratos ({data.fixedPayments.length})
        </button>
      </div>

      {/* Tabela de Reservas */}
      {activeTab === 'reservas' && (
        <div className="rounded-[4px] border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900">
            <div>
              <h2 
                className="text-lg font-black text-white uppercase tracking-wider leading-none"
                style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
              >
                Reservas — {selectedFieldName} ({MONTHS[monthNum - 1]} {currentYear})
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 font-mono">
              <span>Receita: <span className="text-white font-semibold">{fmt(data.totalRevenue)}</span></span>
              <span>Recebido: <span className="text-[var(--brand)] font-semibold">{fmt(data.totalCollected)}</span></span>
              <span>Pendente: <span className="text-yellow-400 font-semibold">{fmt(data.totalPending)}</span></span>
            </div>
          </div>
          {data.bookings.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">Nenhuma reserva encontrada para o filtro selecionado.</p>
              <p className="text-zinc-600 text-sm mt-1">Tente selecionar outro campo ou período.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-500 border-b border-zinc-800 bg-zinc-950">
                      <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Data</th>
                      <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Cliente</th>
                      <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Campo</th>
                      <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-right font-bold uppercase tracking-wider">Total</th>
                      <th className="px-5 py-3 text-right font-bold uppercase tracking-wider">Sinal PIX</th>
                      <th className="px-5 py-3 text-right font-bold uppercase tracking-wider">No Balcão</th>
                      <th className="px-5 py-3 text-center font-bold uppercase tracking-wider">Sinal</th>
                      <th className="px-5 py-3 text-center font-bold uppercase tracking-wider">Restante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {data.bookings.map(b => {
                      const statusInfo = STATUS_LABELS[b.status] ?? { label: b.status, color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' }
                      const depositInfo = STATUS_LABELS[b.deposit_status] ?? STATUS_LABELS.pending
                      const remainingInfo = STATUS_LABELS[b.remaining_status] ?? STATUS_LABELS.pending
                      const isCancelled = b.status === 'cancelled'
                      return (
                        <tr key={b.id} className={`hover:bg-zinc-800/40 transition-colors ${isCancelled ? 'opacity-50' : ''}`}>
                          <td className="px-5 py-3.5 text-zinc-300 whitespace-nowrap font-mono">
                            <div>{formatDate(b.date)}</div>
                            <div className="text-xs text-zinc-500">{formatTime(b.start_time)}–{formatTime(b.end_time)}</div>
                          </td>
                          <td className="px-5 py-3.5 text-white font-medium">{b.customer_name}</td>
                          <td className="px-5 py-3.5 text-zinc-300 font-semibold">{b.field_name}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right text-white font-semibold font-mono">{fmt(b.total_amount)}</td>
                          <td className="px-5 py-3.5 text-right text-zinc-300 font-mono">{fmt(b.deposit_amount)}</td>
                          <td className="px-5 py-3.5 text-right text-zinc-300 font-mono">{fmt(b.remaining_amount)}</td>
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
              <div className="md:hidden divide-y divide-zinc-800 bg-zinc-900">
                {data.bookings.map(b => {
                  const statusInfo = STATUS_LABELS[b.status] ?? { label: b.status, color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' }
                  const isCancelled = b.status === 'cancelled'
                  return (
                    <div key={b.id} className={`p-4 space-y-3 ${isCancelled ? 'opacity-50' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">{b.customer_name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{formatDate(b.date)} | {formatTime(b.start_time)}–{formatTime(b.end_time)}</div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950 p-2.5 rounded-[2px] border border-zinc-800">
                        <div>
                          <span className="text-zinc-500 font-medium block">Campo</span>
                          <span className="text-zinc-200 font-semibold">{b.field_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-500 font-medium block">Total</span>
                          <span className="text-zinc-200 font-bold font-mono">{fmt(b.total_amount)}</span>
                        </div>
                        <div className="border-t border-zinc-800 pt-1.5 mt-1">
                          <span className="text-zinc-500 font-medium block">Sinal PIX</span>
                          <span className="text-zinc-300 font-mono text-[10px]">
                            {fmt(b.deposit_amount)} ({b.deposit_status === 'paid' ? 'Pago' : 'Pend.'})
                          </span>
                        </div>
                        <div className="border-t border-zinc-800 pt-1.5 mt-1 text-right">
                          <span className="text-zinc-500 font-medium block">No Balcão</span>
                          <span className="text-zinc-300 font-mono text-[10px]">
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
        <div className="rounded-[4px] border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900">
            <div>
              <h2 
                className="text-lg font-black text-white uppercase tracking-wider leading-none"
                style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
              >
                Contratos Fixos — {selectedFieldName} ({MONTHS[monthNum - 1]} {currentYear})
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 font-mono">
              <span>Total: <span className="text-white font-semibold">{fmt(data.fixedTotal)}</span></span>
              <span>Recebido: <span className="text-[var(--brand)] font-semibold">{fmt(data.fixedCollected)}</span></span>
              <span>Pendente: <span className="text-yellow-400 font-semibold">{fmt(data.fixedPending)}</span></span>
            </div>
          </div>
          {data.fixedPayments.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">Nenhum contrato fixo encontrado para o filtro selecionado.</p>
              <p className="text-zinc-600 text-sm mt-1">Os pagamentos de mensalistas são vinculados a cada campo.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-500 border-b border-zinc-800 bg-zinc-950">
                      <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Mês Ref.</th>
                      <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Cliente</th>
                      <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Campo</th>
                      <th className="px-5 py-3 text-right font-bold uppercase tracking-wider">Valor</th>
                      <th className="px-5 py-3 text-center font-bold uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Método</th>
                      <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Data Pgto.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {data.fixedPayments.map(fp => {
                      const statusInfo = fp.status === 'paid'
                        ? STATUS_LABELS.paid
                        : STATUS_LABELS.pending
                      const [refY, refM] = fp.reference_month.split('-')
                      return (
                        <tr key={fp.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="px-5 py-3.5 text-zinc-300 font-mono">{MONTHS[parseInt(refM) - 1]}/{refY}</td>
                          <td className="px-5 py-3.5 text-white font-medium">{fp.customer_name}</td>
                          <td className="px-5 py-3.5 text-zinc-300 font-semibold">{fp.field_name}</td>
                          <td className="px-5 py-3.5 text-right text-white font-semibold font-mono">{fmt(fp.amount)}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-zinc-300">
                            {fp.payment_method ?? <span className="text-zinc-600">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-300 font-mono">
                            {fp.paid_at ? formatDate(fp.paid_at.slice(0, 10)) : <span className="text-zinc-600">—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-zinc-800 bg-zinc-900">
                {data.fixedPayments.map(fp => {
                  const statusInfo = fp.status === 'paid'
                    ? STATUS_LABELS.paid
                    : STATUS_LABELS.pending
                  const [refY, refM] = fp.reference_month.split('-')
                  return (
                    <div key={fp.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">{fp.customer_name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Ref: {MONTHS[parseInt(refM) - 1]}/{refY}</div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950 p-2.5 rounded-[2px] border border-zinc-800">
                        <div>
                          <span className="text-zinc-500 font-medium block">Campo</span>
                          <span className="text-zinc-200 font-semibold">{fp.field_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-500 font-medium block">Valor</span>
                          <span className="text-zinc-200 font-bold font-mono">{fmt(fp.amount)}</span>
                        </div>
                        <div className="col-span-2 border-t border-zinc-800 pt-1.5 mt-1 flex justify-between text-[10px]">
                          <div>
                            <span className="text-zinc-500 font-medium inline">Método: </span>
                            <span className="text-zinc-300">{fp.payment_method ?? '—'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 font-medium inline">Pago em: </span>
                            <span className="text-zinc-300 font-mono">{fp.paid_at ? formatDate(fp.paid_at.slice(0, 10)) : '—'}</span>
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
