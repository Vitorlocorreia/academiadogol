'use client'

import { useState } from 'react'
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
  Menu,
  X,
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
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Top Navbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 w-full h-14 shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Academia do Gol"
            width={28}
            height={28}
            className="rounded-[4px] shrink-0"
          />
          <div>
            <span
              className="text-white font-black text-sm uppercase tracking-wider leading-none"
              style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
            >
              Academia do Gol
            </span>
            <span className="text-zinc-500 text-[10px] ml-1.5 uppercase font-semibold tracking-wider">Admin</span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-zinc-400 hover:text-white rounded-[2px] hover:bg-zinc-800/80 transition-colors"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full shrink-0 transition-transform duration-250 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and close button */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Academia do Gol"
              width={36}
              height={36}
              className="rounded-[4px] shrink-0"
            />
            <div>
              <p
                className="text-white font-black text-base leading-none uppercase tracking-wider"
                style={{ fontFamily: "'Bebas Neue', Arial Black, sans-serif" }}
              >
                Academia do Gol
              </p>
              <p className="text-zinc-500 text-xs mt-0.5">Painel Admin</p>
            </div>
          </div>
          
          {/* Close button on mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-[2px] transition-colors"
            aria-label="Fechar Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-ring)]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--brand)]' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer: usuário + logout */}
        <div className="px-3 py-4 border-t border-zinc-800 shrink-0">
          <div className="px-3 py-2 mb-2">
            <p className="text-zinc-500 text-xs truncate">{userEmail}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              id="btn-logout"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[4px] text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sair
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
