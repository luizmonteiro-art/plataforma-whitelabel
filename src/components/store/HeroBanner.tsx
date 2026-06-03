'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Banner } from '@/types'

interface HeroBannerProps {
  banners: Banner[]
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [current, setCurrent] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + banners.length) % banners.length), [banners.length])

  useEffect(() => {
    if (!isAutoPlaying) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next, isAutoPlaying])

  if (!banners.length) return null

  return (
    <section
      className="relative h-[480px] sm:h-[540px] lg:h-[620px] overflow-hidden bg-[#0d0d0d]"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
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
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/60 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-center">
            <div className="max-w-xl">
              {banner.badge && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 mb-4">
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-green-500/25 text-sm sm:text-base"
              >
                {banner.cta_text}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === current ? 'w-6 h-2 bg-green-500' : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
