/**
 * db.ts — Camada de acesso ao Supabase multi-tenant.
 * Todas as funções recebem storeId explicitamente.
 * Server Components usam getStoreIdFromHeaders() para obtê-lo.
 * Client Components recebem storeId via props/context (do AdminStoreProvider).
 */

import { cache } from 'react'
import { supabase as anonClient } from './supabase'
import { getSupabaseBrowser } from './supabase-browser'
import { compressImage } from './image'
import type {
  Product, Service, Appointment, ServiceOrder, Sale, Banner, Quote,
  Expense, DashboardPeriod, SalePaymentType,
} from '@/types'

/**
 * Seletor de cliente Supabase, ciente do contexto (RLS):
 *  - No browser → cliente com sessão (cookies). As políticas RLS usam o e-mail
 *    do usuário autenticado (owns_store) para liberar leitura/escrita da loja.
 *  - No server → cliente anon (sem sessão). Cobre as leituras públicas da
 *    vitrine, liberadas por políticas RLS de SELECT público.
 */
function db() {
  if (typeof window !== 'undefined') return getSupabaseBrowser() ?? anonClient
  return anonClient
}

// ─── store_config ──────────────────────────────────────────────────

export interface StoreConfig {
  id: string
  store_id: string
  store_name: string
  whatsapp: string
  phone: string
  address: string
  instagram: string
  hours_weekday: string
  hours_saturday: string
  accent_color: string
  about: string
  logo_url: string
}

// cache() deduplica chamadas simultâneas no mesmo request de servidor.
export const getStoreConfig = cache(async (storeId: string): Promise<StoreConfig | null> => {
  if (!storeId) return null
  const { data } = await db()
    .from('store_config')
    .select('*')
    .eq('store_id', storeId)
    .single()
  return data
})

export async function updateStoreConfig(storeId: string, config: Partial<Omit<StoreConfig, 'id' | 'store_id'>>) {
  const { data, error } = await db()
    .from('store_config')
    .update({ ...config, updated_at: new Date().toISOString() })
    .eq('store_id', storeId)
    .select()
    .single()
  if (error) throw error
  return data as StoreConfig
}

// ─── products ─────────────────────────────────────────────────────

