// Layout da área pública — header mobile-first + footer

import Link from 'next/link'
import Image from 'next/image'
import { PublicHeader } from '@/components/public/public-header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <PublicHeader />

      {/* Conteúdo */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
            {/* Marca */}
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Academia do Gol" width={40} height={40} className="rounded-full" />
              <div>
                <p className="text-sm font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                  Academia do Gol
                </p>
                <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Futebol Society
                </p>
              </div>
            </div>

            {/* Links de contato */}
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://wa.me/5581999096142"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70 font-medium flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                📱 WhatsApp
              </a>
              <a
                href="https://www.instagram.com/academia_do_gol/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70 font-medium flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                📷 Instagram
              </a>
              <Link
                href="/reserva/consultar"
                className="transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                Consultar Reserva
              </Link>
            </div>

            {/* Copyright e Créditos */}
            <div className="flex flex-col gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <p>
                © {new Date().getFullYear()} Academia do Gol. Todos os direitos reservados.
              </p>
              <p>
                Desenvolvido por{' '}
                <a href="https://instagram.com/dev.vitorcorreia" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity font-medium" style={{ color: 'var(--brand)' }}>@dev.vitorcorreia</a>
                {' / '}
                <a href="https://instagram.com/jotaesportivo" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity font-medium" style={{ color: 'var(--brand)' }}>@jotaesportivo</a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
