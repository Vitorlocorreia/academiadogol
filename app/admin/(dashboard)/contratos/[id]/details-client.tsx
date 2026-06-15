'use client'

import { useState, useTransition } from 'react'
import {
  deactivateContractAction,
  markPaymentPaidAction,
  generateNextMonthPaymentAction,
} from '../actions'
import {
  User,
  Calendar,
  Clock,
  DollarSign,
  Ban,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
  CreditCard,
} from 'lucide-react'

// Tradução de dias da semana
const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

// Formatação do mês de referência
function formatReferenceMonth(dateStr: string) {
  const parts = dateStr.split('-')
  if (parts.length < 2) return dateStr
  const year = parts[0]
  const monthIdx = parseInt(parts[1], 10) - 1
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]
  return `${months[monthIdx]} / ${year}`
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
}

interface Field {
  id: string
  name: string
}

interface Contract {
  id: string
  customer_id: string
  field_id: string
  day_of_week: number
  start_time: string
  end_time: string
  duration_minutes: number
  monthly_amount: number
  starts_at: string
  ends_at: string | null
  is_active: boolean
  customer: Customer | null
  field: Field | null
}

interface Payment {
  id: string
  contract_id: string
  reference_month: string
  amount: number
  status: 'pending' | 'paid'
  payment_method: string | null
  paid_at: string | null
}

interface Props {
  contract: Contract
  initialPayments: Payment[]
}

