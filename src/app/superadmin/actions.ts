'use server'

import { randomBytes } from 'node:crypto'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { PLANS } from '@/lib/plans'

const TRIAL_DAYS = 7
const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL ?? '').trim().toLowerCase()
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export interface StoreRow {
  id: string
  slug: string
  plan_id: string
  trial_expires_at: string | null
  is_active: boolean
  admin_email: string
  created_at: string
  store_config?: { store_name?: string | null; whatsapp?: string | null; accent_color?: string | null }[] | null
}

export interface LeadInternalNote {
  id: string
  text: string
  created_at: string
  author: string
}

export interface LeadHistoryEntry {
  id: string
  type: 'created' | 'status_changed' | 'note_added'
  created_at: string
  author: string
  text: string
}

export interface RequestRow {
  id: string
  store_name: string
  contact_name: string
  email: string
  whatsapp: string
  plan_id: string
  accent_color: string
  modules_wanted: string[]
  notes: string
  status: string
  created_at: string
  customer_notes: string
  internal_notes: LeadInternalNote[]
  history: LeadHistoryEntry[]
}

export interface CreateStoreInput {
  slug: string
  store_name: string
  plan_id: string
  admin_email: string
  whatsapp: string
  accent_color?: string
  request_id?: string
}

export type ActionResult =
  | { ok: true; message: string; tempPassword?: string; slug?: string }
  | { ok: false; error: string }

