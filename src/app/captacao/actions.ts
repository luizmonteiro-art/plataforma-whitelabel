'use server'

/**
 * Server Action da captação — registra um pedido de loja.
 * Insere em `store_requests` com o cliente anon (RLS permite INSERT público).
 * Não usa .select() porque o anon não tem permissão de leitura na tabela.
 */

import { supabase } from '@/lib/supabase'
import { PLANS } from '@/lib/plans'

export interface RequestInput {
  store_name: string
  contact_name: string
  email: string
  whatsapp: string
  plan_id: string
  accent_color: string
  modules_wanted?: string[]
  notes?: string
}

export type SubmitResult = { ok: true } | { ok: false; error: string }

export async function submitStoreRequest(input: RequestInput): Promise<SubmitResult> {
  if (!input.store_name?.trim()) return { ok: false, error: 'Informe o nome da loja.' }
  if (!input.contact_name?.trim()) return { ok: false, error: 'Informe seu nome.' }
  if (!/^\S+@\S+\.\S+$/.test(input.email ?? '')) return { ok: false, error: 'E-mail inválido.' }
  if ((input.whatsapp ?? '').replace(/\D/g, '').length < 10) return { ok: false, error: 'WhatsApp inválido.' }
  if (!PLANS[input.plan_id]) return { ok: false, error: 'Plano inválido.' }

  const { error } = await supabase.from('store_requests').insert({
    store_name: input.store_name.trim(),
    contact_name: input.contact_name.trim(),
    email: input.email.trim().toLowerCase(),
    whatsapp: input.whatsapp.trim(),
    plan_id: input.plan_id,
    accent_color: input.accent_color || '#22c55e',
    modules_wanted: input.modules_wanted ?? PLANS[input.plan_id].modules,
    notes: input.notes ?? '',
    status: 'pendente',
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
