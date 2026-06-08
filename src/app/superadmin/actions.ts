'use server'

/**
 * Server Actions do painel /superadmin — provisionamento de lojas.
 * Tudo aqui roda no servidor com o cliente SERVICE ROLE (ignora RLS).
 * O acesso à rota /superadmin já é protegido pelo proxy.ts (SUPERADMIN_EMAIL).
 */

import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { PLANS } from '@/lib/plans'

const TRIAL_DAYS = 7

export interface StoreRow {
  id: string
  slug: string
  plan_id: string
  trial_expires_at: string | null
  is_active: boolean
  admin_email: string
  created_at: string
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
  | { ok: true; message: string; tempPassword?: string }
  | { ok: false; error: string }

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function genPassword(): string {
  // senha temporária legível para o Luiz repassar ao lojista
  return 'mc-' + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6)
}

// ─── Leitura ────────────────────────────────────────────────────────

export async function listStores(): Promise<StoreRow[]> {
  const admin = getSupabaseAdmin()
  if (!admin) return []
  const { data } = await admin
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as StoreRow[]
}

export async function listRequests(): Promise<RequestRow[]> {
  const admin = getSupabaseAdmin()
  if (!admin) return []
  const { data } = await admin
    .from('store_requests')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as RequestRow[]
}

// ─── Provisionamento ────────────────────────────────────────────────

export async function createStore(input: CreateStoreInput): Promise<ActionResult> {
  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Service role não configurada no servidor.' }

  const slug = slugify(input.slug || input.store_name)
  if (!slug) return { ok: false, error: 'Slug inválido.' }
  if (!PLANS[input.plan_id]) return { ok: false, error: 'Plano inválido.' }
  if (!input.admin_email) return { ok: false, error: 'E-mail do lojista é obrigatório.' }

  // slug já existe?
  const { data: existing } = await admin.from('stores').select('id').eq('slug', slug).maybeSingle()
  if (existing) return { ok: false, error: `O slug "${slug}" já está em uso.` }

  const trialExpires = new Date(Date.now() + TRIAL_DAYS * 86400_000).toISOString()

  // 1) cria a loja (em trial, inativa até o Luiz ativar)
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

  // 2) cria a config inicial da loja
  const { error: cfgErr } = await admin.from('store_config').insert({
    store_id: store.id,
    store_name: input.store_name || slug,
    whatsapp: (input.whatsapp || '').replace(/\D/g, '') || '11999999999',
    accent_color: input.accent_color || '#22c55e',
  })
  if (cfgErr) {
    // rollback básico para não deixar loja órfã
    await admin.from('stores').delete().eq('id', store.id)
    return { ok: false, error: 'Falha ao criar config: ' + cfgErr.message }
  }

  // 3) cria o usuário admin do lojista (senha temporária para repassar via WhatsApp)
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
      warning = ' (usuário com este e-mail já existia — mantida a senha atual dele)'
    } else {
      warning = ' (não foi possível criar o usuário: ' + userErr.message + ')'
    }
  } else {
    tempPassword = password
  }

  // 4) se veio de um pedido de captação, marca como provisionado
  if (input.request_id) {
    await admin.from('store_requests').update({ status: 'provisionado' }).eq('id', input.request_id)
  }

  revalidatePath('/superadmin')
  return {
    ok: true,
    message: `Loja "${slug}" criada em trial de ${TRIAL_DAYS} dias.` + warning,
    tempPassword,
  }
}

export async function setStoreActive(id: string, active: boolean): Promise<ActionResult> {
  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Service role não configurada no servidor.' }
  const { error } = await admin.from('stores').update({ is_active: active }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/superadmin')
  return { ok: true, message: active ? 'Loja ativada.' : 'Loja desativada.' }
}

export async function updateRequestStatus(id: string, status: string): Promise<ActionResult> {
  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Service role não configurada no servidor.' }
  const { error } = await admin.from('store_requests').update({ status }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/superadmin')
  return { ok: true, message: 'Pedido atualizado.' }
}
