import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result = await build({ entryPoints: ['src/lib/pending-sale.ts'], bundle: true, format: 'esm', write: false })
const { pendingSaleJournal } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
function storage() {
  const data = new Map()
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }
}
const sale = { id: 'sale-1', items: [], total: 10, revision: 0, status: 'aprovado', payment_method: 'pix' }
test('reload recovers same sale and request; new operation cannot replace uncertain write', () => {
  const session = storage()
  const original = pendingSaleJournal(session, 'store-1').begin(sale)
  const reloaded = pendingSaleJournal(session, 'store-1')
  assert.deepEqual(reloaded.read(), original)
  assert.deepEqual(reloaded.begin({ ...sale, id: 'another-sale' }), original)
  reloaded.clear()
  assert.equal(reloaded.read(), null)
  assert.notEqual(reloaded.begin(sale).requestId, original.requestId)
})
test('recovery is separated by store', () => {
  const session = storage()
  pendingSaleJournal(session, 'store-1').begin(sale)
  assert.equal(pendingSaleJournal(session, 'store-2').read(), null)
})
test('storage failure stops operation before sending it', () => {
  const session = storage()
  session.setItem = () => { throw new Error('storage disabled') }
  assert.throws(() => pendingSaleJournal(session, 'store').begin(sale), /storage disabled/)
})
