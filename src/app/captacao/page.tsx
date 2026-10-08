import type { Metadata } from 'next'
import { CaptacaoClient } from './CaptacaoClient'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://usemods.com.br'),
  title: 'MODS — Vitrine digital e gestão para o seu negócio',
  description:
    'A MODS reúne vitrine digital, produtos, estoque e gestão operacional em uma base mais clara para o seu negócio.',
  alternates: { canonical: 'https://usemods.com.br/captacao' },
  icons: { icon: '/brand/mods/favicon.png' },
  openGraph: {
    title: 'MODS — Menos abas. Mais clareza.',
    description: 'Vitrine digital e gestão operacional em uma base mais clara.',
    images: [{ url: '/brand/mods/og-card.jpg', width: 1200, height: 630, alt: 'MODS: menos abas, mais clareza para o negócio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MODS — Menos abas. Mais clareza.',
    description: 'Vitrine digital e gestão operacional em uma base mais clara.',
    images: ['/brand/mods/og-card.jpg'],
  },
}

export default function CaptacaoPage() {
  return <CaptacaoClient />
}
