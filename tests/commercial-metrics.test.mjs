import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const result = await build({ entryPoints: ['src/app/superadmin/comercial/model.ts'], bundle: true, format: 'esm', write: false })
const { parseReais, monthMetrics, saoPauloDate } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)

test('valores em reais viram centavos inteiros sem aceitar ponto decimal ambíguo', () => {
  assert.equal(parseReais('R$ 2.500,05'), 250005)
  assert.equal(parseReais('2500,5'), 250050)
  assert.equal(parseReais('0'), 0)
  assert.equal(parseReais('2.500.05'), null)
  assert.equal(parseReais('12,345'), null)
})

test('mês de São Paulo respeita virada do dia e lead vinculado conta uma vez', () => {
  assert.equal(saoPauloDate('2026-10-01T01:00:00Z'), '2026-09-30')
  const snapshot = {
    leads: [{ id: 'l1', created_at: '2026-10-01T01:00:00Z' }],
    projects: [
      { id: 'p1', source_request_id: 'l1', lead_on: '2026-09-30', proposal_sent_on: '2026-09-10', proposed_cents: 600000, stage: 'fechado', won_on: '2026-09-15', contracted_cents: 600000, delivery_stage: 'em_execucao' },
      { id: 'p2', source_request_id: null, lead_on: '2026-09-16', proposal_sent_on: null, stage: 'novo', won_on: null },
    ],
    subscriptions: [{ status: 'ativa', starts_on: '2026-01-01', ends_on: null, monthly_cents: 29900 }],
    receivables: [
      { id: 'r1', project_id: 'p1', amount_cents: 200000, due_on: '2026-09-20', canceled_at: null },
      { id: 'r2', project_id: 'p1', amount_cents: 400000, due_on: '2026-10-20', canceled_at: null },
    ],
    receipts: [{ receivable_id: 'r1', amount_cents: 100000, received_on: '2026-09-21', voided_at: null }],
  }
  const m = monthMetrics(snapshot, '2026-09', '2026-10-08')
  assert.equal(m.leads, 2)
  assert.equal(m.proposals, 1)
  assert.equal(m.contractedCents, 600000)
  assert.equal(m.receivedCents, 100000)
  assert.equal(m.openCents, 500000)
  assert.equal(m.overdueCents, 100000)
  assert.equal(m.mrrCents, 29900)
  assert.equal(m.pendingDelivery, 1)
  assert.equal(monthMetrics({ ...snapshot, leads: [] }, '2026-09', '2026-10-08').leads, 2,
    'o projeto preserva a data do lead após o pedido original ser excluído')
  const incomplete = monthMetrics({ ...snapshot, receivables: [], projects: [{ ...snapshot.projects[0], contracted_cents: null, history_incomplete: true }] }, '2026-09', '2026-10-08')
  assert.equal(incomplete.unpricedWon, 1)
  assert.equal(incomplete.incompleteHistory, 1)
})
