// Página de consulta de reservas — Área Pública

import { ConsultClient } from './consult-client'

export default function ConsultarReservasPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
      <div
        className="p-6 sm:p-8"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
        }}
      >
        <div className="mb-8 text-center pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h1
            className="uppercase leading-none"
            style={{
              fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
              fontSize: '2.5rem',
              letterSpacing: '0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Minhas Reservas
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider mt-2" style={{ color: 'var(--text-secondary)' }}>
            Digite seu telefone cadastrado para consultar e acessar os detalhes de suas reservas.
          </p>
        </div>

        <ConsultClient />
      </div>
    </div>
  )
}
