/**
 * brand.ts — Normaliza o store_config da loja num objeto de branding usado
 * pela vitrine (Header, Footer, menus). Mantém o storefront white-label:
 * nome, logo, contatos e horários vêm da loja, com fallbacks seguros.
 */
import type { StoreConfig } from '@/lib/db'

export interface Brand {
  name: string
  logoUrl: string
  whatsapp: string      // dígitos internacionais para wa.me (ex.: 5511999999999)
  phone: string         // telefone para exibição
  instagram: string     // handle sem @ (ex.: "minhaloja") ou ''
  instagramUrl: string  // URL completa ou ''
  address: string
  hoursWeekday: string
  hoursSaturday: string
  about: string
}

export function brandFromConfig(config: StoreConfig | null): Brand {
  const name = config?.store_name?.trim() || 'Minha Loja'

  const waDigits = (config?.whatsapp ?? '').replace(/\D/g, '')
  const whatsapp = waDigits ? (waDigits.startsWith('55') ? waDigits : '55' + waDigits) : ''

  const igRaw = (config?.instagram ?? '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '')

  return {
    name,
    logoUrl: config?.logo_url?.trim() || '',
    whatsapp,
    phone: config?.phone?.trim() || '',
    instagram: igRaw,
    instagramUrl: igRaw ? `https://instagram.com/${igRaw}` : '',
    address: config?.address?.trim() || '',
    hoursWeekday: config?.hours_weekday?.trim() || '',
    hoursSaturday: config?.hours_saturday?.trim() || '',
    about: config?.about?.trim() || '',
  }
}

/** Monta um link wa.me com mensagem opcional (vazio se a loja não tem whatsapp). */
export function waLink(brand: Brand, msg?: string): string {
  if (!brand.whatsapp) return '#'
  const base = `https://wa.me/${brand.whatsapp}`
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base
}
