import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  return (
    <div
      className="flex flex-col md:flex-row h-screen overflow-hidden transition-colors duration-200"
      style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}
    >
      <AdminSidebar userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}
