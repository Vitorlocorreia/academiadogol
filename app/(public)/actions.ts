'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { Field, FieldPackage } from '@/lib/supabase/types'
import { getFieldPrice } from '@/lib/pricing'

// ─── Helpers de Normalização e Validação ─────────────────────────────────────

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function isValidCPF(cpfRaw: string): boolean {
  const cpf = cpfRaw.replace(/\D/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(10))) return false

  return true
}

function getBrazilNow(): { todayStr: string; currentHHMM: string; nextHalfHourSlot: string } {
  const now = new Date()
  const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const y = brTime.getFullYear()
  const m = String(brTime.getMonth() + 1).padStart(2, '0')
  const d = String(brTime.getDate()).padStart(2, '0')
  const hh = brTime.getHours()
  const mm = brTime.getMinutes()
  const currentHHMM = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`

  // Arredonda para o próximo bloco de 30 minutos para bloquear horários já iniciados hoje
  const totalMins = hh * 60 + mm
  const roundedMins = Math.min(24 * 60, Math.ceil((totalMins + 1) / 30) * 30)
  const rH = String(Math.floor(roundedMins / 60)).padStart(2, '0')
  const rM = String(roundedMins % 60).padStart(2, '0')
  const nextHalfHourSlot = `${rH}:${rM}`

  return {
    todayStr: `${y}-${m}-${d}`,
    currentHHMM,
    nextHalfHourSlot,
  }
}

function getBrazilTodayStr(): string {
  return getBrazilNow().todayStr
}

// ─── Campos ─────────────────────────────────────────────────────────────────

// Busca todos os campos ativos para exibição pública
export async function getActiveFields(): Promise<Field[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('fields')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('[getActiveFields] Erro ao buscar campos:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('[getActiveFields] Falha de conexão com Supabase:', err)
    return []
  }
}

// Busca um campo específico pelo ID
export async function getFieldById(id: string): Promise<Field | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('fields')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) return null
    return data
  } catch {
    return null
  }
}

// ─── Disponibilidade ─────────────────────────────────────────────────────────

// Retorna os slots já ocupados para um campo em uma data específica
// Inclui reservas ativas/pendentes + bloqueios pontuais + bloqueios recorrentes
export async function getOccupiedSlots(
  fieldId: string,
  date: string // formato ISO: 'YYYY-MM-DD'
): Promise<Array<{ start_time: string; end_time: string }>> {
  try {
    const supabase = createAdminClient()
    const dayOfWeek = new Date(date + 'T12:00:00').getDay() // evita problema de fuso

    // Libera reservas pendentes abandonadas há mais de 20 minutos
    try {
      await supabase.rpc('expire_stale_pending_bookings')
    } catch {
      // ignora caso a RPC ainda não esteja disponível
    }

    // Reservas ativas e pendentes
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, end_time, status, created_at')
      .eq('field_id', fieldId)
      .eq('date', date)
      .in('status', ['pending', 'confirmed'])

    const cutoffMs = Date.now() - 20 * 60 * 1000
    const activeBookings = (bookings ?? []).filter((b) => {
      if (b.status === 'confirmed') return true
      if (!b.created_at) return true
      return new Date(b.created_at).getTime() >= cutoffMs
    })

    // Bloqueios pontuais para a data específica
    const { data: pointBlocks } = await supabase
      .from('blocked_slots')
      .select('start_time, end_time')
      .eq('field_id', fieldId)
      .eq('date', date)
      .eq('is_recurring', false)

    // Bloqueios recorrentes válidos para o dia da semana
    const { data: recurBlocks } = await supabase
      .from('blocked_slots')
      .select('start_time, end_time, recur_ends_at')
      .eq('field_id', fieldId)
      .eq('is_recurring', true)
      .eq('recur_day_of_week', dayOfWeek)

    // Filtra bloqueios recorrentes que já expiraram
    const activeRecurBlocks = (recurBlocks ?? []).filter((b) => {
      if (!b.recur_ends_at) return true
      return b.recur_ends_at >= date
    })

    // Contratos fixos de mensalistas ativos para este dia da semana e vigência
    const { data: fixedContracts } = await supabase
      .from('fixed_contracts')
      .select('start_time, end_time, starts_at, ends_at')
      .eq('field_id', fieldId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)

    const activeContractSlots = (fixedContracts ?? []).filter((c) => {
      if (c.starts_at && c.starts_at > date) return false
      if (c.ends_at && c.ends_at < date) return false
      return true
    })

    // Se a data consultada for hoje no fuso de Brasília, bloqueia os horários que já passaram
    const { todayStr, nextHalfHourSlot } = getBrazilNow()
    const pastTodayBlocks =
      date === todayStr && nextHalfHourSlot > '00:00'
        ? [{ start_time: '00:00', end_time: nextHalfHourSlot }]
        : []

    const all = [
      ...activeBookings,
      ...(pointBlocks ?? []),
      ...activeRecurBlocks,
      ...activeContractSlots,
      ...pastTodayBlocks,
    ]

    return all.map(({ start_time, end_time }) => ({ start_time, end_time }))
  } catch (err) {
    console.error('[getOccupiedSlots] Erro ao carregar disponibilidade:', err)
    return []
  }
}

// ─── Reserva ─────────────────────────────────────────────────────────────────

const reservationSchema = z.object({
  field_id: z.string().uuid('Campo inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, 'Horário de início inválido'),
  duration_minutes: z.coerce
    .number()
    .int()
    .min(30, 'Duração mínima é de 30 minutos')
    .max(240, 'Duração máxima é de 240 minutos (4h)')
    .refine((val) => val % 30 === 0, 'A duração deve ser em blocos de 30 minutos'),
  customer_name: z.string().trim().min(2, 'Nome deve ter ao menos 2 caracteres').max(120),
  customer_phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length >= 10 && v.length <= 11, 'Informe um WhatsApp válido com DDD (10 ou 11 dígitos)'),
  customer_cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => isValidCPF(v), 'CPF inválido. Digite um CPF válido para emissão do PIX.'),
  customer_email: z.string().trim().email('E-mail inválido').optional().or(z.literal('')),
  customer_birth_date: z.string().optional().or(z.literal('')),
})

// Cria uma intenção de reserva com status 'pending'
// Realiza upsert no cliente pelo telefone normalizado (chave de identificação)
export async function createBookingAction(
  _prev: { error: string } | null,
  formData: FormData
) {
  const raw = {
    field_id: formData.get('field_id'),
    date: formData.get('date'),
    start_time: formData.get('start_time'),
    duration_minutes: formData.get('duration_minutes'),
    customer_name: formData.get('customer_name'),
    customer_phone: formData.get('customer_phone'),
    customer_cpf: formData.get('customer_cpf') ?? '',
    customer_email: formData.get('customer_email') ?? '',
    customer_birth_date: formData.get('customer_birth_date') ?? '',
  }

  const parsed = reservationSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const {
    field_id,
    date,
    start_time,
    duration_minutes,
    customer_name,
    customer_phone,
    customer_cpf,
    customer_email,
    customer_birth_date,
  } = parsed.data

  // Bloqueia reservas para datas passadas ou horários já passados hoje
  const { todayStr, currentHHMM } = getBrazilNow()
  if (date < todayStr) {
    return { error: 'Não é possível realizar reservas para datas passadas.' }
  }
  if (date === todayStr && start_time <= currentHHMM) {
    return { error: 'Não é possível reservar um horário que já passou hoje. Escolha um horário futuro.' }
  }

  const supabase = createAdminClient()

  // Busca dados do campo para calcular valores (incluindo tabela de pacotes)
  const { data: field, error: fieldError } = await supabase
    .from('fields')
    .select('name, hourly_rate, deposit_type, deposit_value, is_active, packages')
    .eq('id', field_id)
    .single()

  if (fieldError || !field || !field.is_active) {
    return { error: 'Campo não encontrado ou indisponível.' }
  }

  // Calcula horário de fim e valida limite do dia
  const [hh, mm] = start_time.split(':').map(Number)
  const endMinutes = hh * 60 + mm + duration_minutes
  if (endMinutes > 24 * 60) {
    return { error: 'O horário de término não pode ultrapassar 00:00.' }
  }

  const end_time = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

  // Determina tipo da reserva (jogo ou festa)
  const requestedBookingType = formData.get('booking_type')
  const booking_type = (requestedBookingType === 'festa' || duration_minutes >= 180) ? 'festa' : 'jogo'

  // Procura pacote específico nos packages cadastrados do campo
  const packages: FieldPackage[] = (field as any).packages ?? []
  const matchedPkg = packages.find(
    (p) => p.duration_minutes === duration_minutes && (p.category === booking_type || !p.category) && p.is_active !== false
  ) || packages.find((p) => p.duration_minutes === duration_minutes && p.is_active !== false)

  let total_amount: number
  let deposit_amount: number

  if (matchedPkg) {
    total_amount = Number(matchedPkg.total_price)
    deposit_amount = matchedPkg.deposit_price !== undefined && matchedPkg.deposit_price !== null
      ? Number(matchedPkg.deposit_price)
      : field.deposit_type === 'fixed'
        ? Number(field.deposit_value)
        : (total_amount * Number(field.deposit_value)) / 100
  } else {
    total_amount = getFieldPrice(field.name, duration_minutes, field.hourly_rate, packages)
    deposit_amount =
      field.deposit_type === 'fixed'
        ? Number(field.deposit_value)
        : (total_amount * Number(field.deposit_value)) / 100
  }

  const remaining_amount = Math.max(0, total_amount - deposit_amount)

  // Verifica sobreposição antes de inserir (defesa dupla — trigger no banco)
  const occupied = await getOccupiedSlots(field_id, date)
  const conflict = occupied.some((slot) => {
    return slot.start_time < end_time && slot.end_time > start_time
  })
  if (conflict) {
    return { error: 'Este horário não está mais disponível. Escolha outro.' }
  }

  // Upsert do cliente pelo telefone normalizado (apenas dígitos)
  let { data: customer, error: customerError } = await supabase
    .from('customers')
    .upsert(
      {
        phone: customer_phone,
        name: customer_name,
        cpf: customer_cpf,
        email: customer_email || null,
        birth_date: customer_birth_date || null,
      },
      { onConflict: 'phone' }
    )
    .select('id')
    .single()

  // Fallback caso a coluna cpf ainda não exista no schema remoto
  if (customerError && customerError.message?.includes('cpf')) {
    const retry = await supabase
      .from('customers')
      .upsert(
        {
          phone: customer_phone,
          name: customer_name,
          email: customer_email || null,
          birth_date: customer_birth_date || null,
        },
        { onConflict: 'phone' }
      )
      .select('id')
      .single()
    customer = retry.data
    customerError = retry.error
  }

  if (customerError || !customer) {
    return { error: 'Erro ao registrar cliente.' }
  }

  // Notas identificando o tipo de reserva e o pacote
  const notesParts = [
    booking_type === 'festa' ? '🎂 [FESTA DE ANIVERSÁRIO / EVENTO]' : '⚽ [JOGO / HORÁRIO NORMAL]',
    matchedPkg?.name ? `Pacote: ${matchedPkg.name}` : null,
    customer_cpf ? `CPF: ${customer_cpf}` : null,
  ].filter(Boolean)

  // Cria a reserva com status pending
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      field_id,
      customer_id: customer.id,
      date,
      start_time,
      end_time,
      duration_minutes,
      total_amount,
      deposit_amount,
      remaining_amount,
      status: 'pending',
      deposit_status: 'pending',
      remaining_status: 'pending',
      booking_type,
      notes: notesParts.join(' | '),
    })
    .select('id')
    .single()

  if (bookingError || !booking) {
    if (bookingError?.message?.includes('Conflito de horário')) {
      return { error: 'Este horário acabou de ser reservado por outro cliente. Escolha outro.' }
    }
    return { error: 'Erro ao criar reserva. Tente novamente.' }
  }

  // Dispara o evento de expiração para o Inngest em background
  try {
    const { inngest } = await import('@/inngest/client')
    await inngest.send({
      name: 'booking.created',
      data: {
        bookingId: booking.id,
      },
    })
  } catch (inngestErr) {
    console.error('Erro ao enviar evento para o Inngest:', inngestErr)
  }

  redirect(`/reserva/pagamento/${booking.id}`)
}

// ─── Consulta de Reserva ─────────────────────────────────────────────────────

const consultSchema = z.object({
  phone: z.string().min(8, 'Telefone inválido'),
})

export async function consultBookingAction(
  _prev: { error: string; bookings?: unknown[] } | null,
  formData: FormData
) {
  const raw = { phone: formData.get('phone') }
  const parsed = consultSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, bookings: [] }
  }

  const rawPhone = parsed.data.phone.trim()
  const cleanPhone = normalizePhone(rawPhone)

  const supabase = createAdminClient()

  // Busca tanto pelo telefone normalizado (apenas dígitos) quanto pelo texto original de forma segura
  const phoneCandidates = Array.from(new Set([cleanPhone, rawPhone].filter(Boolean)))
  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .in('phone', phoneCandidates)

  if (!customers || customers.length === 0) {
    return { error: 'Nenhuma reserva encontrada para este telefone.', bookings: [] }
  }

  const customerIds = customers.map((c) => c.id)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, field:fields(name)')
    .in('customer_id', customerIds)
    .order('date', { ascending: false })
    .limit(10)

  // Busca contratos fixos de mensalista e suas mensalidades
  const { data: contracts } = await supabase
    .from('fixed_contracts')
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      duration_minutes,
      monthly_amount,
      is_active,
      field:fields(name),
      payments:fixed_payments(
        id,
        reference_month,
        amount,
        status,
        paid_at,
        payment_method
      )
    `)
    .in('customer_id', customerIds)
    .order('created_at', { ascending: false })

  const hasAny = (bookings && bookings.length > 0) || (contracts && contracts.length > 0)
  if (!hasAny) {
    return { error: 'Nenhuma reserva ou contrato de mensalista encontrado para este telefone.', bookings: [], contracts: [] }
  }

  return { error: '', bookings: bookings ?? [], contracts: contracts ?? [] }
}

