import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditCampoForm } from './edit-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarCampoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: field, error } = await supabase
    .from('fields')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !field) {
    notFound()
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/campos"
          className="flex items-center justify-center w-9 h-9 rounded-[4px] border transition-all"
          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Editar Campo</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{field.name}</p>
        </div>
      </div>

      <div 
        className="border rounded-[4px] p-6 shadow-sm"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <EditCampoForm field={field} />
      </div>
    </div>
  )
}
