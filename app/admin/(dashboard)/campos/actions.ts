'use server'

import { requireAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const fieldSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  description: z.string().optional(),
  photo_urls: z.string().transform((val) =>
    val ? val.split(',').map((v) => v.trim()).filter(Boolean) : []
  ),
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
  packages: z.string().optional().transform((val) => {
    if (!val) return []
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }),
})

function revalidateFieldPages() {
  revalidatePath('/')
  revalidatePath('/campos')
  revalidatePath('/admin/campos')
  revalidatePath('/admin/agenda')
}

// Action: criar campo
export async function createFieldAction(formData: FormData) {
  const { supabase } = await requireAdmin()

  const raw = {
    name: formData.get('name'),
    description: formData.get('description'),
    photo_urls: formData.get('photo_url') || '',
    hourly_rate: formData.get('hourly_rate'),
    deposit_type: formData.get('deposit_type'),
    deposit_value: formData.get('deposit_value'),
    duration_options: formData.get('duration_options') || '60,90,120,180,240',
    amenities: formData.get('amenities') || '',
    is_active: true,
    maps_url: formData.get('maps_url') ? String(formData.get('maps_url')) : null,
    packages: formData.get('packages') || '',
  }

  const parsed = fieldSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const insertData: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.packages && parsed.data.packages.length > 0) {
    const activeDurations = parsed.data.packages
      .filter((p: any) => p.is_active !== false)
      .map((p: any) => Number(p.duration_minutes))
      .filter((n: number) => !isNaN(n) && n > 0)
    if (activeDurations.length > 0) {
      insertData.duration_options = Array.from(new Set(activeDurations)).sort((a: number, b: number) => a - b)
    }
  }

  const { error } = await supabase.from('fields').insert(insertData)

  if (error) {
    return { error: `Erro ao criar campo: ${error.message}` }
  }

  revalidateFieldPages()
  redirect('/admin/campos')
}

// Action: atualizar campo
export async function updateFieldAction(id: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const raw = {
    name: formData.get('name'),
    description: formData.get('description'),
    photo_urls: formData.get('photo_url') || '',
    hourly_rate: formData.get('hourly_rate'),
    deposit_type: formData.get('deposit_type'),
    deposit_value: formData.get('deposit_value'),
    duration_options: formData.get('duration_options') || '60,90,120,180,240',
    amenities: formData.get('amenities') || '',
    is_active: formData.get('is_active') === 'true',
    maps_url: formData.get('maps_url') ? String(formData.get('maps_url')) : null,
    packages: formData.get('packages') || '',
  }

  const parsed = fieldSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const updateData: Record<string, unknown> = { ...parsed.data }
  if (!parsed.data.photo_urls || parsed.data.photo_urls.length === 0) {
    delete updateData.photo_urls
  }

  if (parsed.data.packages && parsed.data.packages.length > 0) {
    const activeDurations = parsed.data.packages
      .filter((p: any) => p.is_active !== false)
      .map((p: any) => Number(p.duration_minutes))
      .filter((n: number) => !isNaN(n) && n > 0)
    if (activeDurations.length > 0) {
      updateData.duration_options = Array.from(new Set(activeDurations)).sort((a: number, b: number) => a - b)
    }
  }

  const { error } = await supabase.from('fields').update(updateData).eq('id', id)

  if (error) {
    return { error: `Erro ao atualizar campo: ${error.message}` }
  }

  revalidateFieldPages()
  redirect('/admin/campos')
}

// Action: alternar status ativo/inativo
export async function toggleFieldActiveAction(id: string, currentStatus: boolean) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('fields')
    .update({ is_active: !currentStatus })
    .eq('id', id)

  if (error) {
    return { error: `Erro ao atualizar campo: ${error.message}` }
  }

  revalidateFieldPages()
}

// Action: deletar campo
export async function deleteFieldAction(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('fields').delete().eq('id', id)

  if (error) {
    return { error: `Erro ao deletar campo: ${error.message}` }
  }

  revalidateFieldPages()
}

// Action: upload de foto do campo no Supabase Storage
export async function uploadFieldPhotoAction(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { supabase } = await requireAdmin()
    const file = formData.get('file') as File | null
    if (!file || file.size === 0) {
      return { success: false, error: 'Nenhum arquivo enviado.' }
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'O arquivo selecionado deve ser uma imagem válida (JPG, PNG, WebP).' }
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'O tamanho da imagem não pode ultrapassar 10MB.' }
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `campo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('fields')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return { success: false, error: `Falha no upload: ${uploadError.message}` }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('fields')
      .getPublicUrl(fileName)

    return { success: true, url: publicUrl }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado ao fazer upload da foto.' }
  }
}

// Action: vincular foto diretamente a um campo existente
export async function updateFieldPhotoAction(fieldId: string, photoUrl: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('fields')
    .update({ photo_urls: [photoUrl] })
    .eq('id', fieldId)

  if (error) {
    return { error: `Erro ao atualizar foto: ${error.message}` }
  }

  revalidateFieldPages()
  return { success: true }
}
