import { getFinanceiroData } from './actions'
import { FinanceiroDashboard } from './financeiro-dashboard'
import { BarChart3 } from 'lucide-react'

interface Props {
  searchParams: Promise<{
    month?: string
    year?: string
    fieldId?: string
  }>
}

export default async function AdminFinanceiroPage({ searchParams }: Props) {
  const params = await searchParams

  // Padrão: mês e ano atual no fuso de SP
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const month = params.month ?? String(now.getMonth() + 1)
  const year = params.year ?? String(now.getFullYear())
  const fieldId = params.fieldId ?? 'all'

  const data = await getFinanceiroData(month, year, fieldId)

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[4px] bg-[var(--brand-subtle)] border border-[var(--brand-ring)] flex items-center justify-center shrink-0">
          <BarChart3 className="w-5 h-5 text-[var(--brand)]" />
        </div>
        <div>
          <h1 
            className="text-3xl font-black uppercase tracking-wider leading-none"
            style={{
              fontFamily: "'Bebas Neue', Arial Black, sans-serif",
              color: 'var(--text-primary)',
            }}
          >
            Financeiro
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Acompanhe o faturamento, pagamentos recebidos e pendências por quadra e período.
          </p>
        </div>
      </div>

      <FinanceiroDashboard
        data={data}
        currentMonth={month}
        currentYear={year}
        currentFieldId={fieldId}
      />
    </div>
  )
}
