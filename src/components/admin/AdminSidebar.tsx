'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart, Wrench, Calendar,
  Settings, Smartphone, ChevronLeft, ChevronRight, LogOut, Tag, X, Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/estoque', label: 'Estoque', icon: Package },
  { href: '/admin/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/admin/servicos', label: 'Ordens de Serviço', icon: Wrench },
  { href: '/admin/agendamentos', label: 'Agendamentos', icon: Calendar },
  { href: '/admin/promocoes', label: 'Promoções', icon: Tag },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
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

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const handleLogout = () => {
    document.cookie = 'admin_session=; path=/; max-age=0'
    router.push('/admin/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-white/[0.06] px-4', collapsed ? 'justify-center' : 'gap-2')}>
        {collapsed ? (
          <span className="text-base font-black text-green-400 tracking-tighter drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]">MM</span>
        ) : (
          <div className="flex flex-col leading-none select-none">
            <div className="flex items-center gap-0.5">
              <span className="text-base font-black text-green-400 tracking-tighter drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]">MM</span>
              <span className="text-base font-black text-white tracking-tighter ml-1">CELL</span>
            </div>
            <p className="text-[9px] text-green-500/60 uppercase tracking-widest">Painel Admin</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={onMobileClose}
            title={collapsed ? label : undefined}
            className={cn(
              'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
              collapsed ? 'justify-center' : 'gap-3',
              isActive(href, exact)
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
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
