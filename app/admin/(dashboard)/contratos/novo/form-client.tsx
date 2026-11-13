'use client'

import { useActionState, startTransition, useState } from 'react'
import { createContractAction } from '../actions'
import { CalendarDays, Clock, DollarSign, Loader2, User, Users, Plus, Trash2, Layers } from 'lucide-react'
import Link from 'next/link'

interface FieldOption {
  id: string
  name: string
}

interface CreateContractFormProps {
  fields: FieldOption[]
  initialFieldId?: string
}

interface AdditionalSlot {
  id: string
  field_id: string
  day_of_week: number
  start_time: string
  end_time: string
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

export function CreateContractForm({ fields, initialFieldId }: CreateContractFormProps) {
  const [state, formAction, isPending] = useActionState(createContractAction, null)
  const [additionalSlots, setAdditionalSlots] = useState<AdditionalSlot[]>([])
  const [isCourtesy, setIsCourtesy] = useState(false)
  const [monthlyAmount, setMonthlyAmount] = useState('')

  const handleToggleCourtesy = () => {
    const next = !isCourtesy
    setIsCourtesy(next)
    if (next) {
      setMonthlyAmount('0')
    } else {
      setMonthlyAmount('')
    }
  }

  const handleAddSlot = () => {
    setAdditionalSlots((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        field_id: initialFieldId || fields[0]?.id || '',
        day_of_week: 2, // Terça-feira como padrão
        start_time: '19:00',
        end_time: '20:00',
      },
    ])
  }

  const handleRemoveSlot = (id: string) => {
    setAdditionalSlots((prev) => prev.filter((s) => s.id !== id))
  }

  const handleUpdateSlot = (id: string, field: keyof AdditionalSlot, value: any) => {
    setAdditionalSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (additionalSlots.length > 0) {
      formData.set('additional_schedules', JSON.stringify(additionalSlots))
    }
    formData.set('is_courtesy', String(isCourtesy))
    if (isCourtesy) {
      formData.set('monthly_amount', '0')
    }
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
      {/* Seção: Organizadores do Contrato */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-[var(--brand)]" />
            <h3
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-primary)' }}
            >
              1º Organizador (Responsável Principal / Titular)
            </h3>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Contato principal da turma para cobranças, lembretes e avisos do campo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="customer_name"
                className="block text-xs font-semibold uppercase mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Nome do 1º Organizador *
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
                Telefone / WhatsApp (Titular) *
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

        {/* 2º Organizador (Opcional) */}
        <div
          className="p-4 rounded-[4px] border"
          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[var(--brand)]" />
            <h3
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-primary)' }}
            >
              2º Organizador (Co-responsável / Contato Reserva) — Opcional
            </h3>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Segundo responsável pelo jogo para contato caso o titular não responda.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="secondary_name"
                className="block text-xs font-semibold uppercase mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Nome do 2º Organizador
              </label>
              <input
                type="text"
                id="secondary_name"
                name="secondary_name"
                className="input-admin"
                placeholder="Ex: Pedro Henrique (Co-organizador)"
              />
            </div>

