'use client'

import { useState } from 'react'
import { AdminSidebar, AdminMobileMenuButton } from './AdminSidebar'
import { cn } from '@/lib/utils'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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
          <span className="ml-3 text-sm font-semibold text-white">MM CELL Admin</span>
        </div>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
