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
  notes?: string
}

export type SubmitResult = { ok: true } | { ok: false; error: string }

export async function submitStoreRequest(input: RequestInput): Promise<SubmitResult> {
  const storeName = input.store_name?.trim() ?? ''
  const contactName = input.contact_name?.trim() ?? ''
  const email = input.email?.trim().toLowerCase() ?? ''
  const whatsapp = input.whatsapp?.trim() ?? ''
  const digits = whatsapp.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  const notes = input.notes?.trim() ?? ''
  const plan = Object.hasOwn(PLANS, input.plan_id) ? PLANS[input.plan_id] : undefined

  if (!storeName || storeName.length > 120) return { ok: false, error: 'Informe o nome do negócio (até 120 caracteres).' }
  if (!contactName || contactName.length > 100) return { ok: false, error: 'Informe seu nome (até 100 caracteres).' }
  if (email.length > 160 || !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: 'Informe um e-mail válido.' }
  if (digits.length !== 10 && digits.length !== 11) return { ok: false, error: 'Informe um WhatsApp brasileiro válido com DDD.' }
  if (!plan) return { ok: false, error: 'Escolha um plano válido.' }
  if (notes.length > 1000) return { ok: false, error: 'Resuma sua mensagem em até 1.000 caracteres.' }

  const { error } = await supabase.from('store_requests').insert({
    store_name: storeName,
    contact_name: contactName,
    email,
    whatsapp: digits,
    plan_id: input.plan_id,
    accent_color: /^#[0-9a-fA-F]{6}$/.test(input.accent_color ?? '') ? input.accent_color : '#79E2AD',
    modules_wanted: plan.modules,
    notes,
    status: 'pendente',
  })

  if (error) {
    console.error('Falha ao registrar solicitação MODS:', error.code)
    return { ok: false, error: 'Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp.' }
  }
  return { ok: true }
}
