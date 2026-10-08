import Link from 'next/link'
import { loadCommercial } from './actions'
import { CommercialBoard } from './CommercialBoard'

export const dynamic = 'force-dynamic'

export default async function CommercialPage() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  let snapshot: Awaited<ReturnType<typeof loadCommercial>> | null = null
  let problem = ''
  try {
    snapshot = await loadCommercial()
  } catch (error) {
    problem = error instanceof Error ? error.message : 'Falha de conexão.'
  }
  if (snapshot) return <CommercialBoard snapshot={snapshot} today={today} />
  return <main className="min-h-screen bg-[#07130f] px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#79e2ad]">MODS · Comercial</p>
        <h1 className="mt-4 text-2xl font-semibold">Não foi possível abrir o financeiro</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{problem}</p>
        <p className="mt-4 text-sm text-zinc-400">Confirme a sessão de superadmin e a migração comercial no banco.</p>
        <Link href="/superadmin" className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 text-sm">Voltar ao superadmin</Link>
      </div>
    </main>
}
