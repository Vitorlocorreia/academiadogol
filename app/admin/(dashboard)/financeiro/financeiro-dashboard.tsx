'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  Building2,
  Calendar,
  Receipt,
} from 'lucide-react'
import type { FinanceiroData } from './actions'

interface Props {
  data: FinanceiroData
  currentMonth: string
  currentYear: string
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

export function FinanceiroDashboard({ data, currentMonth, currentYear }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'reservas' | 'contratos'>('reservas')

  const years = Array.from({ length: 3 }, (_, i) => String(new Date().getFullYear() - i))
  const monthNum = parseInt(currentMonth)
  const yearNum = parseInt(currentYear)

  function navigate(month: string, year: string) {
    startTransition(() => {
      router.push(`/admin/financeiro?month=${month}&year=${year}`)
    })
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(e.target.value, currentYear)
  }

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(currentMonth, e.target.value)
  }

  const totalGrand = data.totalRevenue + data.fixedTotal
  const totalCollectedGrand = data.totalCollected + data.fixedCollected
  const totalPendingGrand = data.totalPending + data.fixedPending

  const collectedPct = totalGrand > 0 ? (totalCollectedGrand / totalGrand) * 100 : 0

  const kpiCards = [
    {
      label: 'Receita Total',
      value: fmt(totalGrand),
      sub: 'Reservas + Contratos Fixos',
      icon: TrendingUp,
      color: 'from-[var(--brand)]/15 to-zinc-950 border-[var(--brand-ring)]',
      iconColor: 'text-[var(--brand)]',
    },
    {
      label: 'Valor Recebido',
      value: fmt(totalCollectedGrand),
      sub: `${collectedPct.toFixed(0)}% do total`,
      icon: CheckCircle2,
      color: 'from-blue-500/15 to-zinc-950 border-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Valor Pendente',
      value: fmt(totalPendingGrand),
      sub: `${(100 - collectedPct).toFixed(0)}% do total`,
      icon: Clock,
      color: 'from-yellow-500/15 to-zinc-950 border-yellow-500/20',
      iconColor: 'text-yellow-400',
    },
    {
      label: 'Reservas Canceladas',
      value: fmt(data.totalCancelled),
      sub: 'Valor não cobrado',
      icon: XCircle,
      color: 'from-red-500/15 to-zinc-950 border-red-500/20',
      iconColor: 'text-red-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-[4px] px-3 py-2">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <span className="text-zinc-400 text-sm">Período:</span>
          <div className="relative">
            <label htmlFor="month-select" className="sr-only">Mês</label>
            <select
              id="month-select"
              value={currentMonth}
              onChange={handleMonthChange}
              disabled={isPending}
              className="bg-transparent text-white text-sm font-medium appearance-none pr-6 cursor-pointer focus:outline-none"
            >
              {MONTHS.map((name, i) => (
                <option key={i + 1} value={String(i + 1)} className="bg-zinc-900">
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <label htmlFor="year-select" className="sr-only">Ano</label>
            <select
              id="year-select"
              value={currentYear}
              onChange={handleYearChange}
              disabled={isPending}
              className="bg-transparent text-white text-sm font-medium appearance-none pr-6 cursor-pointer focus:outline-none"
            >
              {years.map(y => (
                <option key={y} value={y} className="bg-zinc-900">{y}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        {isPending && (
          <span className="text-zinc-500 text-sm animate-pulse">Carregando...</span>
        )}
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

      {/* Barra de progresso de recebimento */}
      <div className="rounded-[4px] border border-zinc-700/50 bg-zinc-900/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">Progresso de Recebimento</span>
          <span className="text-sm text-zinc-400 font-mono">{fmt(totalCollectedGrand)} / {fmt(totalGrand)}</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-[2px] overflow-hidden">
          <div
            className="h-full bg-[var(--brand)] rounded-[2px] transition-all duration-700"
            style={{ width: `${Math.min(collectedPct, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[var(--brand)] font-bold">{(collectedPct).toFixed(1)}% RECEBIDO</span>
          <span className="text-xs text-yellow-400 font-bold">{fmt(totalPendingGrand)} PENDENTE</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-full md:w-fit gap-1 bg-zinc-900 border border-zinc-800 rounded-[4px] p-1">
        <button
          onClick={() => setActiveTab('reservas')}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-[2px] text-xs sm:text-sm font-medium transition-all cursor-pointer ${
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
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-[2px] text-xs sm:text-sm font-medium transition-all cursor-pointer ${
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
        <div className="rounded-[4px] border border-zinc-700/50 bg-zinc-900/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 
              className="text-lg font-black text-white uppercase tracking-wider leading-none"
              style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
            >
              Reservas — {MONTHS[monthNum - 1]} {currentYear}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500 font-mono">
              <span>Receita: <span className="text-white font-semibold">{fmt(data.totalRevenue)}</span></span>
              <span>Recebido: <span className="text-[var(--brand)] font-semibold">{fmt(data.totalCollected)}</span></span>
              <span>Pendente: <span className="text-yellow-400 font-semibold">{fmt(data.totalPending)}</span></span>
            </div>
          </div>
          {data.bookings.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">Nenhuma reserva neste período</p>
              <p className="text-zinc-600 text-sm mt-1">Tente selecionar outro mês</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-500 border-b border-zinc-700/50 bg-zinc-900/25">
                      <th className="px-5 py-3 text-left font-medium uppercase tracking-wider">Data</th>
                      <th className="px-5 py-3 text-left font-medium uppercase tracking-wider">Cliente</th>
                      <th className="px-5 py-3 text-left font-medium uppercase tracking-wider">Campo</th>
                      <th className="px-5 py-3 text-left font-medium uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-right font-medium uppercase tracking-wider">Total</th>
                      <th className="px-5 py-3 text-right font-medium uppercase tracking-wider">Sinal</th>
                      <th className="px-5 py-3 text-right font-medium uppercase tracking-wider">Restante</th>
                      <th className="px-5 py-3 text-center font-medium uppercase tracking-wider">Pgto. Sinal</th>
                      <th className="px-5 py-3 text-center font-medium uppercase tracking-wider">Pgto. Restante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700/30">
                    {data.bookings.map(b => {
                      const statusInfo = STATUS_LABELS[b.status] ?? { label: b.status, color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' }
                      const depositInfo = STATUS_LABELS[b.deposit_status] ?? STATUS_LABELS.pending
                      const remainingInfo = STATUS_LABELS[b.remaining_status] ?? STATUS_LABELS.pending
                      const isCancelled = b.status === 'cancelled'
                      return (
                        <tr key={b.id} className={`hover:bg-zinc-700/20 transition-colors ${isCancelled ? 'opacity-50' : ''}`}>
                          <td className="px-5 py-3.5 text-zinc-300 whitespace-nowrap font-mono">
                            <div>{formatDate(b.date)}</div>
                            <div className="text-xs text-zinc-500">{formatTime(b.start_time)}–{formatTime(b.end_time)}</div>
                          </td>
                          <td className="px-5 py-3.5 text-white font-medium">{b.customer_name}</td>
                          <td className="px-5 py-3.5 text-zinc-300">{b.field_name}</td>
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
              <div className="md:hidden divide-y divide-zinc-800/50 bg-zinc-900">
                {data.bookings.map(b => {
                  const statusInfo = STATUS_LABELS[b.status] ?? { label: b.status, color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' }
                  const isCancelled = b.status === 'cancelled'
                  return (
                    <div key={b.id} className={`p-4 space-y-3 ${isCancelled ? 'opacity-50' : ''}`}>
                      {/* Top: Cliente + Status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">{b.customer_name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{formatDate(b.date)} | {formatTime(b.start_time)}–{formatTime(b.end_time)}</div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Middle: Campo + Valores */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/40 p-2.5 rounded-[2px] border border-zinc-800/60">
                        <div>
                          <span className="text-zinc-500 font-medium block">Campo</span>
                          <span className="text-zinc-200 font-semibold">{b.field_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-500 font-medium block">Total</span>
                          <span className="text-zinc-200 font-bold font-mono">{fmt(b.total_amount)}</span>
                        </div>
                        <div className="border-t border-zinc-800/40 pt-1.5 mt-1">
                          <span className="text-zinc-500 font-medium block">Sinal</span>
                          <span className="text-zinc-300 font-mono text-[10px]">
                            {fmt(b.deposit_amount)} ({b.deposit_status === 'paid' ? 'Pago' : 'Pend.'})
                          </span>
                        </div>
                        <div className="border-t border-zinc-800/40 pt-1.5 mt-1 text-right">
                          <span className="text-zinc-500 font-medium block">Restante</span>
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
        <div className="rounded-[4px] border border-zinc-700/50 bg-zinc-900/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 
              className="text-lg font-black text-white uppercase tracking-wider leading-none"
              style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
            >
              Contratos Fixos — {MONTHS[monthNum - 1]} {currentYear}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500 font-mono">
              <span>Total: <span className="text-white font-semibold">{fmt(data.fixedTotal)}</span></span>
              <span>Recebido: <span className="text-[var(--brand)] font-semibold">{fmt(data.fixedCollected)}</span></span>
              <span>Pendente: <span className="text-yellow-400 font-semibold">{fmt(data.fixedPending)}</span></span>
            </div>
          </div>
          {data.fixedPayments.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">Nenhum contrato fixo neste período</p>
              <p className="text-zinc-600 text-sm mt-1">Os pagamentos aparecem conforme os contratos ativos</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-500 border-b border-zinc-700/50 bg-zinc-900/25">
                      <th className="px-5 py-3 text-left font-medium uppercase tracking-wider">Mês Ref.</th>
                      <th className="px-5 py-3 text-left font-medium uppercase tracking-wider">Cliente</th>
                      <th className="px-5 py-3 text-left font-medium uppercase tracking-wider">Campo</th>
                      <th className="px-5 py-3 text-right font-medium uppercase tracking-wider">Valor</th>
                      <th className="px-5 py-3 text-center font-medium uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-left font-medium uppercase tracking-wider">Método</th>
                      <th className="px-5 py-3 text-left font-medium uppercase tracking-wider">Data Pgto.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700/30">
                    {data.fixedPayments.map(fp => {
                      const statusInfo = fp.status === 'paid'
                        ? STATUS_LABELS.paid
                        : STATUS_LABELS.pending
                      const [refY, refM] = fp.reference_month.split('-')
                      return (
                        <tr key={fp.id} className="hover:bg-zinc-700/20 transition-colors">
                          <td className="px-5 py-3.5 text-zinc-300 font-mono">{MONTHS[parseInt(refM) - 1]}/{refY}</td>
                          <td className="px-5 py-3.5 text-white font-medium">{fp.customer_name}</td>
                          <td className="px-5 py-3.5 text-zinc-300">{fp.field_name}</td>
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
              <div className="md:hidden divide-y divide-zinc-800/50 bg-zinc-900">
                {data.fixedPayments.map(fp => {
                  const statusInfo = fp.status === 'paid'
                    ? STATUS_LABELS.paid
                    : STATUS_LABELS.pending
                  const [refY, refM] = fp.reference_month.split('-')
                  return (
                    <div key={fp.id} className="p-4 space-y-3">
                      {/* Top: Client + Status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">{fp.customer_name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Ref: {MONTHS[parseInt(refM) - 1]}/{refY}</div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Middle: Campo + Valor */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/40 p-2.5 rounded-[2px] border border-zinc-800/60">
                        <div>
                          <span className="text-zinc-500 font-medium block">Campo</span>
                          <span className="text-zinc-200 font-semibold">{fp.field_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-500 font-medium block">Valor</span>
                          <span className="text-zinc-200 font-bold font-mono">{fmt(fp.amount)}</span>
                        </div>
                        <div className="col-span-2 border-t border-zinc-800/40 pt-1.5 mt-1 flex justify-between text-[10px]">
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
