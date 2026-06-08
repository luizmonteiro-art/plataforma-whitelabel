'use client'

/**
 * AdminStore — Fonte única de verdade para todos os dados do admin.
 * storeId e planId vêm do Server Component pai (layout.tsx),
 * que os lê dos headers injetados pelo middleware.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Product, Service, Appointment, ServiceOrder, Sale, Banner } from '@/types'
import {
  getProducts, getServices, getAppointments,
  getServiceOrders, getSales, getBanners, getStoreConfig,
  type StoreConfig,
} from '@/lib/db'
import { getPlan, planHasModule, type ModuleFlag, type PlanDef } from '@/lib/plans'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AdminStoreState {
  storeId: string
  planId: string
  storeConfig: StoreConfig | null
  products: Product[]
  services: Service[]
  appointments: Appointment[]
  serviceOrders: ServiceOrder[]
  sales: Sale[]
  banners: Banner[]
  _loaded: boolean
  _error: string | null
}

interface AdminStoreActions {
  setProducts: (fn: (prev: Product[]) => Product[]) => void
  setServices: (fn: (prev: Service[]) => Service[]) => void
  setAppointments: (fn: (prev: Appointment[]) => Appointment[]) => void
  setServiceOrders: (fn: (prev: ServiceOrder[]) => ServiceOrder[]) => void
  setSales: (fn: (prev: Sale[]) => Sale[]) => void
  setBanners: (fn: (prev: Banner[]) => Banner[]) => void
  reload: () => Promise<void>
}

type AdminStore = AdminStoreState & AdminStoreActions

// ── Context ───────────────────────────────────────────────────────────────────

const Ctx = createContext<AdminStore | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

interface ProviderProps {
  storeId: string
  planId: string
  children: ReactNode
}

export function AdminStoreProvider({ storeId, planId, children }: ProviderProps) {
  const [state, setState] = useState<AdminStoreState>({
    storeId,
    planId,
    storeConfig: null,
    products: [],
    services: [],
    appointments: [],
    serviceOrders: [],
    sales: [],
    banners: [],
    _loaded: false,
    _error: null,
  })

  const load = async () => {
    try {
      const [storeConfig, products, services, appointments, serviceOrders, sales, banners] =
        await Promise.all([
          getStoreConfig(storeId),
          getProducts(storeId),
          getServices(storeId),
          getAppointments(storeId),
          getServiceOrders(storeId),
          getSales(storeId),
          getBanners(storeId),
        ])
      setState(s => ({
        ...s,
        storeConfig,
        products,
        services,
        appointments,
        serviceOrders,
        sales,
        banners,
        _loaded: true,
        _error: null,
      }))
    } catch (err) {
      setState(s => ({
        ...s,
        _loaded: true,
        _error: err instanceof Error ? err.message : 'Erro ao carregar dados',
      }))
    }
  }

  useEffect(() => { load() }, [])

  const make = <K extends keyof Omit<AdminStoreState, '_loaded' | '_error' | 'storeId' | 'planId'>>(key: K) =>
    (fn: (prev: AdminStoreState[K]) => AdminStoreState[K]) => {
      setState(prev => ({ ...prev, [key]: fn(prev[key]) }))
    }

  const store: AdminStore = {
    ...state,
    setProducts: make('products'),
    setServices: make('services'),
    setAppointments: make('appointments'),
    setServiceOrders: make('serviceOrders'),
    setSales: make('sales'),
    setBanners: make('banners'),
    reload: load,
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useAdminStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAdminStore must be inside AdminStoreProvider')
  return ctx
}

/**
 * usePlan — feature flags da loja atual, derivadas do planId (header → context).
 * Camada de UX: esconder links, bloquear telas, fazer upsell.
 */
export function usePlan(): {
  planId: string
  plan: PlanDef
  hasModule: (flag: ModuleFlag) => boolean
  productLimit: number
} {
  const { planId } = useAdminStore()
  const plan = getPlan(planId)
  return {
    planId,
    plan,
    hasModule: (flag: ModuleFlag) => planHasModule(planId, flag),
    productLimit: plan.productLimit,
  }
}

/** Config da loja atual (nome, cor, whatsapp...) para branding do admin. */
export const useStoreConfig = () => useAdminStore().storeConfig

export const useProducts      = () => { const s = useAdminStore(); return [s.products,      s.setProducts]      as const }
export const useServices      = () => { const s = useAdminStore(); return [s.services,      s.setServices]      as const }
export const useAppointments  = () => { const s = useAdminStore(); return [s.appointments,  s.setAppointments]  as const }
export const useServiceOrders = () => { const s = useAdminStore(); return [s.serviceOrders, s.setServiceOrders] as const }
export const useSales         = () => { const s = useAdminStore(); return [s.sales,         s.setSales]         as const }
export const useBanners       = () => { const s = useAdminStore(); return [s.banners,       s.setBanners]       as const }
