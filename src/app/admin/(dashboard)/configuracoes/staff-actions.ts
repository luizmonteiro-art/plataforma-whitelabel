'use server'

import { randomBytes } from 'node:crypto'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { PLANS } from '@/lib/plans'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

interface ActionResult {
  ok: boolean
  message?: string
  error?: string
  tempPassword?: string
}

function genPassword(): string {
  return 'mc-' + randomBytes(6).toString('hex')
}

async function getAuthedEmail(): Promise<string> {
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
  return (user?.email ?? '').trim().toLowerCase()
}

/** Cria um login de equipe (plano Master) com o mesmo acesso operacional do dono. */
export async function addStaff(storeId: string, email: string): Promise<ActionResult> {
  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Service role nao configurada no servidor.' }

  const callerEmail = await getAuthedEmail()
  if (!callerEmail) return { ok: false, error: 'Sessao expirada. Entre novamente.' }

  const { data: store } = await admin
    .from('stores')
    .select('id, admin_email, plan_id')
    .eq('id', storeId)
    .maybeSingle()
  if (!store) return { ok: false, error: 'Loja nao encontrada.' }
  if (store.admin_email.trim().toLowerCase() !== callerEmail) {
    return { ok: false, error: 'Somente o dono da loja pode gerenciar a equipe.' }
  }

  const plan = PLANS[store.plan_id]
  const staffLimit = plan?.staffLimit ?? 0
  if (staffLimit <= 0) {
    return { ok: false, error: 'Seu plano nao inclui login de equipe. Faca upgrade para o Master.' }
  }

  const { count } = await admin
    .from('store_staff')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId)
  if ((count ?? 0) >= staffLimit) {
    return { ok: false, error: `Limite de ${staffLimit} login(s) de equipe atingido no plano ${plan.name}.` }
  }

  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) return { ok: false, error: 'E-mail invalido.' }
  if (cleanEmail === store.admin_email.trim().toLowerCase()) {
    return { ok: false, error: 'Esse e-mail ja e o dono da loja.' }
  }

  const password = genPassword()
  const { error: userErr } = await admin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
  })

  let tempPassword: string | undefined = password
  if (userErr) {
    if (/already|exist|registered/i.test(userErr.message)) {
      tempPassword = undefined
    } else {
      return { ok: false, error: 'Falha ao criar usuario: ' + userErr.message }
    }
  }

  const { error: staffErr } = await admin.from('store_staff').insert({ store_id: storeId, email: cleanEmail })
  if (staffErr) {
    if (/duplicate|unique/i.test(staffErr.message)) {
      return { ok: false, error: 'Esse e-mail ja faz parte da equipe.' }
    }
    return { ok: false, error: staffErr.message }
  }

  return {
    ok: true,
    message: tempPassword
      ? `Login criado. Senha temporaria: ${tempPassword}`
      : 'Login adicionado a equipe (usuario ja existia, senha atual mantida).',
    tempPassword,
  }
}
