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
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwiping = useRef(false)

  const images = product.images.length > 0 ? product.images : []
  const hasMultiple = images.length > 1

  const discount = product.promo_price
    ? Math.round(((product.price - product.promo_price) / product.price) * 100)
    : 0

  // ── Touch handlers (mobile swipe) ──
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

  // ── Hover handler (desktop) ──
  const onMouseEnter = () => {
    if (hasMultiple) setImgIndex(1)
  }
  const onMouseLeave = () => {
    setImgIndex(0)
  }

  return (
    <Link
      href={`/produto/${product.slug}`}
      className={cn(
        'group relative flex flex-col rounded-2xl overflow-hidden bg-[#141414] border border-white/[0.06] hover:border-green-500/25 hover:bg-[#1a1a1a] transition-all duration-300 hover:shadow-xl hover:shadow-green-500/[0.07] hover:-translate-y-1',
        className
      )}
    >
      {/* ── Área de imagem com swipe/hover ── */}
      <div
        className="relative aspect-square overflow-hidden bg-[#111] cursor-pointer"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {images.length > 0 ? (
          <>
            {/* Imagens — transição suave entre elas */}
            {images.map((src, i) => (
              <Image
                key={src + i}
                src={src}
                alt={`${product.name} — foto ${i + 1}`}
                fill
                className={cn(
                  'object-cover transition-all duration-500',
                  i === imgIndex
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-105 pointer-events-none'
                )}
                priority={i === 0}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ))}

            {/* Dots de navegação (só aparece com múltiplas fotos) */}
            {hasMultiple && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={e => { e.preventDefault(); setImgIndex(i) }}
                    className={cn(
                      'rounded-full transition-all duration-300 shadow',
                      i === imgIndex
                        ? 'w-4 h-1.5 bg-green-400'
                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                    )}
                  />
                ))}
              </div>
            )}

            {/* Seta sutil de "deslize" no hover — mobile hint */}
            {hasMultiple && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="flex flex-col gap-0.5">
                  <div className="w-0.5 h-3 bg-white/30 rounded-full" />
                  <div className="w-0.5 h-2 bg-white/20 rounded-full" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <circle cx="12" cy="17" r="1" fill="currentColor" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm', conditionColor[product.condition])}>
            {conditionLabel[product.condition]}
          </span>
          {discount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/80 text-white backdrop-blur-sm">
              -{discount}%
            </span>
          )}
        </div>

        {/* Estoque baixo */}
        {product.stock_qty <= 2 && product.stock_qty > 0 && (
          <div className="absolute bottom-2 right-2 z-10">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-500/80 text-white backdrop-blur-sm">
              Últimas {product.stock_qty} un.
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
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
              <BrandIcon brand={product.brand} size={12} />
            </span>
            <p className="text-[10px] text-zinc-600 uppercase font-medium tracking-wider">{product.brand}</p>
          </div>
          <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 group-hover:text-green-400 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="mt-auto pt-2 border-t border-white/[0.04]">
          {product.promo_price ? (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-green-400">{formatCurrency(product.promo_price)}</span>
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
