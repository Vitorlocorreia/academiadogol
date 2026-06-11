'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().min(3, 'Usuário ou E-mail muito curto'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

// Action: login do administrador
export async function loginAction(formData: FormData) {
  let emailInput = (formData.get('email') as string || '').trim()
  const password = formData.get('password') as string

  if (emailInput && !emailInput.includes('@')) {
    emailInput = `${emailInput}@academiadogol.com.br`
  }

  const parsed = loginSchema.safeParse({ email: emailInput, password })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: emailInput,
    password,
  })

  if (error) {
    return { error: 'Usuário ou senha inválidos.' }
  }

  redirect('/admin/agenda')
}

// Action: logout do administrador
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
