'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, X, Smartphone, Wrench, Calendar, Info,
  ChevronRight, Shield, Phone, MapPin, Clock,
  MessageCircle, AtSign, ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/loja', label: 'Loja', icon: Smartphone },
  { href: '/servicos', label: 'Serviços', icon: Wrench },
  { href: '/agendar', label: 'Agendar', icon: Calendar },
  { href: '/sobre', label: 'Sobre', icon: Info },
]

const quickInfo = [
  { icon: Phone, label: '(11) 99999-9999', href: 'tel:+5511999999999', color: 'text-green-400' },
  { icon: MessageCircle, label: 'WhatsApp', href: 'https://wa.me/5511999999999', color: 'text-emerald-400' },
  { icon: MapPin, label: 'Centro — São Paulo/SP', href: '/sobre', color: 'text-blue-400' },
  { icon: Clock, label: 'Seg–Sex 08h–18h | Sáb 08h–13h', href: '/sobre', color: 'text-zinc-400' },
]

function MMLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' }
  return (
    <span className={cn('flex items-center select-none leading-none', sizes[size])}>
      <span className="font-black text-green-400 tracking-tighter drop-shadow-[0_0_8px_rgba(34,197,94,0.7)]">MM</span>
      <span className="font-black text-white tracking-tighter ml-1">CELL</span>
    </span>
  )
}

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const infoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setDrawerOpen(false); setInfoOpen(false) }, [pathname])

  // Fecha info ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) setInfoOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/30'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* ── LOGO animado ── */}
          <Link
            href="/"
            className="group relative flex items-center gap-2"
          >
            {/* Glow de fundo no hover */}
            <span className="absolute -inset-3 rounded-2xl bg-green-500/0 group-hover:bg-green-500/[0.06] transition-all duration-300 blur-sm" />

            {/* Logo com efeito de inchar + pular */}
            <span className="relative flex items-center gap-1.5 transition-all duration-300
              group-hover:scale-110 group-hover:-translate-y-0.5
              group-active:scale-95 group-active:translate-y-0
              drop-shadow-[0_0_0px_rgba(34,197,94,0)]
              group-hover:drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]"
            >
              <MMLogo size="md" />
            </span>
            <span className="hidden sm:inline text-[9px] font-semibold text-green-500/50 uppercase tracking-widest border border-green-500/20 px-1.5 py-0.5 rounded transition-all group-hover:border-green-500/40 group-hover:text-green-400/70">
              Store
            </span>
          </Link>

          {/* ── Nav desktop ── */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'text-green-400 bg-green-500/10'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Direita: Info + Agendar ── */}
          <div className="flex items-center gap-2">

            {/* Botão de Info rápido */}
            <div className="relative hidden md:block" ref={infoRef}>
              <button
                onClick={() => setInfoOpen(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200',
                  infoOpen
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
                )}
              >
                <Info size={14} />
                <span className="text-xs">Info</span>
                <ChevronDown size={12} className={cn('transition-transform duration-200', infoOpen && 'rotate-180')} />
              </button>

              {/* Dropdown de info */}
              {infoOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#161616] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <MMLogo size="sm" />
                      <span className="text-[10px] text-zinc-600 ml-1">Celulares & Assistência Técnica</span>
                    </div>
                  </div>
                  <div className="p-2">
                    {quickInfo.map(({ icon: Icon, label, href, color }) => (
                      <Link
                        key={label}
                        href={href}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
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

            {/* CTA Agendar */}
            <Link
              href="/agendar"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.03] active:scale-95"
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

      {/* ── Overlay mobile ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Drawer mobile ── */}
      <aside
        className={cn(
          'fixed top-0 right-0 bottom-0 z-[70] w-[290px] bg-[#0f0f0f] border-l border-white/[0.07] flex flex-col transition-transform duration-300 ease-out md:hidden',
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 leading-none select-none">
              <span className="text-lg font-black text-green-400 tracking-tighter drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]">MM</span>
              <span className="text-lg font-black text-white tracking-tighter ml-1">CELL</span>
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info rápida */}
        <div className="px-4 py-3 border-b border-white/[0.04] space-y-1">
          <a href="tel:+5511999999999" className="flex items-center gap-2.5 py-1.5">
            <Phone size={13} className="text-green-400 shrink-0" />
            <span className="text-xs text-zinc-400">(11) 99999-9999</span>
          </a>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 py-1.5">
            <MessageCircle size={13} className="text-emerald-400 shrink-0" />
            <span className="text-xs text-zinc-400">WhatsApp — clique para conversar</span>
          </a>
          <div className="flex items-center gap-2.5 py-1.5">
            <Clock size={13} className="text-zinc-600 shrink-0" />
            <span className="text-xs text-zinc-600">Seg–Sex 08h–18h | Sáb 08h–13h</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'text-green-400 bg-green-500/10'
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
            className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-400 text-black text-sm font-bold rounded-xl transition-all active:scale-95"
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
