import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const result = await build({ entryPoints: ['src/lib/period.ts'], bundle: true, format: 'esm', write: false })
const {
  calcSaleProfit, calcSaldoDevedor, calcTrocoDevido, isVencido,
  calcPeriodMetrics, getActivePeriod, filterSalesByPeriod, filterExpensesByPeriod,
} = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)

const venda = (over = {}) => ({
  id: 'v1', status: 'aprovado', created_at: '2026-09-20T12:00:00Z',
  items: [{ product_id: 'p1', product_name: 'Aparelho', quantity: 1, unit_price: 1000 }],
  total: 1000, payment_method: 'pix', ...over,
})
const produto = (over = {}) => ({ id: 'p1', cost: 600, ...over })

// ─── Lucro ────────────────────────────────────────────────────────────────

test('lucro desconta o custo do produto', () => {
  assert.equal(calcSaleProfit(venda(), [produto()]), 400)
})

test('venda com desconto nao mostra lucro maior que a receita', () => {
  // Itens somam 1000, mas a venda saiu por 800: o desconto de 200 sai do lucro.
  const comDesconto = venda({ total: 800 })
  const lucro = calcSaleProfit(comDesconto, [produto()])
  assert.equal(lucro, 200)
  assert.ok(lucro <= comDesconto.total, 'lucro nunca pode passar da receita')
})

test('custo congelado na venda vence o cadastro atual do produto', () => {
  const v = venda({ items: [{ product_id: 'p1', product_name: 'X', quantity: 1, unit_price: 1000, unit_cost: 900 }] })
  // Mesmo que o estoque diga 600, a venda antiga mantem o custo que tinha.
  assert.equal(calcSaleProfit(v, [produto({ cost: 600 })]), 100)
})

test('produto sem custo cadastrado nao inventa lucro negativo', () => {
  assert.equal(calcSaleProfit(venda(), [produto({ cost: undefined })]), 1000)
})

// ─── Saldo devedor e troca ────────────────────────────────────────────────

test('venda a vista quitada nao aparece como divida', () => {
  assert.equal(calcSaldoDevedor(venda({ valor_pago: 1000 })), 0)
})

test('venda a prazo com entrada deixa o saldo certo', () => {
  assert.equal(calcSaldoDevedor(venda({ payment_type: 'aprazo', valor_pago: 300 })), 700)
})

test('aparelho recebido na troca abate o saldo devedor', () => {
  const v = venda({ payment_type: 'aprazo', valor_pago: 200, trade_in_value: 500 })
  assert.equal(calcSaldoDevedor(v), 300)
})

test('troca que cobre a venda inteira zera o saldo, sem ficar negativo', () => {
  const v = venda({ payment_type: 'aprazo', valor_pago: 0, trade_in_value: 1500 })
  assert.equal(calcSaldoDevedor(v), 0)
})

test('troca maior que a venda gera troco para o cliente', () => {
  const v = venda({ trade_in_value: 1300 })
  assert.equal(calcTrocoDevido(v), 300)
})

test('troca menor que a venda nao gera troco', () => {
  assert.equal(calcTrocoDevido(venda({ trade_in_value: 700 })), 0)
})

test('venda cancelada nao gera divida nem troco', () => {
  const v = venda({ status: 'cancelado', valor_pago: 0, trade_in_value: 5000 })
  assert.equal(calcSaldoDevedor(v), 0)
  assert.equal(calcTrocoDevido(v), 0)
})

// ─── Vencimento ───────────────────────────────────────────────────────────

test('so fica vencido quem tem data passada E saldo em aberto', () => {
  const quitada = venda({ valor_pago: 1000, vencimento: '2020-01-01' })
  const devendo = venda({ payment_type: 'aprazo', valor_pago: 0, vencimento: '2020-01-01' })
  const futura = venda({ payment_type: 'aprazo', valor_pago: 0, vencimento: '2099-01-01' })
  assert.equal(isVencido(quitada), false, 'quitada nao vence')
  assert.equal(isVencido(devendo), true)
  assert.equal(isVencido(futura), false)
  assert.equal(isVencido(venda({ payment_type: 'aprazo', valor_pago: 0 })), false, 'sem data nao vence')
})

// ─── Metricas do periodo ──────────────────────────────────────────────────

const despesa = (over = {}) => ({ id: 'd1', amount: 100, date: '2026-09-20', affects_cash: true, ...over })

test('resultado do periodo desconta so a despesa que sai do caixa', () => {
  const m = calcPeriodMetrics(
    [venda()], [produto()],
    [despesa({ amount: 100 }), despesa({ id: 'd2', amount: 50, affects_cash: false })],
  )
  assert.equal(m.receita, 1000)
  assert.equal(m.lucro, 400)
  assert.equal(m.despesas, 100, 'a despesa marcada como fora do caixa nao entra')
  assert.equal(m.resultado, 300)
})

test('venda cancelada nao entra na receita', () => {
  const m = calcPeriodMetrics([venda(), venda({ id: 'v2', status: 'cancelado' })], [produto()], [])
  assert.equal(m.vendas, 1)
  assert.equal(m.receita, 1000)
})

test('loja sem nenhum custo cadastrado nao exibe lucro', () => {
  const m = calcPeriodMetrics([venda()], [produto({ cost: undefined })], [])
  assert.equal(m.temCusto, false)
})

test('periodo filtra por janela e a divida nao depende dela', () => {
  const periods = [
    { id: 'atual', started_at: '2026-09-15T00:00:00Z', ended_at: null, meta_valor: 0 },
    { id: 'antigo', started_at: '2026-08-01T00:00:00Z', ended_at: '2026-09-15T00:00:00Z', meta_valor: 0 },
  ]
  const ativo = getActivePeriod(periods)
  assert.equal(ativo.id, 'atual')
  const dentro = venda({ created_at: '2026-09-20T12:00:00Z' })
  const fora = venda({ id: 'v2', created_at: '2026-08-10T12:00:00Z' })
  assert.deepEqual(filterSalesByPeriod([dentro, fora], ativo).map(s => s.id), ['v1'])
  assert.deepEqual(
    filterExpensesByPeriod([despesa({ date: '2026-09-20' }), despesa({ id: 'd2', date: '2026-08-10' })], ativo).map(d => d.id),
    ['d1'],
  )
})
