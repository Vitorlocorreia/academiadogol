'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evita hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        background: isDark ? 'rgba(26,107,46,0.15)' : 'rgba(26,107,46,0.08)',
        borderColor: isDark ? 'rgba(46,158,78,0.3)' : 'rgba(26,107,46,0.2)',
        color: isDark ? '#2e9e4e' : '#1A6B2E',
      }}
    >
      {isDark
        ? <Sun className="w-4 h-4" />
        : <Moon className="w-4 h-4" />
      }
    </button>
  )
}
