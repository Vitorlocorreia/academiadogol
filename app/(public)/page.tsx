// Landing page — Academia do Gol Futebol Society

import Link from 'next/link'
import Image from 'next/image'
import { getActiveFields } from './actions'
import { CampoCard } from '@/components/public/campo-card'

const WHATSAPP_LINK = 'https://wa.me/5581999096142'
const INSTAGRAM_LINK = 'https://www.instagram.com/academia_do_gol/'
const PHONE_DISPLAY = '(81) 99909-6142'

export default async function HomePage() {
  const fields = await getActiveFields()

  return (
    <div style={{ background: 'var(--bg)' }}>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden flex items-center"
        style={{ height: 'calc(100svh - 64px)', minHeight: '500px' }}
      >
        {/* Imagem de fundo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.png"
            alt="Academia do Gol — campo de futebol"
            fill
            priority
            className="object-cover object-center"
            quality={90}
          />
          {/* Overlay gradiente direcional */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 55%, rgba(13,74,28,0.3) 100%)' }}
          />
        </div>

        {/* Linhas decorativas de campo (SVG) */}
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden opacity-[0.06]">
          <svg className="absolute right-0 top-0 h-full" viewBox="0 0 400 600" fill="none" stroke="white" strokeWidth="1">
            <circle cx="400" cy="300" r="180"/>
            <line x1="400" y1="0" x2="400" y2="600"/>
            <rect x="230" y="160" width="170" height="280"/>
            <rect x="300" y="220" width="100" height="160"/>
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full py-24">
          {/* Pré-título */}
          <div
            className="inline-flex items-center gap-2 mb-8 px-3 py-1"
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '2px',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#4ade80' }}
            />
            <span
              className="text-xs font-bold uppercase tracking-[0.15em]"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Reservas Online Abertas
            </span>
          </div>

          {/* Título principal */}
          <h1
            className="uppercase leading-none mb-6"
            style={{
              fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
              fontSize: 'clamp(56px, 9vw, 128px)',
              letterSpacing: '-0.01em',
              color: 'white',
            }}
          >
            Seu campo.
            <br />
            <span style={{ color: '#4ade80' }}>Sua hora.</span>
            <br />
            <span style={{ fontSize: '60%', color: 'rgba(255,255,255,0.6)' }}>
              Seu jogo.
            </span>
          </h1>

          <p
            className="max-w-lg text-base leading-relaxed mb-10"
            style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.7' }}
          >
            {fields.length} campos disponíveis no complexo Academia do Gol.
            Escolha seu campo, reserve o horário e pague o sinal via PIX — em menos de 2 minutos.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#campos"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-bold text-sm uppercase tracking-widest transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
              style={{
                background: 'var(--brand)',
                borderRadius: '2px',
                letterSpacing: '0.1em',
                boxShadow: '0 8px 32px rgba(26,107,46,0.4)',
              }}
            >
              ⚽ Ver Campos
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-sm uppercase tracking-widest transition-all duration-200 hover:bg-white/10"
              style={{
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '2px',
                letterSpacing: '0.1em',
              }}
            >
              Falar no WhatsApp
            </a>
          </div>

          {/* Stats */}
          <div
            className="flex gap-8 mt-16 pt-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
          >
            {[
              { value: `${fields.length}`, label: 'Campos' },
              { value: '100%', label: 'Online' },
              { value: 'PIX', label: 'Sinal' },
            ].map((stat) => (
              <div key={stat.label}>
                <p
                  className="font-black leading-none"
                  style={{
                    fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
                    fontSize: '2.5rem',
                    color: 'white',
                  }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs uppercase tracking-widest mt-1"
                  style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CAMPOS ───────────────────────────────────────────────── */}
      <section id="campos" style={{ background: 'var(--bg)', paddingTop: '96px', paddingBottom: '96px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">

          {/* Header da seção */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: 'var(--brand)', letterSpacing: '0.18em' }}
              >
                Nossos campos
              </p>
              <h2
                className="uppercase leading-none"
                style={{
                  fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
                  fontSize: 'clamp(40px, 6vw, 80px)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Escolha <span style={{ color: 'var(--brand)' }}>seu</span>
                <br />arena
              </h2>
            </div>
            <p
              className="text-sm max-w-xs leading-relaxed sm:text-right"
              style={{ color: 'var(--text-muted)' }}
            >
              Cada campo com sua localização específica em Recife. Clique para ver detalhes e disponibilidade.
            </p>
          </div>

          {/* Grid de campos */}
          {fields.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {fields.map((field, i) => (
                <CampoCard key={field.id} field={field} index={i} />
              ))}
            </div>
          ) : (
            <div
              className="text-center py-24"
              style={{ border: '1px dashed var(--border)', borderRadius: '4px' }}
            >
              <p className="text-4xl mb-4">⚽</p>
              <p style={{ color: 'var(--text-muted)' }}>Campos em breve disponíveis</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── COMO FUNCIONA ────────────────────────────────────────── */}
      <section style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)', padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="mb-12">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
              style={{ color: 'var(--brand)' }}
            >
              Simples assim
            </p>
            <h2
              className="uppercase leading-none"
              style={{
                fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
                fontSize: 'clamp(36px, 5vw, 64px)',
                color: 'var(--text-primary)',
              }}
            >
              3 passos para <span style={{ color: 'var(--brand)' }}>jogar</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
            {[
              {
                num: '01',
                icon: '🏟️',
                title: 'Escolha o campo',
                desc: 'Navegue pelos nossos campos e veja disponibilidade de horários em tempo real.',
              },
              {
                num: '02',
                icon: '📅',
                title: 'Reserve o horário',
                desc: 'Preencha seus dados e selecione o horário que preferir. Rápido e sem burocracia.',
              },
              {
                num: '03',
                icon: '⚡',
                title: 'Pague o sinal via PIX',
                desc: 'Confirme com o pagamento do sinal via PIX. Você recebe a confirmação no e-mail.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="p-8 flex flex-col"
                style={{ background: 'var(--bg-card)' }}
              >
                <p
                  className="font-black mb-6 leading-none"
                  style={{
                    fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
                    fontSize: '4rem',
                    color: 'var(--border)',
                  }}
                >
                  {step.num}
                </p>
                <p className="text-3xl mb-4">{step.icon}</p>
                <h3
                  className="font-black uppercase mb-2 text-lg"
                  style={{ color: 'var(--text-primary)', letterSpacing: '0.02em' }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/reserva/consultar"
              className="text-sm font-bold uppercase tracking-widest transition-colors hover:opacity-70"
              style={{ color: 'var(--brand)', letterSpacing: '0.1em' }}
            >
              Já tem reserva? Consulte aqui →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CONTATO / FOOTER STRIP ───────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'var(--brand-dark)', padding: '80px 0' }}
      >
        {/* Linhas decorativas */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1200 400" fill="none" stroke="white" strokeWidth="0.5">
            <circle cx="1100" cy="200" r="300"/>
            <circle cx="1100" cy="200" r="200"/>
            <line x1="800" y1="0" x2="800" y2="400"/>
            <rect x="800" y="80" width="200" height="240"/>
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] mb-4"
                style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.18em' }}
              >
                Fale conosco
              </p>
              <h2
                className="uppercase leading-none mb-6 text-white"
                style={{
                  fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
                  fontSize: 'clamp(40px, 6vw, 72px)',
                }}
              >
                Tem alguma<br />
                <span style={{ color: '#4ade80' }}>dúvida?</span>
              </h2>
              <p
                className="text-sm leading-relaxed max-w-sm"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                Nossa equipe está pronta para te ajudar com informações sobre campos, horários e reservas.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '4px',
                }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center shrink-0 text-2xl"
                  style={{ background: '#25D366', borderRadius: '4px' }}
                >
                  📱
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    WhatsApp
                  </p>
                  <p className="text-white font-bold text-lg">{PHONE_DISPLAY}</p>
                </div>
                <span className="ml-auto text-white opacity-40">→</span>
              </a>

              <a
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '4px',
                }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center shrink-0 text-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                    borderRadius: '4px',
                  }}
                >
                  📷
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Instagram
                  </p>
                  <p className="text-white font-bold text-lg">@academia_do_gol</p>
                </div>
                <span className="ml-auto text-white opacity-40">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
