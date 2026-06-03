import { mockServiceOrders } from '@/data/mock'
import { ServicosClient } from './ServicosClient'

export default function ServicosAdminPage() {
  return <ServicosClient initialOrders={mockServiceOrders} />
}
