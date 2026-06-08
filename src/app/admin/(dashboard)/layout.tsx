import { headers } from 'next/headers'
import { AdminShell } from '@/components/admin/AdminShell'
import { AdminStoreProvider } from '@/contexts/AdminStore'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const storeId = h.get('x-store-id') ?? ''
  const planId  = h.get('x-store-plan') ?? 'vitrine'

  return (
    <AdminStoreProvider storeId={storeId} planId={planId}>
      <AdminShell>{children}</AdminShell>
    </AdminStoreProvider>
  )
}
