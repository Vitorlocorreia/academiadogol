import { redirect } from 'next/navigation'

// Redireciona a raiz do admin para a agenda
export default function AdminPage() {
  redirect('/admin/agenda')
}
