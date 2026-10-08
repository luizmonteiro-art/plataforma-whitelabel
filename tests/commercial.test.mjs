import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { startDatabase } from './local-postgres.mjs'

test('comercial MODS: fechamento, parcelas, pagamentos e isolamento', async () => {
  const db = await startDatabase(55448, 'full')
  let visitor
  try {
    await db.client.query(await readFile(new URL('../supabase/migrations/20261008_mods_commercial.sql', import.meta.url), 'utf8'))
    const projectId = randomUUID()
    const requestId = randomUUID()
    await db.client.query(`insert into store_requests(id,store_name,contact_name,email,whatsapp,plan_id)
      values($1,'Cliente','Contato','teste@example.test','11999999999','loja')`, [requestId])
    await db.client.query(`insert into commercial_projects(id,kind,title,client_name,source_request_id,lead_on)
      values($1,'loja','Implantação','Cliente',$2,'2026-01-10')`, [projectId, requestId])
    const schedule = [
      { kind: 'entrada', amount_cents: 200000, due_on: '2026-02-10' },
      { kind: 'parcela', amount_cents: 200000, due_on: '2026-03-10' },
    ]
    await assert.rejects(db.client.query('select commercial_close_project($1,$2,$3,$4::jsonb,$5)',
      [projectId, 500000, '2026-02-01', JSON.stringify(schedule), 'qa']), /agenda deve somar/)
    assert.equal((await db.client.query('select stage from commercial_projects where id=$1', [projectId])).rows[0].stage, 'novo')
    await db.client.query('select commercial_close_project($1,$2,$3,$4::jsonb,$5)',
      [projectId, 400000, '2026-02-01', JSON.stringify(schedule), 'qa'])
    const receivables = (await db.client.query('select * from commercial_receivables where project_id=$1 order by due_on', [projectId])).rows
    assert.equal(receivables.length, 2)
    const operation = randomUUID()
    const args = [receivables[0].id, operation, 100000, '2026-02-10', 'pix', 'qa', 'superadmin@example.test']
    const first = (await db.client.query('select commercial_record_receipt($1,$2,$3,$4,$5,$6,$7) as id', args)).rows[0].id
    assert.equal((await db.client.query('select commercial_record_receipt($1,$2,$3,$4,$5,$6,$7) as id', args)).rows[0].id, first)
    await assert.rejects(db.client.query('select commercial_record_receipt($1,$2,$3,$4,$5,$6,$7)',
      [receivables[0].id, randomUUID(), 150000, '2026-02-10', 'pix', null, 'qa']), /acima do saldo/)
    await db.client.query('select commercial_void_receipt($1,$2,$3)', [first, 'Pagamento lançado errado', 'qa'])
    assert.equal((await db.client.query('select count(*)::int as n from commercial_receipts where voided_at is null')).rows[0].n, 0)
    await assert.rejects(db.client.query('select commercial_record_receipt($1,$2,$3,$4,$5,$6,$7)', args), /anterior estornada/)
    const subscriptionId = randomUUID()
    await db.client.query(`insert into commercial_subscriptions(id,project_id,client_name,monthly_cents,billing_day,starts_on)
      values($1,$2,'Cliente',29900,10,'2026-02-01')`, [subscriptionId, projectId])
    await db.client.query('select commercial_create_monthly_charge($1,$2,$3)', [subscriptionId, '2026-02-01', 'qa'])
    await assert.rejects(db.client.query('select commercial_create_monthly_charge($1,$2,$3)',
      [subscriptionId, '2026-02-01', 'qa']), /unique/)
    await db.client.query("update commercial_subscriptions set status='pausada' where id=$1", [subscriptionId])
    await assert.rejects(db.client.query('select commercial_create_monthly_charge($1,$2,$3)',
      [subscriptionId, '2026-03-01', 'qa']), /não está ativa/)
    await db.client.query("update commercial_subscriptions set status='ativa' where id=$1", [subscriptionId])
    await assert.rejects(db.client.query('select commercial_create_monthly_charge($1,$2,$3)',
      [subscriptionId, '2026-01-01', 'qa']), /fora da vigência/)
    assert.ok((await db.client.query('select count(*)::int as n from commercial_events where project_id=$1', [projectId])).rows[0].n >= 5)
    const historyId = randomUUID()
    await db.client.query(`insert into commercial_projects(id,kind,title,client_name,stage,history_incomplete,source_note)
      values($1,'site','Projeto antigo','Cliente histórico','fechado',true,'Contrato a conferir')`, [historyId])
    assert.equal((await db.client.query('select won_on from commercial_projects where id=$1', [historyId])).rows[0].won_on, null)
    await db.client.query('select commercial_close_project($1,$2,$3,$4::jsonb,$5)',
      [historyId, 100000, '2025-05-15', JSON.stringify([{ kind: 'entrada', amount_cents: 100000, due_on: '2025-05-15' }]), 'qa'])
    assert.equal((await db.client.query('select history_incomplete from commercial_projects where id=$1', [historyId])).rows[0].history_incomplete, false)
    await db.client.query('delete from store_requests where id=$1', [requestId])
    assert.equal((await db.client.query('select source_request_id from commercial_projects where id=$1', [projectId])).rows[0].source_request_id, null)
    assert.equal((await db.client.query("select count(*)::int as n from commercial_receivables where project_id=$1 and kind <> 'mensalidade'", [projectId])).rows[0].n, 2)
    visitor = await db.connect()
    await visitor.query('set role authenticated')
    await assert.rejects(visitor.query('select * from commercial_projects'), /permission denied/)
    await assert.rejects(visitor.query('select * from commercial_receipts'), /permission denied/)
    await assert.rejects(visitor.query('select commercial_close_project($1,$2,$3,$4::jsonb,$5)',
      [projectId, 1, '2026-02-01', '[]', 'x']), /permission denied/)
    await assert.rejects(visitor.query('select commercial_create_monthly_charge($1,$2,$3)',
      [subscriptionId, '2026-04-01', 'x']), /permission denied/)
    await visitor.query('set role anon')
    await assert.rejects(visitor.query('select * from commercial_projects'), /permission denied/)
  } finally {
    if (visitor) await visitor.end()
    await db.stop()
  }
})
