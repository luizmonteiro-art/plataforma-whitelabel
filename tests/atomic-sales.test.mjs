import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
before(async () => {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('app.uid',true),'')::uuid $$;
    create table plans(id text primary key, modules text[]);
    create table stores(id uuid primary key, plan_id text references plans, is_active boolean, trial_expires_at timestamptz, admin_email text);
    create table products(id uuid primary key, store_id uuid references stores, name text, stock_qty integer, is_active boolean);
    create table sales(id uuid primary key, store_id uuid references stores, items jsonb, total numeric(10,2), payment_method text, customer_name text, created_at timestamptz default now());
    create function public.owns_store(p_store_id uuid) returns boolean language sql security definer set search_path=public as $$
      select exists(select 1 from stores where id=p_store_id and admin_email=current_setting('app.email',true)) $$;
    grant usage on schema public,auth to authenticated,anon;
    grant all on sales to authenticated,anon;
    insert into plans values ('loja',array['VENDAS']),('vitrine',array['ESTOQUE']);
    select set_config('app.uid','11111111-1111-4111-8111-111111111111',false);
    select set_config('app.email','owner@example.test',false);
  `)
  await db.exec(await readFile(new URL('../supabase/migrations/20260906_atomic_sales.sql', import.meta.url),'utf8'))
})
after(() => db.close())

async function fixture(stock=3) {
  const store=randomUUID(), product=randomUUID()
  await db.query('insert into stores values ($1,$2,true,null,$3)',[store,'loja','owner@example.test'])
  await db.query('insert into products values ($1,$2,$3,$4,true)',[product,store,'Produto',stock])
  return {store,product,id:randomUUID(),request:randomUUID()}
}
async function save(f, overrides={}) {
  const input={revision:0,status:'aprovado',quantity:1,total:10, ...overrides}
  await db.exec('set role authenticated')
  try {
    const {rows}=await db.query(`select * from public.save_sale_atomic($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)`,[
      f.store,f.id,input.request ?? f.request,input.revision,
      JSON.stringify(input.items ?? [{product_id:f.product,quantity:input.quantity,unit_price:10}]),
      input.total,'pix','Cliente',input.status,
    ])
    return rows[0]
  } finally { await db.exec('reset role') }
}
async function stock(f) { return (await db.query('select stock_qty from products where id=$1',[f.product])).rows[0].stock_qty }
async function count(f,table) { return Number((await db.query(`select count(*) from ${table} where store_id=$1`,[f.store])).rows[0].count) }

test('grava venda, baixa estoque e preserva situação após nova leitura',async()=>{
  const f=await fixture(); const sale=await save(f,{status:'pendente'})
  assert.equal(sale.status,'pendente'); assert.equal(await stock(f),2)
  assert.equal(await count(f,'sale_stock_movements'),1)
  assert.equal((await db.query('select status from sales where id=$1',[f.id])).rows[0].status,'pendente')
})
test('retry da mesma operação não duplica venda ou baixa',async()=>{
  const f=await fixture(); await save(f); await save(f)
  assert.equal(await count(f,'sales'),1); assert.equal(await stock(f),2)
  assert.equal(await count(f,'sale_stock_movements'),1)
})
test('estoque insuficiente desfaz venda e todos os movimentos',async()=>{
  const f=await fixture(1)
  await assert.rejects(save(f,{quantity:2,total:20}),/Estoque insuficiente/)
  assert.equal(await count(f,'sales'),0); assert.equal(await stock(f),1)
})
test('edição aplica somente diferença; cancelar devolve uma vez',async()=>{
  const f=await fixture(); await save(f)
  await save(f,{revision:1,request:randomUUID(),quantity:2,total:20})
  assert.equal(await stock(f),1)
  const request=randomUUID()
  await save(f,{revision:2,request,status:'cancelado',quantity:2,total:20})
  await save(f,{revision:2,request,status:'cancelado',quantity:2,total:20})
  assert.equal(await stock(f),3); assert.equal(await count(f,'sales'),1)
})
test('edição com revisão desatualizada falha sem alterar saldo',async()=>{
  const f=await fixture(); await save(f)
  await assert.rejects(save(f,{request:randomUUID(),revision:0}),/mudou em outro acesso/)
  assert.equal(await stock(f),2)
})
test('último item não pode ser vendido novamente',async()=>{
  const f=await fixture(1); await save(f)
  await assert.rejects(save({...f,id:randomUUID(),request:randomUUID()}),/Estoque insuficiente/)
  assert.equal(await stock(f),0); assert.equal(await count(f,'sales'),1)
})
test('valida propriedade do produto e da loja',async()=>{
  const f=await fixture(), other=await fixture()
  await assert.rejects(save({...f,product:other.product}),/não pertence/)
  await db.query('update stores set admin_email=$1 where id=$2',['another@example.test',other.store])
  await assert.rejects(save(other),/Acesso negado/)
  assert.equal(await stock(f),3)
})
test('bloqueia loja inativa sem trial e plano sem vendas',async()=>{
  const f=await fixture()
  await db.query('update stores set is_active=false where id=$1',[f.store])
  await assert.rejects(save(f),/Loja inativa/)
  await db.query("update stores set is_active=true,plan_id='vitrine' where id=$1",[f.store])
  await assert.rejects(save(f),/plano/)
})
test('bloqueia quantidade inválida, total inválido e itens duplicados',async()=>{
  const f=await fixture()
  await assert.rejects(save(f,{quantity:-1}),/Quantidade/)
  await assert.rejects(save(f,{quantity:1.5}),/Quantidade/)
  await assert.rejects(save(f,{total:11}),/Total inválido/)
  const item={product_id:f.product,quantity:1,unit_price:10}
  await assert.rejects(save(f,{items:[item,item]}),/Agrupe/)
  assert.equal(await count(f,'sales'),0)
})
test('vendas anteriores à migração não têm estoque reconstruído por suposição',async()=>{
  const f=await fixture()
  await db.query('insert into sales(id,store_id,items,total) values($1,$2,$3,10)',[f.id,f.store,JSON.stringify([{product_id:f.product,quantity:1,unit_price:10}])])
  await assert.rejects(save(f),/Venda antiga/)
  assert.equal(await stock(f),3)
})
test('cliente autenticado não pode gravar ou excluir venda diretamente',async()=>{
  await db.exec('set role authenticated')
  try { await assert.rejects(db.exec('delete from public.sales'),/permission denied/) }
  finally { await db.exec('reset role') }
})
test('falha no segundo produto reverte a baixa do primeiro',async()=>{
  const f=await fixture(2), second=randomUUID()
  await db.query('insert into products values($1,$2,$3,0,true)',[second,f.store,'Sem estoque'])
  await assert.rejects(save(f,{items:[
    {product_id:f.product,quantity:1,unit_price:10},
    {product_id:second,quantity:1,unit_price:10},
  ],total:20}),/Estoque insuficiente/)
  assert.equal(await stock(f),2); assert.equal(await count(f,'sales'),0)
  assert.equal(await count(f,'sale_stock_movements'),0)
})
test('aprovar reserva não desconta duas vezes e reabrir cancelada exige saldo',async()=>{
  const f=await fixture(1); await save(f,{status:'pendente'})
  await save(f,{revision:1,request:randomUUID(),status:'aprovado'})
  assert.equal(await stock(f),0)
  await save(f,{revision:2,request:randomUUID(),status:'cancelado'})
  await save({...f,id:randomUUID(),request:randomUUID()})
  await assert.rejects(save(f,{revision:3,request:randomUUID()}),/Estoque insuficiente/)
  assert.equal((await db.query('select status from sales where id=$1',[f.id])).rows[0].status,'cancelado')
})
test('formulário antigo de produto não sobrescreve baixa confirmada',async()=>{
  const f=await fixture(3); const previous=await stock(f); await save(f)
  const result=await db.query('update products set stock_qty=8 where id=$1 and store_id=$2 and stock_qty=$3 returning id',[f.product,f.store,previous])
  assert.equal(result.rows.length,0); assert.equal(await stock(f),2)
})
test('chamada anônima não executa a função',async()=>{
  await db.exec('set role anon')
  try { await assert.rejects(db.query('select public.save_sale_atomic(null,null,null,0,$1,0,$2,null,$3)',['[]','pix','aprovado']),/permission denied/) }
  finally { await db.exec('reset role') }
})
