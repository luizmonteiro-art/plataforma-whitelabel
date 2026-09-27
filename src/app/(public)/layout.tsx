import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFloat } from '@/components/layout/CustomerMenu'
import { CarrinhoProvider } from '@/contexts/Carrinho'
import { CarrinhoDrawer } from '@/components/store/CarrinhoDrawer'
import { getStoreConfig } from '@/lib/db'
import { getStoreIdFromHeaders } from '@/lib/store-headers'
import { brandFromConfig } from '@/lib/brand'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let config = null
  let storeId: string | null = null
  try {
    storeId = await getStoreIdFromHeaders()
    if (storeId) config = await getStoreConfig(storeId)
  } catch {}
  const brand = brandFromConfig(config)

  return (
    <CarrinhoProvider storeId={storeId ?? 'sem-loja'}>
      <Header brand={brand} />
      <main className="flex-1 pt-16 bg-[#0a0a0a] min-h-screen">{children}</main>
      <Footer brand={brand} />
      <WhatsAppFloat brand={brand} />
      <CarrinhoDrawer brand={brand} />
    </CarrinhoProvider>
  )
}
