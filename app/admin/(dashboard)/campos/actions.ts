'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const fieldSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  description: z.string().optional(),
  hourly_rate: z.coerce.number().min(0, 'Valor inválido'),
  deposit_type: z.enum(['fixed', 'percentage']),
  deposit_value: z.coerce.number().min(0, 'Valor inválido'),
  duration_options: z.string().transform((val) =>
    val.split(',').map((v) => parseInt(v.trim())).filter((n) => !isNaN(n))
  ),
  amenities: z.string().transform((val) =>
    val ? val.split(',').map((v) => v.trim()).filter(Boolean) : []
  ),
  is_active: z.coerce.boolean().optional().default(true),
  maps_url: z.string().optional().nullable(),
})

// Action: criar campo
export async function createFieldAction(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    description: formData.get('description'),
    hourly_rate: formData.get('hourly_rate'),
    deposit_type: formData.get('deposit_type'),
    deposit_value: formData.get('deposit_value'),
    duration_options: formData.get('duration_options') || '60,90,120',
    amenities: formData.get('amenities') || '',
    is_active: true,
    maps_url: formData.get('maps_url') ? String(formData.get('maps_url')) : null,
  }

  const parsed = fieldSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('fields').insert(parsed.data)

  if (error) {
    return { error: `Erro ao criar campo: ${error.message}` }
  }

  revalidatePath('/admin/campos')
  redirect('/admin/campos')
}

// Action: atualizar campo
export async function updateFieldAction(id: string, formData: FormData) {
  const raw = {
    name: formData.get('name'),
    description: formData.get('description'),
    hourly_rate: formData.get('hourly_rate'),
    deposit_type: formData.get('deposit_type'),
    deposit_value: formData.get('deposit_value'),
    duration_options: formData.get('duration_options') || '60,90,120',
    amenities: formData.get('amenities') || '',
    is_active: formData.get('is_active') === 'true',
    maps_url: formData.get('maps_url') ? String(formData.get('maps_url')) : null,
  }

  const parsed = fieldSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('fields').update(parsed.data).eq('id', id)

  if (error) {
    return { error: `Erro ao atualizar campo: ${error.message}` }
  }

  revalidatePath('/admin/campos')
  redirect('/admin/campos')
}

// Action: alternar status ativo/inativo
export async function toggleFieldActiveAction(id: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('fields')
    .update({ is_active: !currentStatus })
    .eq('id', id)

  if (error) {
    return { error: `Erro ao atualizar campo: ${error.message}` }
  }

  revalidatePath('/admin/campos')
}

// Action: deletar campo
export async function deleteFieldAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('fields').delete().eq('id', id)

  if (error) {
    return { error: `Erro ao deletar campo: ${error.message}` }
  }

  revalidatePath('/admin/campos')
}
