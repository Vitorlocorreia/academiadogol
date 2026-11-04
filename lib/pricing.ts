// Lógica de cálculo de preços por pacote e duração para as unidades
// Suporta tabela customizada por campo (full editável via banco/admin)
// com fallback para a tabela padrão cadastrada.

import type { FieldPackage, BookingCategory } from '@/lib/supabase/types'

export function getDefaultPackagesForField(fieldName: string, hourlyRateFallback: number = 200): FieldPackage[] {
  const name = fieldName.toLowerCase()

  // CANDEIAS e SETUBAL
  if (name.includes('candeias') || name.includes('setúbal') || name.includes('setubal')) {
    return [
      { id: 'jogo_90', category: 'jogo', name: 'Avulso 1h30', duration_minutes: 90, total_price: 300, deposit_price: 150, is_active: true },
      { id: 'jogo_120', category: 'jogo', name: 'Avulso 2h', duration_minutes: 120, total_price: 400, deposit_price: 150, is_active: true },
      { id: 'festa_180', category: 'festa', name: 'Festa 3h', duration_minutes: 180, total_price: 700, deposit_price: 150, is_active: true },
      { id: 'festa_240', category: 'festa', name: 'Festa 4h', duration_minutes: 240, total_price: 850, deposit_price: 150, is_active: true },
    ]
  }

  // JANGA
  if (name.includes('janga')) {
    return [
      { id: 'jogo_90', category: 'jogo', name: 'Avulso 1h30', duration_minutes: 90, total_price: 280, deposit_price: 150, is_active: true },
      { id: 'jogo_120', category: 'jogo', name: 'Avulso 2h', duration_minutes: 120, total_price: 350, deposit_price: 150, is_active: true },
      { id: 'festa_180', category: 'festa', name: 'Festa 3h', duration_minutes: 180, total_price: 450, deposit_price: 150, is_active: true },
      { id: 'festa_240', category: 'festa', name: 'Festa 4h', duration_minutes: 240, total_price: 550, deposit_price: 150, is_active: true },
    ]
  }

  // INTERNACIONAL / SPORT / CLUBE DOS OFICIAIS / ARRAIAL
  if (
    name.includes('internacional') ||
    name.includes('sport') ||
    name.includes('oficiais') ||
    name.includes('arraial')
  ) {
    return [
      { id: 'jogo_60', category: 'jogo', name: 'Avulso 1h', duration_minutes: 60, total_price: 250, deposit_price: 150, is_active: true },
      { id: 'jogo_90', category: 'jogo', name: 'Avulso 1h30', duration_minutes: 90, total_price: 370, deposit_price: 150, is_active: true },
      { id: 'festa_180', category: 'festa', name: 'Festa 3h', duration_minutes: 180, total_price: 850, deposit_price: 150, is_active: true },
      { id: 'festa_240', category: 'festa', name: 'Festa 4h', duration_minutes: 240, total_price: 1000, deposit_price: 150, is_active: true },
    ]
  }

  // Fallback padrão genérico
  return [
    { id: 'jogo_60', category: 'jogo', name: 'Avulso 1h', duration_minutes: 60, total_price: hourlyRateFallback, deposit_price: 150, is_active: true },
    { id: 'jogo_90', category: 'jogo', name: 'Avulso 1h30', duration_minutes: 90, total_price: Math.round(hourlyRateFallback * 1.5), deposit_price: 150, is_active: true },
    { id: 'festa_180', category: 'festa', name: 'Festa 3h', duration_minutes: 180, total_price: Math.round(hourlyRateFallback * 3), deposit_price: 150, is_active: true },
    { id: 'festa_240', category: 'festa', name: 'Festa 4h', duration_minutes: 240, total_price: Math.round(hourlyRateFallback * 4), deposit_price: 150, is_active: true },
  ]
}

export function getFieldPackages(field: { name: string; packages?: FieldPackage[]; hourly_rate?: number }): FieldPackage[] {
  if (field.packages && field.packages.length > 0) {
    return field.packages
  }
  return getDefaultPackagesForField(field.name, field.hourly_rate ?? 200)
}

