/**
 * db.ts — Camada de acesso ao Supabase multi-tenant.
 * Todas as queries filtram por STORE_ID (uma variável de ambiente por deploy).
 */

import { cache } from 'react'
import { supabase } from './supabase'
import type { Product, Service, Appointment, ServiceOrder, Sale, Banner, Quote } from '@/types'

export const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? 'default'

// ─── store_config ──────────────────────────────────────────────────────────

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
// generateMetadata e RootLayout chamam getStoreConfig — sem cache() isso
// dispara 2 queries ao Supabase; com cache() é sempre 1 query por request.
export const getStoreConfig = cache(async (): Promise<StoreConfig | null> => {
  const { data } = await supabase
    .from('store_config')
    .select('*')
    .eq('store_id', STORE_ID)
    .single()
  return data
})

export async function updateStoreConfig(config: Partial<Omit<StoreConfig, 'id' | 'store_id'>>) {
  const { data, error } = await supabase
    .from('store_config')
    .update({ ...config, updated_at: new Date().toISOString() })
    .eq('store_id', STORE_ID)
    .select()
    .single()
  if (error) throw error
  return data as StoreConfig
}

// ─── products ─────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function upsertProduct(product: Partial<Product> & { id?: string }) {
  const { data, error } = await supabase
    .from('products')
    .upsert({ ...product, store_id: STORE_ID })
    .select()
    .single()
  if (error) throw error
  return data as Product
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products').delete().eq('id', id).eq('store_id', STORE_ID)
  if (error) throw error
}

// ─── services ─────────────────────────────────────────────────────────────

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Service[]
}

export async function upsertService(service: Partial<Service> & { id?: string }) {
  const { data, error } = await supabase
    .from('services')
    .upsert({ ...service, store_id: STORE_ID })
    .select()
    .single()
  if (error) throw error
  return data as Service
}

export async function deleteService(id: string) {
  const { error } = await supabase
    .from('services').delete().eq('id', id).eq('store_id', STORE_ID)
  if (error) throw error
}

// ─── appointments ─────────────────────────────────────────────────────────

export async function getAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('scheduled_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Appointment[]
}

export async function upsertAppointment(appt: Partial<Appointment> & { id?: string }) {
  const { data, error } = await supabase
    .from('appointments')
    .upsert({ ...appt, store_id: STORE_ID })
    .select()
    .single()
  if (error) throw error
  return data as Appointment
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase
    .from('appointments').delete().eq('id', id).eq('store_id', STORE_ID)
  if (error) throw error
}

// ─── service_orders ───────────────────────────────────────────────────────

export async function getServiceOrders(): Promise<ServiceOrder[]> {
  const { data, error } = await supabase
    .from('service_orders')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ServiceOrder[]
}

export async function upsertServiceOrder(order: Partial<ServiceOrder> & { id?: string }) {
  const { data, error } = await supabase
    .from('service_orders')
    .upsert({ ...order, store_id: STORE_ID })
    .select()
    .single()
  if (error) throw error
  return data as ServiceOrder
}

export async function deleteServiceOrder(id: string) {
  const { error } = await supabase
    .from('service_orders').delete().eq('id', id).eq('store_id', STORE_ID)
  if (error) throw error
}

// ─── sales ────────────────────────────────────────────────────────────────

export async function getSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Sale[]
}

export async function insertSale(sale: Omit<Sale, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('sales')
    .insert({ ...sale, store_id: STORE_ID })
    .select()
    .single()
  if (error) throw error
  return data as Sale
}

export async function upsertSale(sale: Partial<Sale> & { id: string }) {
  const { data, error } = await supabase
    .from('sales')
    .upsert({ ...sale, store_id: STORE_ID })
    .select()
    .single()
  if (error) throw error
  return data as Sale
}

export async function deleteSale(id: string) {
  const { error } = await supabase
    .from('sales').delete().eq('id', id).eq('store_id', STORE_ID)
  if (error) throw error
}

// ─── banners ──────────────────────────────────────────────────────────────

export async function getBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Banner[]
}

export async function upsertBanner(banner: Partial<Banner> & { id?: string }) {
  const { data, error } = await supabase
    .from('banners')
    .upsert({ ...banner, store_id: STORE_ID })
    .select()
    .single()
  if (error) throw error
  return data as Banner
}

export async function deleteBanner(id: string) {
  const { error } = await supabase
    .from('banners').delete().eq('id', id).eq('store_id', STORE_ID)
  if (error) throw error
}

// ─── storage (upload de imagens) ────────────────────────────────────────────

const STORAGE_BUCKET = 'store-assets'

/** Lê um File como data URL (base64) — fallback quando o Storage não está disponível. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Faz upload de uma imagem para o bucket `store-assets` e retorna a URL pública.
 * Se o bucket não existir / Storage não estiver configurado, faz fallback para
 * base64 (data URL) — assim o cadastro nunca quebra.
 * `folder` ex.: 'products', 'banners'.
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${STORE_ID}/${folder}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type })
    if (error) throw error
    return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl
  } catch {
    // Bucket ausente ou sem credenciais → guarda a imagem inline (base64)
    return fileToBase64(file)
  }
}

// ─── quotes ───────────────────────────────────────────────────────────────────

export async function getQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Quote[]
}

export async function upsertQuote(quote: Partial<Quote> & { id?: string }) {
  const { data, error } = await supabase
    .from('quotes')
    .upsert({ ...quote, store_id: STORE_ID })
    .select()
    .single()
  if (error) throw error
  return data as Quote
}

export async function deleteQuote(id: string) {
  const { error } = await supabase
    .from('quotes').delete().eq('id', id).eq('store_id', STORE_ID)
  if (error) throw error
}