export function ContractDetailsClient({ contract, initialPayments }: Props) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [isActive, setIsActive] = useState(contract.is_active)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [selectedMethods, setSelectedMethods] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  // Desativar Contrato
  const handleDeactivate = async () => {
    if (!confirm('Deseja realmente encerrar este contrato? Bloqueios futuros na agenda não serão alterados, mas novas mensalidades não serão geradas.')) {
      return
    }

    startTransition(async () => {
      setErrorMsg('')
      setSuccessMsg('')
      const res = await deactivateContractAction(contract.id)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setIsActive(false)
        setSuccessMsg('Contrato encerrado com sucesso.')
      }
    })
  }

  // Marcar mensalidade como paga
  const handleMarkPaid = async (paymentId: string) => {
    const method = selectedMethods[paymentId] || 'PIX'
    startTransition(async () => {
      setErrorMsg('')
      setSuccessMsg('')
      const res = await markPaymentPaidAction(paymentId, method, contract.id)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        // Atualiza a lista localmente
        setPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  status: 'paid',
                  payment_method: method,
                  paid_at: new Date().toISOString(),
                }
              : p
          )
        )
        setSuccessMsg('Pagamento registrado com sucesso!')
      }
    })
  }

  // Gerar próxima mensalidade
  const handleGenerateNextMonth = async () => {
    startTransition(async () => {
      setErrorMsg('')
      setSuccessMsg('')
      const res = await generateNextMonthPaymentAction(
        contract.id,
        contract.monthly_amount
      )
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        // Recarrega página ou adiciona localmente (como as mensalidades vêm ordenadas, recarregar ou obter é melhor)
        // Para uma UX rápida, apenas calculamos o próximo mês na lista localmente
        setSuccessMsg('Mensalidade do próximo mês gerada com sucesso!')
        // Recarregar os pagamentos atualizados
        window.location.reload()
      }
    })
  }

  const formattedMonthly = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(contract.monthly_amount)

  return (
    <div className="space-y-6">
      {/* Mensagens de Feedback */}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-[4px] text-sm font-medium">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-[var(--brand-subtle)] border border-[var(--brand-ring)] text-[var(--brand)] rounded-[4px] text-sm font-semibold">
          {successMsg}
        </div>
      )}

      {/* Grid: Informações Gerais e do Cliente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Contrato */}
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[4px] p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                Contrato Fixo
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Toda {DAYS_OF_WEEK[contract.day_of_week]} no {contract.field?.name}
              </h2>
            </div>
            {isActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]">
                <CheckCircle className="w-3 h-3 text-[var(--brand)]" />
                Vigente
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase bg-zinc-805 text-zinc-500 border border-zinc-700">
                <Ban className="w-3 h-3" />
                Encerrado
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800 text-sm">
            <div>
              <p className="text-zinc-500 text-xs font-semibold uppercase">Horário</p>
              <p className="text-white font-medium mt-1 flex items-center gap-1.5 font-mono">
                <Clock className="w-4 h-4 text-zinc-400" />
                {contract.start_time.substring(0, 5)} - {contract.end_time.substring(0, 5)}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-semibold uppercase">Mensalidade</p>
              <p className="text-[var(--brand)] font-bold mt-1 flex items-center gap-1 font-mono">
                <DollarSign className="w-4 h-4" />
                {formattedMonthly}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-semibold uppercase">Vigência</p>
              <p className="text-white font-medium mt-1 flex items-center gap-1.5 font-mono">
                <Calendar className="w-4 h-4 text-zinc-400" />
                Desde {new Date(contract.starts_at + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Encerramento */}
          {isActive && (
            <div className="pt-6 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                id="btn-encerrar-contrato"
                onClick={handleDeactivate}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-transparent text-red-400 text-xs font-bold rounded-[2px] transition-all cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Ban className="w-3.5 h-3.5" />
                )}
                Encerrar Contrato
              </button>
            </div>
          )}
        </div>

        {/* Card Cliente */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-6 space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <User className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Cliente Mensalista</h3>
          </div>
          <div className="space-y-3 pt-2">
            <div>
              <p className="text-zinc-500 text-[10px] font-semibold uppercase">Nome</p>
              <p className="text-white text-sm font-semibold">{contract.customer?.name}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-semibold uppercase">Telefone</p>
              <p className="text-zinc-300 text-sm font-medium font-mono">{contract.customer?.phone}</p>
            </div>
            {contract.customer?.email && (
              <div>
                <p className="text-zinc-500 text-[10px] font-semibold uppercase">E-mail</p>
                <p className="text-zinc-400 text-sm truncate">{contract.customer?.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Histórico de Mensalidades */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 
              className="text-xl font-black text-white uppercase tracking-wider leading-none"
              style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
            >
              Controle de Mensalidades
            </h3>
            <p className="text-xs text-zinc-500">Histórico de faturamento do mensalista</p>
          </div>
          {isActive && (
            <button
              type="button"
              id="btn-gerar-proxima-mensalidade"
              onClick={handleGenerateNextMonth}
              disabled={isPending}
              className="btn-admin-primary px-4 py-2 text-xs font-bold rounded-[2px] hover:text-white"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              Gerar Próxima Mensalidade
            </button>
          )}
        </div>

        <div className="pt-2">
          {payments.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-sm">
              Nenhuma mensalidade gerada.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3">Mês de Referência</th>
                      <th className="pb-3">Valor</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Pagamento / Método</th>
                      <th className="pb-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-sm">
                    {payments.map((p) => {
                      const amtFormatted = new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(p.amount)

                      const selectedMethod = selectedMethods[p.id] || 'PIX'

                      return (
                        <tr key={p.id} className="hover:bg-zinc-800/10">
                          <td className="py-4 font-semibold text-zinc-205">
                            {formatReferenceMonth(p.reference_month)}
                          </td>
                          <td className="py-4 font-bold text-white font-mono">{amtFormatted}</td>
                          <td className="py-4">
                            {p.status === 'paid' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]">
                                Pago
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold tracking-wider uppercase bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                                Pendente
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-xs text-zinc-400">
                            {p.status === 'paid' ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-zinc-200 flex items-center gap-1">
                                  <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                                  {p.payment_method}
                                </div>
                                {p.paid_at && (
                                  <div className="text-zinc-500 font-mono">
                                    {new Date(p.paid_at).toLocaleString('pt-BR')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            {p.status === 'pending' && (
                              <div className="inline-flex items-center gap-2">
                                <label htmlFor={`method-select-${p.id}`} className="sr-only">Método de Pagamento</label>
                                <select
                                  id={`method-select-${p.id}`}
                                  value={selectedMethod}
                                  onChange={(e) =>
                                    setSelectedMethods((prev) => ({
                                      ...prev,
                                      [p.id]: e.target.value,
                                    }))
                                  }
                                  className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-[2px] text-xs text-zinc-300 focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                                >
                                  <option value="PIX">PIX</option>
                                  <option value="Dinheiro">Dinheiro</option>
                                  <option value="Cartão">Cartão</option>
                                </select>
                                <button
                                  type="button"
                                  id={`btn-receber-${p.id}`}
                                  onClick={() => handleMarkPaid(p.id)}
                                  disabled={isPending}
                                  className="btn-admin-primary px-3 py-1 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-xs font-bold rounded-[2px] transition-all cursor-pointer"
                                >
                                  Confirmar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-zinc-800/50 bg-zinc-900/50 rounded-[4px] border border-zinc-800/60 overflow-hidden">
                {payments.map((p) => {
                  const amtFormatted = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(p.amount)

                  const selectedMethod = selectedMethods[p.id] || 'PIX'

                  return (
                    <div key={p.id} className="p-4 space-y-3">
                      {/* Reference Month + Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">
                          {formatReferenceMonth(p.reference_month)}
                        </span>
                        {p.status === 'paid' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]">
                            Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                            Pendente
                          </span>
                        )}
                      </div>

                      {/* Value + Payment details */}
                      <div className="flex items-center justify-between text-xs bg-zinc-950/40 p-2.5 rounded-[2px] border border-zinc-800/60">
                        <div>
                          <span className="text-zinc-500 block">Valor</span>
                          <span className="text-sm font-bold text-white font-mono">{amtFormatted}</span>
                        </div>
                        {p.status === 'paid' && (
                          <div className="text-right">
                            <span className="text-zinc-500 block">Método / Data</span>
                            <span className="text-zinc-250 font-semibold">{p.payment_method}</span>
                            {p.paid_at && (
                              <span className="text-zinc-500 font-mono block text-[9px]">
                                {new Date(p.paid_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions if pending */}
                      {p.status === 'pending' && (
                        <div className="flex items-center justify-between gap-3 pt-1">
                          <div className="flex-1 flex items-center gap-1.5">
                            <label htmlFor={`mobile-method-select-${p.id}`} className="sr-only">Método</label>
                            <select
                              id={`mobile-method-select-${p.id}`}
                              value={selectedMethod}
                              onChange={(e) =>
                                setSelectedMethods((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-[2px] text-xs text-zinc-300 focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                            >
                              <option value="PIX">PIX</option>
                              <option value="Dinheiro">Dinheiro</option>
                              <option value="Cartão">Cartão</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            id={`btn-mobile-receber-${p.id}`}
                            onClick={() => handleMarkPaid(p.id)}
                            disabled={isPending}
                            className="btn-admin-primary px-4 py-1.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-xs font-bold rounded-[2px] transition-all cursor-pointer flex-1 text-center justify-center"
                          >
                            Confirmar
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