interface RequestNotesPayload {
  customer_notes: string
  internal_notes: LeadInternalNote[]
  history: LeadHistoryEntry[]
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function genPassword(): string {
  return 'mc-' + randomBytes(6).toString('hex')
}

function makeEntryId(): string {
  return randomBytes(8).toString('hex')
}

function emptyRequestNotes(customerNotes = ''): RequestNotesPayload {
  return {
    customer_notes: customerNotes.trim(),
    internal_notes: [],
    history: [],
  }
}

function parseRequestNotes(notes: string | null | undefined, createdAt?: string | null): RequestNotesPayload {
  const raw = (notes ?? '').trim()
  if (!raw) return emptyRequestNotes()

  try {
    const parsed = JSON.parse(raw) as Partial<RequestNotesPayload>
    if (
      typeof parsed.customer_notes === 'string'
      && Array.isArray(parsed.internal_notes)
      && Array.isArray(parsed.history)
    ) {
      return {
        customer_notes: parsed.customer_notes,
        internal_notes: parsed.internal_notes,
        history: parsed.history,
      }
    }
  } catch {}

  const payload = emptyRequestNotes(raw)
  if (createdAt) {
    payload.history.push({
      id: makeEntryId(),
      type: 'created',
      created_at: createdAt,
      author: 'captacao',
      text: 'Lead recebido pela landing page.',
    })
  }
  return payload
}

function stringifyRequestNotes(payload: RequestNotesPayload): string {
  return JSON.stringify(payload)
}

function toDataSvg(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function safeAccentColor(value: string | undefined): string {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#79e2ad'
}

function makeHeroImage(storeName: string, accentColor: string): string {
  const safeStoreName = escapeXml(storeName)
  return toDataSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#071311" />
          <stop offset="55%" stop-color="#10201b" />
          <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#bg)" />
      <circle cx="1250" cy="180" r="220" fill="${accentColor}" fill-opacity="0.18" />
      <circle cx="280" cy="740" r="260" fill="#daf1de" fill-opacity="0.06" />
      <text x="120" y="230" fill="#daf1de" font-family="Arial, sans-serif" font-size="48" opacity="0.72">CONTEÚDO DE EXEMPLO</text>
      <text x="120" y="360" fill="#ffffff" font-family="Arial, sans-serif" font-size="102" font-weight="700">${safeStoreName}</text>
      <text x="120" y="455" fill="#c5d6ce" font-family="Arial, sans-serif" font-size="40">Substitua antes de publicar sua vitrine.</text>
      <rect x="120" y="560" width="360" height="86" rx="26" fill="${accentColor}" />
      <text x="180" y="614" fill="#071311" font-family="Arial, sans-serif" font-size="34" font-weight="700">Prévia da vitrine</text>
    </svg>
  `)
}

function makeProductImage(title: string, accentColor: string, tone: string): string {
  const safeTitle = escapeXml(title)
  return toDataSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
      <rect width="1200" height="1200" rx="54" fill="${tone}" />
      <rect x="120" y="120" width="960" height="960" rx="44" fill="#0d1513" stroke="${accentColor}" stroke-opacity="0.25" />
      <circle cx="920" cy="280" r="92" fill="${accentColor}" fill-opacity="0.18" />
      <text x="120" y="220" fill="#8eb69b" font-family="Arial, sans-serif" font-size="40" letter-spacing="5">PRODUTO DE EXEMPLO</text>
      <text x="120" y="560" fill="#ffffff" font-family="Arial, sans-serif" font-size="86" font-weight="700">${safeTitle}</text>
      <text x="120" y="650" fill="#d7e2dc" font-family="Arial, sans-serif" font-size="42">Substitua foto, descrição e preço</text>
    </svg>
  `)
}

function makeStarterLogo(storeName: string, accentColor: string): string {
  const safeStoreName = escapeXml(storeName)
  const initials = escapeXml(
    storeName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('') || 'ML',
  )

  return toDataSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420">
      <defs>
        <linearGradient id="logo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#071311" />
          <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.95" />
        </linearGradient>
      </defs>
      <rect width="420" height="420" rx="108" fill="url(#logo)" />
      <circle cx="314" cy="108" r="68" fill="#daf1de" fill-opacity="0.14" />
      <text x="210" y="228" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="138" font-weight="700">${initials}</text>
      <text x="210" y="328" text-anchor="middle" fill="#daf1de" font-family="Arial, sans-serif" font-size="28" opacity="0.82">${safeStoreName}</text>
    </svg>
  `)
}

async function seedStoreStarterContent(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  store: { id: string; slug: string },
  input: CreateStoreInput,
) {
  const storeName = input.store_name?.trim() || store.slug
  const accentColor = safeAccentColor(input.accent_color)
  const heroImage = makeHeroImage(storeName, accentColor)

  const products = [
    {
      store_id: store.id,
       name: '[EXEMPLO] iPhone 13 128GB',
      slug: 'iphone-13-128gb',
       description: 'Conteúdo de exemplo. Substitua descrição, preço, estoque e foto por dados reais antes de publicar.',
      price: 3490,
      promo_price: 3290,
      stock_qty: 2,
      category: 'iphone',
      brand: 'Apple',
      condition: 'seminovo',
      images: [makeProductImage('iPhone 13', accentColor, '#14201d')],
      is_featured: true,
       is_active: false,
      specs: { memoria: '128GB', cor: 'Meia-noite', garantia: '90 dias' },
    },
    {
      store_id: store.id,
       name: '[EXEMPLO] Galaxy S23 256GB',
      slug: 'galaxy-s23-256gb',
       description: 'Conteúdo de exemplo. Substitua descrição, preço, estoque e foto por dados reais antes de publicar.',
      price: 3290,
      stock_qty: 1,
      category: 'android',
      brand: 'Samsung',
      condition: 'lacrado',
      images: [makeProductImage('Galaxy S23', accentColor, '#111b1a')],
      is_featured: true,
       is_active: false,
      specs: { memoria: '256GB', cor: 'Preto', garantia: '12 meses' },
    },
    {
      store_id: store.id,
       name: '[EXEMPLO] Capinha Premium MagSafe',
      slug: 'capinha-premium-magsafe',
       description: 'Conteúdo de exemplo. Confirme características, compatibilidade e preço antes de publicar.',
      price: 129,
      stock_qty: 8,
      category: 'capinha',
       brand: 'Exemplo',
      condition: 'novo',
      images: [makeProductImage('Capinha', accentColor, '#162622')],
      is_featured: false,
       is_active: false,
      specs: { material: 'TPU + policarbonato', compatibilidade: 'iPhone 12 ao 15' },
    },
    {
      store_id: store.id,
       name: '[EXEMPLO] Carregador Turbo 25W',
      slug: 'carregador-turbo-25w',
       description: 'Conteúdo de exemplo. Confirme características, compatibilidade e preço antes de publicar.',
      price: 99,
      stock_qty: 10,
      category: 'carregador',
       brand: 'Exemplo',
      condition: 'novo',
      images: [makeProductImage('Carregador', accentColor, '#182320')],
      is_featured: false,
       is_active: false,
      specs: { potencia: '25W', conexao: 'USB-C', garantia: '30 dias' },
    },
  ]

  const services = [
    {
      store_id: store.id,
       name: '[EXEMPLO] Troca de tela',
       description: 'Serviço de exemplo. Defina escopo, prazo e preço reais antes de publicar.',
      price_from: 280,
      duration_minutes: 90,
       is_active: false,
      icon: 'Monitor',
    },
    {
      store_id: store.id,
       name: '[EXEMPLO] Troca de bateria',
       description: 'Serviço de exemplo. Defina escopo, prazo e preço reais antes de publicar.',
      price_from: 180,
      duration_minutes: 60,
       is_active: false,
      icon: 'Battery',
    },
    {
      store_id: store.id,
       name: '[EXEMPLO] Limpeza e recuperação',
       description: 'Serviço de exemplo. Defina escopo, prazo e preço reais antes de publicar.',
      price_from: 120,
      duration_minutes: 45,
       is_active: false,
      icon: 'Sparkles',
    },
  ]

  const banners = [
    {
      store_id: store.id,
       title: `${storeName}: banner de exemplo`,
       subtitle: 'Substitua por uma mensagem real antes de publicar.',
      image_url: heroImage,
       badge: 'Exemplo',
      cta_text: 'Ver catalogo',
      cta_href: '/loja',
       is_active: false,
      order: 1,
    },
    {
      store_id: store.id,
       title: 'Agendamento: banner de exemplo',
       subtitle: 'Confirme os serviços e horários da sua loja antes de publicar.',
      image_url: heroImage,
       badge: 'Exemplo',
      cta_text: 'Agendar servico',
      cta_href: '/agendar',
       is_active: false,
      order: 2,
    },
  ]

  const posts = [
    {
      store_id: store.id,
      image_url: products[0].images[0],
       caption: 'Publicação de exemplo. Substitua pelas informações reais da loja.',
       tag: 'Exemplo',
      link: '/loja',
       is_active: false,
      order: 1,
    },
    {
      store_id: store.id,
      image_url: products[1].images[0],
       caption: 'Publicação de exemplo. Substitua pelas informações reais da loja.',
       tag: 'Exemplo',
      link: '/loja',
       is_active: false,
      order: 2,
    },
    {
      store_id: store.id,
      image_url: products[3].images[0],
       caption: 'Publicação de exemplo. Substitua pelas informações reais da loja.',
       tag: 'Exemplo',
      link: '/loja',
       is_active: false,
      order: 3,
    },
  ]

  const { error: productsError } = await admin.from('products').insert(products)
  if (productsError) throw new Error('Falha ao criar produtos iniciais: ' + productsError.message)

  const { error: servicesError } = await admin.from('services').insert(services)
  if (servicesError) throw new Error('Falha ao criar servicos iniciais: ' + servicesError.message)

  const { error: bannersError } = await admin.from('banners').insert(banners)
  if (bannersError) throw new Error('Falha ao criar banners iniciais: ' + bannersError.message)

  const { error: postsError } = await admin.from('posts').insert(posts)
  if (postsError) throw new Error('Falha ao criar feed inicial: ' + postsError.message)
}

async function ensureSuperadmin(): Promise<ActionResult | null> {
  if (!SUPERADMIN_EMAIL) {
    return { ok: false, error: 'SUPERADMIN_EMAIL nao configurado no servidor.' }
  }

  if (!SUPABASE_URL.startsWith('http') || SUPABASE_KEY.length <= 10) {
    return { ok: false, error: 'Autenticacao do superadmin indisponivel. Verifique o Supabase.' }
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const email = (user?.email ?? '').trim().toLowerCase()

  if (!email) {
    return { ok: false, error: 'Sessao expirada. Entre novamente como superadmin.' }
  }

  if (email !== SUPERADMIN_EMAIL) {
    return { ok: false, error: 'Acao nao autorizada para este usuario.' }
  }

  return null
}

export async function listStores(): Promise<StoreRow[]> {
  if (await ensureSuperadmin()) return []
  const admin = getSupabaseAdmin()
  if (!admin) return []
  const { data } = await admin
    .from('stores')
    .select('id, slug, plan_id, trial_expires_at, is_active, admin_email, created_at, store_config(store_name, whatsapp, accent_color)')
    .order('created_at', { ascending: false })
  return (data ?? []) as StoreRow[]
}

export async function listRequests(): Promise<RequestRow[]> {
  if (await ensureSuperadmin()) return []
  const admin = getSupabaseAdmin()
  if (!admin) return []

  const { data } = await admin
    .from('store_requests')
    .select('*')
    .order('created_at', { ascending: false })

  return (data ?? []).map((row) => {
    const payload = parseRequestNotes(row.notes, row.created_at)
    if (payload.history.length === 0) {
      payload.history.push({
        id: makeEntryId(),
        type: 'created',
        created_at: row.created_at,
        author: 'captacao',
        text: 'Lead recebido pela landing page.',
      })
    }

    return {
      ...(row as Omit<RequestRow, 'customer_notes' | 'internal_notes' | 'history'>),
      customer_notes: payload.customer_notes,
      internal_notes: payload.internal_notes,
      history: payload.history,
      notes: stringifyRequestNotes(payload),
    }
  })
}

async function updateRequestRecord(
  id: string,
  updater: (payload: RequestNotesPayload, request: { status: string; created_at: string }) => { payload: RequestNotesPayload; status?: string },
): Promise<ActionResult> {
  const blocked = await ensureSuperadmin()
  if (blocked) return blocked

  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Service role nao configurada no servidor.' }

  const { data: request, error: fetchError } = await admin
    .from('store_requests')
    .select('status, created_at, notes')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return { ok: false, error: fetchError.message }
  if (!request) return { ok: false, error: 'Lead nao encontrado.' }

  const current = parseRequestNotes(request.notes, request.created_at)
  if (current.history.length === 0) {
    current.history.push({
      id: makeEntryId(),
      type: 'created',
      created_at: request.created_at,
      author: 'captacao',
      text: 'Lead recebido pela landing page.',
    })
  }

  const result = updater(current, request)
  const payload: { notes: string; status?: string } = {
    notes: stringifyRequestNotes(result.payload),
  }

  if (result.status) payload.status = result.status

  const { error } = await admin.from('store_requests').update(payload).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin')
  return { ok: true, message: 'Lead atualizado.' }
}

export async function createStore(input: CreateStoreInput): Promise<ActionResult> {
  const blocked = await ensureSuperadmin()
  if (blocked) return blocked

  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Service role nao configurada no servidor.' }

  const slug = slugify(input.slug || input.store_name)
  if (!slug) return { ok: false, error: 'Slug invalido.' }
  if (!PLANS[input.plan_id]) return { ok: false, error: 'Plano invalido.' }
  if (!input.admin_email) return { ok: false, error: 'E-mail do lojista e obrigatorio.' }
  const storeName = input.store_name?.trim() || slug
  const accentColor = safeAccentColor(input.accent_color)
  const starterLogo = makeStarterLogo(storeName, accentColor)
  const cleanWhatsapp = (input.whatsapp || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  if (cleanWhatsapp && !/^\d{10,11}$/.test(cleanWhatsapp)) {
    return { ok: false, error: 'WhatsApp deve ter DDD e 10 ou 11 dígitos.' }
  }

  const { data: existing } = await admin.from('stores').select('id').eq('slug', slug).maybeSingle()
  if (existing) return { ok: false, error: `O slug "${slug}" ja esta em uso.` }

  const trialExpires = new Date(Date.now() + TRIAL_DAYS * 86400_000).toISOString()
  const { data: store, error: storeErr } = await admin
    .from('stores')
    .insert({
      slug,
      plan_id: input.plan_id,
      admin_email: input.admin_email.trim().toLowerCase(),
      trial_expires_at: trialExpires,
      is_active: false,
    })
    .select()
    .single()

  if (storeErr || !store) return { ok: false, error: storeErr?.message ?? 'Falha ao criar loja.' }

  const { error: cfgErr } = await admin.from('store_config').insert({
    store_id: store.id,
    store_name: storeName,
    whatsapp: cleanWhatsapp,
    phone: cleanWhatsapp,
    accent_color: accentColor,
    about: `A vitrine de ${storeName} está em preparação. Produtos, serviços e informações serão publicados após revisão.`,
    logo_url: starterLogo,
  })

  if (cfgErr) {
    await admin.from('stores').delete().eq('id', store.id)
    return { ok: false, error: 'Falha ao criar config: ' + cfgErr.message }
  }

  try {
    await seedStoreStarterContent(admin, { id: store.id, slug }, input)
  } catch (error) {
    await admin.from('stores').delete().eq('id', store.id)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Falha ao montar o kit inicial da loja.',
    }
  }

  let tempPassword: string | undefined
  let warning = ''
  const password = genPassword()
  const { error: userErr } = await admin.auth.admin.createUser({
    email: input.admin_email.trim().toLowerCase(),
    password,
    email_confirm: true,
  })

  if (userErr) {
    if (/already|exist|registered/i.test(userErr.message)) {
      warning = ' (usuario com este e-mail ja existia, senha atual mantida)'
    } else {
      await admin.from('store_config').delete().eq('store_id', store.id)
      await admin.from('stores').delete().eq('id', store.id)
      return { ok: false, error: 'Falha ao criar o usuario do lojista (loja desfeita): ' + userErr.message }
    }
  } else {
    tempPassword = password
  }

  if (input.request_id) {
    await updateRequestRecord(input.request_id, (payload, request) => {
      if (request.status !== 'provisionado') {
        payload.history.unshift({
          id: makeEntryId(),
          type: 'status_changed',
          created_at: new Date().toISOString(),
          author: SUPERADMIN_EMAIL || 'superadmin',
          text: `Status alterado de "${request.status}" para "provisionado".`,
        })
      }
      return { payload, status: 'provisionado' }
    })
  }

  revalidatePath('/superadmin')
  return {
    ok: true,
    message: `Loja "${slug}" criada em trial de ${TRIAL_DAYS} dias com conteúdo demonstrativo inativo.` + warning,
    tempPassword,
    slug,
  }
}

export async function setStoreActive(id: string, active: boolean): Promise<ActionResult> {
  const blocked = await ensureSuperadmin()
  if (blocked) return blocked

  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Service role nao configurada no servidor.' }

  const { error } = await admin.from('stores').update({ is_active: active }).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin')
  return { ok: true, message: active ? 'Loja ativada.' : 'Loja desativada.' }
}

export async function updateRequestStatus(id: string, status: string): Promise<ActionResult> {
  const result = await updateRequestRecord(id, (payload, request) => {
    if (request.status !== status) {
      payload.history.unshift({
        id: makeEntryId(),
        type: 'status_changed',
        created_at: new Date().toISOString(),
        author: SUPERADMIN_EMAIL || 'superadmin',
        text: `Status alterado de "${request.status}" para "${status}".`,
      })
    }
    return { payload, status }
  })

  if (!result.ok) return result
  return { ok: true, message: 'Pedido atualizado.' }
}

export async function addRequestInternalNote(id: string, text: string): Promise<ActionResult> {
  const cleanText = text.trim()
  if (!cleanText) return { ok: false, error: 'Escreva uma observacao antes de salvar.' }

  const result = await updateRequestRecord(id, (payload) => {
    payload.internal_notes.unshift({
      id: makeEntryId(),
      text: cleanText,
      created_at: new Date().toISOString(),
      author: SUPERADMIN_EMAIL || 'superadmin',
    })
    payload.history.unshift({
      id: makeEntryId(),
      type: 'note_added',
      created_at: new Date().toISOString(),
      author: SUPERADMIN_EMAIL || 'superadmin',
      text: 'Observacao interna adicionada.',
    })
    return { payload }
  })

  if (!result.ok) return result
  return { ok: true, message: 'Observacao interna salva.' }
}

export async function deleteRequest(id: string): Promise<ActionResult> {
  const blocked = await ensureSuperadmin()
  if (blocked) return blocked

  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Service role nao configurada no servidor.' }

  const { data: request } = await admin
    .from('store_requests')
    .select('store_name, status')
    .eq('id', id)
    .maybeSingle()

  if (!request) return { ok: false, error: 'Pedido nao encontrado.' }
  if (!['cancelado', 'provisionado'].includes(request.status)) {
    return { ok: false, error: 'So e permitido remover pedidos encerrados.' }
  }

  const { error } = await admin.from('store_requests').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin')
  return { ok: true, message: `Pedido "${request.store_name}" removido da base.` }
}

export async function deleteStore(id: string): Promise<ActionResult> {
  const blocked = await ensureSuperadmin()
  if (blocked) return blocked

  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Service role nao configurada no servidor.' }

  const { data: store } = await admin.from('stores').select('slug, admin_email').eq('id', id).maybeSingle()
  if (!store) return { ok: false, error: 'Loja nao encontrada (talvez ja tenha sido excluida).' }

  const { error } = await admin.from('stores').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  const email = (store.admin_email ?? '').trim().toLowerCase()
  if (email && email !== SUPERADMIN_EMAIL) {
    const { data: others } = await admin.from('stores').select('id').eq('admin_email', email).limit(1)
    if (!others || others.length === 0) {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
      const user = list?.users?.find((entry) => (entry.email ?? '').toLowerCase() === email)
      if (user) await admin.auth.admin.deleteUser(user.id)
    }
  }

  revalidatePath('/superadmin')
  return { ok: true, message: `Loja "${store.slug}" excluida por completo.` }
}

/** Gera uma nova senha temporaria para o dono da loja (esqueceu a senha). */
export async function resetStorePassword(id: string): Promise<ActionResult> {
  const blocked = await ensureSuperadmin()
  if (blocked) return blocked

  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Service role nao configurada no servidor.' }

  const { data: store } = await admin.from('stores').select('slug, admin_email').eq('id', id).maybeSingle()
  if (!store) return { ok: false, error: 'Loja nao encontrada.' }

  const email = (store.admin_email ?? '').trim().toLowerCase()
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const user = list?.users?.find((entry) => (entry.email ?? '').toLowerCase() === email)
  if (!user) return { ok: false, error: 'Usuario do lojista nao encontrado no Auth.' }

  const password = genPassword()
  const { error } = await admin.auth.admin.updateUserById(user.id, { password })
  if (error) return { ok: false, error: 'Falha ao gerar nova senha: ' + error.message }

  return { ok: true, message: `Nova senha gerada para "${store.slug}".`, tempPassword: password, slug: store.slug }
}
