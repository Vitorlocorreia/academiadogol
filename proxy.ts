import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

// Proxy do Next.js 16: protege todas as rotas /admin/* exceto /admin/login
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginRoute = pathname === '/admin/login'

  if (!isAdminRoute) {
    return supabaseResponse
  }

  const { url: supabaseUrl, anonKey } = getSupabasePublicConfig()

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Atualiza sessão do usuário com tratamento seguro de erro de rede
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    user = null
  }

  // Redireciona para login se acessar área admin sem autenticação
  if (isAdminRoute && !isLoginRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Redireciona para agenda se já autenticado e tentar acessar login
  if (isLoginRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/agenda'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// Exporta por padrão também para garantir compatibilidade
export default proxy

export const config = {
  matcher: [
    // Aplica proxy em todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
