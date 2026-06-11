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
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/campos"
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Editar Campo</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{field.name}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <EditCampoForm field={field} />
      </div>
    </div>
  )
}
