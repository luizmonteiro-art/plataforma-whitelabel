// Only the transport is replaced. Production React components and state are reused.
import type { Sale } from '../../src/types'
export const storeId='22222222-2222-4222-8222-222222222222'
async function read(table:string) {
  const response=await fetch('/qa/'+table)
  if (!response.ok) throw new Error('Falha de leitura na demonstração')
  return response.json()
}
export const getProducts=()=>read('products')
export const getSales=()=>read('sales')
export const getStoreConfig=async()=>({store_name:'Loja demonstração',accent_color:'#22c55e'})
export const getServices=async()=>[]
export const getAppointments=async()=>[]
export const getServiceOrders=async()=>[]
export const getBanners=async()=>[]
export async function saveSaleAtomic(_store:string,sale:Sale,request:string) {
  const mode=sessionStorage.getItem('qa-failure') ?? 'normal'
  sessionStorage.setItem('qa-failure','normal')
  const response=await fetch('/qa/sale',{method:'POST',headers:{'Content-Type':'application/json','X-QA':'1'},body:JSON.stringify({sale,request,mode})})
  const result=await response.json()
  if (!response.ok) throw Object.assign(new Error(result.error), { code: result.code })
  return result
}
