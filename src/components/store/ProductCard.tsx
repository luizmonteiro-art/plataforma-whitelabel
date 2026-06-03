import Link from 'next/link'
import Image from 'next/image'
import { cn, formatCurrency, conditionLabel, conditionColor } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const discount = product.promo_price
    ? Math.round(((product.price - product.promo_price) / product.price) * 100)
    : 0

  return (
    <Link
      href={`/produto/${product.slug}`}
      className={cn(
        'group relative flex flex-col rounded-2xl overflow-hidden bg-[#141414] border border-white/[0.06] hover:border-green-500/25 hover:bg-[#1a1a1a] transition-all duration-300 hover:shadow-xl hover:shadow-green-500/[0.07] hover:-translate-y-1',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#111]">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <circle cx="12" cy="17" r="1" fill="currentColor" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', conditionColor[product.condition])}>
            {conditionLabel[product.condition]}
          </span>
          {discount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              -{discount}%
            </span>
          )}
        </div>

        {product.stock_qty <= 2 && product.stock_qty > 0 && (
          <div className="absolute bottom-2 right-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              Últimas {product.stock_qty} un.
            </span>
          </div>
        )}
        {product.stock_qty === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-zinc-400 bg-black/80 px-3 py-1 rounded-full">Esgotado</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-2">
        <div>
          <p className="text-[11px] text-zinc-600 uppercase font-medium tracking-wider mb-0.5">{product.brand}</p>
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
