'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Banner } from '@/types'

interface HeroBannerProps {
  banners: Banner[]
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [current, setCurrent] = useState(0)

  // Auto-avança sem precisar de botões
  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length])

  useEffect(() => {
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next])

  if (!banners.length) return null

  return (
    <section className="relative h-[500px] sm:h-[560px] lg:h-[640px] overflow-hidden bg-[#0a0a0a]">

      {/* ── Logo MM CELL flutuante no hero ── */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
          <div className="flex items-center gap-1.5 select-none pointer-events-auto">
            <span className="text-2xl sm:text-3xl font-black text-green-400 tracking-tighter
              drop-shadow-[0_0_16px_rgba(34,197,94,0.9)]
              [text-shadow:0_0_20px_rgba(34,197,94,0.7),0_2px_4px_rgba(0,0,0,0.9)]
              animate-pulse-slow">
              MM
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter ml-1
              [text-shadow:0_0_12px_rgba(0,0,0,1),0_2px_6px_rgba(0,0,0,1)]">
              CELL
            </span>
            <span className="hidden sm:inline text-[9px] font-semibold text-green-400/60 uppercase tracking-widest border border-green-500/25 px-1.5 py-0.5 rounded ml-1">
              Store
            </span>
          </div>
        </div>
      </div>

      {/* Slides */}
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              className="object-cover opacity-30"
              priority={i === 0}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/40" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-center pt-14">
            <div className="max-w-xl">
              {banner.badge && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 mb-4 animate-in fade-in">
                  {banner.badge}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3">
                {banner.title}
              </h1>
              <p className="text-base sm:text-lg text-zinc-400 mb-8 leading-relaxed">
                {banner.subtitle}
              </p>
              <Link
                href={banner.cta_href}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-green-500 hover:bg-green-400 active:scale-95 text-black font-bold rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-green-500/30 text-sm sm:text-base"
              >
                {banner.cta_text}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Dots apenas — sem setas */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'rounded-full transition-all duration-300 active:scale-90',
                i === current
                  ? 'w-6 h-2 bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/60'
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}
