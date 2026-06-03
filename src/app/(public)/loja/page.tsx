import { mockProducts } from '@/data/mock'
import { CatalogClient } from './CatalogClient'

interface Props {
  searchParams: Promise<{ categoria?: string }>
}

export default async function LojaPage({ searchParams }: Props) {
  const params = await searchParams
  return <CatalogClient products={mockProducts} initialCategory={params.categoria} />
}
