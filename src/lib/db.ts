/**
 * db.ts — Camada de acesso ao Supabase multi-tenant.
 * Todas as funções recebem storeId explicitamente.
 * Server Components usam getStoreIdFromHeaders() para obtê-lo.
 * Client Components recebem storeId via props/context (do AdminStoreProvider).
 */

import { cache } from 'react'
import { supabase as anonClient } from './supabase'
import { getSupabaseBrowser } from './supabase-browser'
import type { Product, Service, Appointment, ServiceOrder, Sale, Banner, Quote } from '@/types'

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

export async function upsertProduct(storeId: string, product: Partial<Product> & { id?: string }) {
  const { data, error } = await db()
    .from('products')
    .upsert({ ...product, store_id: storeId })
    .select()
    .single()
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

export async function insertSale(storeId: string, sale: Omit<Sale, 'id' | 'created_at'>) {
  const { data, error } = await db()
    .from('sales')
    .insert({ ...sale, store_id: storeId })
    .select()
    .single()
  if (error) throw error
  return data as Sale
}

export async function upsertSale(storeId: string, sale: Partial<Sale> & { id: string }) {
  const { data, error } = await db()
    .from('sales')
    .upsert({ ...sale, store_id: storeId })
    .select()
    .single()
  if (error) throw error
  return data as Sale
}

export async function deleteSale(storeId: string, id: string) {
  const { error } = await db()
    .from('sales').delete().eq('id', id).eq('store_id', storeId)
  if (error) throw error
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
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${storeId}/${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await db().storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type })
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
