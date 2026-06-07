import { redirect } from 'next/navigation'

// O proxy.ts protege todas as rotas /admin/* — se chegou aqui, está autenticado.
export default function AdminRootPage() {
  redirect('/admin/dashboard')
}
