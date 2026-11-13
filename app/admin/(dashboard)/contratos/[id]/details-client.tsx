'use client'

import { useState, useTransition } from 'react'
import {
  deactivateContractAction,
  markPaymentPaidAction,
  generateNextMonthPaymentAction,
  updateContractOrganizersAction,
} from '../actions'
import {
  User,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Ban,
  CheckCircle,
  Loader2,
  FileText,
  CreditCard,
  Edit2,
  Phone,
  MessageCircle,
  QrCode,
  ExternalLink,
  Link2,
  Copy,
  Check,
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
  secondary_organizer_name?: string | null
  secondary_organizer_phone?: string | null
  is_active: boolean
  customer: Customer | null
  field: Field | null
  schedules?: Array<{
    field_id: string
    day_of_week: number
    start_time: string
    end_time: string
    duration_minutes: number
    field_name?: string
  }>
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

  // Estados dos Organizadores
  const [primaryName, setPrimaryName] = useState(contract.customer?.name || '')
  const [primaryPhone, setPrimaryPhone] = useState(contract.customer?.phone || '')
  const [primaryEmail, setPrimaryEmail] = useState(contract.customer?.email || '')
  const [secondaryName, setSecondaryName] = useState(contract.secondary_organizer_name || '')
  const [secondaryPhone, setSecondaryPhone] = useState(contract.secondary_organizer_phone || '')
  const [isEditingOrganizers, setIsEditingOrganizers] = useState(false)
  const [isSavingOrganizers, setIsSavingOrganizers] = useState(false)
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null)

  const handleCopyPaymentLink = async (paymentId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://academiadogol.vercel.app'
    const url = `${origin}/mensalidade/${paymentId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedPaymentId(paymentId)
      setTimeout(() => setCopiedPaymentId(null), 2500)
    } catch (err) {
      console.error(err)
    }
  }

  // Salvar organizadores
  const handleSaveOrganizers = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingOrganizers(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await updateContractOrganizersAction(contract.id, {
        customer_name: primaryName,
        customer_phone: primaryPhone,
        customer_email: primaryEmail,
        secondary_name: secondaryName,
        secondary_phone: secondaryPhone,
      })
      if (res?.error) {
        setErrorMsg('Erro ao salvar organizadores: ' + res.error)
      } else {
        setSuccessMsg('Organizadores atualizados com sucesso!')
        setIsEditingOrganizers(false)
      }
    } catch (err: any) {
      setErrorMsg('Erro: ' + (err.message || 'Falha ao salvar'))
    } finally {
      setIsSavingOrganizers(false)
    }
  }

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
                {contract.schedules && contract.schedules.length > 1
                  ? `Contrato com ${contract.schedules.length} Peladas Semanais`
                  : `Toda ${DAYS_OF_WEEK[contract.day_of_week]} no ${contract.field?.name}`}
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
                {contract.schedules && contract.schedules.length > 1 ? 'Total de Peladas' : 'Horário'}
              </p>
              <p
                className="font-medium mt-1 flex items-center gap-1.5 font-mono"
                style={{ color: 'var(--text-primary)' }}
              >
                <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                {contract.schedules && contract.schedules.length > 1
                  ? `${contract.schedules.length} dias por semana`
                  : `${contract.start_time.substring(0, 5)} - ${contract.end_time.substring(0, 5)}`}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Mensalidade Total
              </p>
              <p
                className="font-bold mt-1 flex items-center gap-1 font-mono"
                style={{ color: contract.monthly_amount === 0 ? '#c084fc' : 'var(--brand)' }}
              >
                {contract.monthly_amount === 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[2px] bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
                    🎁 Contrato Cortesia (R$ 0,00)
                  </span>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    {formattedMonthly}
                  </>
                )}
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

          {/* Grid com todas as peladas e dias deste contrato */}
          {contract.schedules && contract.schedules.length > 0 && (
            <div className="pt-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand)]">
                  ⚽ Dias e Horários das Peladas no Contrato ({contract.schedules.length} {contract.schedules.length === 1 ? 'dia' : 'dias'}/semana)
                </p>
                {contract.schedules.length > 1 && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-[2px] bg-[var(--brand)] text-white shadow-2xs">
                    Contrato Unificado
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contract.schedules.map((slot, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-[4px] border space-y-1.5 shadow-2xs"
                    style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]">
                        Pelada {i + 1}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {slot.field_name || contract.field?.name}
                      </span>
                    </div>
                    <div className="text-sm font-bold uppercase tracking-wide text-[var(--text-primary)]">
                      {DAYS_OF_WEEK[slot.day_of_week]}
                    </div>
                    <div className="text-xs font-mono flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <Clock className="w-3.5 h-3.5 text-[var(--brand)]" />
                      {slot.start_time.substring(0, 5)} às {slot.end_time.substring(0, 5)} ({slot.duration_minutes} min)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

        {/* Card Organizadores */}
        <div
          className="rounded-[4px] p-6 space-y-4"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2" style={{ color: 'var(--brand)' }}>
              <Users className="w-4 h-4 text-[var(--brand)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Organizadores da Turma
              </h3>
            </div>
            {!isEditingOrganizers && (
              <button
                type="button"
                onClick={() => setIsEditingOrganizers(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--brand)] hover:underline cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                Editar
              </button>
            )}
          </div>

          {isEditingOrganizers ? (
            <form onSubmit={handleSaveOrganizers} className="space-y-4 text-xs">
              <div className="space-y-2">
                <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--brand)' }}>
                  1º Organizador (Titular)
                </p>
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={primaryName}
                    onChange={(e) => setPrimaryName(e.target.value)}
                    className="input-admin py-1.5 text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                    className="input-admin py-1.5 text-xs font-mono w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    className="input-admin py-1.5 text-xs w-full"
                  />
                </div>
              </div>

              <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
                <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--brand)' }}>
                  2º Organizador (Co-responsável)
                </p>
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Nome do 2º Organizador
                  </label>
                  <input
                    type="text"
                    value={secondaryName}
                    onChange={(e) => setSecondaryName(e.target.value)}
                    placeholder="Ex: Pedro Henrique"
                    className="input-admin py-1.5 text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Telefone / WhatsApp (2º Org)
                  </label>
                  <input
                    type="text"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    placeholder="Ex: 81 9 8888-8888"
                    className="input-admin py-1.5 text-xs font-mono w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingOrganizers}
                  className="btn-admin-primary py-1.5 px-3 text-xs font-bold rounded-[2px] flex items-center gap-1"
                >
                  {isSavingOrganizers ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrimaryName(contract.customer?.name || '')
                    setPrimaryPhone(contract.customer?.phone || '')
                    setPrimaryEmail(contract.customer?.email || '')
                    setSecondaryName(contract.secondary_organizer_name || '')
                    setSecondaryPhone(contract.secondary_organizer_phone || '')
                    setIsEditingOrganizers(false)
                  }}
                  className="btn-admin-secondary py-1.5 px-3 text-xs font-bold rounded-[2px]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 pt-1">
              {/* 1º Organizador */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--brand)]">
                    1º Organizador (Titular)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]">
                    Principal
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {primaryName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {primaryPhone}
                    </span>
                    {primaryPhone && (
                      <a
                        href={`https://wa.me/55${primaryPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline"
                        title="Conversar no WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
                {primaryEmail && (
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {primaryEmail}
                  </p>
                )}
              </div>

              {/* Divisor */}
              <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                    2º Organizador (Co-responsável)
                  </span>
                  {secondaryName && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-[var(--bg-subtle)] border text-[var(--text-secondary)]">
                      Reserva
                    </span>
                  )}
                </div>

                {secondaryName ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {secondaryName}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {secondaryPhone || 'Sem telefone cadastrado'}
                      </span>
                      {secondaryPhone && (
                        <a
                          href={`https://wa.me/55${secondaryPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline"
                          title="Conversar no WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs py-1" style={{ color: 'var(--text-muted)' }}>
                    <span>Nenhum 2º organizador cadastrado.</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingOrganizers(true)}
                      className="block text-[11px] font-bold text-[var(--brand)] hover:underline mt-1 cursor-pointer"
                    >
                      + Adicionar 2º Organizador
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
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
                              p.payment_method === 'Cortesia' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[10px] font-bold tracking-wider uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                  🎁 Cortesia
                                </span>
                              ) : (
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
                              )
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
                                {/* Cobrar no WhatsApp */}
                                <a
                                  href={`https://wa.me/55${(primaryPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                    `Olá ${primaryName || 'Amigo'}! Segue o link para pagamento da mensalidade de ${formatReferenceMonth(p.reference_month)} do racha no ${contract.field?.name || 'campo'} (Academia do Gol):\n\n💰 Valor: ${amtFormatted}\n🔗 Pague via PIX com baixa automática no link:\n${typeof window !== 'undefined' ? window.location.origin : 'https://academiadogol.vercel.app'}/mensalidade/${p.id}`
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-[2px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
                                  title="Enviar cobrança PIX no WhatsApp do titular"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  Cobrar no Zap
                                </a>

                                {/* Copiar Link */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyPaymentLink(p.id)}
                                  className="btn-admin-secondary px-2.5 py-1 text-xs font-bold rounded-[2px] inline-flex items-center gap-1"
                                  title="Copiar Link de Pagamento da Mensalidade"
                                >
                                  {copiedPaymentId === p.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      Copiado!
                                    </>
                                  ) : (
                                    <>
                                      <Link2 className="w-3.5 h-3.5" />
                                      Copiar Link
                                    </>
                                  )}
                                </button>

                                {/* Ver página do PIX */}
                                <a
                                  href={`/mensalidade/${p.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 rounded-[2px] border text-[var(--text-muted)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-colors"
                                  title="Abrir Tela de Pagamento PIX"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>

                                {/* Baixa manual */}
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
                                  className="px-2 py-1 rounded-[2px] text-xs font-semibold focus:outline-none"
                                  style={{
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  <option value="PIX">PIX</option>
                                  <option value="Dinheiro">Dinheiro</option>
                                  <option value="Cartão">Cartão</option>
                                  <option value="Cortesia">🎁 Cortesia (Isenção)</option>
                                </select>
                                <button
                                  type="button"
                                  id={`btn-receber-${p.id}`}
                                  onClick={() => handleMarkPaid(p.id)}
                                  disabled={isPending}
                                  className="btn-admin-primary px-3 py-1 text-xs font-bold rounded-[2px] cursor-pointer"
                                >
                                  Baixa
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
                          p.payment_method === 'Cortesia' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-wider uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30">
                              🎁 Cortesia
                            </span>
                          ) : (
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
                          )
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
                        <div className="space-y-2 pt-1">
                          {/* Botões de Ação Online */}
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://wa.me/55${(primaryPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Olá ${primaryName || 'Amigo'}! Segue o link para pagamento da mensalidade de ${formatReferenceMonth(p.reference_month)} do racha no ${contract.field?.name || 'campo'} (Academia do Gol):\n\n💰 Valor: ${amtFormatted}\n🔗 Pague via PIX com baixa automática no link:\n${typeof window !== 'undefined' ? window.location.origin : 'https://academiadogol.vercel.app'}/mensalidade/${p.id}`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[2px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Cobrar no Zap
                            </a>

                            <button
                              type="button"
                              onClick={() => handleCopyPaymentLink(p.id)}
                              className="btn-admin-secondary px-3 py-1.5 text-xs font-bold rounded-[2px] inline-flex items-center gap-1"
                            >
                              {copiedPaymentId === p.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Link2 className="w-3.5 h-3.5" />
                              )}
                              {copiedPaymentId === p.id ? 'Copiado!' : 'Link'}
                            </button>

                            <a
                              href={`/mensalidade/${p.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-[2px] border text-[var(--text-muted)] hover:text-[var(--brand)]"
                              title="Ver Tela de Pagamento"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>

                          {/* Baixa Manual */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex-1">
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
                                <option value="Cortesia">🎁 Cortesia (Isenção)</option>
                              </select>
                            </div>
                            <button
                              type="button"
                              id={`btn-mobile-receber-${p.id}`}
                              onClick={() => handleMarkPaid(p.id)}
                              disabled={isPending}
                              className="btn-admin-primary px-4 py-1.5 text-xs font-bold rounded-[2px] cursor-pointer text-center justify-center"
                            >
                              Baixa Manual
                            </button>
                          </div>
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
