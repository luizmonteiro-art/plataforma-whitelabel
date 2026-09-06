import type { Metadata } from 'next'
import { CaptacaoClient } from './CaptacaoClient'

export const metadata: Metadata = {
  metadataBase: new URL('https://plataforma-whitelabel.vercel.app'),
  title: 'MODUS — Seu negócio em modo de avançar',
  description:
    'Vitrine, operação e atendimento em uma base digital adaptada à identidade da sua empresa.',
  openGraph: {
    title: 'MODUS — Seu negócio em modo de avançar',
    description: 'Vitrine, operação e atendimento em um só lugar.',
    images: [{ url: '/brand/modus-social-card.png', width: 1200, height: 630, alt: 'MODUS — Operação digital' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MODUS — Seu negócio em modo de avançar',
    description: 'Vitrine, operação e atendimento em um só lugar.',
    images: ['/brand/modus-social-card.png'],
  },
}

export default function CaptacaoPage() {
  return <CaptacaoClient />
}
