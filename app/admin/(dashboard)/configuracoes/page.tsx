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
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-zinc-400 text-sm mt-1">Gerencie as configurações do sistema</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <SaveSettingsForm settings={settings} />
      </div>
    </div>
  )
}
