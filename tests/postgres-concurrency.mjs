import assert from 'node:assert/strict'
import { setTimeout } from 'node:timers/promises'
import { startDatabase,seedStore,saleArgs,saleSQL } from './local-postgres.mjs'

const db=await startDatabase()
const a=await db.connect(true),b=await db.connect(true)
try {
  const f=await seedStore(db.client)
  await a.query('begin')
  await a.query(saleSQL,saleArgs(f))
  let completed=false
  const competing=b.query(saleSQL,saleArgs(f)).then(()=>({ok:true}),error=>({ok:false,error})).finally(()=>{completed=true})
  await setTimeout(200)
  assert.equal(completed,false,'A segunda conexão deve aguardar o bloqueio da primeira')
  await a.query('commit')
  const result=await competing
  assert.equal(result.ok,false)
  assert.match(result.error.message,/Estoque insuficiente/)
  assert.equal((await db.client.query('select stock_qty from products where id=$1',[f.product])).rows[0].stock_qty,0)
  assert.equal(Number((await db.client.query('select count(*) from sales where store_id=$1',[f.store])).rows[0].count),1)
  console.log('PASS: duas conexões disputam o último item; somente uma venda confirmada.')

  const retry=await seedStore(db.client,2),args=saleArgs(retry)
  const responses=await Promise.all([a.query(saleSQL,args),b.query(saleSQL,args)])
  assert.equal(responses[0].rows[0].id,responses[1].rows[0].id)
  assert.equal((await db.client.query('select stock_qty from products where id=$1',[retry.product])).rows[0].stock_qty,1)
  console.log('PASS: requisições simultâneas com mesmo identificador não duplicam a baixa.')
  const version=responses[0].rows[0]
  const edits=await Promise.allSettled([
    a.query(saleSQL,saleArgs(retry,{id:version.id,revision:1,status:'pendente'})),
    b.query(saleSQL,saleArgs(retry,{id:version.id,revision:1,status:'cancelado'})),
  ])
  assert.equal(edits.filter(x=>x.status==='fulfilled').length,1)
  assert.match(edits.find(x=>x.status==='rejected').reason.message,/mudou em outro acesso/)
  console.log('PASS: duas edições da mesma revisão; somente uma aceita.')
} finally { await a.end();await b.end();await db.stop() }
