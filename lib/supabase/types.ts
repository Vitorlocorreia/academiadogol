// Tipos TypeScript para todas as entidades do banco
// Gerado manualmente — usar `generate_typescript_types` do Supabase MCP para atualizar

export type DepositType = 'fixed' | 'percentage'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type DepositStatus = 'pending' | 'paid' | 'refunded'
export type RemainingStatus = 'pending' | 'paid'
export type RemainingPaymentMethod = 'pix_manual' | 'cash' | 'card_machine'
export type CampaignStatus = 'draft' | 'sent'
export type FixedPaymentStatus = 'pending' | 'paid'

export interface Field {
  id: string
  name: string
  description: string | null
  photo_urls: string[]
  hourly_rate: number
  duration_options: number[]
  amenities: string[]
  deposit_type: DepositType
  deposit_value: number
  is_active: boolean
  maps_url?: string | null
  created_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  birth_date: string | null
  total_bookings: number
  total_spent: number
  birthday_message_sent_year: number | null
  created_at: string
}

export interface Booking {
  id: string
  field_id: string
  customer_id: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  total_amount: number
  deposit_amount: number
  remaining_amount: number
  status: BookingStatus
  deposit_status: DepositStatus
  remaining_status: RemainingStatus
  remaining_payment_method: RemainingPaymentMethod | null
  asaas_charge_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Relacionamentos opcionais (joins)
  field?: Field
  customer?: Customer
}

export interface FixedContract {
  id: string
  customer_id: string
  field_id: string
  day_of_week: number // 0=dom ... 6=sab
  start_time: string
  end_time: string
  duration_minutes: number
  monthly_amount: number
  starts_at: string
  ends_at: string | null
  is_active: boolean
  created_at: string
  customer?: Customer
  field?: Field
}

export interface FixedPayment {
  id: string
  contract_id: string
  reference_month: string
  amount: number
  status: FixedPaymentStatus
  payment_method: string | null
  paid_at: string | null
  created_at: string
}

export interface BlockedSlot {
  id: string
  field_id: string
  date: string | null        // null quando é recorrente sem data específica
  start_time: string
  end_time: string
  reason: string | null
  is_recurring: boolean
  recur_day_of_week: number | null  // 0=dom … 6=sab
  recur_ends_at: string | null
  created_at: string
}

export interface Campaign {
  id: string
  title: string
  message: string
  status: CampaignStatus
  sent_at: string | null
  recipients_count: number
  created_at: string
}

export interface Settings {
  id: string
  business_name: string
  business_phone: string | null
  open_time: string
  close_time: string
  days_of_week: number[]
  advance_booking_days: number
  min_advance_hours: number
  cancellation_hours: number
  birthday_message_template: string | null
  updated_at: string
}
