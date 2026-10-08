import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MODS — Painel da plataforma',
  description: 'Acompanhe leads e lojas da plataforma MODS.',
  icons: { icon: '/brand/mods/favicon.png' },
  robots: { index: false, follow: false },
}

export default function SuperadminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
