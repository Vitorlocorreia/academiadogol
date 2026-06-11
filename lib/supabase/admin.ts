import { createClient } from '@supabase/supabase-js'

/**
 * Cria um cliente Supabase com privilégios administrativos (bypass RLS)
 * se a chave SUPABASE_SERVICE_ROLE_KEY estiver definida no ambiente.
 * Caso contrário, retorna um cliente padrão anon key para uso com RPC.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Variável NEXT_PUBLIC_SUPABASE_URL ausente no ambiente.')
  }

  const keyToUse = serviceKey || anonKey
  if (!keyToUse) {
    throw new Error('Chave do Supabase (service_role ou anon) ausente no ambiente.')
  }

  return createClient(supabaseUrl, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
