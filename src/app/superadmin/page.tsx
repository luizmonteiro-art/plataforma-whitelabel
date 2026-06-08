import { listStores, listRequests } from './actions'
import { SuperadminBoard } from './SuperadminBoard'
import { supabaseAdminConfigured } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function SuperadminPage() {
  const [stores, requests] = await Promise.all([listStores(), listRequests()])
  return (
    <SuperadminBoard
      stores={stores}
      requests={requests}
      configured={supabaseAdminConfigured}
    />
  )
}
