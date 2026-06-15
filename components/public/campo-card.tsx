// Card do campo — Design System Academia do Gol
'use client'

import Link from 'next/link'
import type { Field } from '@/lib/supabase/types'
import { getFieldPrice, getField1HourPriceInfo } from '@/lib/pricing'


interface Props {
  field: Field
  index: number
}

export function CampoCard({ field, index }: Props) {
  const num = String(index + 1).padStart(2, '0')
  const { price, isDerived } = getField1HourPriceInfo(field.name, field.duration_options, field.hourly_rate)

  return (
    <Link
      href={`/campos/${field.id}`}
      className="group relative flex flex-col overflow-hidden transition-all duration-500 hover:-translate-y-1"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
      }}
    >
      {/* Número do campo estilo placar */}
      <div
        className="absolute top-4 left-4 z-20 font-black text-4xl leading-none select-none pointer-events-none"
        style={{
          color: 'rgba(255,255,255,0.12)',
          fontFamily: "'Bebas Neue', Arial Black, sans-serif",
          letterSpacing: '-0.02em',
        }}
      >
        {num}
      </div>

      {/* Foto */}
      <div className="relative w-full overflow-hidden" style={{ height: '220px' }}>
        {field.photo_urls?.[0] ? (
          <img
            src={field.photo_urls[0]}
            alt={field.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--brand-dark) 0%, var(--brand) 100%)' }}
          >
            {/* SVG de campo de futebol minimalista */}
            <svg viewBox="0 0 120 80" className="w-24 h-16 opacity-30" fill="none" stroke="white" strokeWidth="1.5">
              <rect x="2" y="2" width="116" height="76" rx="1"/>
              <line x1="60" y1="2" x2="60" y2="78"/>
              <circle cx="60" cy="40" r="12"/>
              <rect x="2" y="22" width="18" height="36"/>
              <rect x="100" y="22" width="18" height="36"/>
              <circle cx="60" cy="40" r="2" fill="white"/>
            </svg>
          </div>
        )}
        {/* Overlay gradient */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }}
        />
        {/* Badge de status */}
        <div className="absolute top-4 right-4 z-10">
          <span
            className="text-xs font-bold uppercase tracking-widest px-2 py-1"
            style={{
              background: 'var(--brand)',
              color: 'white',
              borderRadius: '2px',
              letterSpacing: '0.1em',
            }}
          >
            Disponível
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-5">
        {/* Nome */}
        <h3
          className="font-black text-xl uppercase tracking-tight leading-tight"
          style={{
            color: 'var(--text-primary)',
            fontFamily: "'Bebas Neue', Arial Black, sans-serif",
            letterSpacing: '0.03em',
            lineHeight: 1.1,
          }}
        >
          {field.name}
        </h3>
        {field.description && (
          <p
            className="text-sm mt-2 line-clamp-2 leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            {field.description}
          </p>
        )}

        {/* Durations */}
        <div className="flex flex-wrap gap-2 mt-4">
          {(field.duration_options ?? [60]).map((min) => (
            <span
              key={min}
              className="text-xs font-bold uppercase tracking-wide px-2.5 py-1"
              style={{
                background: 'var(--brand-subtle)',
                color: 'var(--brand)',
                border: '1px solid var(--brand-ring)',
                borderRadius: '2px',
              }}
            >
              {min} min
            </span>
          ))}
        </div>

        {/* Comodidades */}
        {field.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {field.amenities.slice(0, 4).map((item) => (
              <span
                key={item}
                className="text-xs px-2 py-0.5"
                style={{
                  color: 'var(--text-muted)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: '2px',
                }}
              >
                {item}
              </span>
            ))}
            {field.amenities.length > 4 && (
              <span
                className="text-xs px-2 py-0.5"
                style={{ color: 'var(--text-muted)', borderRadius: '2px' }}
              >
                +{field.amenities.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Preço + CTA */}
        <div
          className="flex items-center justify-between mt-5 pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-baseline gap-1 flex-wrap">
            {isDerived && (
              <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-muted)' }}>
                a partir de
              </span>
            )}
            <span
              className="font-black"
              style={{
                color: 'var(--text-primary)',
                fontSize: '1.75rem',
                lineHeight: 1,
                fontFamily: "'Bebas Neue', Arial Black, sans-serif",
              }}
            >
              R$ {price.toFixed(0)},00
            </span>
            <span className="text-xs font-medium ml-1" style={{ color: 'var(--text-muted)' }}>
              / hora
            </span>
          </div>
          <span
            className="text-sm font-bold uppercase tracking-widest px-5 py-2.5 transition-all duration-200 group-hover:opacity-90"
            style={{
              background: 'var(--brand)',
              color: 'white',
              borderRadius: '2px',
              letterSpacing: '0.08em',
            }}
          >
            Reservar
          </span>
        </div>
      </div>

      {/* Linha de destaque no hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
        style={{ background: 'var(--brand)' }}
      />
    </Link>
  )
}
