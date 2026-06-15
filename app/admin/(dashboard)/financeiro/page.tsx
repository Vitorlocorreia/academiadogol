import { getFinanceiroData } from './actions'
import { FinanceiroDashboard } from './financeiro-dashboard'
import { BarChart3 } from 'lucide-react'

interface Props {
  searchParams: Promise<{
    month?: string
    year?: string
  }>
}

export default async function AdminFinanceiroPage({ searchParams }: Props) {
  const params = await searchParams

  // Padrão: mês e ano atual no fuso de SP
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const month = params.month ?? String(now.getMonth() + 1)
  const year = params.year ?? String(now.getFullYear())

  const data = await getFinanceiroData(month, year)

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[4px] bg-[var(--brand-subtle)] border border-[var(--brand-ring)] flex items-center justify-center shrink-0">
          <BarChart3 className="w-5 h-5 text-[var(--brand)]" />
        </div>
        <div>
          <h1 
            className="text-3xl font-black text-white uppercase tracking-wider leading-none"
            style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
          >
            Financeiro
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Acompanhe a receita, pagamentos recebidos e pendências do complexo por período.
          </p>
        </div>
      </div>

      <FinanceiroDashboard data={data} currentMonth={month} currentYear={year} />
    </div>
  )
}
