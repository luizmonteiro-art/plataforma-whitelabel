/**
 * period.ts — fonte única de verdade para lucro e para as métricas "do período
 * atual".
 *
 * Um período é uma janela [started_at, ended_at) em `dashboard_periods`; o
 * período atual é o que tem `ended_at` null. Fechar um período é só um filtro
 * de leitura: nenhuma venda, despesa ou O.S. é movida ou apagada.
 */

import type { Sale, SaleItem, Product, Expense, DashboardPeriod } from '@/types'

export function getActivePeriod(periods: DashboardPeriod[]): DashboardPeriod | null {
  return periods.find(p => p.ended_at === null) ?? null
}

function dentroDoPeriodo(iso: string, period: DashboardPeriod | null): boolean {
  if (!period) return true
  const t = new Date(iso).getTime()
  const inicio = new Date(period.started_at).getTime()
  const fim = period.ended_at ? new Date(period.ended_at).getTime() : Infinity
  return t >= inicio && t < fim
}

export function filterSalesByPeriod(sales: Sale[], period: DashboardPeriod | null): Sale[] {
  return sales.filter(s => dentroDoPeriodo(s.created_at, period))
}

export function filterExpensesByPeriod(expenses: Expense[], period: DashboardPeriod | null): Expense[] {
  // Despesa é lançada por `date` (competência), não pela hora do cadastro.
  return expenses.filter(e => dentroDoPeriodo(e.date, period))
}

/**
 * Custo unitário de um item. O custo congelado na venda tem prioridade sobre o
 * cadastro do produto: sem isso, editar o custo no estoque reescreveria o lucro
 * de vendas antigas. Enquanto `save_sale_atomic` não congelar o custo, cai no
 * cadastro atual do produto.
 */
export function calcItemCost(item: SaleItem, products: Product[]): number {
  if (item.unit_cost !== undefined) return item.unit_cost
  return products.find(p => p.id === item.product_id)?.cost ?? 0
}

/**
 * `items[].unit_price` é o preço cheio; `sale.total` já vem com o desconto
 * subtraído. Por isso o desconto é abatido aqui também — senão uma venda com
 * desconto mostraria lucro maior que a própria receita.
 */
export function calcSaleProfit(sale: Sale, products: Product[]): number {
  const bruto = sale.items.reduce(
    (total, item) => total + (item.unit_price - calcItemCost(item, products)) * item.quantity,
    0,
  )
  const somaItens = sale.items.reduce((t, i) => t + i.unit_price * i.quantity, 0)
  const desconto = Math.max(0, somaItens - sale.total)
  return bruto - desconto
}

/**
 * Saldo em aberto de uma venda. Zero quando quitada.
 *
 * O aparelho recebido na troca abate como se fosse pagamento: ele não entra no
 * total da venda (o total é o preço do produto), mas é valor que a loja já
 * recebeu.
 */
export function calcSaldoDevedor(sale: Sale): number {
  if (sale.status === 'cancelado') return 0
  const pago = sale.valor_pago ?? sale.total
  const troca = sale.trade_in_value ?? 0
  return Math.max(0, Number((sale.total - pago - troca).toFixed(2)))
}

/**
 * Troco devido ao cliente: quando o aparelho entregue vale mais do que ele
 * levou, a loja é que fica devendo a diferença em dinheiro.
 */
export function calcTrocoDevido(sale: Sale): number {
  if (sale.status === 'cancelado') return 0
  const troca = sale.trade_in_value ?? 0
  if (troca <= 0) return 0
  const pago = sale.valor_pago ?? 0
  return Math.max(0, Number((troca + pago - sale.total).toFixed(2)))
}

export function isVencido(sale: Sale): boolean {
  if (!sale.vencimento || calcSaldoDevedor(sale) <= 0) return false
  const hoje = new Date().toISOString().slice(0, 10)
  return sale.vencimento < hoje
}

export interface PeriodMetrics {
  receita: number
  lucro: number
  despesas: number
  resultado: number
  vendas: number
  /**
   * Uma loja que nunca preencheu custo não deve ver um card de "Lucro" zerado
   * como se tivesse perdido dinheiro — a tela esconde o indicador.
   */
  temCusto: boolean
}

export function calcPeriodMetrics(
  sales: Sale[], products: Product[], expenses: Expense[] = [],
): PeriodMetrics {
  const aprovadas = sales.filter(s => s.status !== 'cancelado')
  const receita = aprovadas.reduce((a, s) => a + s.total, 0)
  const lucro = aprovadas.reduce((a, s) => a + calcSaleProfit(s, products), 0)
  const despesas = expenses.filter(e => e.affects_cash).reduce((a, e) => a + e.amount, 0)
  const temCusto =
    products.some(p => (p.cost ?? 0) > 0) ||
    sales.some(s => s.items.some(i => (i.unit_cost ?? 0) > 0))
  return { receita, lucro, despesas, resultado: lucro - despesas, vendas: aprovadas.length, temCusto }
}

/** Quanto do valor da meta já foi alcançado, de 0 a 1. */
export function progressoMeta(receita: number, meta: number): number {
  if (meta <= 0) return 0
  return Math.min(1, receita / meta)
}
