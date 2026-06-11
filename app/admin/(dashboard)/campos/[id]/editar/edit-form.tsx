'use client'

import { useActionState } from 'react'
import { updateFieldAction } from '../../actions'
import { CampoForm } from '@/components/admin/campo-form'
import type { Field } from '@/lib/supabase/types'

const initialState = { error: '' }

interface Props {
  field: Field
}

export function EditCampoForm({ field }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await updateFieldAction(field.id, formData)
      return result ?? initialState
    },
    initialState
  )

  return (
    <>
      {state?.error && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {state.error}
        </div>
      )}
      <CampoForm formAction={formAction} isPending={isPending} field={field} />
    </>
  )
}
