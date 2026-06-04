'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn, formatCurrency, conditionLabel, conditionColor } from '@/lib/utils'
import { BrandIcon } from '@/components/icons/BrandIcons'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [imgIndex, setImgIndex] = useState(0)
  const [imgError, setImgError] = useState<Record<number, boolean>>({})
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwiping = useRef(false)

  const images = product.images.filter((_, i) => !imgError[i])
  const hasMultiple = images.length > 1

  const discount = product.promo_price
    ? Math.round(((product.price - product.promo_price) / product.price) * 100)
    : 0

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = false
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
    if (dx > dy && dx > 10) isSwiping.current = true
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!hasMultiple || !isSwiping.current) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 30) {
      if (diff > 0) setImgIndex(i => (i + 1) % images.length)
      else setImgIndex(i => (i - 1 + images.length) % images.length)
    }
  }
  const onMouseEnter = () => { if (hasMultiple) setImgIndex(1) }
  const onMouseLeave = () => { setImgIndex(0) }

  const safeIndex = Math.min(imgIndex, Math.max(0, images.length - 1))

  return (
    <Link
      href={`/produto/${product.slug}`}
      className={cn(
        'group relative flex flex-col rounded-2xl overflow-hidden bg-[#141414] border border-white/[0.06]',
        'hover:border-green-500/30 hover:bg-[#181818] transition-all duration-300',
        'hover:shadow-xl hover:shadow-green-500/[0.08] hover:-translate-y-1 active:scale-[0.98]',
        className
      )}
    >
      {/* ── Imagem com swipe ── */}
      <div
        className="relative aspect-square overflow-hidden bg-[#111] select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {images.length > 0 ? (
          <>
            {product.images.map((src, i) => (
              <Image
                key={i}
                src={src}
                alt={product.name}
                fill
                className={cn(
                  'object-cover transition-all duration-500',
                  i === safeIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04] pointer-events-none'
                )}
                priority={i === 0}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onError={() => setImgError(prev => ({ ...prev, [i]: true }))}
              />
            ))}

            {/* Dots de navegação */}
            {hasMultiple && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={e => { e.preventDefault(); setImgIndex(i) }}
                    className={cn(
                      'rounded-full transition-all duration-300 active:scale-75',
                      i === safeIndex ? 'w-4 h-1.5 bg-green-400' : 'w-1.5 h-1.5 bg-white/40'
                    )}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <circle cx="12" cy="17" r="1" fill="currentColor" />
            </svg>
          </div>
        )}

        {/* ── Badges — sem sobreposição ── */}
        <div className="absolute top-2 left-2 right-2 z-10 flex flex-col items-start gap-1 pointer-events-none">
          {/* Linha 1: condição */}
          <span className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm whitespace-nowrap',
            conditionColor[product.condition]
          )}>
            {conditionLabel[product.condition]}
          </span>

          {/* Linha 2: desconto (só se tiver) */}
          {discount > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white whitespace-nowrap shadow">
              -{discount}%
            </span>
          )}
        </div>

        {/* Estoque baixo */}
        {product.stock_qty <= 2 && product.stock_qty > 0 && (
          <div className="absolute bottom-6 right-2 z-10">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-500/80 text-white backdrop-blur-sm whitespace-nowrap">
              Últimas {product.stock_qty}
            </span>
          </div>
        )}

        {/* Esgotado */}
        {product.stock_qty === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <span className="text-xs font-semibold text-zinc-300 bg-black/80 px-3 py-1 rounded-full">Esgotado</span>
          </div>
        )}
      </div>

      {/* ── Conteúdo ── */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1.5">
        {/* Marca com ícone */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0">
            <BrandIcon brand={product.brand} size={11} />
          </span>
          <span className="text-[10px] text-zinc-600 uppercase font-semibold tracking-wider truncate">{product.brand}</span>
        </div>

        {/* Nome do produto */}
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-green-400 transition-colors">
          {product.name}
        </h3>

        {/* Preço */}
        <div className="mt-auto pt-2 border-t border-white/[0.04]">
          {product.promo_price ? (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-black text-green-400">{formatCurrency(product.promo_price)}</span>
              <span className="text-xs text-zinc-600 line-through">{formatCurrency(product.price)}</span>
            </div>
          ) : (
            <span className="text-base font-bold text-white">{formatCurrency(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
