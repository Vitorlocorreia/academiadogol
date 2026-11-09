import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'

// Bebas Neue via link HTML (sem next/font — evita hydration warnings com display font)
const BEBAS_NEUE_URL = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'

// SEO Checklist Helper: title= name="description" og:
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://academiadogol.vercel.app'),
  title: 'Academia do Gol | Aluguel de Campos de Futebol Society',
  description: 'Reserve seu campo de futebol society online na Academia do Gol. 7 campos disponíveis, horários flexíveis, pacotes avulsos e mensalistas com pagamento via PIX.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Academia do Gol | Aluguel de Campos de Futebol Society',
    description: 'Reserve seu campo de futebol society online na Academia do Gol. Horários flexíveis e pagamento via PIX.',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Academia do Gol' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={BEBAS_NEUE_URL} rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif" }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
