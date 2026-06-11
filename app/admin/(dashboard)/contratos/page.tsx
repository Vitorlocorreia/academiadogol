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
          <h1 className="text-2xl font-black text-white sm:text-3xl">Contratos Fixos</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Gerencie os clientes mensalistas, seus horários fixos e controle o pagamento das mensalidades.
          </p>
        </div>
        <Link
          href="/admin/contratos/novo"
          id="btn-novo-contrato"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Novo Contrato
        </Link>
      </div>

      {/* Lista de Contratos */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-zinc-500" />
            </div>
            <p className="text-zinc-400 font-medium">Nenhum contrato fixo registrado</p>
            <p className="text-zinc-600 text-sm mt-1">Clique em "Novo Contrato" para registrar o primeiro mensalista.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/50">
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
                          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {contract.customer?.name}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {contract.customer?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {contract.field?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-zinc-300 font-medium">
                            {dayName}
                          </div>
                          <div className="text-xs text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-600" />
                            {contract.start_time.substring(0, 5)} às {contract.end_time.substring(0, 5)} ({contract.duration_minutes} min)
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-emerald-400">
                          {formattedValue}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-zinc-300">
                          De: <span className="font-semibold text-zinc-100">{startsAtFormatted}</span>
                        </div>
                        <div className="text-xs text-zinc-500">
                          Até: <span className="font-semibold text-zinc-400">{endsAtFormatted}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contract.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-500 border border-zinc-700">
                            <Ban className="w-3.5 h-3.5 text-zinc-600" />
                            Finalizado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/contratos/${contract.id}`}
                          id={`btn-gerenciar-${contract.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-700 hover:text-white transition-all"
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
