import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { startDatabase, saleSQL } from './local-postgres.mjs'

const db = await startDatabase(55443, 'full')
const clients = []
let checks = 0
async function check(name, fn) { await fn(); checks++; console.log(`PASS ${name}`) }
try {
  const a = randomUUID(), b = randomUUID(), pa = randomUUID(), pb = randomUUID()
  await db.client.query(`insert into stores(id,slug,plan_id,is_active,admin_email) values
    ($1,'qa-a','loja',true,'a@example.test'),($2,'qa-b','loja',true,'b@example.test')`, [a,b])
  await db.client.query(`insert into products(id,store_id,name,slug,price,stock_qty,category) values
    ($1,$2,'Produto A','produto-a',10,3,'teste'),($3,$4,'Produto B','produto-b',10,3,'teste')`, [pa,a,pb,b])
  async function identity(email, role='authenticated') {
    const client = await db.connect(); clients.push(client)
    await client.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify(email ? { sub: randomUUID(), email, role } : { role })])
    await client.query(`set role ${role}`)
    return client
  }
  const owner = await identity('a@example.test'), other = await identity('b@example.test'), visitor = await identity(null,'anon')
  await check('owns_store real distingue dono, outra loja e visitante', async () => {
    for (const [client, expected] of [[owner,true],[other,false],[visitor,false]]) {
      assert.equal((await client.query('select owns_store($1) as owns',[a])).rows[0].owns, expected)
    }
  })
  await check('resolve_store retorna identidade publica sem email administrativo', async () => {
    const row = (await visitor.query("select * from resolve_store('qa-a')")).rows[0]
    assert.equal(row.id,a); assert.equal('admin_email' in row,false)
    assert.equal((await visitor.query('select * from stores')).rowCount,0)
  })
  await check('produto de outra loja nao pode ser atualizado ou excluido', async () => {
    assert.equal((await owner.query('update products set stock_qty=99 where id=$1',[pb])).rowCount,0)
    assert.equal((await owner.query('delete from products where id=$1',[pb])).rowCount,0)
    await assert.rejects(owner.query('update products set store_id=$1 where id=$2',[b,pa]), /row-level security/)
  })
  const saleId = randomUUID(), request = randomUUID()
  const args = [a,saleId,request,0,JSON.stringify([{product_id:pa,quantity:1,unit_price:10}]),10,'pix','Cliente ficticio','aprovado']
  await check('venda atomica compativel com schema completo e retry idempotente', async () => {
    assert.equal((await owner.query(saleSQL,args)).rows[0].id,saleId)
    assert.equal((await owner.query(saleSQL,args)).rows[0].revision,1)
    assert.equal((await db.client.query('select stock_qty from products where id=$1',[pa])).rows[0].stock_qty,2)
  })
  await check('vendas e movimentos privados invisiveis para outra loja e anonimo', async () => {
    for (const table of ['sales','sale_stock_movements']) {
      assert.equal((await owner.query(`select * from ${table}`)).rowCount,1)
      assert.equal((await other.query(`select * from ${table}`)).rowCount,0)
      // Movement ledger may deny the role at privilege level rather than RLS.
      try { assert.equal((await visitor.query(`select * from ${table}`)).rowCount,0) }
      catch (error) { if (error.code !== '42501') throw error }
    }
    await assert.rejects(other.query(saleSQL,args))
    await assert.rejects(visitor.query(saleSQL,args), /permission denied/)
  })
  await check('orcamentos, ordens e agendamentos isolados por loja', async () => {
    await db.client.query("insert into quotes(store_id,customer_name,device) values($1,'Privado','Teste')",[a])
    await db.client.query("insert into service_orders(id,store_id,customer_name,customer_phone,device_brand,device_model,problem) values('QA-1',$1,'Privado','000','Teste','Teste','Teste')",[a])
    await db.client.query("insert into appointments(store_id,customer_name,customer_phone,service_name,scheduled_at) values($1,'Privado','000','Teste',now())",[a])
    for (const table of ['quotes','service_orders','appointments']) {
      assert.equal((await owner.query(`select * from ${table}`)).rowCount,1)
      assert.equal((await other.query(`select * from ${table}`)).rowCount,0)
      assert.equal((await visitor.query(`select * from ${table}`)).rowCount,0)
      assert.equal((await other.query(`delete from ${table}`)).rowCount,0)
    }
  })
  await check('storage restringe escrita ao prefixo da propria loja', async () => {
    await owner.query("insert into storage.objects(bucket_id,name) values('store-assets',$1)",[`${a}/qa.png`])
    await assert.rejects(other.query("insert into storage.objects(bucket_id,name) values('store-assets',$1)",[`${a}/invasao.png`]), /row-level security/)
    assert.equal((await other.query("delete from storage.objects where name=$1",[`${a}/qa.png`])).rowCount,0)
  })
  await check('regressao reproduzida: schema anterior expoe produto desativado', async () => {
    await db.client.query('update products set is_active=false where id=$1',[pa])
    assert.equal((await visitor.query('select id from products where id=$1',[pa])).rowCount,1)
  })
  await db.client.query(await readFile(new URL('../supabase/migrations/20260906_public_catalog_visibility.sql',import.meta.url),'utf8'))
  await check('correcao oculta item desativado do publico e preserva acesso do dono', async () => {
    assert.equal((await visitor.query('select id from products where id=$1',[pa])).rowCount,0)
    assert.equal((await other.query('select id from products where id=$1',[pa])).rowCount,0)
    assert.equal((await owner.query('select id from products where id=$1',[pa])).rowCount,1)
    assert.equal((await visitor.query('select id from products where id=$1',[pb])).rowCount,1)
  })
  await check('loja inativa: API publica bloqueada, trial futuro libera, expirado nao', async () => {
    await db.client.query('update products set is_active=true where id=$1',[pa])
    for (const trial of [null, '2000-01-01', '2099-01-01']) {
      await db.client.query('update stores set is_active=false,trial_expires_at=$2 where id=$1',[a,trial])
      assert.equal((await visitor.query('select id from products where id=$1',[pa])).rowCount,trial==='2099-01-01'?1:0)
      assert.equal((await owner.query('select id from products where id=$1',[pa])).rowCount,1)
    }
  })
  await check('servicos, banners, posts e configuracao respeitam a disponibilidade', async () => {
    await db.client.query("insert into services(store_id,name) values($1,'Servico QA')",[a])
    await db.client.query("insert into banners(store_id,title) values($1,'Banner QA')",[a])
    await db.client.query("insert into posts(store_id,caption) values($1,'Post QA')",[a])
    await db.client.query('insert into store_config(store_id) values($1)',[a])
    for (const table of ['services','banners','posts','store_config']) {
      assert.equal((await visitor.query(`select * from ${table} where store_id=$1`,[a])).rowCount,1)
    }
    await db.client.query('update stores set trial_expires_at=null where id=$1',[a])
    for (const table of ['services','banners','posts','store_config']) {
      assert.equal((await visitor.query(`select * from ${table} where store_id=$1`,[a])).rowCount,0)
      assert.equal((await owner.query(`select * from ${table} where store_id=$1`,[a])).rowCount,1)
    }
    await db.client.query('update stores set is_active=true where id=$1',[a])
    for (const table of ['services','banners','posts']) {
      await owner.query(`update ${table} set is_active=false where store_id=$1`,[a])
      assert.equal((await visitor.query(`select * from ${table} where store_id=$1`,[a])).rowCount,0)
      assert.equal((await owner.query(`select * from ${table} where store_id=$1`,[a])).rowCount,1)
    }
  })
  console.log(`${checks} verificacoes com schema completo passaram. Sem acesso remoto.`)
} finally {
  await Promise.all(clients.map(client => client.end()))
  await db.stop()
}
