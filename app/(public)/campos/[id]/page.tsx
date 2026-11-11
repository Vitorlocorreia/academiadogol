// Página de detalhes do campo + calendário de disponibilidade

import { notFound } from 'next/navigation'
import { getFieldById } from '../../actions'
import { AvailabilityCalendar } from '@/components/public/availability-calendar'
import { createClient } from '@/lib/supabase/server'
import { getFieldPackages } from '@/lib/pricing'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CampoDetailPage({ params }: Props) {
  const { id } = await params
  const field = await getFieldById(id)
  if (!field) notFound()

  // Busca configurações de funcionamento
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('settings')
    .select('open_time, close_time, days_of_week')
    .limit(1)
    .single()

  const openTime = settings?.open_time?.slice(0, 5) ?? '08:00'
  const closeTime = settings?.close_time?.slice(0, 5) ?? '23:00'

  const packages = getFieldPackages(field)
  const jogoPackages = packages.filter((p) => p.category === 'jogo' && p.is_active !== false)
  const festaPackages = packages.filter((p) => p.category === 'festa' && p.is_active !== false)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs uppercase tracking-widest mb-8 flex items-center gap-2 font-bold" style={{ color: 'var(--text-muted)' }}>
        <a href="/campos" className="hover:text-white transition-colors">Campos</a>
        <span className="opacity-50">/</span>
        <span style={{ color: 'var(--text-primary)' }}>{field.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Coluna esquerda — info do campo */}
        <div className="lg:col-span-3 space-y-8">
          {/* Galeria de fotos */}
          {field.photo_urls && field.photo_urls.length > 1 ? (
            <div className="grid grid-cols-2 gap-3">
              <div
                className="col-span-2 sm:col-span-1 aspect-video overflow-hidden bg-zinc-800"
                style={{ border: '1px solid var(--border)', borderRadius: '4px' }}
              >
                <img
                  src={field.photo_urls[0]}
                  alt={field.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-rows-2 gap-3">
                {[1, 2].map((i) =>
                  field.photo_urls?.[i] ? (
                    <div
                      key={i}
                      className="overflow-hidden bg-zinc-800"
                      style={{ border: '1px solid var(--border)', borderRadius: '4px' }}
                    >
                      <img src={field.photo_urls[i]} alt={`${field.name} - Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ) : null
                )}
              </div>
            </div>
          ) : (
            <div
              className="w-full aspect-video overflow-hidden bg-zinc-800"
              style={{ border: '1px solid var(--border)', borderRadius: '4px' }}
            >
              {field.photo_urls?.[0] ? (
                <img
                  src={field.photo_urls[0]}
                  alt={field.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">⚽</div>
              )}
            </div>
          )}

          {/* Nome e descrição */}
          <div>
            <h1
              className="uppercase leading-none"
              style={{
                fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
                fontSize: 'clamp(36px, 6vw, 54px)',
                letterSpacing: '0.02em',
                color: 'var(--text-primary)',
              }}
            >
              {field.name}
            </h1>
            {field.description && (
              <p
                className="text-sm mt-3 leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                {field.description}
              </p>
            )}
          </div>

          {/* Comodidades */}
          {field.amenities?.length > 0 && (
            <div>
              <h2
                className="uppercase tracking-wider mb-3 font-bold"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '1.25rem',
                  color: 'var(--text-primary)',
                }}
              >
                Comodidades
              </h2>
              <div className="flex flex-wrap gap-2">
                {field.amenities.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                    style={{
                      background: 'var(--brand-subtle)',
                      color: 'var(--brand)',
                      border: '1px solid var(--brand-ring)',
                      borderRadius: '2px',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preços e Pacotes (Full Editáveis) */}
          <div
            className="p-6 space-y-6"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
            }}
          >
            <div>
              <h2
                className="uppercase tracking-wider font-bold text-black"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '1.35rem',
                  color: '#000000',
                }}
              >
                Tabela de Valores & Pacotes
              </h2>
              <p className="text-xs text-black font-medium mt-1" style={{ color: '#000000' }}>
                Garantia imediata do horário pagando apenas o sinal via PIX no site.
              </p>
            </div>

            {/* 1. Aluguel de Quadra Normal */}
            {jogoPackages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200">
                  <span className="text-sm">⚽</span>
                  <span className="text-xs font-black uppercase tracking-wider text-black" style={{ color: '#000000' }}>
                    Aluguel de Quadra (Horário Normal / Jogo)
                  </span>
                </div>
                <div className="space-y-2.5">
                  {jogoPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between pb-2.5 border-b border-zinc-200/60"
                    >
                      <div>
                        <span className="text-sm font-black uppercase tracking-wider text-black" style={{ color: '#000000' }}>
                          {pkg.name}
                        </span>
                        <span className="block text-[11px] text-black font-medium" style={{ color: '#000000' }}>
                          {pkg.duration_minutes} minutos de jogo
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className="font-black text-black"
                          style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: '1.4rem',
                            color: '#000000',
                          }}
                        >
                          R$ {Number(pkg.total_price).toFixed(0)}
                        </span>
                        <span className="block text-[11px] font-black uppercase tracking-wider text-black" style={{ color: '#000000' }}>
                          Sinal: R$ {Number(pkg.deposit_price).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Festas de Aniversário & Eventos */}
            {festaPackages.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200">
                  <span className="text-sm">🎂</span>
                  <span className="text-xs font-black uppercase tracking-wider text-black" style={{ color: '#000000' }}>
                    Festas de Aniversário & Eventos
                  </span>
                </div>
                <div className="space-y-2.5">
                  {festaPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between pb-2.5 border-b border-zinc-200/60"
                    >
                      <div>
                        <span className="text-sm font-black uppercase tracking-wider text-black" style={{ color: '#000000' }}>
                          {pkg.name}
                        </span>
                        <span className="block text-[11px] text-black font-medium" style={{ color: '#000000' }}>
                          {pkg.duration_minutes / 60} horas de estrutura completa
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className="font-black text-black"
                          style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: '1.4rem',
                            color: '#000000',
                          }}
                        >
                          R$ {Number(pkg.total_price).toFixed(0)}
                        </span>
                        <span className="block text-[11px] font-black uppercase tracking-wider text-black" style={{ color: '#000000' }}>
                          Sinal: R$ {Number(pkg.deposit_price).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card Especial: Quer ser Mensalista? */}
          <div
            className="p-6 rounded-[4px] border space-y-4 shadow-sm"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--brand-ring)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span 
                  className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-[2px] bg-zinc-100 text-black border border-zinc-300 inline-block"
                  style={{ color: '#000000' }}
                >
                  Contratos Fixos
                </span>
                <h3
                  className="text-xl font-black uppercase tracking-wider text-black"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    color: '#000000',
                  }}
                >
                  Quer ser mensalista no {field.name}?
                </h3>
                <p className="text-xs leading-relaxed text-black font-medium" style={{ color: '#000000' }}>
                  Garanta o mesmo dia e horário fixo para a sua turma toda semana, sem risco de perder a vaga. Descontos especiais na mensalidade e controle online.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={`https://wa.me/5581999096142?text=${encodeURIComponent(
                  `Olá! Tenho interesse em ser mensalista no campo ${field.name} da Academia do Gol toda semana. Quais horários fixos estão disponíveis?`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn-admin-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-[2px] inline-flex items-center gap-2"
              >
                <span>Solicitar Vaga de Mensalista no Zap</span>
              </a>

              <a
                href="/reserva/consultar"
                className="btn-admin-secondary px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-[2px] inline-flex items-center gap-1.5"
              >
                <span>Já sou mensalista • Pagar Mensalidade</span>
              </a>
            </div>
          </div>

          {/* Localização do Campo */}
          {field.maps_url && (
            <FieldLocation mapsUrl={field.maps_url} name={field.name} />
          )}
        </div>

        {/* Coluna direita — calendário de disponibilidade */}
        <div className="lg:col-span-2">
          <div
            className="sticky top-24 p-6"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
            }}
          >
            <h2
              className="uppercase tracking-wider mb-6 font-bold"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.5rem',
                color: 'var(--text-primary)',
              }}
            >
              Escolha data e horário
            </h2>
            <AvailabilityCalendar
              fieldId={field.id}
              fieldName={field.name}
              openTime={openTime}
              closeTime={closeTime}
              durationOptions={field.duration_options ?? [60]}
              hourlyRate={field.hourly_rate}
              depositType={field.deposit_type as 'fixed' | 'percentage'}
              depositValue={field.deposit_value}
              packages={packages}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar para carregar a localização sem bloquear a página
async function FieldLocation({ mapsUrl, name }: { mapsUrl: string; name: string }) {
  const loc = await resolveLocation(mapsUrl)

  if (!loc.embedUrl) return null

  return (
    <div
      className="p-6 space-y-6"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 flex items-center justify-center shrink-0"
          style={{
            background: 'var(--brand-subtle)',
            border: '1px solid var(--brand-ring)',
            borderRadius: '2px',
          }}
        >
          <span className="text-xl">📍</span>
        </div>
        <div>
          <h2
            className="uppercase tracking-wider font-bold leading-none"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.25rem',
              color: 'var(--text-primary)',
            }}
          >
            Localização deste Campo
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Veja onde fica e trace sua rota</p>
        </div>
      </div>

      <div
        className="overflow-hidden h-[300px]"
        style={{
          border: '1px solid var(--border)',
          borderRadius: '4px',
        }}
      >
        <iframe
          src={loc.embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Localização ${name}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={loc.gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          id="btn-campo-gmaps"
          className="flex items-center justify-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:opacity-90"
          style={{
            border: '1px solid var(--border)',
            borderRadius: '2px',
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          🗺️ Google Maps
        </a>
        <a
          href={loc.wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          id="btn-campo-waze"
          className="flex items-center justify-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:opacity-90"
          style={{
            border: '1px solid var(--border)',
            borderRadius: '2px',
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          🚗 Waze
        </a>
      </div>
    </div>
  )
}

// Função para resolver os redirecionamentos do Google Maps
async function resolveLocation(mapsUrl: string) {
  let embedUrl = ''
  let wazeUrl = `https://waze.com/ul?q=${encodeURIComponent('Academia do Gol Recife')}&navigate=yes`
  let gmapsUrl = mapsUrl

  try {
    const res = await fetch(mapsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 86400 } // Cache do resultado por 24h
    })
    
    const finalUrl = res.url
    gmapsUrl = finalUrl

    let lat = ''
    let lng = ''
    
    const coordsMatch = finalUrl.match(/@([-]?\d+\.\d+),([-]?\d+\.\d+)/) || finalUrl.match(/q=([-]?\d+\.\d+)%2C([-]?\d+\.\d+)/)
    if (coordsMatch) {
      lat = coordsMatch[1]
      lng = coordsMatch[2]
    } else {
      const html = await res.clone().text()
      const htmlCoords = html.match(/[-]?8\.\d{3,},[-]?34\.\d{3,}/)
      if (htmlCoords) {
        const parts = htmlCoords[0].split(',')
        lat = parts[0]
        lng = parts[1]
      }
    }

    if (lat && lng) {
      wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
    }

    const cidMatch = finalUrl.match(/cid=(\d+)/)
    if (cidMatch) {
      embedUrl = `https://www.google.com/maps/embed?origin=mfe&pb=!1m3!3m2!1m1!4s${cidMatch[1]}`
    } else {
      const placeIdMatch = finalUrl.match(/1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/)
      if (placeIdMatch) {
        embedUrl = `https://www.google.com/maps/embed?origin=mfe&pb=!1m3!3m2!1m1!1s${placeIdMatch[1]}`
      } else if (finalUrl.includes('/search/')) {
        const parts = finalUrl.split('/search/')
        if (parts[1]) {
          const query = parts[1].split('/')[0]
          embedUrl = `https://maps.google.com/maps?q=${query}&output=embed`
        }
      } else {
        const separator = finalUrl.includes('?') ? '&' : '?'
        embedUrl = `${finalUrl}${separator}output=embed`
      }
    }
  } catch (error) {
    console.error('Erro ao resolver redirecionamento do mapa:', error)
    embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapsUrl)}&output=embed`
  }

  return { embedUrl, wazeUrl, gmapsUrl }
}
