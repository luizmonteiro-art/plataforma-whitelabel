import { getProducts } from '@/lib/db'
import { CatalogClient } from './CatalogClient'

interface Props {
  searchParams: Promise<{ categoria?: string }>
}

export default async function LojaPage({ searchParams }: Props) {
  const [params, products] = await Promise.all([
    searchParams,
    getProducts().catch(() => []),
  ])
  return <CatalogClient products={products} initialCategory={params.categoria} />
}
