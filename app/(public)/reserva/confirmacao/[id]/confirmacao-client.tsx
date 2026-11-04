'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle2, Clock, Landmark, MapPin, Receipt, Share2, User, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  booking: any
  businessPhone?: string
}

export function ConfirmationClient({ booking, businessPhone }: Props) {
  const router = useRouter()
  const [copiedLink, setCopiedLink] = useState(false)
  const [countdown, setCountdown] = useState<number>(3)

  const dateDisplay = new Date(booking.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Calcula horário de fim
  const [hh, mm] = booking.start_time.split(':').map(Number)
  const endMin = hh * 60 + mm + booking.duration_minutes
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

  const total = Number(booking.total_amount)
  const deposit = Number(booking.deposit_amount)
  const remaining = Number(booking.remaining_amount)

  const isFesta = booking.booking_type === 'festa' || booking.duration_minutes >= 180
  const tipoLabel = isFesta ? '🎂 Festa de Aniversário / Evento' : '⚽ Aluguel de Quadra (Jogo)'

  // Telefone oficial da Academia do Gol
  const rawPhone = (businessPhone || booking.field?.business_phone || '81999096142').replace(/\D/g, '')
  const formattedPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`

  // Link do comprovante oficial para compartilhar
  const comprovanteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/reserva/confirmacao/${booking.id}`
    : `https://academiadogol.vercel.app/reserva/confirmacao/${booking.id}`

  // Mensagem pronta e detalhada para o WhatsApp da Academia
  const waMessage = `Olá! Acabei de reservar o campo *${booking.field?.name || 'Academia do Gol'}* pelo site! ⚽🏟️\n\n📋 *Comprovante de Reserva:*\n• *Titular:* ${booking.customer?.name || 'Cliente'}\n• *Data:* ${dateDisplay}\n• *Horário:* ${booking.start_time.substring(0, 5)} às ${endTime} (${booking.duration_minutes} min)\n• *Tipo:* ${tipoLabel}\n• *Sinal PIX Pago:* R$ ${deposit.toFixed(2).replace('.', ',')}\n• *Saldo Restante na Arena:* R$ ${remaining.toFixed(2).replace('.', ',')}\n\n📄 *Link do Comprovante Oficial:*\n${comprovanteUrl}\n\nObrigado e até o jogo!`

  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMessage)}`

  // Redirecionamento automático com fallback
  useEffect(() => {
    // Se já tentou redirecionar nesta sessão, não repete em loop
    const storageKey = `wa_auto_redirect_${booking.id}`
    if (sessionStorage.getItem(storageKey)) {
      setCountdown(0)
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          sessionStorage.setItem(storageKey, 'true')
          // Tenta abrir o WhatsApp automaticamente
          window.location.href = waUrl
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [booking.id, waUrl])

  const shareText = `Fala galera! Horário reservado na Academia do Gol. Campo: ${booking.field?.name} | Data: ${dateDisplay} às ${booking.start_time.substring(0, 5)} - bora bater esse futebol!`
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Reserva Academia do Gol',
          text: shareText,
          url: comprovanteUrl,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(comprovanteUrl)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      } catch (err) {
        console.error('Failed to copy', err)
      }
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Visual Header */}
      <div className="text-center space-y-4">
        <div className="relative inline-flex items-center justify-center">
          <div
            className="w-16 h-16 flex items-center justify-center text-2xl"
            style={{
              background: 'var(--brand-subtle)',
              border: '2px solid var(--brand)',
              color: 'var(--brand)',
              borderRadius: '50%',
            }}
          >
            ✓
          </div>
        </div>

        <div className="space-y-1">
          <span
            className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest"
            style={{
              background: 'var(--brand-subtle)',
              color: 'var(--brand)',
              border: '1px solid var(--brand-ring)',
              borderRadius: '2px',
            }}
          >
            Pagamento Confirmado
          </span>
          <h1
            className="uppercase leading-none pt-2"
            style={{
              fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
              fontSize: '2.5rem',
              color: 'var(--text-primary)',
              letterSpacing: '0.02em',
            }}
          >
            Reserva Garantida!
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Obrigado, <strong style={{ color: 'var(--text-primary)' }}>{booking.customer?.name}</strong>. Seu sinal foi registrado e o horário está reservado para a sua partida.
          </p>
        </div>
      </div>

      {/* CARD DE NOTIFICAÇÃO WHATSAPP (AUTOMÁTICO + BOTÃO DE FALLBACK) */}
      <div className="p-5 sm:p-6 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/50 via-zinc-900 to-zinc-950 space-y-4 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-xl">
            💬
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                <span>Avisar Academia do Gol no WhatsApp</span>
              </h3>
              {countdown > 0 && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                  Abrindo em {countdown}s...
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {countdown > 0
                ? 'Seu comprovante foi gerado! Estamos abrindo o WhatsApp da Academia do Gol automaticamente...'
                : 'Se o WhatsApp não abriu sozinho no seu celular, clique no botão abaixo para avisar a recepção sobre sua reserva.'}
            </p>
          </div>
        </div>

        {/* Botão de WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-lg shadow-emerald-950/50 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Abrir WhatsApp & Enviar Comprovante</span>
        </a>
      </div>

      {/* Recibo Premium - Estilo Ficha de Jogo/Estatística Esportiva */}
      <div
        className="p-6 sm:p-8 space-y-6 shadow-xl"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
        }}
      >
        <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
          <Receipt className="w-5 h-5" style={{ color: 'var(--brand)' }} />
          <h2
            className="uppercase tracking-wider font-bold"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.25rem',
              color: 'var(--text-primary)',
            }}
          >
            Ficha de Reserva & Detalhes
          </h2>
        </div>

        <div className="space-y-3 text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-secondary)' }}>
          {/* Informações Básicas */}
          <div className="flex justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <span>Arena / Campo</span>
            <span style={{ color: 'var(--text-primary)' }}>{booking.field?.name}</span>
          </div>
          <div className="flex justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <span>Tipo de Reserva</span>
            <span style={{ color: isFesta ? '#c084fc' : 'var(--text-primary)' }}>{tipoLabel}</span>
          </div>
          <div className="flex justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <span>Data Selecionada</span>
            <span style={{ color: 'var(--text-primary)' }}>{dateDisplay}</span>
          </div>
          <div className="flex justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <span>Cronograma / Horário</span>
            <span style={{ color: 'var(--text-primary)' }}>{booking.start_time.substring(0, 5)} às {endTime}</span>
          </div>
          <div className="flex justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <span>Titular da Vaga</span>
            <span style={{ color: 'var(--text-primary)' }}>{booking.customer?.name}</span>
          </div>

          {/* Dados Financeiros */}
          <div className="pt-4 space-y-2">
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Financeiro / Custos
            </span>
            <div className="flex justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>Custo Total do Aluguel</span>
              <span style={{ color: 'var(--text-primary)' }}>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>Sinal Pago via PIX</span>
              <span style={{ color: 'var(--brand)' }}>R$ {deposit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 text-sm font-black" style={{ color: 'var(--text-primary)' }}>
              <span>Saldo a Pagar na Arena</span>
              <span>R$ {remaining.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Regras Importantes e Dicas */}
      <div
        className="p-5 space-y-3"
        style={{
          background: 'var(--bg-card-alt)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
        }}
      >
        <span
          className="text-[10px] uppercase font-black tracking-widest"
          style={{ color: 'var(--brand)' }}
        >
          Regulamento da Arena
        </span>
        <ul className="text-xs space-y-2 list-disc list-inside uppercase font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          <li>É proibido o uso de chuteiras de campo (cravos altos de alumínio). Utilize chuteiras society ou futsal.</li>
          <li>Os coletes para divisão de equipes são fornecidos gratuitamente pelo complexo.</li>
          <li>O restante do pagamento (R$ {remaining.toFixed(2)}) deverá ser pago no caixa em dinheiro, cartão ou PIX.</li>
          <li>Cancelamento e estorno do sinal: permitido somente com no mínimo 48h de antecedência ao horário do jogo.</li>
        </ul>
      </div>

      {/* Ações Rápidas */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:opacity-90 cursor-pointer"
          style={{
            border: '1px solid var(--border)',
            borderRadius: '2px',
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <Share2 className="w-4 h-4" />
          {copiedLink ? 'Link Copiado!' : 'Convidar Amigos'}
        </button>

        <button
          onClick={() => router.push('/campos')}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:opacity-90 cursor-pointer text-center"
          style={{
            border: '1px solid var(--border)',
            borderRadius: '2px',
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          Voltar para os Campos
        </button>
      </div>
    </div>
  )
}
