import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from './config'

function isKeyMatchingUrl(jwt: string | undefined, url: string | undefined): boolean {
  if (!jwt || !url) return false
  try {
    const parts = jwt.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
    if (payload.ref && !url.includes(payload.ref)) {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Cria um cliente Supabase com privilégios administrativos (bypass RLS)
 * se a chave SUPABASE_SERVICE_ROLE_KEY estiver definida e pertencer ao mesmo projeto.
 * Caso contrário, retorna um cliente padrão anon key conectado ao projeto ativo.
 */
export function createAdminClient() {
  const { url: supabaseUrl, anonKey } = getSupabasePublicConfig()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const validServiceKey = isKeyMatchingUrl(serviceKey, supabaseUrl) ? serviceKey : undefined
  const keyToUse = validServiceKey || anonKey

  return createClient(supabaseUrl, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
