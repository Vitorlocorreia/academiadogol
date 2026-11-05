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
  if (!dateStr) return '—'
  const cleanStr = String(dateStr).split('T')[0]
  const parts = cleanStr.split('-')
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
  const monthName = months[monthIdx] || parts[1]
  return `${monthName} / ${year}`
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
      if (res?.error) {
        setErrorMsg('Erro ao encerrar contrato: ' + res.error)
      } else {
        setIsActive(false)
        setSuccessMsg('Contrato encerrado com sucesso!')
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
      if (res?.error) {
        setErrorMsg('Erro ao confirmar pagamento: ' + res.error)
      } else {
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
      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Mensalidade do próximo mês gerada com sucesso!')
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
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[4px] text-sm font-medium">
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
        <div
          className="md:col-span-2 rounded-[4px] p-6 space-y-6"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Contrato Fixo
              </span>
              <h2
                className="text-xl font-bold mt-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Toda {DAYS_OF_WEEK[contract.day_of_week]} no {contract.field?.name}
              </h2>
            </div>
            {isActive ? (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[10px] font-bold tracking-wider uppercase"
                style={{
                  background: 'var(--brand-subtle)',
                  color: 'var(--brand)',
                  border: '1px solid var(--brand-ring)',
                }}
              >
                <CheckCircle className="w-3 h-3 text-[var(--brand)]" />
                Vigente
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[10px] font-bold tracking-wider uppercase"
                style={{
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <Ban className="w-3 h-3" />
                Encerrado
              </span>
            )}
          </div>

          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-sm"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div>
              <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Horário
              </p>
              <p
                className="font-medium mt-1 flex items-center gap-1.5 font-mono"
                style={{ color: 'var(--text-primary)' }}
              >
                <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                {contract.start_time.substring(0, 5)} - {contract.end_time.substring(0, 5)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Mensalidade
              </p>
              <p
                className="font-bold mt-1 flex items-center gap-1 font-mono"
                style={{ color: 'var(--brand)' }}
              >
                <DollarSign className="w-4 h-4" />
                {formattedMonthly}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Vigência
              </p>
              <p
                className="font-medium mt-1 flex items-center gap-1.5 font-mono"
                style={{ color: 'var(--text-primary)' }}
              >
                <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                Desde {new Date(contract.starts_at + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Encerramento */}
          {isActive && (
            <div className="pt-6 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                id="btn-encerrar-contrato"
                onClick={handleDeactivate}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-transparent text-red-500 text-xs font-bold rounded-[2px] transition-all cursor-pointer"
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
        <div
          className="rounded-[4px] p-6 space-y-4"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <User className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Cliente Mensalista
            </h3>
          </div>
          <div className="space-y-3 pt-2">
            <div>
              <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Nome
              </p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {contract.customer?.name}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Telefone
              </p>
              <p className="text-sm font-medium font-mono" style={{ color: 'var(--text-secondary)' }}>
                {contract.customer?.phone}
              </p>
            </div>
            {contract.customer?.email && (
              <div>
                <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                  E-mail
                </p>
                <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                  {contract.customer?.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Histórico de Mensalidades */}
      <div
        className="rounded-[4px] p-6 space-y-6"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3
              className="text-xl font-black uppercase tracking-wider leading-none"
              style={{
                fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                color: 'var(--text-primary)',
              }}
            >
              Controle de Mensalidades
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Histórico de faturamento e pagamentos do mensalista
            </p>
          </div>
          {isActive && (
            <button
              type="button"
              id="btn-gerar-proxima-mensalidade"
              onClick={handleGenerateNextMonth}
              disabled={isPending}
              className="btn-admin-primary px-4 py-2 text-xs font-bold rounded-[2px]"
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
            <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhuma mensalidade gerada.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <th className="pb-3">Mês de Referência</th>
                      <th className="pb-3">Valor</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Pagamento / Método</th>
                      <th className="pb-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {payments.map((p) => {
                      const amtFormatted = new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(p.amount)

                      const selectedMethod = selectedMethods[p.id] || 'PIX'

                      return (
                        <tr
                          key={p.id}
                          className="transition-colors hover:bg-[var(--bg-subtle)]"
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          <td className="py-4 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {formatReferenceMonth(p.reference_month)}
                          </td>
                          <td className="py-4 font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                            {amtFormatted}
                          </td>
                          <td className="py-4">
                            {p.status === 'paid' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[10px] font-bold tracking-wider uppercase"
                                style={{
                                  background: 'var(--brand-subtle)',
                                  color: 'var(--brand)',
                                  border: '1px solid var(--brand-ring)',
                                }}
                              >
                                Pago
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[10px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                Pendente
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-xs">
                            {p.status === 'paid' ? (
                              <div className="space-y-0.5">
                                <div
                                  className="font-semibold flex items-center gap-1"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  <CreditCard className="w-3.5 h-3.5 text-[var(--brand)]" />
                                  {p.payment_method}
                                </div>
                                {p.paid_at && (
                                  <div className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                    {new Date(p.paid_at).toLocaleString('pt-BR')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            {p.status === 'pending' && (
                              <div className="inline-flex items-center gap-2">
                                <label htmlFor={`method-select-${p.id}`} className="sr-only">
                                  Método de Pagamento
                                </label>
                                <select
                                  id={`method-select-${p.id}`}
                                  value={selectedMethod}
                                  onChange={(e) =>
                                    setSelectedMethods((prev) => ({
                                      ...prev,
                                      [p.id]: e.target.value,
                                    }))
                                  }
                                  className="px-2.5 py-1 rounded-[2px] text-xs font-semibold focus:outline-none"
                                  style={{
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                  }}
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
                                  className="btn-admin-primary px-3 py-1 text-xs font-bold rounded-[2px] cursor-pointer"
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
              <div
                className="md:hidden divide-y rounded-[4px] overflow-hidden"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card-alt)',
                  borderColor: 'var(--border)',
                }}
              >
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
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {formatReferenceMonth(p.reference_month)}
                        </span>
                        {p.status === 'paid' ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase"
                            style={{
                              background: 'var(--brand-subtle)',
                              color: 'var(--brand)',
                              border: '1px solid var(--brand-ring)',
                            }}
                          >
                            Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Pendente
                          </span>
                        )}
                      </div>

                      {/* Value + Payment details */}
                      <div
                        className="flex items-center justify-between text-xs p-2.5 rounded-[2px]"
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div>
                          <span className="block" style={{ color: 'var(--text-muted)' }}>
                            Valor
                          </span>
                          <span className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                            {amtFormatted}
                          </span>
                        </div>
                        {p.status === 'paid' && (
                          <div className="text-right">
                            <span className="block" style={{ color: 'var(--text-muted)' }}>
                              Método / Data
                            </span>
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {p.payment_method}
                            </span>
                            {p.paid_at && (
                              <span className="font-mono block text-[9px]" style={{ color: 'var(--text-muted)' }}>
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
                            <label htmlFor={`mobile-method-select-${p.id}`} className="sr-only">
                              Método
                            </label>
                            <select
                              id={`mobile-method-select-${p.id}`}
                              value={selectedMethod}
                              onChange={(e) =>
                                setSelectedMethods((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              className="w-full px-2 py-1.5 rounded-[2px] text-xs font-semibold focus:outline-none"
                              style={{
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                              }}
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
                            className="btn-admin-primary px-4 py-1.5 text-xs font-bold rounded-[2px] cursor-pointer flex-1 text-center justify-center"
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
