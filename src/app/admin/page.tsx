import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function AdminRootPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (!session) redirect('/admin/login')
  redirect('/admin/dashboard')
}
