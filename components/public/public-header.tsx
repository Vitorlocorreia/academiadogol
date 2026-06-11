'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Sun, Moon, X, Ticket } from 'lucide-react'

const NAV_LINKS = [
  { href: '/#campos', label: 'Campos' },
  { href: '/campos', label: 'Ver Todos os Campos' },
  { href: '/reserva/consultar', label: 'Minha Reserva' },
]

const CONTACT_LINKS = [
  { href: 'https://wa.me/5581999096142', label: '(81) 99909-6142', icon: '📱', external: true },
  { href: 'https://www.instagram.com/academia_do_gol/', label: '@academia_do_gol', icon: '📷', external: true },
]

// ── Hamburguer Icon ──────────────────────────────────────────
function HamburgerIcon() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="currentColor">
      <rect y="0" width="22" height="2" rx="1"/>
      <rect y="7" width="16" height="2" rx="1"/>
      <rect y="14" width="22" height="2" rx="1"/>
    </svg>
  )
}

// ── Header Mobile (< sm) ─────────────────────────────────────
export function PublicHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = theme === 'dark'

  // Fecha ao pressionar Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Bloqueia scroll quando drawer abre
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full backdrop-blur-xl"
        style={{
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border)',
        }}
      >
        {/* ── MOBILE header (< sm) ────────────────────────── */}
        <div className="flex sm:hidden items-center justify-between px-4 h-16">
          {/* Hamburguer */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors hover:opacity-70"
            style={{ color: 'var(--text-primary)' }}
          >
            <HamburgerIcon />
          </button>

          {/* Logo centralizado */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Image
              src="/logo.png"
              alt="Academia do Gol"
              width={52}
              height={52}
              priority
              className="rounded-full"
              style={{ boxShadow: '0 2px 12px rgba(26,107,46,0.2)' }}
            />
          </Link>

          {/* Ícone consultar reserva */}
          <Link
            href="/reserva/consultar"
            aria-label="Consultar reserva"
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors hover:opacity-70"
            style={{ color: 'var(--text-primary)' }}
          >
            <Ticket className="w-5 h-5" />
          </Link>
        </div>

        {/* ── DESKTOP header (≥ sm) ───────────────────────── */}
        <div className="hidden sm:flex items-center justify-between max-w-7xl mx-auto px-6 lg:px-12 h-16">
          {/* Logo + Nome */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Academia do Gol"
              width={40}
              height={40}
              priority
              className="rounded-full"
            />
            <span
              className="font-bold text-lg tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Academia do Gol
            </span>
          </Link>

          {/* Nav + controles */}
          <div className="flex items-center gap-5">
            <nav className="flex items-center gap-6">
              <Link
                href="/#campos"
                className="text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-secondary)' }}
              >
                Campos
              </Link>
              <Link
                href="/reserva/consultar"
                className="text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-secondary)' }}
              >
                Minha Reserva
              </Link>
            </nav>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
                className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-200 hover:scale-105"
                style={{
                  background: isDark ? 'rgba(26,107,46,0.15)' : 'rgba(26,107,46,0.08)',
                  borderColor: isDark ? 'rgba(46,158,78,0.3)' : 'rgba(26,107,46,0.2)',
                  color: isDark ? '#2e9e4e' : '#1A6B2E',
                }}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <Link
              href="/campos"
              className="px-4 py-2 text-white text-sm font-bold transition-all duration-200 hover:opacity-90"
              style={{ background: 'var(--brand)', borderRadius: '2px' }}
            >
              Reservar Agora
            </Link>
          </div>
        </div>
      </header>

      {/* ── DRAWER MOBILE ───────────────────────────────────── */}
      {/* Overlay */}
      <div
        onClick={() => setDrawerOpen(false)}
        className="fixed inset-0 z-[60] transition-all duration-300"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'all' : 'none',
        }}
      />

      {/* Painel */}
      <div
        className="fixed top-0 left-0 bottom-0 z-[70] flex flex-col w-[280px] transition-transform duration-300 ease-out"
        style={{
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Cabeçalho do drawer */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Academia do Gol" width={36} height={36} className="rounded-full" />
            <div>
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                Academia do Gol
              </p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Futebol Society
              </p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Fechar menu"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Navegação
          </p>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg font-medium text-sm transition-all hover:opacity-80"
              style={{ color: 'var(--text-primary)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--brand)' }}
              />
              {link.label}
            </Link>
          ))}

          <div
            className="my-3"
            style={{ borderTop: '1px solid var(--border)' }}
          />

          <p
            className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Contato
          </p>
          {CONTACT_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>{link.icon}</span>
              {link.label}
            </a>
          ))}
        </nav>

        {/* Tema toggle na base */}
        <div
          className="px-5 py-5"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {mounted && (
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              {isDark
                ? <Sun className="w-4 h-4 shrink-0" style={{ color: 'var(--brand)' }} />
                : <Moon className="w-4 h-4 shrink-0" style={{ color: 'var(--brand)' }} />
              }
              {isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
