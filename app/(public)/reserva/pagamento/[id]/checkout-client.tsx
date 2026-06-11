'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { confirmSimulatedPixPayment } from '@/app/(public)/actions'

interface Props {
  booking: any // booking com relations
}

export function PixCheckoutClient({ booking }: Props) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isConfirmed = booking.status === 'confirmed' || booking.status === 'completed'
  const isPaid = booking.deposit_status === 'paid'

  const dateDisplay = new Date(booking.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  // Horário fim
  const [hh, mm] = booking.start_time.split(':').map(Number)
  const endMin = hh * 60 + mm + booking.duration_minutes
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

  const pixKey = `00020101021226830014br.gov.bcb.pix2561pix.academiadogol.com.br/qr/${booking.id}5204000053039865405${booking.deposit_amount.toFixed(2)}5802BR5916Academia do Gol6009Sao Paulo62070503***6304`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleSimulatePayment = () => {
    setError(null)
    startTransition(async () => {
      const res = await confirmSimulatedPixPayment(booking.id)
      if (res.error) {
        setError(res.error)
      } else {
        router.push(`/reserva/confirmacao/${booking.id}`)
      }
    })
  }
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Etapas */}
      <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest px-2" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>1. Escolher</span>
        <span>→</span>
        <span style={{ color: 'var(--text-secondary)' }}>2. Identificar</span>
        <span>→</span>
        <span style={{ color: isConfirmed ? 'var(--text-secondary)' : 'var(--brand)' }}>3. Pagar Sinal</span>
        <span>→</span>
        <span style={{ color: isConfirmed ? 'var(--brand)' : 'var(--text-muted)' }}>4. Confirmado</span>
      </div>

      {isConfirmed && isPaid ? (
        /* SUCESSO: PAGAMENTO CONFIRMADO */
        <div
          className="p-8 text-center space-y-6 shadow-xl"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
          }}
        >
          <div
            className="mx-auto w-16 h-16 flex items-center justify-center text-2xl animate-bounce"
            style={{
              background: 'var(--brand-subtle)',
              border: '2px solid var(--brand)',
              color: 'var(--brand)',
              borderRadius: '50%',
            }}
          >
            ✓
          </div>
          
          <div className="space-y-2">
            <h2
              className="uppercase tracking-wider"
              style={{
                fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
                fontSize: '2rem',
                color: 'var(--text-primary)',
              }}
            >
              Reserva Confirmada!
            </h2>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Seu pagamento foi compensado. Horário garantido para a partida.
            </p>
          </div>

          {/* Recibo em formato de Ficha de Estatística Esportiva */}
          <div className="space-y-2.5 text-xs uppercase tracking-wider font-bold py-5 max-w-md mx-auto" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>Partida / Campo</span>
              <span style={{ color: 'var(--text-primary)' }}>{booking.field?.name}</span>
            </div>
            <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>Data da Partida</span>
              <span style={{ color: 'var(--text-primary)' }}>{dateDisplay}</span>
            </div>
            <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>Cronograma / Hora</span>
              <span style={{ color: 'var(--text-primary)' }}>{booking.start_time.substring(0, 5)} - {endTime}</span>
            </div>
            <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>Atleta Responsável</span>
              <span style={{ color: 'var(--text-primary)' }}>{booking.customer?.name}</span>
            </div>
            <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>Custo Total</span>
              <span style={{ color: 'var(--text-primary)' }}>R$ {booking.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span>Sinal PIX Compensado</span>
              <span style={{ color: 'var(--brand)' }}>R$ {booking.deposit_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-black" style={{ color: 'var(--text-primary)' }}>
              <span>Restante no Caixa</span>
              <span>R$ {booking.remaining_amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Confirmamos os dados no e-mail: <strong style={{ color: 'var(--text-primary)' }}>{booking.customer?.email || 'cadastrado'}</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/campos"
                className="px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:opacity-90"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '2px',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                Voltar aos Campos
              </a>
              <a
                href="/reserva/consultar"
                className="px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:opacity-90"
                style={{
                  background: 'var(--brand)',
                  color: 'white',
                  borderRadius: '2px',
                }}
              >
                Minhas Reservas
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* checkout PIX pendente */
        <div
          className="p-6 sm:p-8 space-y-6 shadow-xl"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
          }}
        >
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2
                className="uppercase tracking-wider font-bold leading-none"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '1.5rem',
                  color: 'var(--text-primary)',
                }}
              >
                Pagamento do Sinal
              </h2>
              <p className="text-[10px] uppercase font-semibold tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Pague via PIX para garantir a reserva</p>
            </div>
            <span
              className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest animate-pulse"
              style={{
                background: 'rgba(217,119,6,0.08)',
                color: '#d97706',
                border: '1px solid rgba(217,119,6,0.2)',
                borderRadius: '2px',
              }}
            >
              Aguardando PIX
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* QR Code */}
            <div
              className="flex flex-col items-center space-y-3 p-6"
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
            >
              {/* Dummy QR Code representation using pure SVG for crisp high-end design */}
              <svg className="w-40 h-40" viewBox="0 0 100 100" fill="currentColor" style={{ color: 'var(--text-primary)' }}>
                <rect width="100" height="100" fill="transparent" />
                {/* Outer corners */}
                <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="10" y="10" width="15" height="15" />
                
                <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="75" y="10" width="15" height="15" />
 
                <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="10" y="75" width="15" height="15" />
                
                {/* Random blocks for realism */}
                <rect x="40" y="10" width="10" height="5" />
                <rect x="55" y="15" width="5" height="15" />
                <rect x="40" y="25" width="15" height="5" />
                <rect x="45" y="40" width="20" height="10" />
                <rect x="15" y="45" width="10" height="5" />
                <rect x="70" y="45" width="10" height="15" />
                <rect x="80" y="75" width="15" height="10" />
                <rect x="40" y="65" width="5" height="20" />
                <rect x="55" y="70" width="15" height="5" />
                <rect x="45" y="80" width="15" height="10" />
                <rect x="15" y="60" width="5" height="5" />
                
                {/* Center logo icon (soccer ball) */}
                <circle cx="50" cy="50" r="10" fill="var(--brand)" />
                <circle cx="50" cy="50" r="8" fill="var(--bg-card)" />
                <circle cx="50" cy="50" r="3" fill="var(--brand)" />
              </svg>
              
              <span className="text-[9px] uppercase font-bold tracking-widest text-center" style={{ color: 'var(--text-muted)' }}>
                Aponte a câmera do seu celular
              </span>
            </div>
 
            {/* Informações e Copiar Código */}
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Valor do Sinal</span>
                <div
                  className="font-black leading-none"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '2.5rem',
                    color: 'var(--brand)',
                  }}
                >
                  R$ {booking.deposit_amount.toFixed(2)}
                </div>
                <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Restante no balcão: R$ {booking.remaining_amount.toFixed(2)}
                </p>
              </div>
 
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-secondary)' }}>PIX Copia e Cola</span>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-between px-3.5 py-3 hover:opacity-95 text-xs font-mono transition-all text-left group"
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: '2px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span className="truncate mr-4">{pixKey}</span>
                  <span className="shrink-0 text-[10px] uppercase font-bold tracking-wider text-white px-2 py-1 transition-all" style={{ background: 'var(--brand)', borderRadius: '2px' }}>
                    {copied ? 'Copiado!' : 'Copiar'}
                  </span>
                </button>
              </div>
 
              <div className="text-[10px] uppercase font-bold tracking-wider space-y-1" style={{ color: 'var(--text-muted)' }}>
                <p>• O PIX expira em 15 minutos.</p>
                <p>• Sem confirmação, a reserva é cancelada.</p>
              </div>
            </div>
          </div>
 
          {/* SIMULADOR DE PAGAMENTO */}
          <div className="pt-6 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div
              className="p-5 space-y-3"
              style={{
                background: 'var(--bg-card-alt)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
            >
              <span
                className="font-bold uppercase tracking-wider text-xs"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '1.1rem',
                  color: 'var(--text-primary)',
                }}
              >
                Área de Teste / Simulador de PIX
              </span>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Clique no botão abaixo para simular a liquidação imediata da reserva pelo banco.
              </p>
              
              {error && (
                <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-2.5 rounded font-bold uppercase tracking-wider" style={{ borderRadius: '2px' }}>
                  {error}
                </div>
              )}
 
              <button
                onClick={handleSimulatePayment}
                disabled={isPending}
                id="btn-simular-pix"
                className="w-full py-3.5 text-white font-bold text-xs uppercase tracking-widest border transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-50"
                style={{
                  background: 'var(--brand)',
                  borderColor: 'var(--brand)',
                  borderRadius: '2px',
                  letterSpacing: '0.15em',
                }}
              >
                {isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                    Simulando...
                  </>
                ) : (
                  'Confirmar Pagamento do Sinal ✓'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
