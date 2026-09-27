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
  /** Quanto a loja pagou pelo produto. Base de todo cálculo de lucro. */
  cost?: number
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
  /**
   * Custo unitário congelado no momento da venda. Ainda não é gravado — quem
   * normaliza os itens é `save_sale_atomic`, que hoje descarta campos extras.
   * Fica opcional para que o cálculo de lucro use o custo atual do produto
   * como base e passe a usar o congelado assim que a função for estendida.
   */
  unit_cost?: number
}

/** À vista quita no ato; a prazo gera saldo devedor e aparece em Devedores. */
export type SalePaymentType = 'avista' | 'aprazo'

export interface Sale {
  id: string
  status?: 'aprovado' | 'pendente' | 'cancelado'
  revision?: number
  stock_managed?: boolean
  items: SaleItem[]
  total: number
  payment_method: PaymentMethod
  payment_type?: SalePaymentType
  /** Quanto já foi recebido desta venda. */
  valor_pago?: number
  vencimento?: string | null
  /** Aparelho recebido como parte do pagamento (ex.: "iPhone 11 128GB"). */
  trade_in_device?: string | null
  /** Valor avaliado da troca. Abate o saldo devedor; não entra no total. */
  trade_in_value?: number
  customer_name?: string
  customer_phone?: string
  notes?: string
  created_at: string
}

export type ExpenseCategory =
  | 'aluguel' | 'fornecedor' | 'peca' | 'salario'
  | 'imposto' | 'marketing' | 'contas' | 'outros'

export interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  payment_method: PaymentMethod
  date: string
  notes?: string
  /** Falso quando é só registro contábil e não sai do caixa. */
  affects_cash: boolean
  created_at: string
}

/**
 * Janela [started_at, ended_at) usada como filtro de leitura do dashboard.
 * Fechar um período não move nem apaga venda nenhuma.
 */
export interface DashboardPeriod {
  id: string
  started_at: string
  ended_at: string | null
  meta_valor: number
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
