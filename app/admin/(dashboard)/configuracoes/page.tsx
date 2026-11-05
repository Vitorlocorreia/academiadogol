import { createClient } from '@/lib/supabase/server'
import type { Settings } from '@/lib/supabase/types'
import { SaveSettingsForm } from './save-form'
import { PushNotificationCard } from '@/components/admin/push-notification-card'

// Busca as configurações do sistema
async function getSettings(): Promise<Settings | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*').single()
  return data
}

export default async function ConfiguracoesPage() {
  const settings = await getSettings()

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 
          className="text-3xl font-black uppercase tracking-wider leading-none"
          style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif", color: 'var(--text-primary)' }}
        >
          Configurações
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Gerencie as preferências, notificações e regras do sistema</p>
      </div>

      {/* Card de Notificações Web Push no Dispositivo */}
      <PushNotificationCard />

      {/* Formulário Geral de Configurações */}
      <div 
        className="border rounded-[4px] p-6 shadow-sm"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <SaveSettingsForm settings={settings} />
      </div>
    </div>
  )
}
