// Página de detalhes do campo + calendário de disponibilidade

import { notFound } from 'next/navigation'
import { getFieldById } from '../../actions'
import { AvailabilityCalendar } from '@/components/public/availability-calendar'
import { createClient } from '@/lib/supabase/server'

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
          <div className="grid grid-cols-2 gap-3">
            <div
              className="col-span-2 sm:col-span-1 aspect-video overflow-hidden bg-zinc-800"
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
                ) : (
                  <div
                    key={i}
                    className="flex items-center justify-center text-zinc-700 text-2xl"
                    style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '4px' }}
                  >
                    ⚽
                  </div>
                )
              )}
            </div>
          </div>

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

          {/* Preços e sinal */}
          <div
            className="p-6"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
            }}
          >
            <h2
              className="uppercase tracking-wider mb-4 font-bold"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '1.25rem',
                color: 'var(--text-primary)',
              }}
            >
              Valores por Período
            </h2>
            <div className="space-y-3">
              {(field.duration_options ?? [60]).map((min) => {
                const total = (field.hourly_rate * min) / 60
                const deposit =
                  field.deposit_type === 'fixed'
                    ? field.deposit_value
                    : (total * field.deposit_value) / 100
                return (
                  <div key={min} className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{min} minutos</span>
                    <div className="text-right">
                      <span
                        className="font-black"
                        style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: '1.5rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        R$ {total.toFixed(0)}
                      </span>
                      <span className="text-xs ml-2 font-semibold uppercase tracking-wider" style={{ color: 'var(--brand)' }}>
                        (sinal: R$ {deposit.toFixed(0)})
                      </span>
                    </div>
                  </div>
                )
              })}
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
              openTime={openTime}
              closeTime={closeTime}
              durationOptions={field.duration_options ?? [60]}
              hourlyRate={field.hourly_rate}
              depositType={field.deposit_type as 'fixed' | 'percentage'}
              depositValue={field.deposit_value}
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

