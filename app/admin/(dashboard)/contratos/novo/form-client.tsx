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
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[4px] text-sm font-medium">
          {state.error}
        </div>
      )}

      {/* Seção: Cliente */}
      <div>
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Informações do Mensalista
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="customer_name"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Nome Completo
            </label>
            <input
              type="text"
              id="customer_name"
              name="customer_name"
              required
              className="input-admin"
              placeholder="Ex: João da Silva"
            />
          </div>

          <div>
            <label
              htmlFor="customer_phone"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              id="customer_phone"
              name="customer_phone"
              required
              className="input-admin font-mono"
              placeholder="Ex: (81) 9 9999-9999"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="customer_email"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              E-mail (opcional)
            </label>
            <input
              type="email"
              id="customer_email"
              name="customer_email"
              className="input-admin"
              placeholder="Ex: mensalista@email.com"
            />
          </div>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border)' }} />

      {/* Seção: Detalhes do Contrato */}
      <div>
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Detalhes do Contrato & Agendamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="field_id"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Campo Reservado
            </label>
            <select
              id="field_id"
              name="field_id"
              required
              className="input-admin"
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
            <label
              htmlFor="day_of_week"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Dia Fixo da Semana
            </label>
            <select
              id="day_of_week"
              name="day_of_week"
              required
              className="input-admin"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="start_time"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Horário de Início
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-4 h-4" />
              </span>
              <input
                type="time"
                id="start_time"
                name="start_time"
                required
                className="input-admin pl-12 font-mono"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="end_time"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Horário de Término
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-4 h-4" />
              </span>
              <input
                type="time"
                id="end_time"
                name="end_time"
                required
                className="input-admin pl-12 font-mono"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="monthly_amount"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Valor da Mensalidade (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                type="number"
                id="monthly_amount"
                name="monthly_amount"
                required
                min="1"
                step="0.01"
                className="input-admin pl-12 font-mono"
                placeholder="Ex: 450.00"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="starts_at"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Data de Início da Vigência
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <CalendarDays className="w-4 h-4" />
              </span>
              <input
                type="date"
                id="starts_at"
                name="starts_at"
                required
                className="input-admin pl-12 font-mono"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="ends_at"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Data de Término da Vigência (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <CalendarDays className="w-4 h-4" />
              </span>
              <input
                type="date"
                id="ends_at"
                name="ends_at"
                className="input-admin pl-12 font-mono"
              />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Se deixado em branco, o contrato será considerado por prazo indeterminado e gerará bloqueios contínuos na agenda.
            </p>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div
        className="flex items-center justify-end gap-3 pt-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <Link
          href="/admin/contratos"
          className="btn-admin-secondary px-5 py-2.5 text-sm font-semibold rounded-[2px]"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          id="btn-confirmar-contrato"
          disabled={isPending}
          className="btn-admin-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-[2px] cursor-pointer"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Criar Contrato Fixo
        </button>
      </div>
    </form>
  )
}