// Busca uma reserva específica pelo ID (com joins de campo e cliente)
export async function getBookingById(id: string) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('bookings')
      .select('*, field:fields(*), customer:customers(*)')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  } catch {
    return null
  }
}

// Simula a confirmação de pagamento PIX (BLOQUEADO se ASAAS_API_KEY estiver ativa ou em produção)
export async function confirmSimulatedPixPayment(bookingId: string) {
  if (process.env.ASAAS_API_KEY || process.env.NODE_ENV === 'production') {
    return {
      error: 'Simulador de pagamento desativado em ambiente de produção. Realize o pagamento via PIX.',
    }
  }

  const supabase = createAdminClient()

  // Busca os dados completos da reserva (com relações de campo e cliente) para o e-mail
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('*, field:fields(*), customer:customers(*)')
    .eq('id', bookingId)
    .single()

  if (fetchErr || !booking) {
    return { error: 'Reserva não encontrada.' }
  }

  // Atualiza os status no banco de dados
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      deposit_status: 'paid',
    })
    .eq('id', bookingId)

  if (error) {
    return { error: error.message }
  }

  // Dispara o e-mail de confirmação para o cliente, alerta para o administrador e Web Push em background
  try {
    const { sendConfirmationEmail, sendAdminNewBookingEmail } = await import('@/lib/resend/emails')
    const { sendBookingConfirmedPush } = await import('@/lib/web-push/push')

    booking.status = 'confirmed'
    booking.deposit_status = 'paid'

    await sendConfirmationEmail(booking)
    await sendAdminNewBookingEmail(booking)
    await sendBookingConfirmedPush(booking)
  } catch (notifErr) {
    console.error('Erro ao disparar notificações de confirmação (e-mail/push):', notifErr)
  }

  revalidatePath(`/reserva/pagamento/${bookingId}`)
  return { success: true }
}

