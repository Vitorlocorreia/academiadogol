import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2, ImageOff } from 'lucide-react'
import { toggleFieldActiveAction, deleteFieldAction } from './actions'
import type { Field } from '@/lib/supabase/types'

export default async function CamposPage() {
  const supabase = await createClient()
  const { data: fields, error } = await supabase
    .from('fields')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 
            className="text-3xl font-black uppercase tracking-wider leading-none"
            style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif", color: 'var(--text-primary)' }}
          >
            Campos
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Gerencie os campos do complexo</p>
        </div>
        <Link
          href="/admin/campos/novo"
          id="btn-novo-campo"
          className="btn-admin-primary w-full sm:w-auto text-center justify-center"
        >
          <Plus className="w-4 h-4" />
          Novo Campo
        </Link>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-[4px] text-red-500 text-sm">
          Erro ao carregar campos: {error.message}
        </div>
      )}

      {/* Grid de campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {fields?.map((field: Field) => (
          <CampoCard key={field.id} field={field} />
        ))}

        {(!fields || fields.length === 0) && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
            >
              <ImageOff className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Nenhum campo cadastrado</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Clique em "Novo Campo" para começar</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CampoCard({ field }: { field: Field }) {
  const foto = field.photo_urls?.[0]
  const depositLabel = field.deposit_type === 'fixed'
    ? `R$ ${field.deposit_value.toFixed(2).replace('.', ',')} fixo`
    : `${field.deposit_value}% do total`

  return (
    <div 
      className={`border overflow-hidden transition-all rounded-[4px] shadow-sm ${field.is_active ? '' : 'opacity-60'}`}
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {/* Foto */}
      <div className="h-44 relative overflow-hidden group" style={{ background: 'var(--bg-subtle)' }}>
        {foto ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto} alt={field.name} className="w-full h-full object-cover" />
            <Link
              href={`/admin/campos/${field.id}/editar`}
              className="absolute top-3 left-3 px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              Alterar Foto
            </Link>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
            <ImageOff className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
            <Link
              href={`/admin/campos/${field.id}/editar`}
              className="px-3 py-1 bg-[var(--brand)] text-white text-xs font-bold uppercase rounded-[2px] shadow-xs hover:opacity-90 transition-opacity"
            >
              + Adicionar Foto
            </Link>
          </div>
        )}
        {/* Badge status */}
        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-[2px] text-xs font-semibold uppercase tracking-wider ${
          field.is_active 
            ? 'bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]' 
            : 'border'
        }`}
        style={!field.is_active ? { background: 'var(--bg-card)', color: 'var(--text-muted)', borderColor: 'var(--border)' } : undefined}
        >
          {field.is_active ? 'Ativo' : 'Inativo'}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5">
        <h3 className="font-bold text-base mb-1 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
          {field.name}
        </h3>
        {field.description && (
          <p className="text-sm mb-3 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {field.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm mb-4">
          <span className="font-bold" style={{ color: 'var(--brand)' }}>
            R$ {field.hourly_rate.toFixed(2).replace('.', ',')} / h
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sinal: {depositLabel}</span>
        </div>

        {/* Comodidades */}
        {field.amenities && field.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {field.amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="px-2.5 py-0.5 font-semibold text-xs rounded border shadow-xs"
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              >
                {a}
              </span>
            ))}
            {field.amenities.length > 3 && (
              <span 
                className="px-2 py-0.5 font-semibold text-xs rounded border"
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              >
                +{field.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <Link
            href={`/admin/campos/${field.id}/editar`}
            id={`btn-editar-${field.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[2px] transition-all flex-1 justify-center font-semibold uppercase tracking-wider border hover:opacity-80"
            style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Link>

          <form action={async () => {
            'use server'
            await toggleFieldActiveAction(field.id, field.is_active)
          }}>
            <button
              type="submit"
              id={`btn-toggle-${field.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[2px] transition-all cursor-pointer border hover:opacity-80"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              title={field.is_active ? 'Desativar' : 'Ativar'}
            >
              {field.is_active
                ? <ToggleRight className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
                : <ToggleLeft className="w-3.5 h-3.5" />
              }
            </button>
          </form>

          <form action={async () => {
            'use server'
            await deleteFieldAction(field.id)
          }}>
            <button
              type="submit"
              id={`btn-deletar-${field.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-500/10 hover:text-red-500 text-xs rounded-[2px] transition-all cursor-pointer border hover:border-red-500/20"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
