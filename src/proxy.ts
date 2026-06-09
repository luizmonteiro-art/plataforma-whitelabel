/**
 * middleware.ts — Middleware central da plataforma white-label.
 *
 * Responsabilidades:
 * 1. Resolver a loja pelo subdomínio (ex.: mcell.plataforma.com → store_id + plan_id).
 * 2. Injetar x-store-id e x-store-plan nos headers para db.ts usar.
 * 3. Redirecionar para /loja-inativa se a loja não estiver ativa ou o trial tiver expirado.
 * 4. Proteger rotas /admin/* (requer autenticação Supabase).
 * 5. Rotas da plataforma em si (/, /captacao, /superadmin) passam diretamente.
 *
 * Dev local: usar query param ?store=<slug> como fallback de subdomínio.
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const SUPABASE_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const PLATFORM_HOST = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? 'plataforma.com'
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL ?? ''

const supabaseConfigured = SUPABASE_URL.startsWith('http') && SUPABASE_KEY.length > 10

/** Extrai o slug da loja do host ou do query param ?store= */
function resolveSlug(request: NextRequest): string | null {
  // Dev local: ?store=mcell
  const fromQuery = request.nextUrl.searchParams.get('store')
  if (fromQuery) return fromQuery

  const host = request.headers.get('host') ?? ''
  // mcell.plataforma.com → "mcell" (quando houver domínio/subdomínio próprio)
  if (host.endsWith(`.${PLATFORM_HOST}`)) {
    return host.replace(`.${PLATFORM_HOST}`, '').split('.')[0] || null
  }

  // Sem subdomínio (acesso por ?store= no domínio base, ex.: *.vercel.app): os
  // links internos perdem o ?store=, então mantemos a loja "fixada" por cookie.
  // Vale TAMBÉM em produção — é o que permite navegar na loja e abrir o admin
  // sem um subdomínio próprio. Troca-se de loja visitando outro ?store=slug.
  const fromCookie = request.cookies.get('store_slug')?.value
  if (fromCookie) return fromCookie

  return null
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Rotas exclusivas da plataforma (não dependem de loja) ────────
  // /superadmin tem auth própria (e-mail do Luiz)
  if (pathname.startsWith('/superadmin')) {
    if (pathname === '/superadmin/login') return NextResponse.next()
    return handleSuperadminAuth(request)
  }
  const isPlatformOnly = ['/captacao', '/loja-inativa', '/api'].some(
    prefix => pathname === prefix || pathname.startsWith(prefix + '/')
  )
  if (isPlatformOnly) return NextResponse.next()

  // ── 1. Resolver o slug da loja (subdomínio ou ?store=) ───────────
  const slug = resolveSlug(request)

  if (!slug) {
    // Host base da plataforma (sem subdomínio): a raiz serve a landing de
    // captação; qualquer outra rota volta para a home da plataforma.
    const url = request.nextUrl.clone()
    if (pathname === '/') {
      url.pathname = '/captacao'
      return NextResponse.rewrite(url)
    }
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // ── 2. Buscar store no banco ─────────────────────────────────────
  if (!supabaseConfigured) {
    // Sem credenciais (build/preview) → injeta placeholder e deixa passar
    const response = NextResponse.next()
    response.headers.set('x-store-id', 'preview-store-id')
    response.headers.set('x-store-plan', 'master')
    return response
  }

  // resolve_store é uma função SECURITY DEFINER no Postgres: resolve a loja pelo
  // slug retornando só campos não sensíveis (sem admin_email), permitindo que a
  // chave anon faça a resolução mesmo com RLS owner-only ativo em `stores`.
  const { data: rows } = await createSupabaseClient(request)
    .rpc('resolve_store', { p_slug: slug })
  const store = Array.isArray(rows) ? rows[0] : rows

  if (!store) {
    const url = request.nextUrl.clone()
    url.pathname = '/loja-inativa'
    return NextResponse.redirect(url)
  }

  // ── 3. Verificar se a loja está ativa / trial válido ─────────────
  const trialOk = !store.trial_expires_at || new Date(store.trial_expires_at) > new Date()
  if (!store.is_active && !trialOk) {
    const url = request.nextUrl.clone()
    url.pathname = '/loja-inativa'
    return NextResponse.redirect(url)
  }

  // ── 4. Proteger /admin (exceto /admin/login) ─────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return handleAdminAuth(request, store.id, store.plan_id)
  }

  // ── 5. Injetar headers e continuar ──────────────────────────────
  const response = NextResponse.next()
  response.headers.set('x-store-id', store.id)
  response.headers.set('x-store-plan', store.plan_id)
  // Dev: fixa a loja para as próximas navegações (os links perdem o ?store=).
  const querySlug = request.nextUrl.searchParams.get('store')
  if (querySlug) response.cookies.set('store_slug', querySlug, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 })
  return response
}

// ─── Auth: admin da loja ─────────────────────────────────────────────────────

async function handleAdminAuth(request: NextRequest, storeId: string, planId: string) {
  if (!supabaseConfigured) {
    const response = NextResponse.next()
    response.headers.set('x-store-id', storeId)
    response.headers.set('x-store-plan', planId)
    return response
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Defense-in-depth: o usuário está logado, mas é o DONO desta loja?
  // (A RLS já protege os dados; isto evita exibir o shell do admin de outra loja.)
  const { data: owns } = await supabase.rpc('owns_store', { p_store_id: storeId })
  if (!owns) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  response.headers.set('x-store-id', storeId)
  response.headers.set('x-store-plan', planId)
  // Dev: mantém a loja fixada nas próximas navegações do painel.
  const querySlug = request.nextUrl.searchParams.get('store')
  if (querySlug) response.cookies.set('store_slug', querySlug, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 })
  return response
}

// ─── Auth: superadmin (o Luiz) ───────────────────────────────────────────────

async function handleSuperadminAuth(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (SUPERADMIN_EMAIL && user.email !== SUPERADMIN_EMAIL)) {
    const loginUrl = new URL('/superadmin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

// ─── Cliente Supabase sem SSR (só queries, sem auth cookies) ─────────────────

function createSupabaseClient(request: NextRequest) {
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll() {},
    },
  })
}

// ─── Matcher ─────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    // Aplica em tudo, exceto arquivos estáticos e _next internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
