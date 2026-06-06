'use client'

/**
 * AdminStore — Fonte única de verdade para todos os dados do admin.
 *
 * - Inicializa com mock data na primeira visita
 * - Persiste tudo no localStorage (sobrevive a refreshes)
 * - Todas as páginas admin leem/escrevem aqui
 * - Fácil de trocar por Supabase: basta substituir load/save por fetch/mutation
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Product, Service, Appointment, ServiceOrder, Sale, Banner } from '@/types'
import {
  mockProducts, mockServices, mockAppointments,
  mockServiceOrders, mockSales, mockBanners,
} from '@/data/mock'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface AdminStoreState {
  products: Product[]
  services: Service[]
  appointments: Appointment[]
  serviceOrders: ServiceOrder[]
  sales: Sale[]
  banners: Banner[]
  _loaded: boolean
}

interface AdminStoreActions {
  setProducts: (fn: (prev: Product[]) => Product[]) => void
  setServices: (fn: (fn: Service[]) => Service[]) => void
  setAppointments: (fn: (prev: Appointment[]) => Appointment[]) => void
  setServiceOrders: (fn: (prev: ServiceOrder[]) => ServiceOrder[]) => void
  setSales: (fn: (prev: Sale[]) => Sale[]) => void
  setBanners: (fn: (prev: Banner[]) => Banner[]) => void
  resetToDefaults: () => void
}

type AdminStore = AdminStoreState & AdminStoreActions

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: Omit<AdminStoreState, '_loaded'> = {
  products: mockProducts,
  services: mockServices,
  appointments: mockAppointments,
  serviceOrders: mockServiceOrders,
  sales: mockSales,
  banners: mockBanners,
}

const STORAGE_KEY = 'mcell-admin-store-v1'

// ── Context ───────────────────────────────────────────────────────────────────

const Ctx = createContext<AdminStore | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminStoreState>({ ...DEFAULTS, _loaded: false })

  // Carrega do localStorage após mount (evita hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        setState({ ...DEFAULTS, ...saved, _loaded: true })
      } else {
        setState(s => ({ ...s, _loaded: true }))
      }
    } catch {
      setState(s => ({ ...s, _loaded: true }))
    }
  }, [])

  // Salva no localStorage sempre que o estado muda (após carregado)
  const save = useCallback((next: Omit<AdminStoreState, '_loaded'>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // localStorage cheio ou bloqueado — ignorar
    }
  }, [])

  // Helpers de update genérico
  const make = <K extends keyof Omit<AdminStoreState, '_loaded'>>(key: K) =>
    (fn: (prev: AdminStoreState[K]) => AdminStoreState[K]) => {
      setState(prev => {
        const next = { ...prev, [key]: fn(prev[key]) }
        save(next)
        return next
      })
    }

  const resetToDefaults = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setState({ ...DEFAULTS, _loaded: true })
  }

  const store: AdminStore = {
    ...state,
    setProducts: make('products'),
    setServices: make('services'),
    setAppointments: make('appointments'),
    setServiceOrders: make('serviceOrders'),
    setSales: make('sales'),
    setBanners: make('banners'),
    resetToDefaults,
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAdminStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAdminStore must be inside AdminStoreProvider')
  return ctx
}

// Hooks específicos por domínio (mais legíveis nos componentes)
export const useProducts    = () => { const s = useAdminStore(); return [s.products,      s.setProducts]      as const }
export const useServices    = () => { const s = useAdminStore(); return [s.services,      s.setServices]      as const }
export const useAppointments= () => { const s = useAdminStore(); return [s.appointments,  s.setAppointments]  as const }
export const useServiceOrders=() => { const s = useAdminStore(); return [s.serviceOrders, s.setServiceOrders] as const }
export const useSales       = () => { const s = useAdminStore(); return [s.sales,         s.setSales]         as const }
export const useBanners     = () => { const s = useAdminStore(); return [s.banners,       s.setBanners]       as const }
