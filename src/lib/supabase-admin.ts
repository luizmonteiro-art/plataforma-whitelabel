/**
 * supabase-admin.ts — Cliente Supabase com SERVICE ROLE (ignora RLS).
 *
 * ⚠️ SOMENTE SERVIDOR. Nunca importar em Client Components.
 * Usa SUPABASE_SERVICE_ROLE_KEY (sem NEXT_PUBLIC_), que dá acesso total ao banco.
 * Usado apenas pelo painel /superadmin para provisionar lojas e ler pedidos.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export const supabaseAdminConfigured = url.startsWith('http') && serviceKey.length > 10

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseAdminConfigured) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
