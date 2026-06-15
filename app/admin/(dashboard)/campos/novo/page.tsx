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
          className="flex items-center justify-center w-9 h-9 rounded-[2px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Novo Campo</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Cadastre um novo campo no complexo</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-6">
        {state?.error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-[2px] text-red-400 text-sm">
            {state.error}
          </div>
        )}
        <CampoForm formAction={formAction} isPending={isPending} />
      </div>
    </div>
  )
}