            <div>
              <label
                htmlFor="secondary_phone"
                className="block text-xs font-semibold uppercase mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Telefone / WhatsApp (2º Organizador)
              </label>
              <input
                type="text"
                id="secondary_phone"
                name="secondary_phone"
                className="input-admin font-mono"
                placeholder="Ex: (81) 9 8888-8888"
              />
            </div>
          </div>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border)' }} />

      {/* Seção: Detalhes do Contrato & Agendamento de Peladas */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-primary)' }}
            >
              Horários & Dias das Peladas no Contrato
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Configure os dias e horários reservados. Você pode adicionar múltiplos dias e campos em um único contrato (ex: escolinhas).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSlot}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-bold uppercase tracking-wider bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)] hover:bg-[var(--brand)] hover:text-white transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            + Adicionar Outro Dia / Horário (Outra Pelada)
          </button>
        </div>

        {/* 1º Slot / Pelada Principal */}
        <div
          className="p-4 rounded-[4px] border space-y-4 shadow-2xs"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-[var(--brand)] text-white">
                1
              </span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                1ª Pelada (Horário Principal)
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[var(--brand-subtle)] text-[var(--brand)]">
              Principal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="field_id"
                className="block text-xs font-semibold uppercase mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Campo *
              </label>
              <select
                id="field_id"
                name="field_id"
                required
                defaultValue={initialFieldId || ''}
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
                Dia da Semana *
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
                Horário de Início *
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
                Horário de Término *
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
          </div>
        </div>

        {/* Peladas Adicionais (2ª, 3ª, etc.) */}
        {additionalSlots.map((slot, idx) => (
          <div
            key={slot.id}
            className="p-4 rounded-[4px] border space-y-4 shadow-2xs relative transition-all"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-neutral-600 text-white">
                  {idx + 2}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  {idx + 2}ª Pelada (Horário Adicional no Contrato)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSlot(slot.id)}
                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-400 font-semibold transition-colors cursor-pointer"
                title="Remover este horário adicional"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Campo *
                </label>
                <select
                  value={slot.field_id}
                  onChange={(e) => handleUpdateSlot(slot.id, 'field_id', e.target.value)}
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
                <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Dia da Semana *
                </label>
                <select
                  value={slot.day_of_week}
                  onChange={(e) => handleUpdateSlot(slot.id, 'day_of_week', Number(e.target.value))}
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
                <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Horário de Início *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    <Clock className="w-4 h-4" />
                  </span>
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => handleUpdateSlot(slot.id, 'start_time', e.target.value)}
                    required
                    className="input-admin pl-12 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Horário de Término *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    <Clock className="w-4 h-4" />
                  </span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => handleUpdateSlot(slot.id, 'end_time', e.target.value)}
                    required
                    className="input-admin pl-12 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Resumo Consolidado de Peladas */}
        <div
          className="p-3.5 rounded-[4px] border flex items-center justify-between flex-wrap gap-2"
          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Total no Contrato: {1 + additionalSlots.length} {1 + additionalSlots.length === 1 ? 'pelada semanal' : 'peladas semanais'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddSlot}
            className="text-xs font-bold uppercase tracking-wider text-[var(--brand)] hover:underline cursor-pointer"
          >
            + Adicionar Mais Um Dia
          </button>
        </div>

        {/* Opção de Cortesia */}
        <div
          onClick={handleToggleCourtesy}
          className={`p-4 rounded-[4px] border cursor-pointer transition-all flex items-center justify-between gap-4 ${
            isCourtesy
              ? 'bg-purple-950/30 border-purple-500/50 text-purple-200'
              : 'hover:border-purple-500/30'
          }`}
          style={{ background: isCourtesy ? undefined : 'var(--bg-card)', borderColor: isCourtesy ? undefined : 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Marcar Contrato como Cortesia (Isenção Total)
              </p>
              <p className="text-[11px] text-neutral-400">
                Ideal para parcerias, projetos sociais, escolinhas parceiras ou contratos sem cobrança de mensalidade (R$ 0,00).
              </p>
            </div>
          </div>
          <div
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
              isCourtesy ? 'bg-purple-600' : 'bg-neutral-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                isCourtesy ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        <input type="hidden" name="is_courtesy" value={isCourtesy ? 'true' : 'false'} />

        {/* Informações Financeiras e Vigência */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label
              htmlFor="monthly_amount"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Valor Total da Mensalidade (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                type="number"
                id="monthly_amount"
                name="monthly_amount"
                required={!isCourtesy}
                readOnly={isCourtesy}
                value={isCourtesy ? '0' : monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                min="0"
                step="0.01"
                className={`input-admin pl-12 font-mono ${isCourtesy ? 'opacity-70 bg-purple-950/20 text-purple-300 border-purple-500/40 cursor-not-allowed' : ''}`}
                placeholder={isCourtesy ? '0.00 (Cortesia)' : 'Ex: 800.00'}
              />
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {isCourtesy
                ? 'Contrato gratuito / cortesia cadastrado sem cobrança mensal.'
                : 'Valor único consolidado que cobre todos os dias/horários acima.'}
            </p>
          </div>

          <div>
            <label
              htmlFor="starts_at"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Início da Vigência *
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
                min="2024-01-01"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="input-admin pl-12 font-mono"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="ends_at"
              className="block text-xs font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Término da Vigência (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <CalendarDays className="w-4 h-4" />
              </span>
              <input
                type="date"
                id="ends_at"
                name="ends_at"
                min="2024-01-01"
                className="input-admin pl-12 font-mono"
              />
            </div>
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