export function getPackageForDuration(
  packages: FieldPackage[] | undefined,
  durationMinutes: number,
  preferredCategory?: BookingCategory
): FieldPackage | null {
  if (!packages || packages.length === 0) return null
  if (preferredCategory) {
    const directMatch = packages.find(
      (p) => p.duration_minutes === durationMinutes && p.category === preferredCategory && p.is_active !== false
    )
    if (directMatch) return directMatch
  }
  return packages.find((p) => p.duration_minutes === durationMinutes && p.is_active !== false) ?? null
}

export function getFieldPrice(
  fieldName: string,
  durationMinutes: number,
  hourlyRateFallback: number,
  packages?: FieldPackage[]
): number {
  // 1. Se houver pacotes cadastrados para o campo, prioriza o valor editado no banco
  if (packages && packages.length > 0) {
    const pkg = packages.find((p) => p.duration_minutes === durationMinutes && p.is_active !== false)
    if (pkg) {
      return Number(pkg.total_price)
    }
  }

  const name = fieldName.toLowerCase()

  // 2. Fallbacks predefinidos de pacotes
  // CANDEIAS e SETUBAL
  if (name.includes('candeias') || name.includes('setúbal') || name.includes('setubal')) {
    if (durationMinutes === 90) return 300
    if (durationMinutes === 120) return 400
    if (durationMinutes === 180) return 700
    if (durationMinutes === 240) return 850
  }

  // JANGA
  if (name.includes('janga')) {
    if (durationMinutes === 90) return 280
    if (durationMinutes === 120) return 350
    if (durationMinutes === 180) return 450
    if (durationMinutes === 240) return 550
  }

  // INTERNACIONAL / SPORT / CLUBE DOS OFICIAIS / ARRAIAL
  if (
    name.includes('internacional') ||
    name.includes('sport') ||
    name.includes('oficiais') ||
    name.includes('arraial')
  ) {
    if (durationMinutes === 60) return 250
    if (durationMinutes === 90) return 370
    if (durationMinutes === 180) return 850
    if (durationMinutes === 240) return 1000
  }

  // Fallback para cálculo linear baseado no hourly_rate caso seja outra duração ou campo
  return (hourlyRateFallback * durationMinutes) / 60
}

export interface Price1HourInfo {
  price: number
  isDerived: boolean
}

export function getField1HourPriceInfo(
  fieldName: string,
  durationOptions: number[],
  hourlyRate: number,
  packages?: FieldPackage[]
): Price1HourInfo {
  if (packages && packages.length > 0) {
    const pkg60 = packages.find((p) => p.duration_minutes === 60 && p.is_active !== false)
    if (pkg60) {
      return { price: Number(pkg60.total_price), isDerived: false }
    }
    const pkg90 = packages.find((p) => p.duration_minutes === 90 && p.is_active !== false)
    if (pkg90) {
      return { price: Math.round(Number(pkg90.total_price) / 1.5), isDerived: true }
    }
  }

  const options = durationOptions ?? []

  // 1. Se o campo tiver um valor cadastrado especificamente para 1h (60 min), usar esse valor diretamente.
  if (options.includes(60)) {
    return {
      price: getFieldPrice(fieldName, 60, hourlyRate, packages),
      isDerived: false,
    }
  }

  // 2. Se o campo não tiver pacote de 1h, calcular o valor proporcional de 60 min a partir do valor de 1h30 cadastrado (valor_1h30 ÷ 1,5), arredondando para valor inteiro/cheio se necessário.
  if (options.includes(90)) {
    const price90 = getFieldPrice(fieldName, 90, hourlyRate, packages)
    return {
      price: Math.round(price90 / 1.5),
      isDerived: true,
    }
  }

  // 3. Fallback genérico: se não tiver nem 60 nem 90, pegar a primeira opção disponível e calcular proporcionalmente
  if (options.length > 0) {
    const firstDuration = options[0]
    const firstPrice = getFieldPrice(fieldName, firstDuration, hourlyRate, packages)
    return {
      price: Math.round((firstPrice * 60) / firstDuration),
      isDerived: true,
    }
  }

  // Fallback absoluto se a lista de durações estiver vazia
  return {
    price: Math.round(hourlyRate),
    isDerived: true,
  }
}
