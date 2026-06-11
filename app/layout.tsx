import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'

// Bebas Neue via link HTML (sem next/font — evita hydration warnings com display font)
const BEBAS_NEUE_URL = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'

export const metadata: Metadata = {
  title: 'Academia do Gol | Aluguel de Campos de Futebol',
  description: 'Reserve seu campo de futebol online com facilidade. 7 campos disponíveis, horários flexíveis e pagamento via PIX.',
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
