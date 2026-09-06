import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'
import { startDatabase,saleSQL } from './local-postgres.mjs'

const root=fileURLToPath(new URL('../',import.meta.url))
const store='22222222-2222-4222-8222-222222222222'
const product='33333333-3333-4333-8333-333333333333'
const port=Number(process.env.QA_PORT ?? 3018)
const db=await startDatabase(Number(process.env.QA_PG_PORT ?? 55440))
await db.client.query('insert into stores values($1,$2,true,null,$3)',[store,'loja','owner@example.test'])
await db.client.query('insert into products values($1,$2,$3,3,true)',[product,store,'Celular demonstração'])
const bundle=await build({entryPoints:[path.join(root,'tests/browser/entry.tsx')],bundle:true,write:false,format:'esm',jsx:'automatic',
  define:{'process.env.NODE_ENV':'"development"'},alias:{
    '@/lib/db':path.join(root,'tests/browser/transport.ts'),
    'next/navigation':path.join(root,'tests/browser/navigation.tsx'),
    'next/link':path.join(root,'tests/browser/navigation.tsx'),
  },absWorkingDir:root})
const css=(await postcss([tailwind({base:root})]).process(await readFile(path.join(root,'src/app/globals.css'),'utf8'),{from:path.join(root,'src/app/globals.css')})).css
const json=(response,status,data)=>{response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify(data))}
const server=createServer(async(req,res)=>{
  try {
    if (req.method==='POST' && req.url==='/qa/sale') {
      if(req.headers['x-qa']!=='1' || (req.headers.origin && req.headers.origin!==`http://127.0.0.1:${port}`)) return json(res,403,{error:'Local only'})
      let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000)throw new Error('Payload too large')}
      const {sale,request,mode}=JSON.parse(raw)
      if(mode==='before')return json(res,503,{error:'Falha simulada antes da gravação. Nenhuma venda foi salva.'})
      const client=await db.connect(true)
      try {
        const {rows}=await client.query(saleSQL,[store,sale.id,request,sale.revision??0,JSON.stringify(sale.items),sale.total,sale.payment_method,sale.customer_name??null,sale.status??'aprovado'])
        if(mode==='after')return json(res,503,{error:'Resposta simulada como perdida. Tente novamente a mesma operação.'})
        return json(res,200,{...rows[0],total:Number(rows[0].total)})
      } finally {await client.end()}
    }
    if(req.url==='/qa/products'){
      const {rows}=await db.client.query('select * from products where store_id=$1',[store])
      return json(res,200,rows.map(p=>({...p,price:10,images:[],brand:'Demonstração',category:'iphone',condition:'novo',description:'Produto fictício',created_at:new Date().toISOString()})))
    }
    if(req.url==='/qa/sales'){
      const {rows}=await db.client.query('select * from sales where store_id=$1 order by created_at desc',[store])
      return json(res,200,rows.map(s=>({...s,total:Number(s.total)})))
    }
    if(req.url==='/app.js'){res.writeHead(200,{'Content-Type':'text/javascript'});return res.end(bundle.outputFiles[0].text)}
    if(req.url==='/app.css'){res.writeHead(200,{'Content-Type':'text/css'});return res.end(css)}
    res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MODUS — demonstração local</title><link rel="stylesheet" href="/app.css"><div id="root"></div><script type="module" src="/app.js"></script></html>')
  }catch(error){json(res,400,{error:error.message,code:error.code})}
})
server.listen(port,'127.0.0.1',()=>console.log(`Demonstração isolada: http://127.0.0.1:${port}/vendas`))
async function stop(){server.close();await db.stop();process.exit(0)}
process.on('SIGINT',stop);process.on('SIGTERM',stop)
process.stdin.setEncoding('utf8')
process.stdin.on('data',data=>{if(data.trim()==='stop')void stop()})