export async function getProducts(storeId: string): Promise<Product[]> {
  const { data, error } = await db()
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function countProducts(storeId: string): Promise<number> {
  const { count, error } = await db()
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
  if (error) throw error
  return count ?? 0
}

export async function upsertProduct(storeId: string, product: Partial<Product> & { id?: string }, expectedStock?: number) {
  if (product.stock_qty !== undefined && (!Number.isInteger(product.stock_qty) || product.stock_qty < 0)) {
    throw new Error('O estoque deve ser um número inteiro igual ou maior que zero.')
  }
  // Compare-and-set: an old edit form must not overwrite a sale's new balance.
  if (product.id && product.stock_qty !== undefined && expectedStock === undefined) {
    throw new Error('Reabra o produto para conferir o estoque antes de salvar.')
  }
  let query = product.id
    ? db().from('products').update({ ...product, store_id: storeId }).eq('id', product.id).eq('store_id', storeId)
    : db().from('products').insert({ ...product, store_id: storeId })
  if (product.id && expectedStock !== undefined) query = query.eq('stock_qty', expectedStock)
  const { data, error } = await query.select().single()
  if (error?.code === 'PGRST116') throw new Error('O estoque mudou ou o produto não está mais disponível. Atualize a página e reabra o produto.')
  if (error) throw error
  return data as Product
}

export async function deleteProduct(storeId: string, id: string) {
  const { error } = await db()
    .from('products').delete().eq('id', id).eq('store_id', storeId)
  if (error) throw error
}

/** Liga/ajusta/remove a promoção de um produto. promoPrice = null remove a promo. */
export async function updateProductPromo(storeId: string, id: string, promoPrice: number | null) {
  const { error } = await db()
    .from('products').update({ promo_price: promoPrice }).eq('id', id).eq('store_id', storeId)
  if (error) throw error
}

// ─── services ─────────────────────────────────────────────────────

export async function getServices(storeId: string): Promise<Service[]> {
  const { data, error } = await db()
    .from('services')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Service[]
}

export async function upsertService(storeId: string, service: Partial<Service> & { id?: string }) {
  const { data, error } = await db()
    .from('services')
    .upsert({ ...service, store_id: storeId })
    .select()
    .single()
  if (error) throw error
  return data as Service
}

export async function deleteService(storeId: string, id: string) {
  const { error } = await db()
    .from('services').delete().eq('id', id).eq('store_id', storeId)
  if (error) throw error
}

// ─── appointments ─────────────────────────────────────────────────

export async function getAppointments(storeId: string): Promise<Appointment[]> {
  const { data, error } = await db()
    .from('appointments')
    .select('*')
    .eq('store_id', storeId)
    .order('scheduled_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Appointment[]
}

export async function upsertAppointment(storeId: string, appt: Partial<Appointment> & { id?: string }) {
  const { data, error } = await db()
    .from('appointments')
    .upsert({ ...appt, store_id: storeId })
    .select()
    .single()
  if (error) throw error
  return data as Appointment
}

export async function deleteAppointment(storeId: string, id: string) {
  const { error } = await db()
    .from('appointments').delete().eq('id', id).eq('store_id', storeId)
  if (error) throw error
}

/**
 * Criação de agendamento pelo visitante público (site /agendar).
 * Sob RLS, o anon pode INSERIR mas não pode SELECIONAR a linha de volta —
 * por isso este insert NÃO usa .select() (evita erro de RETURNING bloqueado).
 */
export async function createPublicAppointment(
  storeId: string,
  appt: Omit<Appointment, 'id' | 'created_at' | 'status'> & { status?: Appointment['status'] },
) {
  const { error } = await db()
    .from('appointments')
    .insert({ ...appt, store_id: storeId })
  if (error) throw error
}

// ─── service_orders ───────────────────────────────────────────────

export async function getServiceOrders(storeId: string): Promise<ServiceOrder[]> {
  const { data, error } = await db()
    .from('service_orders')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ServiceOrder[]
}

export async function upsertServiceOrder(storeId: string, order: Partial<ServiceOrder> & { id?: string }) {
  const { data, error } = await db()
    .from('service_orders')
    .upsert({ ...order, store_id: storeId })
    .select()
    .single()
  if (error) throw error
  return data as ServiceOrder
}

export async function deleteServiceOrder(storeId: string, id: string) {
  const { error } = await db()
    .from('service_orders').delete().eq('id', id).eq('store_id', storeId)
  if (error) throw error
}

// ─── sales ────────────────────────────────────────────────────────

export async function getSales(storeId: string): Promise<Sale[]> {
  const { data, error } = await db()
    .from('sales')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Sale[]
}

export async function saveSaleAtomic(storeId: string, sale: Pick<Sale, 'id' | 'items' | 'total' | 'payment_method' | 'customer_name' | 'status' | 'revision'>, requestId: string) {
  const { data, error } = await db().rpc('save_sale_atomic', {
    p_store_id: storeId, p_sale_id: sale.id, p_request_id: requestId,
    p_revision: sale.revision ?? 0, p_items: sale.items, p_total: sale.total,
    p_payment_method: sale.payment_method, p_customer_name: sale.customer_name ?? null,
    p_status: sale.status ?? 'aprovado',
  })
  if (error?.code === 'PGRST202') throw new Error('Registro indisponível: a atualização do banco ainda não foi aplicada. Nenhuma confirmação foi emitida.')
  if (error) throw error
  if (!data?.id) throw new Error('Não foi possível confirmar a gravação. Tente novamente para verificar a mesma operação.')
  return data as Sale
}

/**
 * Registra um pagamento de venda a prazo. Vai por RPC porque `sales` tem
 * insert/update revogados desde a migração de vendas atômicas — e porque o
 * saldo precisa ser conferido com a linha travada, não no navegador.
 */
export async function registerSalePayment(storeId: string, saleId: string, valor: number) {
  const { data, error } = await db().rpc('register_sale_payment', {
    p_store_id: storeId, p_sale_id: saleId, p_valor: valor,
  })
  if (error?.code === 'PGRST202') throw new Error('Recebimento indisponível: a atualização do banco ainda não foi aplicada.')
  if (error) throw error
  if (!data?.id) throw new Error('Não foi possível confirmar o pagamento. Tente novamente.')
  return data as Sale
}

/** Define se a venda é à vista ou a prazo, logo após ela ser gravada. */
export async function setSalePaymentTerms(
  storeId: string, saleId: string,
  terms: { payment_type: SalePaymentType; valor_pago?: number; vencimento?: string | null },
) {
  const { data, error } = await db().rpc('set_sale_payment_terms', {
    p_store_id: storeId, p_sale_id: saleId, p_payment_type: terms.payment_type,
    p_valor_pago: terms.valor_pago ?? 0, p_vencimento: terms.vencimento ?? null,
  })
  if (error?.code === 'PGRST202') throw new Error('Condição de pagamento indisponível: a atualização do banco ainda não foi aplicada.')
  if (error) throw error
  return data as Sale
}

// ─── expenses (despesas) ──────────────────────────────────────────

export async function getExpenses(storeId: string): Promise<Expense[]> {
  const { data, error } = await db()
    .from('expenses')
    .select('*')
    .eq('store_id', storeId)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Expense[]
}

export async function upsertExpense(storeId: string, expense: Partial<Expense> & { id?: string }) {
  const { data, error } = await db()
    .from('expenses')
    .upsert({ ...expense, store_id: storeId })
    .select()
    .single()
  if (error) throw error
  return data as Expense
}

export async function deleteExpense(storeId: string, id: string) {
  const { error } = await db()
    .from('expenses').delete().eq('id', id).eq('store_id', storeId)
  if (error) throw error
}

// ─── dashboard_periods (período + meta) ───────────────────────────

export async function getPeriods(storeId: string): Promise<DashboardPeriod[]> {
  const { data, error } = await db()
    .from('dashboard_periods')
    .select('*')
    .eq('store_id', storeId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as DashboardPeriod[]
}

/** Cria o período inicial da loja, se ela ainda não tiver um aberto. */
export async function ensureActivePeriod(storeId: string): Promise<DashboardPeriod | null> {
  const periods = await getPeriods(storeId)
  const ativo = periods.find(p => p.ended_at === null)
  if (ativo) return ativo
  const { data, error } = await db()
    .from('dashboard_periods')
    .insert({ store_id: storeId, meta_valor: 0 })
    .select()
    .single()
  // Corrida entre duas abas: o índice único parcial barra o segundo insert e
  // quem perdeu simplesmente lê o período que o outro criou.
  if (error?.code === '23505') return (await getPeriods(storeId)).find(p => p.ended_at === null) ?? null
  if (error) throw error
  return data as DashboardPeriod
}

export async function setPeriodMeta(storeId: string, periodId: string, meta: number) {
  const { data, error } = await db()
    .from('dashboard_periods')
    .update({ meta_valor: meta })
    .eq('id', periodId).eq('store_id', storeId)
    .select()
    .single()
  if (error) throw error
  return data as DashboardPeriod
}

/**
 * Fecha o período atual e abre outro. Não apaga nem move nenhuma venda — só
 * muda a janela que o dashboard lê.
 */
export async function closePeriod(storeId: string, periodId: string) {
  const agora = new Date().toISOString()
  const { error: errFechar } = await db()
    .from('dashboard_periods')
    .update({ ended_at: agora })
    .eq('id', periodId).eq('store_id', storeId)
  if (errFechar) throw errFechar
  const { data, error } = await db()
    .from('dashboard_periods')
    .insert({ store_id: storeId, started_at: agora, meta_valor: 0 })
    .select()
    .single()
  if (error) throw error
  return data as DashboardPeriod
}

// ─── banners ──────────────────────────────────────────────────────

export async function getBanners(storeId: string): Promise<Banner[]> {
  const { data, error } = await db()
    .from('banners')
    .select('*')
    .eq('store_id', storeId)
    .order('order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Banner[]
}

export async function upsertBanner(storeId: string, banner: Partial<Banner> & { id?: string }) {
  const { data, error } = await db()
    .from('banners')
    .upsert({ ...banner, store_id: storeId })
    .select()
    .single()
  if (error) throw error
  return data as Banner
}

export async function deleteBanner(storeId: string, id: string) {
  const { error } = await db()
    .from('banners').delete().eq('id', id).eq('store_id', storeId)
  if (error) throw error
}

// ─── storage (upload de imagens) ──────────────────────────────────

const STORAGE_BUCKET = 'store-assets'

/**
 * Faz upload da imagem para o Storage e retorna a URL pública.
 * Lança o erro em caso de falha — o chamador deve avisar o usuário.
 * (Antes havia fallback silencioso para base64, que gravava data URLs
 * gigantes no banco e mascarava problemas de upload/RLS.)
 */
export async function uploadImage(file: File, folder: string, storeId: string): Promise<string> {
  const compressed = await compressImage(file)
  const ext = compressed.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${storeId}/${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await db().storage
    .from(STORAGE_BUCKET)
    .upload(path, compressed, { upsert: true, cacheControl: '3600', contentType: compressed.type })
  if (error) throw error
  return db().storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

// ─── quotes ───────────────────────────────────────────────────────

export async function getQuotes(storeId: string): Promise<Quote[]> {
  const { data, error } = await db()
    .from('quotes')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Quote[]
}

export async function upsertQuote(storeId: string, quote: Partial<Quote> & { id?: string }) {
  const { data, error } = await db()
    .from('quotes')
    .upsert({ ...quote, store_id: storeId })
    .select()
    .single()
  if (error) throw error
  return data as Quote
}

export async function deleteQuote(storeId: string, id: string) {
  const { error } = await db()
    .from('quotes').delete().eq('id', id).eq('store_id', storeId)
  if (error) throw error
}

// ─── posts (Feed / Novidades) ──────────────────────────────────────

export interface Post {
  id: string
  store_id: string
  image_url: string
  caption: string
  tag: string
  link: string
  is_active: boolean
  order: number
  created_at: string
}

export async function getPosts(storeId: string): Promise<Post[]> {
  const { data, error } = await db()
    .from('posts')
    .select('*')
    .eq('store_id', storeId)
    .order('order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Post[]
}

export async function upsertPost(storeId: string, post: Partial<Post> & { id?: string }) {
  const { data, error } = await db()
    .from('posts')
    .upsert({ ...post, store_id: storeId })
    .select()
    .single()
  if (error) throw error
  return data as Post
}

export async function deletePost(storeId: string, id: string) {
  const { error } = await db()
    .from('posts').delete().eq('id', id).eq('store_id', storeId)
  if (error) throw error
}

// ─── store_staff (logins de equipe — plano Master) ──────────────────
export interface StaffMember { id: string; email: string; created_at: string }

export async function getStaff(storeId: string): Promise<StaffMember[]> {
  const { data, error } = await db()
    .from('store_staff')
    .select('id, email, created_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as StaffMember[]
}

export async function deleteStaff(storeId: string, id: string) {
  const { error } = await db()
    .from('store_staff').delete().eq('id', id).eq('store_id', storeId)
  if (error) throw error
}
