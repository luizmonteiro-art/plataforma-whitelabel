import { listStores, listRequests } from './actions'
import { SuperadminBoard } from './SuperadminBoard'
import { supabaseAdminConfigured } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function SuperadminPage() {
  const [stores, requests] = await Promise.all([listStores(), listRequests()])

  const envStatus = {
    publicUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    publicAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: supabaseAdminConfigured,
    superadminEmail: Boolean(process.env.SUPERADMIN_EMAIL),
  }

  return (
    <SuperadminBoard
      stores={stores}
      requests={requests}
      envStatus={envStatus}
    />
  )
}
