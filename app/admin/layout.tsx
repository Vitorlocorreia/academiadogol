import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Painel Admin | Academia do Gol',
  description: 'Painel administrativo e gestão da Academia do Gol',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
