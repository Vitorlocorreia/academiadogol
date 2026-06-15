'use client'

import { useActionState } from 'react'
import { loginAction } from '../actions'
import { Shield } from 'lucide-react'

const initialState = { error: '' }

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await loginAction(formData)
      return result ?? initialState
    },
    initialState
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[4px] bg-[var(--brand-subtle)] border border-[var(--brand-ring)] mb-4">
            <Shield className="w-8 h-8 text-[var(--brand)]" />
          </div>
          <h1 
            className="text-4xl font-black text-white uppercase tracking-wider leading-none"
            style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
          >
            Academia do Gol
          </h1>
          <p className="text-zinc-400 text-xs uppercase tracking-widest mt-1.5" style={{ letterSpacing: '0.1em' }}>
            Painel Administrativo
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-[4px] p-8 shadow-2xl">
          <h2 
            className="text-2xl font-black text-white uppercase tracking-wider mb-6"
            style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
          >
            Entrar na conta
          </h2>

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Usuário ou E-mail
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                required
                placeholder="Ex: acaddogol"
                className="input-admin"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="input-admin"
              />
            </div>

            {state?.error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-[2px] text-red-400 text-sm">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              id="btn-login"
              className="w-full py-2.5 px-4 bg-[var(--brand)] hover:bg-[var(--brand-dark)] disabled:opacity-50 text-white font-semibold rounded-[4px] text-sm transition-all duration-200 mt-2 uppercase tracking-widest font-bold"
              style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif", fontSize: '1.1rem' }}
            >
              {isPending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Jota Esportivo © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
