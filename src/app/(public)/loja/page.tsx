import { getPublicProducts } from '@/lib/db'
import { getStoreIdFromHeaders } from '@/lib/store-headers'
import { CatalogClient } from './CatalogClient'

interface Props {
  searchParams: Promise<{ categoria?: string }>
}

export default async function LojaPage({ searchParams }: Props) {
  const storeId = await getStoreIdFromHeaders()
  const [params, products] = await Promise.all([
    searchParams,
    getPublicProducts(storeId).catch(() => []),
  ])
  return <CatalogClient products={products} initialCategory={params.categoria} />
}
