'use client'

import { useActionState } from 'react'
import { saveSettingsAction } from './actions'
import type { Settings } from '@/lib/supabase/types'
import { CheckCircle } from 'lucide-react'

const DAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

interface Props {
  settings: Settings | null
}

type FormState = { error: string; success: boolean }
const initialState: FormState = { error: '', success: false }


export function SaveSettingsForm({ settings }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const result = await saveSettingsAction(formData)
      return { ...initialState, ...result }
    },
    initialState
  )

  const activeDays = settings?.days_of_week ?? [0, 1, 2, 3, 4, 5, 6]

  return (
    <form action={formAction} className="space-y-8">

      {/* Feedback */}
      {state?.error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Configurações salvas com sucesso!
        </div>
      )}

      {/* Dados do negócio */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
          Dados do Negócio
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="business_name" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Nome do Negócio <span className="text-red-400">*</span>
            </label>
            <input
              id="business_name"
              name="business_name"
              type="text"
              required
              defaultValue={settings?.business_name ?? 'Academia do Gol'}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div>
            <label htmlFor="business_phone" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Telefone do Negócio
            </label>
            <input
              id="business_phone"
              name="business_phone"
              type="tel"
              defaultValue={settings?.business_phone ?? ''}
              placeholder="(81) 9 9999-9999"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>
      </section>

      <div className="border-t border-zinc-800" />

      {/* Horário de funcionamento */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
          Horário de Funcionamento
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="open_time" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Abertura <span className="text-red-400">*</span>
            </label>
            <input
              id="open_time"
              name="open_time"
              type="time"
              required
              defaultValue={settings?.open_time ?? '08:00'}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div>
            <label htmlFor="close_time" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Fechamento <span className="text-red-400">*</span>
            </label>
            <input
              id="close_time"
              name="close_time"
              type="time"
              required
              defaultValue={settings?.close_time ?? '23:00'}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Dias da semana */}
        <div>
          <p className="block text-sm font-medium text-zinc-300 mb-3">
            Dias de Funcionamento
          </p>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(({ value, label }) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="days_of_week"
                  value={value}
                  defaultChecked={activeDays.includes(value)}
                  className="sr-only peer"
                />
                <span className="flex items-center justify-center w-12 h-10 rounded-xl text-sm font-medium border transition-all
                  peer-checked:bg-emerald-500/10 peer-checked:border-emerald-500/40 peer-checked:text-emerald-400
                  border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-zinc-800" />

      {/* Regras de reserva */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
          Regras de Reserva
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="advance_booking_days" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Antecedência máxima (dias)
            </label>
            <input
              id="advance_booking_days"
              name="advance_booking_days"
              type="number"
              min="1"
              max="365"
              defaultValue={settings?.advance_booking_days ?? 30}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div>
            <label htmlFor="min_advance_hours" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Antecedência mínima (h)
            </label>
            <input
              id="min_advance_hours"
              name="min_advance_hours"
              type="number"
              min="0"
              max="72"
              defaultValue={settings?.min_advance_hours ?? 2}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div>
            <label htmlFor="cancellation_hours" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Prazo de cancelamento (h)
            </label>
            <input
              id="cancellation_hours"
              name="cancellation_hours"
              type="number"
              min="0"
              max="168"
              defaultValue={settings?.cancellation_hours ?? 24}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Salvar */}
      <div className="pt-2">
        <button
          type="submit"
          id="btn-salvar-configuracoes"
          disabled={isPending}
          className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-white font-semibold rounded-xl text-sm transition-all"
        >
          {isPending ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </form>
  )
}
