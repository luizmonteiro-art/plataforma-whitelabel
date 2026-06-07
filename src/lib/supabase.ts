import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Cria o cliente apenas se as credenciais forem válidas.
// Durante o build sem .env configurado, retorna um cliente "vazio" que não quebra.
const isConfigured = url.startsWith('http') && key.length > 10

export const supabase = isConfigured
  ? createClient(url, key)
  : createClient('https://placeholder.supabase.co', 'placeholder-key-for-build')

export const supabaseConfigured = isConfigured
