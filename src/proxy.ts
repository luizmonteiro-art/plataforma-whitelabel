/**
 * Middleware de autenticação — protege todas as rotas /admin/* exceto /admin/login.
 * Usa @supabase/ssr para verificar a sessão do usuário via cookies.
 * Se o Supabase não estiver configurado (env vars vazios), deixa passar
 * para não quebrar em ambientes de build/preview sem credenciais.
 */
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Não protege a própria tela de login
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const configured = url.startsWith('http') && key.length > 10

  // Sem credenciais → ambiente de build/dev sem .env → deixa passar
  if (!configured) {
    return NextResponse.next()
  }

  // Cria um response mutável para que o helper possa atualizar os cookies de sessão
  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // getUser() valida o token com o servidor Supabase (não apenas o cookie local)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  // Aplica o middleware apenas nas rotas do admin
  matcher: ['/admin/:path+'],
}