// Verifica o status em tempo real de uma reserva (usado para auto-redirect após PIX)
// Se ainda estiver pending no banco e tiver asaas_charge_id, consulta ativamente a API v3 do Asaas
export async function checkBookingStatusAction(bookingId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*, field:fields(*), customer:customers(*)')
    .eq('id', bookingId)
    .single()

  if (error || !data) {
    return { isConfirmed: false, status: 'pending' }
  }

  if (data.status === 'confirmed' || data.status === 'completed') {
    return {
      isConfirmed: true,
      status: data.status,
      depositStatus: data.deposit_status,
    }
  }

  // Consulta ativa na API do Asaas caso o pagamento já tenha sido compensado e o Webhook ainda não tenha chegado
  if (data.status === 'pending' && data.asaas_charge_id) {
    try {
      const { checkAsaasPaymentStatus } = await import('@/lib/asaas/client')
      const asaasCheck = await checkAsaasPaymentStatus(data.asaas_charge_id)

      if (asaasCheck.isPaid) {
        const { data: wasConfirmedNow } = await supabase.rpc('confirm_booking_payment', {
          p_booking_id: bookingId,
        })

        if (wasConfirmedNow) {
          try {
            const { sendConfirmationEmail, sendAdminNewBookingEmail } = await import('@/lib/resend/emails')
            const { sendBookingConfirmedPush } = await import('@/lib/web-push/push')

            data.status = 'confirmed'
            data.deposit_status = 'paid'

            await sendConfirmationEmail(data)
            await sendAdminNewBookingEmail(data)
            await sendBookingConfirmedPush(data)
          } catch (notifErr) {
            console.error('[checkBookingStatusAction] Erro ao disparar notificações:', notifErr)
          }
        }

        revalidatePath(`/reserva/pagamento/${bookingId}`)
        revalidatePath(`/reserva/confirmacao/${bookingId}`)
        return {
          isConfirmed: true,
          status: 'confirmed',
          depositStatus: 'paid',
        }
      }
    } catch (err) {
      console.warn('[checkBookingStatusAction] Falha ao consultar Asaas:', err)
    }
  }

  return {
    isConfirmed: false,
    status: data.status,
    depositStatus: data.deposit_status,
  }
}

// Consulta em tempo real o status de pagamento de uma mensalidade de mensalista
export async function checkContractPaymentPublicAction(paymentId: string) {
  const supabase = createAdminClient()
  const { data: payment, error } = await supabase
    .from('fixed_payments')
    .select('id, status, paid_at, payment_method, asaas_charge_id')
    .eq('id', paymentId)
    .single()

  if (error || !payment) return { isPaid: false }
  if (payment.status === 'paid') return { isPaid: true, paidAt: payment.paid_at }

  if (payment.asaas_charge_id) {
    try {
      const { checkAsaasPaymentStatus } = await import('@/lib/asaas/client')
      const check = await checkAsaasPaymentStatus(payment.asaas_charge_id)
      if (check.isPaid) {
        await supabase
          .from('fixed_payments')
          .update({
            status: 'paid',
            payment_method: 'PIX (Asaas)',
            paid_at: new Date().toISOString(),
          })
          .eq('id', paymentId)

        revalidatePath(`/mensalidade/${paymentId}`)
        return { isPaid: true, paidAt: new Date().toISOString() }
      }
    } catch (err) {
      console.error('[checkContractPaymentPublicAction] Erro Asaas:', err)
    }
  }

  return { isPaid: false }
}
