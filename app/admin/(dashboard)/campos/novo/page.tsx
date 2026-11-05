'use client'

import { useActionState } from 'react'
import { createFieldAction } from '../actions'
import { CampoForm } from '@/components/admin/campo-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const initialState = { error: '' }

export default function NovoCampoPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await createFieldAction(formData)
      return result ?? initialState
    },
    initialState
  )

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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Novo Campo</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Cadastre um novo campo no complexo</p>
        </div>
      </div>

      <div 
        className="border rounded-[4px] p-6 shadow-sm"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {state?.error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-[4px] text-red-500 text-sm">
            {state.error}
          </div>
        )}
        <CampoForm formAction={formAction} isPending={isPending} />
      </div>
    </div>
  )
}
