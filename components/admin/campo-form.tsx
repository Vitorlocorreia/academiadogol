'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Field, FieldPackage, BookingCategory } from '@/lib/supabase/types'
import { getDefaultPackagesForField } from '@/lib/pricing'
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react'

interface CampoFormProps {
  formAction: (formData: FormData) => void
  isPending: boolean
  field?: Field
}

export function CampoForm({ formAction, isPending, field }: CampoFormProps) {
  const durationDefault = field?.duration_options?.join(', ') ?? '60, 90, 120, 180, 240'
  const amenitiesDefault = field?.amenities?.join(', ') ?? ''
  const photoDefault = field?.photo_urls?.[0] ?? ''

  // Inicializa pacotes com os salvos ou com os padrões da unidade
  const initialPackages: FieldPackage[] =
    field?.packages && field.packages.length > 0
      ? field.packages
      : getDefaultPackagesForField(field?.name ?? '', Number(field?.hourly_rate ?? 200))

  const [packages, setPackages] = useState<FieldPackage[]>(initialPackages)

  const handleUpdatePackage = (id: string, updates: Partial<FieldPackage>) => {
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, ...updates } : pkg))
    )
  }

  const handleRemovePackage = (id: string) => {
    setPackages((prev) => prev.filter((pkg) => pkg.id !== id))
  }

  const handleAddPackage = (category: BookingCategory) => {
    const defaultMins = category === 'festa' ? 180 : 90
    const newId = `${category}_${Date.now()}`
    const newPkg: FieldPackage = {
      id: newId,
      category,
      name: category === 'festa' ? `Festa ${defaultMins / 60}h` : `Avulso ${defaultMins}min`,
      duration_minutes: defaultMins,
      total_price: category === 'festa' ? 700 : 300,
      deposit_price: 50,
      is_active: true,
    }
    setPackages((prev) => [...prev, newPkg])
  }

  const jogosPackages = packages.filter((p) => p.category === 'jogo')
  const festasPackages = packages.filter((p) => p.category === 'festa')

  return (
    <form action={formAction} className="space-y-8">
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
              placeholder="Ex: Candeias, Setúbal, Sport..."
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
              placeholder="Descreva o campo, tipo de grama, estrutura..."
              className="input-admin resize-none"
            />
          </div>

          <div>
            <label htmlFor="photo_url" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              URL da Foto do Campo
            </label>
            <input
              id="photo_url"
              name="photo_url"
              type="text"
              defaultValue={photoDefault}
              placeholder="Ex: /imagens/candeias/candeias.jpeg ou https://..."
              className="input-admin"
            />
          </div>

          <div>
            <label htmlFor="amenities" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Comodidades
              <span className="text-zinc-500 font-normal normal-case ml-1">(separadas por vírgula)</span>
            </label>
            <input
              id="amenities"
              name="amenities"
              type="text"
              defaultValue={amenitiesDefault}
              placeholder="Ex: Vestiário, Iluminação LED, Churrasqueira, Estacionamento"
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

      {/* PACOTES E PREÇOS FULL EDITÁVEIS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Tabela de Pacotes & Preços (Full Editável)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Altere o valor total e o sinal PIX cobrado na hora da reserva para cada tipo e duração.
            </p>
          </div>
        </div>

        {/* Hidden input com os pacotes serializados */}
        <input type="hidden" name="packages" value={JSON.stringify(packages)} />

        {/* 1. SEÇÃO DE JOGOS / ALUGUEL DE QUADRA NORMAL */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚽</span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Aluguel de Quadra (Horário Normal / Jogo)
                </h4>
                <p className="text-[11px] text-zinc-500">Partidas avulsas padrão (1h, 1h30, 2h)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleAddPackage('jogo')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--brand)] bg-[var(--brand-subtle)] border border-[var(--brand-ring)] rounded hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Jogo
            </button>
          </div>

          <div className="space-y-3">
            {jogosPackages.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2 italic text-center">Nenhum pacote de jogo configurado.</p>
            ) : (
              jogosPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-3 rounded-lg border transition-all ${
                    pkg.is_active ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-900/40 border-zinc-850 opacity-60'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-3 items-center">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Nome do Pacote
                      </label>
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) => handleUpdatePackage(pkg.id, { name: e.target.value })}
                        className="input-admin text-xs py-1.5"
                        placeholder="Ex: Avulso 1h30"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Duração (Min)
                      </label>
                      <input
                        type="number"
                        min="30"
                        step="30"
                        value={pkg.duration_minutes}
                        onChange={(e) => handleUpdatePackage(pkg.id, { duration_minutes: Number(e.target.value) })}
                        className="input-admin text-xs py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Valor Total (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pkg.total_price}
                        onChange={(e) => handleUpdatePackage(pkg.id, { total_price: Number(e.target.value) })}
                        className="input-admin text-xs py-1.5 font-bold text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--brand)] mb-1">
                        Sinal PIX (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pkg.deposit_price}
                        onChange={(e) => handleUpdatePackage(pkg.id, { deposit_price: Number(e.target.value) })}
                        className="input-admin text-xs py-1.5 font-bold text-[var(--brand)]"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4 sm:pt-0 justify-end">
                      <button
                        type="button"
                        onClick={() => handleUpdatePackage(pkg.id, { is_active: !pkg.is_active })}
                        title={pkg.is_active ? 'Desativar pacote' : 'Ativar pacote'}
                        className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                          pkg.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 bg-zinc-800'
                        }`}
                      >
                        {pkg.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(pkg.id)}
                        title="Remover pacote"
                        className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. SEÇÃO DE FESTAS DE ANIVERSÁRIO & EVENTOS */}
        <div className="bg-zinc-950/60 border border-purple-900/30 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎂</span>
              <div>
                <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Festas de Aniversário & Eventos
                </h4>
                <p className="text-[11px] text-zinc-500">Pacotes estendidos com área de festa/churrasqueira (3h, 4h)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleAddPackage('festa')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/30 rounded hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Festa
            </button>
          </div>

          <div className="space-y-3">
            {festasPackages.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2 italic text-center">Nenhum pacote de festa configurado.</p>
            ) : (
              festasPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-3 rounded-lg border transition-all ${
                    pkg.is_active ? 'bg-zinc-900/90 border-purple-950/60' : 'bg-zinc-900/40 border-zinc-850 opacity-60'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-3 items-center">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Nome do Pacote
                      </label>
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) => handleUpdatePackage(pkg.id, { name: e.target.value })}
                        className="input-admin text-xs py-1.5"
                        placeholder="Ex: Festa 3h"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Duração (Min)
                      </label>
                      <input
                        type="number"
                        min="60"
                        step="30"
                        value={pkg.duration_minutes}
                        onChange={(e) => handleUpdatePackage(pkg.id, { duration_minutes: Number(e.target.value) })}
                        className="input-admin text-xs py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Valor Total (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pkg.total_price}
                        onChange={(e) => handleUpdatePackage(pkg.id, { total_price: Number(e.target.value) })}
                        className="input-admin text-xs py-1.5 font-bold text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">
                        Sinal PIX (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pkg.deposit_price}
                        onChange={(e) => handleUpdatePackage(pkg.id, { deposit_price: Number(e.target.value) })}
                        className="input-admin text-xs py-1.5 font-bold text-purple-400"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4 sm:pt-0 justify-end">
                      <button
                        type="button"
                        onClick={() => handleUpdatePackage(pkg.id, { is_active: !pkg.is_active })}
                        title={pkg.is_active ? 'Desativar pacote' : 'Ativar pacote'}
                        className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                          pkg.is_active ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-500 bg-zinc-800'
                        }`}
                      >
                        {pkg.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(pkg.id)}
                        title="Remover pacote"
                        className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Configurações Globais de Fallback */}
        <details className="text-xs text-zinc-400 bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl">
          <summary className="font-bold uppercase tracking-wider cursor-pointer hover:text-zinc-200">
            ⚙️ Configurações de Fallback (Durações avulsas / Valores padrão)
          </summary>
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="hourly_rate" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Valor Base por Hora (R$)
                </label>
                <input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={field?.hourly_rate ?? '200'}
                  className="input-admin text-xs"
                />
              </div>

              <div>
                <label htmlFor="duration_options" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Durações Padrão (min)
                </label>
                <input
                  id="duration_options"
                  name="duration_options"
                  type="text"
                  defaultValue={durationDefault}
                  className="input-admin text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="deposit_type" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Tipo de Sinal Padrão
                </label>
                <select
                  id="deposit_type"
                  name="deposit_type"
                  defaultValue={field?.deposit_type ?? 'fixed'}
                  className="input-admin text-xs"
                >
                  <option value="fixed">Valor fixo (R$)</option>
                  <option value="percentage">Percentual (%)</option>
                </select>
              </div>

              <div>
                <label htmlFor="deposit_value" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Valor do Sinal Padrão
                </label>
                <input
                  id="deposit_value"
                  name="deposit_value"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={field?.deposit_value ?? '50'}
                  className="input-admin text-xs"
                />
              </div>
            </div>
          </div>
        </details>

        {/* Status (somente na edição) */}
        {field && (
          <div>
            <label htmlFor="is_active" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Status do Campo
            </label>
            <select
              id="is_active"
              name="is_active"
              defaultValue={String(field.is_active)}
              className="input-admin"
            >
              <option value="true">Ativo (visível para clientes)</option>
              <option value="false">Inativo (oculto do site)</option>
            </select>
          </div>
        )}
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
          className="btn-admin-primary flex-1 text-center justify-center cursor-pointer"
        >
          {isPending ? 'Salvando...' : field ? 'Salvar Alterações' : 'Criar Campo'}
        </button>
      </div>
    </form>
  )
}
