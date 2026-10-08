import type { Metadata } from 'next'
import { Clock, ArrowUpRight } from 'lucide-react'
import { ModsLogo } from '@/components/brand/ModsLogo'

export const metadata: Metadata = {
  title: 'Loja indisponível — MODS',
  icons: { icon: '/brand/mods/favicon.png' },
  robots: { index: false },
}

export default function LojaInativaPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0a0d0a] px-4 text-zinc-200">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.1]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[30rem] w-[40rem] rounded-full bg-green-500/[0.06] blur-[120px]" />

      <div className="relative w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#79e2ad]/20 bg-[#79e2ad]/10">
          <Clock size={24} className="text-[#79e2ad]" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">Esta loja está indisponível</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
          A loja que você tentou acessar ainda não foi ativada ou o período de teste expirou.
          Se você é o responsável, fale com a gente para reativá-la.
        </p>

        <a
          href="https://wa.me/5519933005099"
          target="_blank" rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#79e2ad] px-6 py-3 text-sm font-bold text-[#0b1b16] transition-all hover:bg-[#a7f0c9] active:scale-95"
        >
          Falar com a MODS <ArrowUpRight size={15} />
        </a>

        <div className="mt-10 flex justify-center"><ModsLogo width={116} /></div>
      </div>
    </div>
  )
}
