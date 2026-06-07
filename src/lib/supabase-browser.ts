/**
 * Browser-side Supabase client usando @supabase/ssr.
 * Armazena a sessão em cookies (em vez de localStorage),
 * tornando-a acessível ao middleware do servidor.
 */
import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabaseConfigured = url.startsWith('http') && key.length > 10

export function getSupabaseBrowser() {
  if (!supabaseConfigured) return null
  return createBrowserClient(url, key)
}
