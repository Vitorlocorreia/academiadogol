// Configuração centralizada do projeto Supabase oficial da Academia do Gol (htceohtpkltnbgkguggz)

const ACTIVE_SUPABASE_URL = 'https://htceohtpkltnbgkguggz.supabase.co'
const ACTIVE_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Y2VvaHRwa2x0bmJna2d1Z2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MTU5MDQsImV4cCI6MjEwNjM5MTkwNH0.zjHYoC-dZ5Al5Qij6kh0G60UvcxB91DGBz4IkLazd2w'

export function getSupabasePublicConfig(): { url: string; anonKey: string } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!envUrl || !envAnonKey) {
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
