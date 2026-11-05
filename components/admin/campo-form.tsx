'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Field, FieldPackage, BookingCategory } from '@/lib/supabase/types'
import { getDefaultPackagesForField } from '@/lib/pricing'
import { Plus, Trash2, CheckCircle, XCircle, X, Sparkles } from 'lucide-react'

interface CampoFormProps {
  formAction: (formData: FormData) => void
  isPending: boolean
  field?: Field
}

const SUGGESTED_AMENITIES = [
  '🚿 Vestiário',
  '💡 Iluminação LED',
  '🥩 Churrasqueira',
  '🚗 Estacionamento',
  '🍺 Bar / Lanchonete',
  '👕 Coletes Gratuitos',
  '🌱 Grama Sintética Premium',
  '📶 Wi-Fi Grátis',
  '🛡️ Segurança 24h',
  '❄️ Freezers Disponíveis',
  '🎉 Espaço para Festas',
  '📺 Telão / TV',
]

export function CampoForm({ formAction, isPending, field }: CampoFormProps) {
  const durationDefault = field?.duration_options?.join(', ') ?? '60, 90, 120, 180, 240'
  const photoDefault = field?.photo_urls?.[0] ?? ''

  // Estado das comodidades (Badges interativos)
  const [amenities, setAmenities] = useState<string[]>(
    field?.amenities && field.amenities.length > 0 ? field.amenities : []
  )
  const [newAmenityInput, setNewAmenityInput] = useState('')

  const handleAddAmenity = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (!amenities.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setAmenities((prev) => [...prev, trimmed])
    }
    setNewAmenityInput('')
  }

  const handleRemoveAmenity = (indexToRemove: number) => {
    setAmenities((prev) => prev.filter((_, i) => i !== indexToRemove))
  }

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
      deposit_price: 150,
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
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
          Informações do Campo
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nome do Campo <span className="text-red-500">*</span>
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
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
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
            <label htmlFor="photo_url" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Comodidades do Campo (Badges Editáveis)
              </label>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {amenities.length} {amenities.length === 1 ? 'item configurado' : 'itens configurados'}
              </span>
            </div>

            {/* Input oculto que envia as comodidades em string separada por vírgula para a Action */}
            <input type="hidden" name="amenities" value={amenities.join(', ')} />

            {/* Caixa de Badges Ativas */}
            <div 
              className="p-3.5 border rounded-lg min-h-[56px] mb-3"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
            >
              {amenities.length === 0 ? (
                <p className="text-xs italic py-1" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma comodidade adicionada ainda. Adicione uma nova ou clique nas sugestões rápidas abaixo.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {amenities.map((item, idx) => (
                    <span
                      key={`${item}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 font-semibold text-xs rounded-full border shadow-xs"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(idx)}
                        className="transition-colors p-0.5 rounded-full hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                        title={`Remover ${item}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Input para adicionar nova comodidade personalizada */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newAmenityInput}
                onChange={(e) => setNewAmenityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddAmenity(newAmenityInput)
                  }
                }}
                placeholder="Digitar comodidade personalizada (ex: Área Coberta, Bebedouro...)"
                className="input-admin flex-1 text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddAmenity(newAmenityInput)}
                disabled={!newAmenityInput.trim()}
                className="px-4 py-2 disabled:opacity-40 font-bold text-xs uppercase tracking-wider rounded border transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {/* Sugestões Rápidas (1 clique) */}
            <div className="pt-1">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" />
                Sugestões Rápidas (Clique para adicionar ou remover):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_AMENITIES.map((sug) => {
                  const isSelected = amenities.some(
                    (a) => a.toLowerCase() === sug.toLowerCase() || sug.toLowerCase().includes(a.toLowerCase())
                  )
                  return (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          const idx = amenities.findIndex(
                            (a) => a.toLowerCase() === sug.toLowerCase() || sug.toLowerCase().includes(a.toLowerCase())
                          )
                          if (idx !== -1) handleRemoveAmenity(idx)
                        } else {
                          handleAddAmenity(sug)
                        }
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[var(--brand-subtle)] text-[var(--brand)] border-[var(--brand-ring)] font-bold shadow-xs'
                          : 'hover:opacity-80'
                      }`}
                      style={!isSelected ? { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border)' } : undefined}
                    >
                      {isSelected ? <CheckCircle className="w-3 h-3" /> : <Plus className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />}
                      <span>{sug}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="maps_url" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
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

      <div className="border-t" style={{ borderColor: 'var(--border)' }} />

      {/* PACOTES E PREÇOS FULL EDITÁVEIS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Tabela de Pacotes & Preços (Full Editável)
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Altere o valor total e o sinal PIX cobrado na hora da reserva para cada tipo e duração.
            </p>
          </div>
        </div>

        {/* Hidden input com os pacotes serializados */}
        <input type="hidden" name="packages" value={JSON.stringify(packages)} />

        {/* 1. SEÇÃO DE JOGOS / ALUGUEL DE QUADRA NORMAL */}
        <div 
          className="border rounded-xl p-4 sm:p-5 space-y-4"
          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚽</span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Aluguel de Quadra (Horário Normal / Jogo)
                </h4>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Partidas avulsas padrão (1h, 1h30, 2h)</p>
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
              <p className="text-xs py-2 italic text-center" style={{ color: 'var(--text-muted)' }}>Nenhum pacote de jogo configurado.</p>
            ) : (
              jogosPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-3 rounded-lg border transition-all ${
                    pkg.is_active ? 'shadow-xs' : 'opacity-60'
                  }`}
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-3 items-center">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Valor Total (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pkg.total_price}
                        onChange={(e) => handleUpdatePackage(pkg.id, { total_price: Number(e.target.value) })}
                        className="input-admin text-xs py-1.5 font-bold"
                        style={{ color: 'var(--text-primary)' }}
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
                          pkg.is_active ? 'text-emerald-600 bg-emerald-500/10' : 'border'
                        }`}
                        style={!pkg.is_active ? { background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderColor: 'var(--border)' } : undefined}
                      >
                        {pkg.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(pkg.id)}
                        title="Remover pacote"
                        className="p-1.5 rounded hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
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
        <div 
          className="border rounded-xl p-4 sm:p-5 space-y-4"
          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">🎂</span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                  Festas de Aniversário & Eventos
                </h4>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Pacotes estendidos com área de festa/churrasqueira (3h, 4h)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleAddPackage('festa')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/30 rounded hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Festa
            </button>
          </div>

          <div className="space-y-3">
            {festasPackages.length === 0 ? (
              <p className="text-xs py-2 italic text-center" style={{ color: 'var(--text-muted)' }}>Nenhum pacote de festa configurado.</p>
            ) : (
              festasPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-3 rounded-lg border transition-all ${
                    pkg.is_active ? 'shadow-xs' : 'opacity-60'
                  }`}
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-3 items-center">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Valor Total (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pkg.total_price}
                        onChange={(e) => handleUpdatePackage(pkg.id, { total_price: Number(e.target.value) })}
                        className="input-admin text-xs py-1.5 font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                        Sinal PIX (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={pkg.deposit_price}
                        onChange={(e) => handleUpdatePackage(pkg.id, { deposit_price: Number(e.target.value) })}
                        className="input-admin text-xs py-1.5 font-bold text-purple-600 dark:text-purple-400"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4 sm:pt-0 justify-end">
                      <button
                        type="button"
                        onClick={() => handleUpdatePackage(pkg.id, { is_active: !pkg.is_active })}
                        title={pkg.is_active ? 'Desativar pacote' : 'Ativar pacote'}
                        className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                          pkg.is_active ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10' : 'border'
                        }`}
                        style={!pkg.is_active ? { background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderColor: 'var(--border)' } : undefined}
                      >
                        {pkg.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(pkg.id)}
                        title="Remover pacote"
                        className="p-1.5 rounded hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
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
        <details 
          className="text-xs border p-4 rounded-xl"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <summary className="font-bold uppercase tracking-wider cursor-pointer" style={{ color: 'var(--text-primary)' }}>
            ⚙️ Configurações de Fallback (Durações avulsas / Valores padrão)
          </summary>
          <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="hourly_rate" className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
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
                <label htmlFor="duration_options" className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
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
                <label htmlFor="deposit_type" className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
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
                <label htmlFor="deposit_value" className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
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
            <label htmlFor="is_active" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
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
