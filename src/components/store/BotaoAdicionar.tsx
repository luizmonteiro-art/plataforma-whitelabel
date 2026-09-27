'use client'

import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCarrinho, type ItemCarrinho } from '@/contexts/Carrinho'

/**
 * Adiciona o produto ao pedido. Sem carrinho no contexto (ou produto sem
 * estoque) o botão não aparece, e a vitrine segue com o fluxo antigo de
 * mandar direto no WhatsApp.
 */
export function BotaoAdicionar({
  item, disponivel = true, className,
}: {
  item: Omit<ItemCarrinho, 'quantidade'>
  disponivel?: boolean
  className?: string
}) {
  const carrinho = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)
  if (!carrinho || !disponivel) return null

  const clicar = (e: React.MouseEvent) => {
    // Nos cards o botão vive dentro de um link para a página do produto.
    e.preventDefault()
    e.stopPropagation()
    carrinho.adicionar(item)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1600)
  }

  return (
    <button
      onClick={clicar}
      className={cn(
        'flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95',
        adicionado
          ? 'bg-emerald-500 text-black'
          : 'bg-[var(--accent)] text-black hover:opacity-90',
        className,
      )}
    >
      {adicionado
        ? <><Check size={17} /> Adicionado</>
        : <><ShoppingBag size={17} /> Adicionar ao pedido</>}
    </button>
  )
}
