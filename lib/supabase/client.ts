import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicConfig } from './config'

// Cliente Supabase para uso em componentes client-side (browser)
export function createClient() {
  const { url, anonKey } = getSupabasePublicConfig()
  return createBrowserClient(url, anonKey)
}
