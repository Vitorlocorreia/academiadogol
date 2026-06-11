'use client'

import { useActionState, startTransition } from 'react'
import { createContractAction } from '../actions'
import { CalendarDays, Clock, DollarSign, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface FieldOption {
  id: string
  name: string
}

interface CreateContractFormProps {
  fields: FieldOption[]
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

export function CreateContractForm({ fields }: CreateContractFormProps) {
  const [state, formAction, isPending] = useActionState(createContractAction, null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {state?.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
          {state.error}
        </div>
      )}

      {/* Seção: Cliente */}
      <div>
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4">
          Informações do Mensalista
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customer_name" className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
              Nome Completo
            </label>
            <input
              type="text"
              id="customer_name"
              name="customer_name"
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-all"
              placeholder="Ex: João da Silva"
            />
          </div>

          <div>
            <label htmlFor="customer_phone" className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
              Telefone / WhatsApp
            </label>
            <input
              type="tel"
              id="customer_phone"
              name="customer_phone"
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-all"
              placeholder="Ex: 11999999999"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="customer_email" className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
              E-mail (opcional)
            </label>
            <input
              type="email"
              id="customer_email"
              name="customer_email"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-all"
              placeholder="Ex: mensalista@email.com"
            />
          </div>
        </div>
      </div>

      <hr className="border-zinc-800" />

      {/* Seção: Detalhes do Contrato */}
      <div>
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4">
          Detalhes do Contrato & Agendamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="field_id" className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
              Campo Reservado
            </label>
            <select
              id="field_id"
              name="field_id"
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-all"
            >
              <option value="">Selecione um campo...</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="day_of_week" className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
              Dia Fixo da Semana
            </label>
            <select
              id="day_of_week"
              name="day_of_week"
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-all"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="start_time" className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
              Horário de Início
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <Clock className="w-4 h-4" />
              </span>
              <input
                type="time"
                id="start_time"
                name="start_time"
                required
                className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="end_time" className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
              Horário de Término
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <Clock className="w-4 h-4" />
              </span>
              <input
                type="time"
                id="end_time"
                name="end_time"
                required
                className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="monthly_amount" className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
              Valor da Mensalidade (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                type="number"
                id="monthly_amount"
                name="monthly_amount"
                required
                min="1"
                step="0.01"
                className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-all"
                placeholder="Ex: 450.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="starts_at" className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
              Data de Início da Vigência
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <CalendarDays className="w-4 h-4" />
              </span>
              <input
                type="date"
                id="starts_at"
                name="starts_at"
                required
                className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="ends_at" className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
              Data de Término da Vigência (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <CalendarDays className="w-4 h-4" />
              </span>
              <input
                type="date"
                id="ends_at"
                name="ends_at"
                className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Se deixado em branco, o contrato será considerado por prazo indeterminado e gerará bloqueios contínuos na agenda.
            </p>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
        <Link
          href="/admin/contratos"
          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl transition-all"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          id="btn-confirmar-contrato"
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 disabled:text-zinc-400 text-white text-sm font-semibold rounded-xl transition-all"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Criar Contrato Fixo
        </button>
      </div>
    </form>
  )
}
