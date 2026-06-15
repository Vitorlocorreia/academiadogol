import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Settings } from '@/lib/supabase/types'
import { SaveSettingsForm } from './save-form'

// Busca as configurações do sistema
async function getSettings(): Promise<Settings | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').single()
  return data
}

export default async function ConfiguracoesPage() {
  const settings = await getSettings()

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 
          className="text-3xl font-black text-white uppercase tracking-wider leading-none"
          style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
        >
          Configurações
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Gerencie as configurações do sistema</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-6">
        <SaveSettingsForm settings={settings} />
      </div>
    </div>
  )
}
