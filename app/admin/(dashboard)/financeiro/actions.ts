'use server'

import { createClient } from '@/lib/supabase/server'

export interface FieldOption {
  id: string
  name: string
}

export interface FieldBreakdown {
  field_id: string
  field_name: string
  total_revenue: number
  total_collected: number
  total_pending: number
  total_cancelled: number
  bookings_count: number
  fixed_count: number
  share_percentage: number
}

export interface FinanceiroData {
  // Lista de campos para seleção no filtro
  fields: FieldOption[]
  selectedFieldId: string

  // KPIs consolidados (ou do campo selecionado)
  totalRevenue: number
  totalCollected: number
  totalPending: number
  totalCancelled: number
  bookingsCount: number
  confirmedCount: number
  pendingCount: number

  // Desdobramento por campo (visão comparativa)
  fieldBreakdown: FieldBreakdown[]

  // Detalhe de reservas
  bookings: BookingRow[]

  // Contratos fixos
  fixedPayments: FixedPaymentRow[]
  fixedTotal: number
  fixedCollected: number
  fixedPending: number
}

export interface BookingRow {
  id: string
  field_id: string
  date: string
  start_time: string
  end_time: string
  customer_name: string
  field_name: string
  total_amount: number
  deposit_amount: number
  remaining_amount: number
  status: string
  deposit_status: string
  remaining_status: string
}

export interface FixedPaymentRow {
  id: string
  field_id: string
  reference_month: string
  amount: number
  status: string
  payment_method: string | null
  paid_at: string | null
  customer_name: string
  field_name: string
}

