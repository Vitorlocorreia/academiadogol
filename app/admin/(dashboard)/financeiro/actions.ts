'use server'

import { createClient } from '@/lib/supabase/server'

export interface FinanceiroData {
  // KPIs
  totalRevenue: number
  totalCollected: number
  totalPending: number
  totalCancelled: number
  bookingsCount: number
  confirmedCount: number
  pendingCount: number

  // Detalhe reservas
  bookings: BookingRow[]

  // Contratos fixos
  fixedPayments: FixedPaymentRow[]
  fixedTotal: number
  fixedCollected: number
  fixedPending: number
}

export interface BookingRow {
  id: string
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
  reference_month: string
  amount: number
  status: string
  payment_method: string | null
  paid_at: string | null
  customer_name: string
  field_name: string
}

export async function getFinanceiroData(month?: string, year?: string): Promise<FinanceiroData> {
  const supabase = await createClient()

  // Monta o intervalo de datas para filtro
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const targetYear = year ? parseInt(year) : now.getFullYear()
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1

  const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
  const endMonth = targetMonth === 12 ? 1 : targetMonth + 1
  const endYear = targetMonth === 12 ? targetYear + 1 : targetYear
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  // Busca reservas do período
  const { data: bookingsRaw, error: bookingsError } = await supabase
    .from('bookings')
    .select('*, field:fields(name), customer:customers(name)')
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false })

  if (bookingsError) {
    console.error('Erro ao buscar reservas financeiro:', bookingsError.message)
  }

  const bookingsRawData = bookingsRaw ?? []

  // Calcula KPIs de reservas
  const activeBookings = bookingsRawData.filter(b => b.status !== 'cancelled')
  const cancelledBookings = bookingsRawData.filter(b => b.status === 'cancelled')

  const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.total_amount ?? 0), 0)

  // Coletado = depósitos pagos + restantes pagos
  const totalCollected = activeBookings.reduce((sum, b) => {
    let collected = 0
    if (b.deposit_status === 'paid') collected += b.deposit_amount ?? 0
    if (b.remaining_status === 'paid') collected += b.remaining_amount ?? 0
    return sum + collected
  }, 0)

  const totalPending = totalRevenue - totalCollected
  const totalCancelled = cancelledBookings.reduce((sum, b) => sum + (b.total_amount ?? 0), 0)

  const bookingsCount = activeBookings.length
  const confirmedCount = activeBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length
  const pendingCount = activeBookings.filter(b => b.status === 'pending').length

  const bookings: BookingRow[] = bookingsRawData.map(b => ({
    id: b.id,
    date: b.date,
    start_time: b.start_time,
    end_time: b.end_time,
    customer_name: (b.customer as any)?.name ?? 'Desconhecido',
    field_name: (b.field as any)?.name ?? 'Campo',
    total_amount: b.total_amount ?? 0,
    deposit_amount: b.deposit_amount ?? 0,
    remaining_amount: b.remaining_amount ?? 0,
    status: b.status,
    deposit_status: b.deposit_status,
    remaining_status: b.remaining_status,
  }))

  // Busca pagamentos de contratos fixos do período
  const refMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}`
  const { data: fixedRaw, error: fixedError } = await supabase
    .from('fixed_payments')
    .select('*, contract:fixed_contracts(customer:customers(name), field:fields(name))')
    .eq('reference_month', refMonth)
    .order('created_at', { ascending: false })

  if (fixedError) {
    console.error('Erro ao buscar pagamentos fixos:', fixedError.message)
  }

  const fixedRawData = fixedRaw ?? []

  const fixedPayments: FixedPaymentRow[] = fixedRawData.map((fp: any) => ({
    id: fp.id,
    reference_month: fp.reference_month,
    amount: fp.amount ?? 0,
    status: fp.status,
    payment_method: fp.payment_method,
    paid_at: fp.paid_at,
    customer_name: fp.contract?.customer?.name ?? 'Desconhecido',
    field_name: fp.contract?.field?.name ?? 'Campo',
  }))

  const fixedTotal = fixedPayments.reduce((sum, fp) => sum + fp.amount, 0)
  const fixedCollected = fixedPayments.filter(fp => fp.status === 'paid').reduce((sum, fp) => sum + fp.amount, 0)
  const fixedPending = fixedTotal - fixedCollected

  return {
    totalRevenue,
    totalCollected,
    totalPending,
    totalCancelled,
    bookingsCount,
    confirmedCount,
    pendingCount,
    bookings,
    fixedPayments,
    fixedTotal,
    fixedCollected,
    fixedPending,
  }
}
