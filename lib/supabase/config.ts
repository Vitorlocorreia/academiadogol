// Configuração centralizada do projeto Supabase ativo da Academia do Gol
// Garante fallback automático caso o ambiente tenha a URL antiga inativa em cache

const ACTIVE_SUPABASE_URL = 'https://xqackyuxipcxvmliecow.supabase.co'
const ACTIVE_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYWNreXV4aXBjeHZtbGllY293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NzgwODMsImV4cCI6MjA5OTQ1NDA4M30.Xv316dO_8QrCpnIqTkcodq_wkuU93ESE8ZOJF5ajFSk'

const LEGACY_INACTIVE_REFS = ['htceohtpkltnbgkguggz', 'pausado']

export function getSupabasePublicConfig(): { url: string; anonKey: string } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  const isLegacyOrMissing =
    !envUrl ||
    !envAnonKey ||
    LEGACY_INACTIVE_REFS.some((ref) => envUrl.includes(ref))

  if (isLegacyOrMissing) {
    return {
      url: ACTIVE_SUPABASE_URL,
      anonKey: ACTIVE_SUPABASE_ANON_KEY,
    }
  }

  return {
    url: envUrl,
    anonKey: envAnonKey,
  }
}
