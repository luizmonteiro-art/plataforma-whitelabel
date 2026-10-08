import EmbeddedPostgres from 'embedded-postgres'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

// Test-only cluster. No .env files, production URLs or user credentials are read.
export async function startDatabase(port=55439, schemaMode='minimal') {
  const directory = await mkdtemp(path.join(tmpdir(),'modus-qa-'))
  const postgres = new EmbeddedPostgres({
    databaseDir:path.join(directory,'data'), user:'qa', password:randomUUID(),
    port, persistent:true, postgresFlags:['-h','127.0.0.1'],
    onLog:()=>{}, onError:()=>{},
  })
  await postgres.initialise()
  await postgres.start()
  let databaseName = 'postgres'
  const connect = async (authenticated=false) => {
    const client = postgres.getPgClient(databaseName)
    await client.connect()
    await client.query("select set_config('app.uid','11111111-1111-4111-8111-111111111111',false), set_config('app.email','owner@example.test',false)")
    if (authenticated) await client.query('set role authenticated')
    return client
  }
  if (schemaMode === 'full') {
    const bootstrap = await connect()
    await bootstrap.query("create database qa_full template template0 encoding 'UTF8' lc_collate 'C' lc_ctype 'C'")
    await bootstrap.end()
    databaseName = 'qa_full'
  }
  const client=await connect()
  if (schemaMode === 'full') {
    // Supabase platform interfaces only; application tables, helpers and RLS
    // come unchanged from the repository schema. This is not an Auth server.
    await client.query(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin;
      create schema auth;
      create function auth.jwt() returns jsonb language sql stable as $$
        select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
      $$;
      create function auth.uid() returns uuid language sql stable as $$
        select (auth.jwt()->>'sub')::uuid
      $$;
      grant usage on schema public, auth to anon, authenticated;
      alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
      create schema storage;
      create table storage.buckets(id text primary key, name text, public boolean);
      create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
      alter table storage.objects enable row level security;
      grant usage on schema storage to anon, authenticated;
      grant select, insert, update, delete on storage.objects to anon, authenticated;
    `)
    await client.query(await readFile(new URL('../supabase-schema.sql',import.meta.url),'utf8'))
  } else {
  // Reuse the same minimal schema fixture as the PostgreSQL/WASM tests.
  const tests=await readFile(new URL('./atomic-sales.test.mjs',import.meta.url),'utf8')
  const schema=tests.match(/await db\.exec\(`([\s\S]*?)`\)/)?.[1]
  if (!schema) throw new Error('Missing test schema fixture')
  await client.query(schema)
  }
  await client.query(await readFile(new URL('../supabase/migrations/20260906_atomic_sales.sql',import.meta.url),'utf8'))
  return { client,connect,directory,stop:async()=>{await client.end();await postgres.stop()} }
}

export async function seedStore(client,stock=1) {
  const store=randomUUID(),product=randomUUID()
  await client.query('insert into stores values($1,$2,true,null,$3)',[store,'loja','owner@example.test'])
  await client.query('insert into products values($1,$2,$3,$4,true)',[product,store,'Celular demonstração',stock])
  return {store,product}
}

export function saleArgs(f,overrides={}) {
  return [f.store,overrides.id ?? randomUUID(),overrides.request ?? randomUUID(),overrides.revision ?? 0,
    JSON.stringify([{product_id:f.product,quantity:1,unit_price:10}]),10,'pix','Cliente demonstração',overrides.status ?? 'aprovado']
}
export const saleSQL='select * from public.save_sale_atomic($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)'
