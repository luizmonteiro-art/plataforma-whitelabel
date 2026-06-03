import { mockSales } from '@/data/mock'
import { VendasClient } from './VendasClient'

export default function VendasPage() {
  return <VendasClient initialSales={mockSales} />
}
