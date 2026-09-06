import type { Sale } from '@/types'

export type SaleInput = Pick<Sale, 'id' | 'items' | 'total' | 'payment_method' | 'customer_name' | 'status' | 'revision'>
export interface PendingSale { requestId: string; sale: SaleInput }

// Session-scoped recovery only. The database remains the source of truth.
export function pendingSaleJournal(storage: Storage, storeId: string) {
  const key = `modus:pending-sale:v1:${storeId}`
  return {
    read(): PendingSale | null {
      const raw = storage.getItem(key)
      if (!raw) return null
      const value = JSON.parse(raw) as PendingSale
      if (!value.requestId || !value.sale?.id || !Array.isArray(value.sale.items)) {
        throw new Error('O registro de recuperação está inválido. Confira a venda antes de continuar.')
      }
      return value
    },
    begin(sale: SaleInput): PendingSale {
      const previous = this.read()
      if (previous) return previous
      const pending = { requestId: crypto.randomUUID(), sale }
      storage.setItem(key, JSON.stringify(pending))
      return pending
    },
    clear() { storage.removeItem(key) },
  }
}
