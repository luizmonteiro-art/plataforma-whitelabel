import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFloat } from '@/components/layout/CustomerMenu'
import { getStoreConfig } from '@/lib/db'
import { getStoreIdFromHeaders } from '@/lib/store-headers'
import { brandFromConfig } from '@/lib/brand'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let config = null
  try {
    const storeId = await getStoreIdFromHeaders()
    if (storeId) config = await getStoreConfig(storeId)
  } catch {}
  const brand = brandFromConfig(config)

  return (
    <>
      <Header brand={brand} />
      <main className="flex-1 pt-16 bg-[#0a0a0a] min-h-screen">{children}</main>
      <Footer brand={brand} />
      <WhatsAppFloat brand={brand} />
    </>
  )
}
