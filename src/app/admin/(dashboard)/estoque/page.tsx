import { mockProducts } from '@/data/mock'
import { EstoqueClient } from './EstoqueClient'

export default function EstoquePage() {
  return <EstoqueClient initialProducts={mockProducts} />
}
