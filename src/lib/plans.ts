/**
 * plans.ts — Definição estática dos planos e feature flags da plataforma.
 *
 * Espelha o seed de `plans` em supabase-schema.sql. Mantido no código para que
 * o client saiba módulos/limites sem uma chamada extra ao banco — o planId da
 * loja chega via header (x-store-plan) → AdminStore → usePlan().
 *
 * Fonte da verdade do ENFORCEMENT continua sendo o servidor/RLS; isto é a
 * camada de UX (esconder, bloquear, fazer upsell).
 */

// ─── Feature flags ──────────────────────────────────────────────────
export const MODULES = [
  'VITRINE_PUBLICA',
  'ESTOQUE',
  'CONFIGURACOES',
  'DASHBOARD',
  'VENDAS',
  'ORDENS_SERVICO',
  'ORCAMENTOS',
  'AGENDAMENTOS',
  'PROMOCOES',
] as const

export type ModuleFlag = (typeof MODULES)[number]

/** Rótulos amigáveis dos módulos — usados na captação e telas de upsell. */
export const MODULE_LABELS: Record<ModuleFlag, string> = {
  VITRINE_PUBLICA: 'Vitrine pública',
  ESTOQUE: 'Controle de estoque',
  CONFIGURACOES: 'Configurações da loja',
  DASHBOARD: 'Painel / Dashboard',
  VENDAS: 'Registro de vendas (PDV)',
  ORDENS_SERVICO: 'Ordens de serviço',
  ORCAMENTOS: 'Orçamentos',
  AGENDAMENTOS: 'Agendamentos',
  PROMOCOES: 'Promoções & Feed',
}

export interface PlanDef {
  id: string
  name: string
  priceBrl: number
  productLimit: number
  modules: ModuleFlag[]
}

// ─── Planos (espelha o INSERT em supabase-schema.sql) ───────────────
export const PLANS: Record<string, PlanDef> = {
  vitrine: {
    id: 'vitrine',
    name: 'Vitrine',
    priceBrl: 99.9,
    productLimit: 30,
    modules: ['VITRINE_PUBLICA', 'ESTOQUE', 'CONFIGURACOES'],
  },
  loja: {
    id: 'loja',
    name: 'Loja',
    priceBrl: 179.9,
    productLimit: 150,
    modules: [
      'VITRINE_PUBLICA', 'ESTOQUE', 'CONFIGURACOES',
      'DASHBOARD', 'VENDAS', 'ORDENS_SERVICO', 'ORCAMENTOS', 'AGENDAMENTOS',
    ],
  },
  master: {
    id: 'master',
    name: 'Master',
    priceBrl: 299.0,
    productLimit: 300,
    modules: [
      'VITRINE_PUBLICA', 'ESTOQUE', 'CONFIGURACOES',
      'DASHBOARD', 'VENDAS', 'ORDENS_SERVICO', 'ORCAMENTOS', 'AGENDAMENTOS',
      'PROMOCOES',
    ],
  },
}

/** Plano usado como fallback quando o planId é desconhecido. */
const FALLBACK_PLAN: PlanDef = PLANS.vitrine

export function getPlan(planId: string | undefined | null): PlanDef {
  if (!planId) return FALLBACK_PLAN
  return PLANS[planId] ?? FALLBACK_PLAN
}

export function planHasModule(planId: string, flag: ModuleFlag): boolean {
  return getPlan(planId).modules.includes(flag)
}

export function getProductLimit(planId: string): number {
  return getPlan(planId).productLimit
}

/**
 * Retorna o plano mais barato que inclui o módulo — usado para sugerir o
 * upgrade certo na tela de bloqueio ("Disponível no plano Loja").
 */
export function cheapestPlanWithModule(flag: ModuleFlag): PlanDef | null {
  const candidates = Object.values(PLANS)
    .filter(p => p.modules.includes(flag))
    .sort((a, b) => a.priceBrl - b.priceBrl)
  return candidates[0] ?? null
}

/**
 * Próximo plano acima do atual (por preço) que tenha um produto-limite maior —
 * usado no upsell quando o lojista atinge o limite de produtos.
 */
export function nextPlanWithMoreProducts(planId: string): PlanDef | null {
  const current = getPlan(planId)
  const candidates = Object.values(PLANS)
    .filter(p => p.productLimit > current.productLimit)
    .sort((a, b) => a.productLimit - b.productLimit)
  return candidates[0] ?? null
}

// ─── Mapa rota do admin → módulo exigido ────────────────────────────
// Usado pela sidebar (esconder links) e pelo ModuleGuard (bloquear acesso
// direto por URL). Rotas não listadas ficam sempre liberadas.
export const ROUTE_MODULE: { prefix: string; exact?: boolean; module: ModuleFlag }[] = [
  { prefix: '/admin', exact: true, module: 'DASHBOARD' },        // /admin redireciona p/ /admin/dashboard
  { prefix: '/admin/dashboard', module: 'DASHBOARD' },
  { prefix: '/admin/estoque', module: 'ESTOQUE' },
  { prefix: '/admin/vendas', module: 'VENDAS' },
  { prefix: '/admin/servicos', module: 'ORDENS_SERVICO' },
  { prefix: '/admin/agendamentos', module: 'AGENDAMENTOS' },
  { prefix: '/admin/orcamentos', module: 'ORCAMENTOS' },
  { prefix: '/admin/assistencia', module: 'AGENDAMENTOS' },
  { prefix: '/admin/promocoes', module: 'PROMOCOES' },
  { prefix: '/admin/configuracoes', module: 'CONFIGURACOES' },
]

/** Retorna o módulo exigido para uma rota do admin, ou null se livre. */
export function moduleForRoute(pathname: string): ModuleFlag | null {
  // Match exato primeiro (ex.: /admin → DASHBOARD, sem capturar /admin/estoque)
  const exact = ROUTE_MODULE.find(r => r.exact && r.prefix === pathname)
  if (exact) return exact.module
  const prefix = ROUTE_MODULE
    .filter(r => !r.exact && (pathname === r.prefix || pathname.startsWith(r.prefix + '/')))
    // mais específico (prefixo mais longo) vence
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]
  return prefix?.module ?? null
}
