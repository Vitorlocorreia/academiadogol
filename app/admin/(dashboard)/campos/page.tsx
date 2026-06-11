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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Campos</h1>
          <p className="text-zinc-400 text-sm mt-1">Gerencie os campos do complexo</p>
        </div>
        <Link
          href="/admin/campos/novo"
          id="btn-novo-campo"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Novo Campo
        </Link>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
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
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
              <ImageOff className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium">Nenhum campo cadastrado</p>
            <p className="text-zinc-600 text-sm mt-1">Clique em "Novo Campo" para começar</p>
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
    <div className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all ${field.is_active ? 'border-zinc-800' : 'border-zinc-800 opacity-60'}`}>
      {/* Foto */}
      <div className="h-44 bg-zinc-800 relative overflow-hidden">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt={field.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageOff className="w-8 h-8 text-zinc-600" />
          </div>
        )}
        {/* Badge status */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${field.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-700 text-zinc-400 border border-zinc-600'}`}>
          {field.is_active ? 'Ativo' : 'Inativo'}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5">
        <h3 className="text-white font-semibold text-base mb-1">{field.name}</h3>
        {field.description && (
          <p className="text-zinc-500 text-sm mb-3 line-clamp-2">{field.description}</p>
        )}

        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-emerald-400 font-semibold">
            R$ {field.hourly_rate.toFixed(2).replace('.', ',')}/h
          </span>
          <span className="text-zinc-500 text-xs">Sinal: {depositLabel}</span>
        </div>

        {/* Comodidades */}
        {field.amenities && field.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {field.amenities.slice(0, 3).map((a) => (
              <span key={a} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-lg border border-zinc-700">
                {a}
              </span>
            ))}
            {field.amenities.length > 3 && (
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-xs rounded-lg border border-zinc-700">
                +{field.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
          <Link
            href={`/admin/campos/${field.id}/editar`}
            id={`btn-editar-${field.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-all flex-1 justify-center"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-all"
              title={field.is_active ? 'Desativar' : 'Ativar'}
            >
              {field.is_active
                ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" />
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 text-xs rounded-lg transition-all"
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
