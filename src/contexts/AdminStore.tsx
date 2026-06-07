'use client'

/**
 * AdminStore — Fonte única de verdade para todos os dados do admin.
 * Conectado ao Supabase: carrega na montagem, persiste em tempo real.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Product, Service, Appointment, ServiceOrder, Sale, Banner } from '@/types'
import {
  getProducts, getServices, getAppointments,
  getServiceOrders, getSales, getBanners,
} from '@/lib/db'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AdminStoreState {
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

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminStoreState>({
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
      const [products, services, appointments, serviceOrders, sales, banners] =
        await Promise.all([
          getProducts(),
          getServices(),
          getAppointments(),
          getServiceOrders(),
          getSales(),
          getBanners(),
        ])
      setState(s => ({
        ...s,
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

  // Setters locais (o componente chama db.ts diretamente para persistir,
  // depois chama o setter para atualizar a UI sem re-fetch completo)
  const make = <K extends keyof Omit<AdminStoreState, '_loaded' | '_error'>>(key: K) =>
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

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAdminStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAdminStore must be inside AdminStoreProvider')
  return ctx
}

export const useProducts     = () => { const s = useAdminStore(); return [s.products,      s.setProducts]      as const }
export const useServices     = () => { const s = useAdminStore(); return [s.services,      s.setServices]      as const }
export const useAppointments = () => { const s = useAdminStore(); return [s.appointments,  s.setAppointments]  as const }
export const useServiceOrders= () => { const s = useAdminStore(); return [s.serviceOrders, s.setServiceOrders] as const }
export const useSales        = () => { const s = useAdminStore(); return [s.sales,         s.setSales]         as const }
export const useBanners      = () => { const s = useAdminStore(); return [s.banners,       s.setBanners]       as const }
