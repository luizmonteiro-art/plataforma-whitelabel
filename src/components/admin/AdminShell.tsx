'use client'

import { useState } from 'react'
import { AdminSidebar, AdminMobileMenuButton } from './AdminSidebar'
import { ModuleGuard } from './ModuleGuard'
import { useStoreConfig } from '@/contexts/AdminStore'
import { cn } from '@/lib/utils'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const config = useStoreConfig()
  const storeName = config?.store_name?.trim() || 'Minha Loja'

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-[60px]' : 'lg:pl-[220px]')}>
        {/* Top bar (mobile only) */}
        <div className="flex items-center h-14 px-4 border-b border-white/[0.06] bg-[#0d0d0d] lg:hidden">
          <AdminMobileMenuButton onClick={() => setMobileOpen(true)} />
          <span className="ml-3 text-sm font-semibold text-white">{storeName}</span>
        </div>
        <main className="p-4 sm:p-6 lg:p-8">
          <ModuleGuard>{children}</ModuleGuard>
        </main>
      </div>
    </div>
  )
}
