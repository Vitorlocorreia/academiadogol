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
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
          Informações do Campo
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Nome do Campo <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={field?.name ?? ''}
              placeholder="Ex: Campo Society 1"
              className="input-admin"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={field?.description ?? ''}
              placeholder="Descreva o campo, grama sintética, dimensões..."
              className="input-admin resize-none"
            />
          </div>

          <div>
            <label htmlFor="amenities" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Comodidades
              <span className="text-zinc-550 font-normal normal-case ml-1">(separadas por vírgula)</span>
            </label>
            <input
              id="amenities"
              name="amenities"
              type="text"
              defaultValue={amenitiesDefault}
              placeholder="Ex: Vestiário, Iluminação, Estacionamento"
              className="input-admin"
            />
          </div>

          <div>
            <label htmlFor="maps_url" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Link de Localização (Google Maps / Waze)
            </label>
            <input
              id="maps_url"
              name="maps_url"
              type="text"
              defaultValue={field?.maps_url ?? ''}
              placeholder="Ex: https://maps.app.goo.gl/... ou link do Waze"
              className="input-admin"
            />
          </div>
        </div>
      </section>

      <div className="border-t border-zinc-800" />

      {/* Preços */}
      <section>
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
          Preços e Duração
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="hourly_rate" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
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
                className="input-admin"
              />
            </div>

            <div>
              <label htmlFor="duration_options" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Durações (min)
                <span className="text-zinc-550 font-normal normal-case ml-1">(por vírgula)</span>
              </label>
              <input
                id="duration_options"
                name="duration_options"
                type="text"
                defaultValue={durationDefault}
                placeholder="60, 90, 120"
                className="input-admin"
              />
            </div>
          </div>

          {/* Sinal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="deposit_type" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Tipo de Sinal <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  id="deposit_type"
                  name="deposit_type"
                  defaultValue={field?.deposit_type ?? 'fixed'}
                  className="input-admin appearance-none pr-8 cursor-pointer"
                >
                  <option value="fixed" className="bg-zinc-900">Valor fixo (R$)</option>
                  <option value="percentage" className="bg-zinc-900">Percentual (%)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="deposit_value" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
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
                className="input-admin"
              />
            </div>
          </div>

          {/* Status (somente na edição) */}
          {field && (
            <div>
              <label htmlFor="is_active" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Status
              </label>
              <div className="relative">
                <select
                  id="is_active"
                  name="is_active"
                  defaultValue={String(field.is_active)}
                  className="input-admin appearance-none pr-8 cursor-pointer"
                >
                  <option value="true" className="bg-zinc-900">Ativo</option>
                  <option value="false" className="bg-zinc-900">Inativo</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Botões */}
      <div className="flex gap-3 pt-2">
        <Link
          href="/admin/campos"
          className="btn-admin-secondary flex-1 text-center justify-center"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          id="btn-salvar-campo"
          disabled={isPending}
          className="btn-admin-primary flex-1 text-center justify-center"
        >
        </button>
      </div>
    </form>
  )
}
