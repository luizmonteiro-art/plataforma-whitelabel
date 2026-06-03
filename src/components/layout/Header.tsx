'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Smartphone, Wrench, Calendar, Info, ChevronRight, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/loja', label: 'Loja', icon: Smartphone },
  { href: '/servicos', label: 'Serviços', icon: Wrench },
  { href: '/agendar', label: 'Agendar', icon: Calendar },
  { href: '/sobre', label: 'Sobre', icon: Info },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

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
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center leading-none select-none">
              <span className="text-xl font-black text-green-400 tracking-tighter drop-shadow-[0_0_8px_rgba(34,197,94,0.6)] group-hover:drop-shadow-[0_0_12px_rgba(34,197,94,0.9)] transition-all">MM</span>
              <span className="text-xl font-black text-white tracking-tighter ml-1">CELL</span>
            </div>
            <span className="hidden sm:inline text-[9px] font-semibold text-green-500/60 uppercase tracking-widest border border-green-500/20 px-1.5 py-0.5 rounded">Store</span>
          </Link>

          {/* Desktop Nav */}
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

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/agendar"
              className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25"
            >
              Agendar Serviço
            </Link>
            <Link
              href="/admin"
              className="p-2 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.04] transition-all duration-200"
              title="Área administrativa"
            >
              <Shield size={16} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed top-0 right-0 bottom-0 z-[70] w-[280px] bg-[#111] border-l border-white/[0.08] flex flex-col transition-transform duration-300 ease-out md:hidden',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06]">
          <div className="flex items-center gap-1 leading-none select-none">
            <span className="text-lg font-black text-green-400 tracking-tighter drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]">MM</span>
            <span className="text-lg font-black text-white tracking-tighter ml-1">CELL</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'text-green-400 bg-green-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              <Icon size={18} />
              {label}
              <ChevronRight size={14} className="ml-auto text-zinc-600" />
            </Link>
          ))}
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-white/[0.06] space-y-2">
          <Link
            href="/agendar"
            className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-xl transition-all"
          >
            <Calendar size={16} />
            Agendar Serviço
          </Link>
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-white/[0.08] text-zinc-500 hover:text-zinc-300 text-xs font-medium rounded-xl transition-all hover:bg-white/[0.04]"
          >
            <Shield size={14} />
            Área Administrativa
          </Link>
        </div>
      </aside>
    </>
  )
}
