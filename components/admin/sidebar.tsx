'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/admin/actions'
import {
  CalendarDays,
  LayoutGrid,
  ScrollText,
  BarChart3,
  Settings,
  LogOut,
  ClipboardList,
} from 'lucide-react'

const navItems = [
  { href: '/admin/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/admin/reservas', label: 'Reservas', icon: ClipboardList },
  { href: '/admin/campos', label: 'Campos', icon: LayoutGrid },
  { href: '/admin/contratos', label: 'Contratos Fixos', icon: ScrollText },
  { href: '/admin/financeiro', label: 'Financeiro', icon: BarChart3 },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

interface AdminSidebarProps {
  userEmail: string
}

export function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Academia do Gol"
            width={36}
            height={36}
            className="rounded-lg shrink-0"
          />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Academia do Gol</p>
            <p className="text-zinc-500 text-xs">Painel Admin</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: usuário + logout */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <div className="px-3 py-2 mb-2">
          <p className="text-zinc-500 text-xs truncate">{userEmail}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            id="btn-logout"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
