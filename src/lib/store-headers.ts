import { headers } from 'next/headers'

/** Lê o store_id injetado pelo middleware. Usar apenas em Server Components. */
export async function getStoreIdFromHeaders(): Promise<string> {
  const h = await headers()
  return h.get('x-store-id') ?? ''
}

/** Lê o plan_id injetado pelo middleware. Usar apenas em Server Components. */
export async function getPlanIdFromHeaders(): Promise<string> {
  const h = await headers()
  return h.get('x-store-plan') ?? 'vitrine'
}
