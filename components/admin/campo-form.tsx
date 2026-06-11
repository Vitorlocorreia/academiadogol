'use client'

import Link from 'next/link'
import type { Field } from '@/lib/supabase/types'

interface CampoFormProps {
  formAction: (formData: FormData) => void
  isPending: boolean
  field?: Field
}

export function CampoForm({ formAction, isPending, field }: CampoFormProps) {
  const durationDefault = field?.duration_options?.join(', ') ?? '60, 90, 120'
  const amenitiesDefault = field?.amenities?.join(', ') ?? ''

  return (
    <form action={formAction} className="space-y-6">
      {/* Informações básicas */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
          Informações do Campo
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Nome do Campo <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={field?.name ?? ''}
              placeholder="Ex: Campo Society 1"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={field?.description ?? ''}
              placeholder="Descreva o campo, grama sintética, dimensões..."
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label htmlFor="amenities" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Comodidades
              <span className="text-zinc-500 font-normal ml-1">(separadas por vírgula)</span>
            </label>
            <input
              id="amenities"
              name="amenities"
              type="text"
              defaultValue={amenitiesDefault}
              placeholder="Ex: Vestiário, Iluminação, Estacionamento"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="maps_url" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Link de Localização (Google Maps / Waze)
            </label>
            <input
              id="maps_url"
              name="maps_url"
              type="text"
              defaultValue={field?.maps_url ?? ''}
              placeholder="Ex: https://maps.app.goo.gl/... ou link do Waze"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </section>

      <div className="border-t border-zinc-800" />

      {/* Preços */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
          Preços e Duração
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="hourly_rate" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Valor por Hora (R$) <span className="text-red-400">*</span>
              </label>
              <input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={field?.hourly_rate ?? ''}
                placeholder="0,00"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="duration_options" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Durações (min)
                <span className="text-zinc-500 font-normal ml-1">(por vírgula)</span>
              </label>
              <input
                id="duration_options"
                name="duration_options"
                type="text"
                defaultValue={durationDefault}
                placeholder="60, 90, 120"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Sinal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="deposit_type" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Tipo de Sinal <span className="text-red-400">*</span>
              </label>
              <select
                id="deposit_type"
                name="deposit_type"
                defaultValue={field?.deposit_type ?? 'fixed'}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="fixed">Valor fixo (R$)</option>
                <option value="percentage">Percentual (%)</option>
              </select>
            </div>

            <div>
              <label htmlFor="deposit_value" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Valor do Sinal <span className="text-red-400">*</span>
              </label>
              <input
                id="deposit_value"
                name="deposit_value"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={field?.deposit_value ?? ''}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Status (somente na edição) */}
          {field && (
            <div>
              <label htmlFor="is_active" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Status
              </label>
              <select
                id="is_active"
                name="is_active"
                defaultValue={String(field.is_active)}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Botões */}
      <div className="flex gap-3 pt-2">
        <Link
          href="/admin/campos"
          className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm transition-all text-center"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          id="btn-salvar-campo"
          disabled={isPending}
          className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-white font-semibold rounded-xl text-sm transition-all"
        >
          {isPending ? 'Salvando...' : field ? 'Salvar Alterações' : 'Criar Campo'}
        </button>
      </div>
    </form>
  )
}