export async function getFinanceiroData(
  month?: string,
  year?: string,
  fieldId?: string
): Promise<FinanceiroData> {
  const supabase = await createClient()

  // 1. Busca todos os campos cadastrados no sistema
  const { data: fieldsRaw } = await supabase
    .from('fields')
    .select('id, name')
    .order('name')

  const fields: FieldOption[] = fieldsRaw ?? []

  // Monta o intervalo de datas para filtro
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const targetYear = year ? parseInt(year) : now.getFullYear()
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1

  const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
  const endMonth = targetMonth === 12 ? 1 : targetMonth + 1
  const endYear = targetMonth === 12 ? targetYear + 1 : targetYear
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  // 2. Busca reservas do período
  const { data: bookingsRaw, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, field_id, date, start_time, end_time, total_amount, deposit_amount, remaining_amount, status, deposit_status, remaining_status, field:fields(name), customer:customers(name)')
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false })

  if (bookingsError) {
    console.error('Erro ao buscar reservas financeiro:', bookingsError.message)
  }

  const allBookingsRaw = bookingsRaw ?? []

  // 3. Busca pagamentos de contratos fixos do período
  const refMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}`
  const { data: fixedRaw, error: fixedError } = await supabase
    .from('fixed_payments')
    .select('id, reference_month, amount, status, payment_method, paid_at, contract:fixed_contracts(field_id, customer:customers(name), field:fields(name))')
    .eq('reference_month', refMonth)
    .order('created_at', { ascending: false })

  if (fixedError) {
    console.error('Erro ao buscar pagamentos fixos:', fixedError.message)
  }

  const allFixedRaw = fixedRaw ?? []

  // Mapeia todas as reservas
  const allBookings: BookingRow[] = allBookingsRaw.map((b: any) => ({
    id: b.id,
    field_id: b.field_id,
    date: b.date,
    start_time: b.start_time,
    end_time: b.end_time,
    customer_name: b.customer?.name ?? 'Desconhecido',
    field_name: b.field?.name ?? 'Campo',
    total_amount: b.total_amount ?? 0,
    deposit_amount: b.deposit_amount ?? 0,
    remaining_amount: b.remaining_amount ?? 0,
    status: b.status,
    deposit_status: b.deposit_status,
    remaining_status: b.remaining_status,
  }))

  // Mapeia todos os pagamentos fixos
  const allFixedPayments: FixedPaymentRow[] = allFixedRaw.map((fp: any) => ({
    id: fp.id,
    field_id: fp.contract?.field_id ?? '',
    reference_month: fp.reference_month,
    amount: fp.amount ?? 0,
    status: fp.status,
    payment_method: fp.payment_method,
    paid_at: fp.paid_at,
    customer_name: fp.contract?.customer?.name ?? 'Desconhecido',
    field_name: fp.contract?.field?.name ?? 'Campo',
  }))

  // 4. Calcula o desdobramento financeiro por campo (Breakdown global)
  const grandTotalRevenue =
    allBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.total_amount, 0) +
    allFixedPayments.reduce((sum, fp) => sum + fp.amount, 0)

  const fieldBreakdown: FieldBreakdown[] = fields.map((f) => {
    const fieldBookings = allBookings.filter(b => b.field_id === f.id)
    const fieldActiveBookings = fieldBookings.filter(b => b.status !== 'cancelled')
    const fieldCancelledBookings = fieldBookings.filter(b => b.status === 'cancelled')
    const fieldFixed = allFixedPayments.filter(fp => fp.field_id === f.id)

    const bookingRev = fieldActiveBookings.reduce((sum, b) => sum + b.total_amount, 0)
    const fixedRev = fieldFixed.reduce((sum, fp) => sum + fp.amount, 0)
    const totalRev = bookingRev + fixedRev

    const bookingCollected = fieldActiveBookings.reduce((sum, b) => {
      let coll = 0
      if (b.deposit_status === 'paid') coll += b.deposit_amount
      if (b.remaining_status === 'paid') coll += b.remaining_amount
      return sum + coll
    }, 0)
    const fixedCollected = fieldFixed.filter(fp => fp.status === 'paid').reduce((sum, fp) => sum + fp.amount, 0)
    const totalCollected = bookingCollected + fixedCollected

    const totalPending = totalRev - totalCollected
    const totalCancelled = fieldCancelledBookings.reduce((sum, b) => sum + b.total_amount, 0)

    const sharePct = grandTotalRevenue > 0 ? (totalRev / grandTotalRevenue) * 100 : 0

    return {
      field_id: f.id,
      field_name: f.name,
      total_revenue: totalRev,
      total_collected: totalCollected,
      total_pending: totalPending,
      total_cancelled: totalCancelled,
      bookings_count: fieldActiveBookings.length,
      fixed_count: fieldFixed.length,
      share_percentage: sharePct,
    }
  })

  // 5. Aplica filtro de campo se especificado
  const isFiltered = fieldId && fieldId !== 'all'
  const selectedFieldId = isFiltered ? fieldId : 'all'

  const filteredBookings = isFiltered
    ? allBookings.filter(b => b.field_id === selectedFieldId)
    : allBookings

  const filteredFixed = isFiltered
    ? allFixedPayments.filter(fp => fp.field_id === selectedFieldId)
    : allFixedPayments

  // KPIs das reservas filtradas
  const activeBookings = filteredBookings.filter(b => b.status !== 'cancelled')
  const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled')

  const totalRevenue = activeBookings.reduce((sum, b) => sum + b.total_amount, 0)

  const totalCollected = activeBookings.reduce((sum, b) => {
    let collected = 0
    if (b.deposit_status === 'paid') collected += b.deposit_amount
    if (b.remaining_status === 'paid') collected += b.remaining_amount
    return sum + collected
  }, 0)

  const totalPending = totalRevenue - totalCollected
  const totalCancelled = cancelledBookings.reduce((sum, b) => sum + b.total_amount, 0)

  const bookingsCount = activeBookings.length
  const confirmedCount = activeBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length
  const pendingCount = activeBookings.filter(b => b.status === 'pending').length

  const fixedTotal = filteredFixed.reduce((sum, fp) => sum + fp.amount, 0)
  const fixedCollected = filteredFixed.filter(fp => fp.status === 'paid').reduce((sum, fp) => sum + fp.amount, 0)
  const fixedPending = fixedTotal - fixedCollected

  return {
    fields,
    selectedFieldId,
    totalRevenue,
    totalCollected,
    totalPending,
    totalCancelled,
    bookingsCount,
    confirmedCount,
    pendingCount,
    fieldBreakdown,
    bookings: filteredBookings,
    fixedPayments: filteredFixed,
    fixedTotal,
    fixedCollected,
    fixedPending,
  }
}
