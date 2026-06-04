import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFloat } from '@/components/layout/CustomerMenu'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 pt-16 bg-[#0a0a0a] min-h-screen">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  )
}
