'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Menu, X, Smartphone, Wrench, Calendar, Info,
  ChevronRight, Shield, Phone, MapPin, Clock,
  MessageCircle, AtSign, ChevronDown, Store,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CustomerMenu } from './CustomerMenu'
import type { Brand } from '@/lib/brand'
import { waLink } from '@/lib/brand'

const navLinks = [
  { href: '/loja', label: 'Loja', icon: Smartphone },
  { href: '/servicos', label: 'Serviços', icon: Wrench },
  { href: '/agendar', label: 'Agendar', icon: Calendar },
  { href: '/sobre', label: 'Sobre', icon: Info },
]

const logoHeights = { sm: 28, md: 36, lg: 44 }

function BrandLogo({ brand, size = 'md' }: { brand: Brand; size?: 'sm' | 'md' | 'lg' }) {
  const h = logoHeights[size]
  const textCls = cn('font-black text-white tracking-tight', size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm')
  return (
    <span className="flex items-center gap-2 select-none leading-none">
      {brand.logoUrl ? (
        <Image src={brand.logoUrl} alt={brand.name} height={h} width={h} className="object-contain rounded-sm" priority />
      ) : (
        <span className="flex items-center justify-center rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20" style={{ height: h, width: h }}>
          <Store size={h * 0.5} className="text-[var(--accent)]" />
        </span>
      )}
      <span className={textCls}>{brand.name}</span>
    </span>
  )
}

export function Header({ brand }: { brand: Brand }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const infoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20)
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setDrawerOpen(false); setInfoOpen(false) }, [pathname])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) setInfoOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Itens de info rápida, montados a partir do branding da loja
  const quickInfo: { icon: React.ElementType; label: string; href: string; color: string; external?: boolean }[] = []
  if (brand.phone) quickInfo.push({ icon: Phone, label: brand.phone, href: `tel:${brand.phone.replace(/[^\d+]/g, '')}`, color: 'text-[var(--accent)]', external: true })
  if (brand.whatsapp) quickInfo.push({ icon: MessageCircle, label: 'WhatsApp', href: waLink(brand), color: 'text-[var(--accent)]', external: true })
  if (brand.address) quickInfo.push({ icon: MapPin, label: brand.address, href: '/sobre', color: 'text-blue-400' })
  if (brand.hoursWeekday || brand.hoursSaturday) {
    const h = [brand.hoursWeekday && `Seg–Sex ${brand.hoursWeekday}`, brand.hoursSaturday && `Sáb ${brand.hoursSaturday}`].filter(Boolean).join(' | ')
    quickInfo.push({ icon: Clock, label: h, href: '/sobre', color: 'text-zinc-400' })
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/30'
            : 'bg-gradient-to-b from-black/60 to-transparent backdrop-blur-[2px]'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="mr-2">
            <CustomerMenu brand={brand} />
          </div>

          {/* LOGO */}
          <Link href="/" className="group relative flex items-center gap-2">
            <span className="absolute -inset-3 rounded-2xl bg-[var(--accent)]/0 group-hover:bg-[var(--accent)]/[0.06] transition-all duration-300 blur-sm" />
            <span className="relative flex items-center gap-1.5 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 group-active:scale-95 group-active:translate-y-0">
              <BrandLogo brand={brand} size="md" />
            </span>
            <span className="hidden sm:inline text-[9px] font-semibold text-[var(--accent)]/50 uppercase tracking-widest border border-[var(--accent)]/20 px-1.5 py-0.5 rounded transition-all group-hover:border-[var(--accent)]/40 group-hover:text-[var(--accent)]/70">
              Store
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Direita */}
          <div className="flex items-center gap-2">
            {quickInfo.length > 0 && (
              <div className="relative hidden md:block" ref={infoRef}>
                <button
                  onClick={() => setInfoOpen(v => !v)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200',
                    infoOpen
                      ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'
                      : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
                  )}
                >
                  <Info size={14} />
                  <span className="text-xs">Info</span>
                  <ChevronDown size={12} className={cn('transition-transform duration-200', infoOpen && 'rotate-180')} />
                </button>

                {infoOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#161616] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        <BrandLogo brand={brand} size="sm" />
                        <span className="text-[10px] text-zinc-600 ml-1">Celulares & Assistência</span>
                      </div>
                    </div>
                    <div className="p-2">
                      {quickInfo.map(({ icon: Icon, label, href, color, external }) => (
                        <Link
                          key={label}
                          href={href}
                          target={external && href.startsWith('http') ? '_blank' : undefined}
                          rel={external && href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all group/item"
                        >
                          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                            <Icon size={13} className={color} />
                          </div>
                          <span className="text-xs text-zinc-400 group-hover/item:text-white transition-colors">{label}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="p-2 pt-0 border-t border-white/[0.04] mt-1">
                      <div className="grid grid-cols-2 gap-1.5 p-2">
                        {[
                          { href: '/loja', label: '📦 Estoque' },
                          { href: '/servicos', label: '🔧 Serviços' },
                          { href: '/agendar', label: '📅 Agendar' },
                          { href: '/sobre', label: '📍 Localização' },
                        ].map(({ href, label }) => (
                          <Link
                            key={href}
                            href={href}
                            className="flex items-center justify-center px-2 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-500 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
                          >
                            {label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CTA Agendar */}
            <Link
              href="/agendar"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)] text-black text-sm font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[var(--accent)]/25 hover:scale-[1.03] active:scale-95"
            >
              <Calendar size={14} />
              Agendar
            </Link>

            {/* Admin link discreto */}
            <Link
              href="/admin"
              className="hidden md:flex p-2 rounded-lg text-zinc-700 hover:text-zinc-500 hover:bg-white/[0.04] transition-all"
              title="Área administrativa"
            >
              <Shield size={15} />
            </Link>

            {/* Menu mobile */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all active:scale-95"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Drawer mobile */}
      <aside
        className={cn(
          'fixed top-0 right-0 bottom-0 z-[70] w-[290px] bg-[#0f0f0f] border-l border-white/[0.07] flex flex-col transition-transform duration-300 ease-out md:hidden',
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06]">
          <BrandLogo brand={brand} size="sm" />
          <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Info rápida */}
        {(brand.phone || brand.whatsapp || brand.hoursWeekday) && (
          <div className="px-4 py-3 border-b border-white/[0.04] space-y-1">
            {brand.phone && (
              <a href={`tel:${brand.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2.5 py-1.5">
                <Phone size={13} className="text-[var(--accent)] shrink-0" />
                <span className="text-xs text-zinc-400">{brand.phone}</span>
              </a>
            )}
            {brand.whatsapp && (
              <a href={waLink(brand)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 py-1.5">
                <MessageCircle size={13} className="text-[var(--accent)] shrink-0" />
                <span className="text-xs text-zinc-400">WhatsApp — clique para conversar</span>
              </a>
            )}
            {(brand.hoursWeekday || brand.hoursSaturday) && (
              <div className="flex items-center gap-2.5 py-1.5">
                <Clock size={13} className="text-zinc-600 shrink-0" />
                <span className="text-xs text-zinc-600">
                  {[brand.hoursWeekday && `Seg–Sex ${brand.hoursWeekday}`, brand.hoursSaturday && `Sáb ${brand.hoursSaturday}`].filter(Boolean).join(' | ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              )}
            >
              <Icon size={17} />
              {label}
              <ChevronRight size={13} className="ml-auto text-zinc-700" />
            </Link>
          ))}
        </nav>

        {/* Footer drawer */}
        <div className="p-4 border-t border-white/[0.06] space-y-2">
          <Link
            href="/agendar"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent)] text-black text-sm font-bold rounded-xl transition-all active:scale-95"
          >
            <Calendar size={16} />
            Agendar Serviço
          </Link>
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-white/[0.07] text-zinc-600 hover:text-zinc-400 text-xs font-medium rounded-xl transition-all hover:bg-white/[0.03]"
          >
            <Shield size={13} />
            Área Administrativa
          </Link>
        </div>
      </aside>
    </>
  )
}
