'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart, Wrench, Calendar,
  Settings, Smartphone, ChevronLeft, ChevronRight, LogOut, Tag, X, Menu, FileText, Stethoscope
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlan, useStoreConfig } from '@/contexts/AdminStore'
import type { ModuleFlag } from '@/lib/plans'

const navItems: { href: string; label: string; icon: React.ElementType; exact?: boolean; module: ModuleFlag }[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'DASHBOARD' },
  { href: '/admin/estoque', label: 'Estoque', icon: Package, module: 'ESTOQUE' },
  { href: '/admin/vendas', label: 'Vendas', icon: ShoppingCart, module: 'VENDAS' },
  { href: '/admin/servicos', label: 'Ordens de Serviço', icon: Wrench, module: 'ORDENS_SERVICO' },
  { href: '/admin/agendamentos', label: 'Agendamentos', icon: Calendar, module: 'AGENDAMENTOS' },
  { href: '/admin/orcamentos', label: 'Orçamentos', icon: FileText, module: 'ORCAMENTOS' },
  { href: '/admin/assistencia', label: 'Serviços', icon: Stethoscope, module: 'AGENDAMENTOS' },
  { href: '/admin/promocoes', label: 'Promoções & Feed', icon: Tag, module: 'PROMOCOES' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings, module: 'CONFIGURACOES' },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function AdminSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { hasModule } = usePlan()
  const config = useStoreConfig()
  const storeName = config?.store_name?.trim() || 'Minha Loja'
  const initial = storeName.charAt(0).toUpperCase()
  const accent = config?.accent_color || '#22c55e'
  const visibleNavItems = navItems.filter(item => hasModule(item.module))

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    // Encerra a sessão no Supabase (limpa os cookies de auth)
    try {
      const { getSupabaseBrowser } = await import('@/lib/supabase-browser')
      const supabase = getSupabaseBrowser()
      if (supabase) await supabase.auth.signOut()
    } catch {}
    router.push('/admin/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-white/[0.06] px-4', collapsed ? 'justify-center' : 'gap-3')}>
        {collapsed ? (
          config?.logo_url ? (
            <Image src={config.logo_url} alt={storeName} height={28} width={28} className="object-contain rounded-md" />
          ) : (
            <span className="text-base font-black tracking-tighter" style={{ color: accent }}>{initial}</span>
          )
        ) : (
          <div className="flex items-center gap-2.5 select-none min-w-0">
            {config?.logo_url ? (
              <Image src={config.logo_url} alt={storeName} height={28} width={28} className="object-contain rounded-md shrink-0" />
            ) : (
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black text-black"
                style={{ backgroundColor: accent }}
              >
                {initial}
              </span>
            )}
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-sm font-black text-white tracking-tight truncate">{storeName}</span>
              <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: accent, opacity: 0.7 }}>Painel Admin</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visibleNavItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={onMobileClose}
            title={collapsed ? label : undefined}
            className={cn(
              'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
              collapsed ? 'justify-center' : 'gap-3',
              isActive(href, exact)
                ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20'
                : 'text-zinc-500 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-2 space-y-0.5">
        <Link
          href="/"
          target="_blank"
          onClick={onMobileClose}
          className={cn(
            'flex items-center rounded-xl px-3 py-2.5 text-xs font-medium text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-all',
            collapsed ? 'justify-center' : 'gap-3'
          )}
        >
          <Smartphone size={15} className="shrink-0" />
          {!collapsed && 'Ver loja'}
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center rounded-xl px-3 py-2.5 text-xs font-medium text-zinc-600 hover:text-red-400 hover:bg-red-500/[0.08] transition-all',
            collapsed ? 'justify-center' : 'gap-3'
          )}
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && 'Sair'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-[#0d0d0d] border-r border-white/[0.06] transition-all duration-300',
          collapsed ? 'w-[60px]' : 'w-[220px]'
        )}
      >
        <SidebarContent />
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#1a1a1a] border border-white/[0.12] flex items-center justify-center text-zinc-500 hover:text-white hover:bg-[#222] transition-all z-50 shadow-lg"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-[70] w-[220px] bg-[#0d0d0d] border-r border-white/[0.06] lg:hidden transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <X size={16} />
        </button>
        <SidebarContent />
      </aside>
    </>
  )
}

export function AdminMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"
    >
      <Menu size={20} />
    </button>
  )
}
