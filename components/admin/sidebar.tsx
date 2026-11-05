'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/admin/actions'
import { ThemeToggle } from '@/components/public/theme-toggle'
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
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 w-full h-14 shrink-0 z-30 transition-colors"
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
        }}
      >
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
              className="font-black text-sm uppercase tracking-wider leading-none"
              style={{
                fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                color: 'var(--text-primary)',
              }}
            >
              Academia do Gol
            </span>
            <span
              className="text-[10px] ml-1.5 uppercase font-semibold tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-[2px] transition-colors cursor-pointer"
            style={{
              color: 'var(--text-secondary)',
            }}
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
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
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col h-full shrink-0 transition-transform duration-250 ease-in-out md:static md:translate-x-0`}
        style={{
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          transform: isOpen ? 'translateX(0)' : undefined,
        }}
      >
        {/* Logo and close button */}
        <div
          className="px-6 py-5 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
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
                className="font-black text-base leading-none uppercase tracking-wider"
                style={{
                  fontFamily: "'Bebas Neue', Arial Black, sans-serif",
                  color: 'var(--text-primary)',
                }}
              >
                Academia do Gol
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Painel Admin
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 rounded-[2px] transition-colors cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Fechar Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-semibold transition-all duration-150 group"
                style={{
                  background: isActive ? 'var(--brand-subtle)' : 'transparent',
                  color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--brand-ring)' : '1px solid transparent',
                }}
              >
                <Icon
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                  }}
                />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer: usuário + tema + logout */}
        <div
          className="px-4 py-4 space-y-3 shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs truncate font-mono" style={{ color: 'var(--text-muted)' }}>
                {userEmail}
              </p>
            </div>
            <ThemeToggle />
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              id="btn-logout"
              className="flex items-center gap-3 w-full px-3 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sair da Conta
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
