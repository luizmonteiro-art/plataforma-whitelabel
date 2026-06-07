export type ProductCondition = 'novo' | 'seminovo' | 'lacrado'
export type ProductCategory = 'iphone' | 'android' | 'capinha' | 'pelicula' | 'carregador' | 'acessorio'
export type ServiceStatus = 'recebido' | 'em_analise' | 'aguardando_peca' | 'em_reparo' | 'pronto' | 'entregue'
export type AppointmentStatus = 'pendente' | 'confirmado' | 'cancelado' | 'realizado'
export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  promo_price?: number
  stock_qty: number
  category: ProductCategory
  brand: string
  condition: ProductCondition
  images: string[]
  is_featured: boolean
  is_active: boolean
  specs?: Record<string, string>
  created_at: string
}

export interface Service {
  id: string
  name: string
  description: string
  price_from: number
  duration_minutes: number
  is_active: boolean
  icon: string
}

export interface Appointment {
  id: string
  customer_name: string
  customer_phone: string
  service_id: string
  service_name: string
  device_info: string
  problem: string
  scheduled_at: string
  status: AppointmentStatus
  notes?: string
  created_at: string
}

export interface ServiceOrder {
  id: string
  customer_name: string
  customer_phone: string
  device_brand: string
  device_model: string
  problem: string
  diagnosis?: string
  price?: number
  status: ServiceStatus
  appointment_id?: string
  created_at: string
  updated_at: string
}

export interface SaleItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  total: number
  payment_method: PaymentMethod
  customer_name?: string
  customer_phone?: string
  notes?: string
  created_at: string
}

export interface Banner {
  id: string
  title: string
  subtitle: string
  image_url: string
  badge?: string
  cta_text: string
  cta_href: string
  is_active: boolean
  order: number
}

export type QuoteStatus = 'pendente' | 'aprovado' | 'recusado' | 'expirado'

export interface QuoteItem {
  id: string
  descricao: string
  qty: number
  unitario: number
}

export interface Quote {
  id: string
  customer_name: string
  customer_phone: string
  device: string
  items: QuoteItem[]
  desconto: number
  observacoes: string
  validade: string
  status: QuoteStatus
  created_at: string
}
