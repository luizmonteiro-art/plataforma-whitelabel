// Temporary public preview gateway. Exposes only the synthetic sales harness.
import { createServer, request } from 'node:http'
const paths=new Set(['/','/vendas','/dashboard','/app.js','/app.css','/qa/products','/qa/sales','/qa/sale'])
createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname
  if(!paths.has(pathname) || !['GET','POST'].includes(req.method) || (req.method==='POST' && pathname!=='/qa/sale')){
    res.writeHead(404);return res.end('Not found')
  }
  if(req.method==='POST' && (!req.headers.origin || new URL(req.headers.origin).host!==req.headers.host)){
    res.writeHead(403);return res.end('Origin not allowed')
  }
  const upstream=request({hostname:'127.0.0.1',port:3019,path:pathname,method:req.method,
    headers:{'content-type':req.headers['content-type']??'application/json','origin':'http://127.0.0.1:3019','x-qa':'1'}},response=>{
    res.writeHead(response.statusCode??502,{'content-type':response.headers['content-type']??'text/plain','cache-control':'no-store','x-robots-tag':'noindex, nofollow'})
    response.pipe(res)
  })
  upstream.on('error',()=>{res.writeHead(503);res.end('Demonstração temporariamente indisponível')})
  let size=0
  req.on('data',chunk=>{size+=chunk.length;if(size>100000){upstream.destroy();req.destroy()}else upstream.write(chunk)})
  req.on('end',()=>upstream.end())
}).listen(3020,'127.0.0.1',()=>console.log('Gateway da demonstração: 127.0.0.1:3020'))
