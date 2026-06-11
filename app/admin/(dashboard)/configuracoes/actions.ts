'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const settingsSchema = z.object({
  business_name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  business_phone: z.string().optional(),
  open_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  close_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  advance_booking_days: z.coerce.number().min(1).max(365),
  min_advance_hours: z.coerce.number().min(0).max(72),
  cancellation_hours: z.coerce.number().min(0).max(168),
  days_of_week: z.array(z.coerce.number()).min(1, 'Selecione ao menos um dia'),
})

export async function saveSettingsAction(formData: FormData) {
  // Coleta os dias selecionados (checkboxes)
  const daysRaw = formData.getAll('days_of_week').map(Number)

  const raw = {
    business_name: formData.get('business_name'),
    business_phone: formData.get('business_phone') || undefined,
    open_time: formData.get('open_time'),
    close_time: formData.get('close_time'),
    advance_booking_days: formData.get('advance_booking_days'),
    min_advance_hours: formData.get('min_advance_hours'),
    cancellation_hours: formData.get('cancellation_hours'),
    days_of_week: daysRaw,
  }

  const parsed = settingsSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  // Sempre atualiza o único registro de configurações
  const { error } = await supabase
    .from('settings')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .not('id', 'is', null)

  if (error) {
    return { error: `Erro ao salvar: ${error.message}`, success: false }
  }

  revalidatePath('/admin/configuracoes')
  return { success: true, error: '' }
}
