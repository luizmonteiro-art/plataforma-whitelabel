'use client'

/**
 * ModuleGuard — guarda de acesso por módulo no nível da rota do admin.
 *
 * Envolve o conteúdo do admin (dentro do AdminShell). Lê o pathname atual,
 * descobre o módulo exigido e:
 *  - libera se o plano da loja inclui o módulo;
 *  - redireciona /admin (dashboard) → /admin/estoque quando o plano não tem
 *    DASHBOARD (todo plano tem ESTOQUE, então é um pouso seguro);
 *  - mostra uma tela de upsell para as demais rotas bloqueadas.
 *
 * Isto é a camada de UX. O enforcement real fica no servidor/RLS.
 */

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Lock, ArrowUpRight, Sparkles } from 'lucide-react'
import { usePlan } from '@/contexts/AdminStore'
import { moduleForRoute, cheapestPlanWithModule } from '@/lib/plans'

export function ModuleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { hasModule } = usePlan()

  const required = moduleForRoute(pathname)
  const allowed = !required || hasModule(required)

  // Dashboard fora do plano → manda pra um pouso que todo plano tem.
  const isDashboardBlocked = required === 'DASHBOARD' && !allowed

  useEffect(() => {
    if (isDashboardBlocked) router.replace('/admin/estoque')
  }, [isDashboardBlocked, router])

  if (allowed) return <>{children}</>
  if (isDashboardBlocked) return null

  const targetPlan = required ? cheapestPlanWithModule(required) : null

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="relative w-full max-w-md text-center">
        {/* glow de fundo (linguagem MODUS) */}
        <div className="absolute inset-0 -z-10 blur-3xl opacity-40 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--accent)_25%,transparent),transparent_60%)]" />

        <div className="rounded-3xl border border-white/[0.08] bg-[#0d100d] p-8 shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/10">
            <Lock size={22} className="text-[var(--accent)]" />
          </div>

          <h2 className="text-xl font-bold text-white">Recurso não está no seu plano</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Esta seção faz parte de um plano superior. Faça upgrade para
            desbloquear e usar tudo sem sair do painel.
          </p>

          {targetPlan && (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.06] px-4 py-3">
              <Sparkles size={15} className="text-[var(--accent)]" />
              <span className="text-sm text-zinc-300">
                Disponível no plano{' '}
                <span className="font-bold text-[var(--accent)]">{targetPlan.name}</span>
                {' '}— a partir de R$ {targetPlan.priceBrl.toFixed(2).replace('.', ',')}/mês
              </span>
            </div>
          )}

          <a
            href="https://wa.me/5519933005099?text=Quero%20fazer%20upgrade%20do%20meu%20plano"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-[var(--accent)] active:scale-95"
          >
            Fazer upgrade <ArrowUpRight size={16} />
          </a>

          <button
            onClick={() => router.replace('/admin/estoque')}
            className="mt-4 block w-full text-xs text-zinc-600 transition-colors hover:text-zinc-400"
          >
            Voltar para o painel
          </button>
        </div>
      </div>
    </div>
  )
}
