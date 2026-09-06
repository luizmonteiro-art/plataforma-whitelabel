/**
 * Middleware central da plataforma white-label.
 *
 * Responsabilidades:
 * 1. Resolver a loja pelo subdominio, query param ou cookie.
 * 2. Injetar x-store-id e x-store-plan para o app.
 * 3. Redirecionar para /loja-inativa quando a loja nao puder operar.
 * 4. Proteger /admin/* com autenticacao Supabase.
 * 5. Proteger /superadmin com autenticacao e e-mail do superadmin.
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const PLATFORM_HOST = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? 'plataforma.com'
const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL ?? '').trim().toLowerCase()

const supabaseConfigured = SUPABASE_URL.startsWith('http') && SUPABASE_KEY.length > 10

function isLocalDevPreview(request: NextRequest) {
  const hostname = request.nextUrl.hostname
  return process.env.NODE_ENV !== 'production'
    && (hostname === 'localhost' || hostname === '127.0.0.1')
}

function misconfiguredResponse(scope: 'loja' | 'admin' | 'superadmin') {
  const label = scope === 'loja'
    ? 'loja'
    : scope === 'admin'
      ? 'painel da loja'
      : 'superadmin'

  return new NextResponse(
    `Configuracao do servidor ausente para ${label}. Verifique as variaveis do Supabase.`,
    { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
  )
}

function resolveSlug(request: NextRequest): string | null {
  const fromQuery = request.nextUrl.searchParams.get('store')
  if (fromQuery) return fromQuery

  const host = request.headers.get('host') ?? ''
  if (host.endsWith(`.${PLATFORM_HOST}`)) {
    return host.replace(`.${PLATFORM_HOST}`, '').split('.')[0] || null
  }

  const fromCookie = request.cookies.get('store_slug')?.value
  if (fromCookie) return fromCookie

  return null
}

function storeResponse(request: NextRequest, storeId: string, planId: string) {
  const headers = new Headers(request.headers)
  headers.set('x-store-id', storeId)
  headers.set('x-store-plan', planId)
  return NextResponse.next({ request: { headers } })
}

function loginRedirect(request: NextRequest, response: NextResponse, path: string) {
  const url = new URL(path, request.url)
  if (path === '/admin/login') {
    const slug = resolveSlug(request)
    if (slug) url.searchParams.set('store', slug)
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
  }
  const redirect = NextResponse.redirect(url)
  response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie))
  return redirect
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/superadmin')) {
    if (pathname === '/superadmin/login') return NextResponse.next()
    return handleSuperadminAuth(request)
  }

  const isPlatformOnly = ['/captacao', '/loja-inativa', '/api'].some(
    prefix => pathname === prefix || pathname.startsWith(prefix + '/'),
  )
  if (isPlatformOnly) return NextResponse.next()

  const slug = resolveSlug(request)

  if (!slug) {
    const url = request.nextUrl.clone()
    if (pathname === '/') {
      url.pathname = '/captacao'
      return NextResponse.rewrite(url)
    }
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (!supabaseConfigured) {
    if (!isLocalDevPreview(request)) return misconfiguredResponse('loja')

    // Local preview sem Supabase: libera a casca visual para modelagem.
    return storeResponse(request, 'preview-store-id', 'master')
  }

  const { data: rows, error } = await createSupabaseClient(request)
    .rpc('resolve_store', { p_slug: slug })
  if (error) return new NextResponse('Não foi possível consultar a loja. Tente novamente.', { status: 503 })
  const store = Array.isArray(rows) ? rows[0] : rows

  if (!store) {
    const url = request.nextUrl.clone()
    url.pathname = '/loja-inativa'
    return NextResponse.redirect(url)
  }

  const trialOk = !!store.trial_expires_at && new Date(store.trial_expires_at) > new Date()
  if (!store.is_active && !trialOk) {
    const url = request.nextUrl.clone()
    url.pathname = '/loja-inativa'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return handleAdminAuth(request, store.id, store.plan_id)
  }

  const response = storeResponse(request, store.id, store.plan_id)
  const querySlug = request.nextUrl.searchParams.get('store')
  if (querySlug) {
    response.cookies.set('store_slug', querySlug, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    })
  }
  return response
}

async function handleAdminAuth(request: NextRequest, storeId: string, planId: string) {
  if (!supabaseConfigured) {
    if (!isLocalDevPreview(request)) return misconfiguredResponse('admin')

    return storeResponse(request, storeId, planId)
  }

  let response = storeResponse(request, storeId, planId)

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        const previousCookies = response.cookies.getAll()
        response = storeResponse(request, storeId, planId)
        previousCookies.forEach(cookie => response.cookies.set(cookie))
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return loginRedirect(request, response, '/admin/login')
  }

  const { data: owns } = await supabase.rpc('owns_store', { p_store_id: storeId })
  if (!owns) {
    return loginRedirect(request, response, '/admin/login')
  }

  const querySlug = request.nextUrl.searchParams.get('store')
  if (querySlug) {
    response.cookies.set('store_slug', querySlug, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    })
  }
  return response
}

async function handleSuperadminAuth(request: NextRequest) {
  if (!SUPERADMIN_EMAIL && !isLocalDevPreview(request)) return misconfiguredResponse('superadmin')
  if (!supabaseConfigured) {
    if (!isLocalDevPreview(request)) return misconfiguredResponse('superadmin')
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email?.trim().toLowerCase() !== SUPERADMIN_EMAIL) {
    return loginRedirect(request, response, '/superadmin/login')
  }

  return response
}

function createSupabaseClient(request: NextRequest) {
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll() {},
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
