'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle,
  Copy,
  Check,
  Calendar,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  QrCode,
  Loader2,
  RefreshCw,
  MessageCircle,
} from 'lucide-react'
import { checkContractPaymentPublicAction } from '@/app/(public)/actions'

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

interface Props {
  payment: any
  pixData: {
    chargeId: string | null
    pixQrCode: string | null
    pixCopyPaste: string
    invoiceUrl?: string | null
    isReal: boolean
  }
}

export function MensalidadeClient({ payment, pixData }: Props) {
  const [isPaid, setIsPaid] = useState(payment.status === 'paid')
  const [paidAt, setPaidAt] = useState<string | null>(payment.paid_at)
  const [copied, setCopied] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [checkMessage, setCheckMessage] = useState('')

  const contract = payment.contract
  const customer = contract?.customer
  const field = contract?.field

  // Formata o mês de referência
  const refParts = payment.reference_month?.split('-') || ['2026', '11']
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  const monthLabel = `${monthNames[Number(refParts[1]) - 1]} de ${refParts[0]}`

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // Auto-polling: verifica a cada 3.5 segundos se o PIX foi pago
  useEffect(() => {
    if (isPaid) return

    const interval = setInterval(async () => {
      try {
        const res = await checkContractPaymentPublicAction(payment.id)
        if (res.isPaid) {
          setIsPaid(true)
          setPaidAt(res.paidAt || new Date().toISOString())
          clearInterval(interval)
        }
      } catch (err) {
        // Silencioso em caso de instabilidade temporária
      }
    }, 3500)

    return () => clearInterval(interval)
  }, [payment.id, isPaid])

  // Verificação manual no botão
  const handleCheckNow = async () => {
    setIsChecking(true)
    setCheckMessage('')
    try {
      const res = await checkContractPaymentPublicAction(payment.id)
      if (res.isPaid) {
        setIsPaid(true)
        setPaidAt(res.paidAt || new Date().toISOString())
      } else {
        setCheckMessage('O pagamento ainda está pendente no sistema. Aguarde alguns instantes após transferir.')
      }
    } catch {
      setCheckMessage('Erro ao verificar status. Tente novamente em alguns segundos.')
    } finally {
      setIsChecking(false)
    }
  }

  // Copiar código PIX
  const handleCopyPix = async () => {
    if (!pixData.pixCopyPaste) return
    try {
      await navigator.clipboard.writeText(pixData.pixCopyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com Logo e Título */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[2px] bg-[var(--brand-subtle)] border border-[var(--brand-ring)] text-[var(--brand)] text-xs font-black uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          Ambiente Seguro de Pagamento
        </div>
        <h1
          className="text-3xl sm:text-4xl font-black uppercase tracking-wider leading-none"
          style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif", color: 'var(--text-primary)' }}
        >
          Mensalidade — {monthLabel}
        </h1>
        <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
          Academia do Gol • Futebol Society
        </p>
      </div>

      {/* Card de Informações do Contrato / Racha */}
      <div
        className="rounded-[4px] border p-5 sm:p-6 shadow-sm space-y-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Campo & Horário Fixo
            </span>
            <h2 className="text-lg font-black uppercase" style={{ color: 'var(--text-primary)' }}>
              {field?.name || 'Campo Society'}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[var(--brand)]" />
                Toda {DAYS_OF_WEEK[contract?.day_of_week ?? 0]}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-[var(--brand)]" />
                {contract?.start_time?.substring(0, 5)} às {contract?.end_time?.substring(0, 5)} ({contract?.duration_minutes} min)
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] block font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Valor da Mensalidade
            </span>
            <span className="text-2xl font-black font-mono text-[var(--brand)]">
              {fmtCurrency(payment.amount)}
            </span>
          </div>
        </div>

        {/* Organizadores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div>
            <span className="text-[10px] uppercase font-bold block" style={{ color: 'var(--text-muted)' }}>
              1º Organizador (Titular):
            </span>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {customer?.name || 'Mensalista'}
            </span>
            <span className="block font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
              {customer?.phone}
            </span>
          </div>

          {contract?.secondary_organizer_name && (
            <div>
              <span className="text-[10px] uppercase font-bold block" style={{ color: 'var(--text-muted)' }}>
                2º Organizador (Co-responsável):
              </span>
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {contract.secondary_organizer_name}
              </span>
              {contract.secondary_organizer_phone && (
                <span className="block font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {contract.secondary_organizer_phone}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SE ESTIVER PAGO */}
      {isPaid ? (
        <div
          className="rounded-[4px] border p-6 text-center space-y-4 shadow-sm"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--brand-ring)' }}
        >
          <div className="w-16 h-16 rounded-full bg-[var(--brand-subtle)] text-[var(--brand)] flex items-center justify-center mx-auto border border-[var(--brand-ring)]">
            <CheckCircle className="w-9 h-9 text-[var(--brand)]" />
          </div>

          <div className="space-y-1">
            <h3
              className="text-2xl font-black uppercase tracking-wider"
              style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif", color: 'var(--brand)' }}
            >
              Mensalidade Quitada com Sucesso!
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              O pagamento do racha referente a <strong>{monthLabel}</strong> foi confirmado no sistema.
            </p>
          </div>

          <div
            className="p-4 rounded-[4px] text-xs space-y-2 border max-w-md mx-auto text-left"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
          >
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span className="font-bold text-[var(--brand)]">CONFIRMADO E PAGO</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Método:</span>
              <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                {payment.payment_method || 'PIX'}
              </span>
            </div>
            {paidAt && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Data da Confirmação:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                  {new Date(paidAt).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>ID do Registro:</span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {payment.id.substring(0, 18)}...
              </span>
            </div>
          </div>

          <p className="text-xs italic pt-2" style={{ color: 'var(--text-muted)' }}>
            Obrigado por jogar na Academia do Gol! Os horários da sua turma seguem garantidos na grade semanal.
          </p>
        </div>
      ) : (
        /* SE ESTIVER PENDENTE */
        <div
          className="rounded-[4px] border p-6 space-y-6 shadow-sm"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-[2px] bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-black uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Aguardando Pagamento
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Pague via PIX com Confirmação Instantânea
            </h3>
            <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
              Abra o app do seu banco, escaneie o QR Code abaixo ou use a chave Copia e Cola para pagar sua mensalidade.
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-5 rounded-[4px] border max-w-xs mx-auto"
            style={{ background: '#ffffff', borderColor: 'var(--border)' }}
          >
            {pixData.pixQrCode ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pixData.pixQrCode}
                alt="QR Code PIX Mensalidade"
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center text-center p-4">
                <QrCode className="w-16 h-16 text-neutral-400 mb-2" />
                <p className="text-xs text-neutral-500 font-medium">
                  Utilize o código Copia e Cola abaixo para pagar no seu aplicativo bancário.
                </p>
              </div>
            )}
            <p className="text-[11px] font-black uppercase tracking-wider text-neutral-800 mt-2">
              Valor: {fmtCurrency(payment.amount)}
            </p>
          </div>

          {/* Copia e Cola */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Código PIX (Copia e Cola)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={pixData.pixCopyPaste}
                className="input-admin font-mono text-xs flex-1 select-all"
              />
              <button
                type="button"
                onClick={handleCopyPix}
                className="btn-admin-primary px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            {copied && (
              <p className="text-xs font-semibold text-[var(--brand)] animate-fade-in">
                ✓ Código PIX copiado para a área de transferência!
              </p>
            )}
          </div>

          {/* Botão de Verificação Manual */}
          <div className="pt-2 text-center space-y-3">
            <button
              type="button"
              onClick={handleCheckNow}
              disabled={isChecking}
              className="btn-admin-secondary text-xs uppercase tracking-wider font-bold py-2.5 px-4 rounded-[2px] inline-flex items-center gap-2"
            >
              {isChecking ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--brand)]" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isChecking ? 'Verificando...' : 'Já paguei, verificar agora'}
            </button>

            {checkMessage && (
              <p className="text-xs font-medium text-amber-600">
                {checkMessage}
              </p>
            )}

            <p className="text-[11px] flex items-center justify-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Verificação automática ativa: a tela atualizará assim que o PIX for compensado.
            </p>
          </div>

          {/* Instruções passo a passo */}
          <div
            className="p-4 rounded-[4px] border text-xs space-y-2"
            style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
          >
            <p className="font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Como pagar:
            </p>
            <ol className="list-decimal list-inside space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>Abra o aplicativo do seu banco no celular.</li>
              <li>Acesse a área <strong>PIX</strong> e escolha <strong>"PIX Copia e Cola"</strong> ou <strong>"Ler QR Code"</strong>.</li>
              <li>Cole o código copiado ou aponte a câmera para a tela.</li>
              <li>Confira o valor de <strong>{fmtCurrency(payment.amount)}</strong> e conclua a transferência.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
