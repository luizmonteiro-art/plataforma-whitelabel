'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Banner } from '@/types'

const SLIDE_DURATION = 5000

interface HeroBannerProps {
  banners: Banner[]
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progressKey, setProgressKey] = useState(0)

  const go = useCallback((idx: number) => {
    setCurrent((idx + banners.length) % banners.length)
    setProgressKey(k => k + 1)
  }, [banners.length])

  const next = useCallback(() => go(current + 1), [go, current])
  const prev = useCallback(() => go(current - 1), [go, current])

  useEffect(() => {
    if (paused || banners.length <= 1) return
    const t = setInterval(() => {
      setCurrent(c => (c + 1) % banners.length)
      setProgressKey(k => k + 1)
    }, SLIDE_DURATION)
    return () => clearInterval(t)
  }, [paused, banners.length])

  if (!banners.length) return null

  return (
    <section
      className="relative h-[500px] sm:h-[560px] lg:h-[640px] overflow-hidden bg-[#0a0a0a]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Logo flutuante */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
          <div className="select-none pointer-events-auto flex items-center gap-2.5">
            <Image
              src="/mcelllogo.jpeg"
              alt="M CELL"
              height={40}
              width={40}
              className="object-contain rounded-lg drop-shadow-[0_0_16px_rgba(34,197,94,0.6)]"
              priority
            />
            <span className="text-lg font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              M <span className="text-green-400">CELL</span>
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
          <div className="absolute inset-0">
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              className="object-cover opacity-45 scale-[1.02]"
              priority={i === 0}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/65 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-transparent to-[#0a0a0a]/30" />
          </div>

          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-center pt-14">
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
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-green-500 hover:bg-green-400 active:scale-95 text-black font-bold rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-green-500/30 text-sm sm:text-base"
              >
                {banner.cta_text}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Seta esquerda */}
      {banners.length > 1 && (
        <button
          onClick={prev}
          aria-label="Slide anterior"
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full glass flex items-center justify-center hover:border-green-500/40 hover:bg-green-500/10 transition-all active:scale-90"
        >
          <ChevronLeft size={18} className="text-white/80" />
        </button>
      )}

      {/* Seta direita */}
      {banners.length > 1 && (
        <button
          onClick={next}
          aria-label="Próximo slide"
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full glass flex items-center justify-center hover:border-green-500/40 hover:bg-green-500/10 transition-all active:scale-90"
        >
          <ChevronRight size={18} className="text-white/80" />
        </button>
      )}

      {/* Dots + barra de progresso */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className="active:scale-90 transition-transform"
            >
              {i === current ? (
                <div className="relative w-14 h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    key={progressKey}
                    className="absolute inset-y-0 left-0 bg-green-400 rounded-full"
                    style={{
                      animation: `progress-fill ${SLIDE_DURATION}ms linear forwards`,
                      animationPlayState: paused ? 'paused' : 'running',
                    }}
                  />
                </div>
              ) : (
                <div className="w-1.5 h-1.5 bg-white/30 hover:bg-white/60 rounded-full transition-colors" />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
