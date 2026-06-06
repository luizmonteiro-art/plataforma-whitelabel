import { AdminShell } from '@/components/admin/AdminShell'
import { AdminStoreProvider } from '@/contexts/AdminStore'

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminStoreProvider>
      <AdminShell>{children}</AdminShell>
    </AdminStoreProvider>
  )
}
