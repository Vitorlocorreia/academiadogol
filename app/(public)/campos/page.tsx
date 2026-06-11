// Listagem de campos disponíveis

import { getActiveFields } from '../actions'
import { CampoCard } from '@/components/public/campo-card'

export default async function CamposPage() {
  const fields = await getActiveFields()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12">
      {/* Header */}
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1
          className="uppercase leading-none"
          style={{
            fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
            fontSize: 'clamp(36px, 6vw, 54px)',
            letterSpacing: '0.02em',
            color: 'var(--text-primary)',
          }}
        >
          Nossos Campos
        </h1>
        <p
          className="text-xs font-bold uppercase tracking-widest mt-2"
          style={{ color: 'var(--text-muted)' }}
        >
          {fields.length} campo{fields.length !== 1 ? 's' : ''} disponível{fields.length !== 1 ? 'is' : ''} para aluguel
        </p>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded" style={{ borderColor: 'var(--border)' }}>
          <p className="text-5xl mb-4">⚽</p>
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Nenhum campo disponível no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field, i) => (
            <CampoCard key={field.id} field={field} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

