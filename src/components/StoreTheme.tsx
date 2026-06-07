'use client'

import { useEffect } from 'react'

/**
 * Injeta a cor de destaque da loja como CSS variable no :root.
 * Chamado no layout raiz com a cor vinda do Supabase (server).
 */
export default function StoreTheme({ accentColor }: { accentColor: string }) {
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
    // Gera variações claras/escuras automaticamente
    document.documentElement.style.setProperty('--accent-hover', accentColor + 'dd')
  }, [accentColor])

  return (
    <style>{`
      :root {
        --accent: ${accentColor};
        --accent-hover: ${accentColor}dd;
      }
    `}</style>
  )
}
