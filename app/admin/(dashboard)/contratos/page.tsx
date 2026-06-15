import Link from 'next/link'
import { Plus, User, Calendar, Clock, DollarSign, ArrowRight, Ban, CheckCircle, HelpCircle } from 'lucide-react'
import { getContracts } from './actions'

// Função auxiliar para traduzir o dia da semana
const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

export default async function ContratosPage() {
  const contracts = await getContracts()

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 
            className="text-3xl font-black text-white uppercase tracking-wider leading-none"
            style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
          >
            Contratos Fixos
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Gerencie os clientes mensalistas, seus horários fixos e controle o pagamento das mensalidades.
          </p>
        </div>
        <Link
          href="/admin/contratos/novo"
          id="btn-novo-contrato"
          className="btn-admin-primary px-4 py-2.5 text-sm font-semibold rounded-[2px] hover:text-white"
        >
          <Plus className="w-4 h-4" />
          Novo Contrato
        </Link>
      </div>

      {/* Lista de Contratos */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-[4px] bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-zinc-500" />
            </div>
            <p className="text-zinc-400 font-medium">Nenhum contrato fixo registrado</p>
            <p className="text-zinc-600 text-sm mt-1">Clique em "Novo Contrato" para registrar o primeiro mensalista.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider bg-zinc-900/50">
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Campo</th>
                  <th className="px-6 py-4">Horário Fixo</th>
                  <th className="px-6 py-4">Valor Mensal</th>
                  <th className="px-6 py-4">Vigência</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {contracts.map((contract) => {
                  const dayName = DAYS_OF_WEEK[contract.day_of_week]
                  const formattedValue = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(contract.monthly_amount)

                  const startsAtFormatted = new Date(contract.starts_at + 'T12:00:00')
                    .toLocaleDateString('pt-BR')
                  
                  const endsAtFormatted = contract.ends_at
                    ? new Date(contract.ends_at + 'T12:00:00').toLocaleDateString('pt-BR')
                    : 'Indeterminado'

                  return (
                    <tr
                      key={contract.id}
                      className="hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[2px] bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {contract.customer?.name}
                            </div>
                            <div className="text-xs text-zinc-500 font-mono">
                              {contract.customer?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {contract.field?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-zinc-300 font-medium">
                            {dayName}
                          </div>
                          <div className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-zinc-600" />
                            {contract.start_time.substring(0, 5)} às {contract.end_time.substring(0, 5)} ({contract.duration_minutes} min)
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-[var(--brand)] font-mono">
                          {formattedValue}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-zinc-300 font-mono">
                          De: <span className="font-semibold text-zinc-100">{startsAtFormatted}</span>
                        </div>
                        <div className="text-xs text-zinc-500 font-mono">
                          Até: <span className="font-semibold text-zinc-400">{endsAtFormatted}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contract.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]">
                            <CheckCircle className="w-3 h-3 text-[var(--brand)]" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase bg-zinc-850 text-zinc-500 border border-zinc-800">
                            <Ban className="w-3 h-3 text-zinc-600" />
                            Finalizado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/contratos/${contract.id}`}
                          id={`btn-gerenciar-${contract.id}`}
                          className="btn-admin-secondary px-3 py-1.5 text-xs font-bold rounded-[2px]"
                        >
                          Mensalidades
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
