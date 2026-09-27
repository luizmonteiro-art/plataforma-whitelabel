'use client'

import { ShoppingBag } from 'lucide-react'
import { useCarrinho } from '@/contexts/Carrinho'

/**
 * Ícone do carrinho no cabeçalho, com o contador de itens.
 * Some quando o carrinho está vazio para não poluir a vitrine de quem só
 * está olhando — e aparece assim que o cliente escolhe o primeiro produto.
 */
export function BotaoCarrinho({ className }: { className?: string }) {
  const carrinho = useCarrinho()
  if (!carrinho || carrinho.quantidadeTotal === 0) return null

  return (
    <button
      onClick={carrinho.abrir}
      aria-label={`Ver pedido (${carrinho.quantidadeTotal} ${carrinho.quantidadeTotal === 1 ? 'item' : 'itens'})`}
      className={`relative flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all active:scale-95 ${className ?? ''}`}
    >
      <ShoppingBag size={18} />
      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-[var(--accent)] text-black text-[10px] font-bold">
        {carrinho.quantidadeTotal}
      </span>
    </button>
  )
}
