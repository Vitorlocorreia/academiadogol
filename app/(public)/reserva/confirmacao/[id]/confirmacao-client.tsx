'use client'

import { useState } from 'react'
import { Calendar, CheckCircle2, Clock, Landmark, MapPin, Receipt, Share2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  booking: any
}

export function ConfirmationClient({ booking }: Props) {
  const router = useRouter()
  const [copiedLink, setCopiedLink] = useState(false)

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

  const shareText = `Fala galera! Horário reservado na Academia do Gol. Campo: ${booking.field?.name} | Data: ${dateDisplay} às ${booking.start_time.substring(0, 5)} - bora bater esse futebol!`
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Reserva Academia do Gol',
          text: shareText,
          url: window.location.origin + `/reserva/confirmacao/${booking.id}`,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.origin + `/reserva/confirmacao/${booking.id}`)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      } catch (err) {
        console.error('Failed to copy', err)
      }
    }
  }

  // Gera o link do WhatsApp para suporte ou contato com a quadra
  const formattedPhone = booking.field?.business_phone || '5511999999999' // mock de telefone de contato
  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Olá! Acabei de fazer uma reserva de teste (ID: ${booking.id}) para o dia ${booking.date} no horário ${booking.start_time}.`
  )}`

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
            Ficha de Reserva & Estatísticas
          </h2>
        </div>

        <div className="space-y-3 text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-secondary)' }}>
          {/* Informações Básicas */}
          <div className="flex justify-between pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <span>Arena / Campo</span>
            <span style={{ color: 'var(--text-primary)' }}>{booking.field?.name}</span>
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

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:opacity-90 cursor-pointer text-center"
          style={{
            border: '1px solid var(--border)',
            borderRadius: '2px',
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          Precisa de Ajuda? Falar Conosco
        </a>
      </div>

      {/* Voltar */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => router.push('/campos')}
          className="text-xs uppercase font-bold tracking-widest transition-all flex items-center gap-1.5 hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Voltar para a listagem
        </button>
      </div>
    </div>
  )
}
