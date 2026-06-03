import { mockAppointments } from '@/data/mock'
import { AgendamentosClient } from './AgendamentosClient'

export default function AgendamentosAdminPage() {
  return <AgendamentosClient initialAppointments={mockAppointments} />
}
