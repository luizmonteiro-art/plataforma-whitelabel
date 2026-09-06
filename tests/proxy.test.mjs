import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { NextRequest } from 'next/server.js'

const require = createRequire(import.meta.url)
async function compile(email) {
  const result = await build({
    entryPoints: ['src/proxy.ts'], bundle: true, platform: 'node', format: 'cjs', write: false,
    external: ['next/server'],
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.NEXT_PUBLIC_SUPABASE_URL': '"https://example.test"',
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': '"fake-test-key-only"',
      'process.env.SUPERADMIN_EMAIL': JSON.stringify(email),
    },
    plugins: [{ name: 'supabase-fixture', setup(b) {
      b.onResolve({ filter: /^@supabase\/ssr$/ }, () => ({ path: 'fixture', namespace: 'fixture' }))
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: `
        export function createServerClient(url, key, options) {
          return { auth: { async getUser() {
            if (globalThis.fixture.refresh) options.cookies.setAll([{name:'test-session',value:'refreshed',options:{path:'/'}}]);
            return {data:{user:globalThis.fixture.user}};
          } }, async rpc(name) {
            return name === 'resolve_store' ? {data:globalThis.fixture.store,error:globalThis.fixture.error} : {data:globalThis.fixture.owns};
          }};
        }` }))
    }}],
  })
  const fakeModule = { exports: {} }
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, fakeModule, fakeModule.exports)
  return fakeModule.exports.proxy
}
const proxy = await compile('owner@example.test')
const noOwnerProxy = await compile('')
function fixture(overrides = {}) {
  globalThis.fixture = { store: { id: 'real-store', plan_id: 'master', is_active: true, trial_expires_at: null }, user: { email: 'owner@example.test' }, owns: true, ...overrides }
}
const request = (path, headers = {}) => new NextRequest(`https://shop.example.test${path}`, { headers })

test('forwards trusted store identity, overriding client supplied identity', async () => {
  fixture()
  const response = await proxy(request('/admin/vendas?store=demo', { 'x-store-id': 'forged', 'x-store-plan': 'forged' }))
  assert.equal(response.headers.get('x-middleware-request-x-store-id'), 'real-store')
  assert.equal(response.headers.get('x-middleware-request-x-store-plan'), 'master')
})
test('inactive store needs an explicit unexpired trial', async () => {
  for (const trial of [null, '2000-01-01', 'invalid']) {
    fixture({ store: { id: 'x', plan_id: 'master', is_active: false, trial_expires_at: trial } })
    assert.equal(new URL((await proxy(request('/?store=demo'))).headers.get('location')).pathname, '/loja-inativa')
  }
  fixture({ store: { id: 'x', plan_id: 'master', is_active: false, trial_expires_at: '2099-01-01' } })
  assert.equal((await proxy(request('/?store=demo'))).status, 200)
})
test('login redirect retains store, destination query and refreshed auth cookie', async () => {
  fixture({ user: null, refresh: true })
  const response = await proxy(request('/admin/vendas?store=demo&filter=hoje'))
  const url = new URL(response.headers.get('location'))
  assert.equal(url.searchParams.get('store'), 'demo')
  assert.equal(url.searchParams.get('next'), '/admin/vendas?store=demo&filter=hoje')
  assert.equal(response.cookies.get('test-session').value, 'refreshed')
})
test('auth refresh preserves forwarded identity and new request cookie', async () => {
  fixture({ refresh: true })
  const response = await proxy(request('/admin/vendas?store=demo'))
  assert.equal(response.headers.get('x-middleware-request-x-store-id'), 'real-store')
  assert.match(response.headers.get('x-middleware-request-cookie'), /test-session=refreshed/)
})
test('wrong store owner cannot enter admin', async () => {
  fixture({ owns: false })
  assert.equal(new URL((await proxy(request('/admin/vendas?store=demo'))).headers.get('location')).pathname, '/admin/login')
})
test('missing superadmin configuration fails closed; wrong account denied', async () => {
  fixture()
  assert.equal((await noOwnerProxy(request('/superadmin'))).status, 503)
  fixture({ user: { email: 'other@example.test' } })
  assert.equal((await proxy(request('/superadmin'))).status, 307)
})
test('database error is unavailable, not misreported as inactive store', async () => {
  fixture({ error: { message: 'unavailable' } })
  assert.equal((await proxy(request('/?store=demo'))).status, 503)
})
