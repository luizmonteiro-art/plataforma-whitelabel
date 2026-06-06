'use client'

import { useState } from 'react'
import { TrendingUp, Package, Calendar, Wrench, ArrowUpRight, AlertTriangle, Clock, X, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDateTime, serviceStatusLabel, serviceStatusColor, appointmentStatusLabel, cn } from '@/lib/utils'
import { useAdminStore } from '@/contexts/AdminStore'
import Link from 'next/link'

function MiniChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-sm bg-green-500/70 hover:bg-green-500 transition-colors min-h-[2px]"
            style={{ height: `${(v / max) * 100}%` }}
            title={`${days[i]}: ${formatCurrency(v)}`}
          />
          <span className="text-[9px] text-zinc-600">{days[i]}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { products, sales, appointments, serviceOrders, _loaded } = useAdminStore()
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0)
  const lowStockProducts = products.filter(p => p.stock_qty <= 2 && p.is_active)
  const pendingAppointments = appointments.filter(a => a.status === 'pendente')
  const activeOrders = serviceOrders.filter(o => !['entregue'].includes(o.status))
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])

  if (!_loaded) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
    </div>
  )

  const dismissAlert = (id: string) => setDismissedAlerts(prev => [...prev, id])

  const chartData = [3200, 4100, 2800, 5200, 3900, 1800, 0]

  const statCards = [
    { label: 'Receita Total', value: formatCurrency(totalRevenue), sub: `${sales.length} vendas registradas`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', href: '/admin/vendas' },
    { label: 'Produtos no Estoque', value: products.filter(p => p.is_active).length.toString(), sub: `${lowStockProducts.length} com estoque baixo`, icon: Package, color: lowStockProducts.length > 0 ? 'text-orange-400' : 'text-blue-400', bg: lowStockProducts.length > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-blue-500/10 border-blue-500/20', href: '/admin/estoque' },
    { label: 'Agendamentos', value: appointments.length.toString(), sub: `${pendingAppointments.length} pendente${pendingAppointments.length !== 1 ? 's' : ''}`, icon: Calendar, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', href: '/admin/agendamentos' },
    { label: 'Ordens de Serviço', value: serviceOrders.length.toString(), sub: `${activeOrders.length} em aberto`, icon: Wrench, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', href: '/admin/servicos' },
  ]

  // Build alert list
  const alerts: { id: string; icon: React.ElementType; iconColor: string; bg: string; border: string; title: string; sub: string; href: string }[] = []

  lowStockProducts.forEach(p => {
    alerts.push({
      id: `stock-${p.id}`,
      icon: AlertTriangle,
      iconColor: 'text-orange-400',
      bg: 'bg-orange-500/[0.06]',
      border: 'border-orange-500/20',
      title: p.name,
      sub: `Apenas ${p.stock_qty} un. em estoque`,
      href: '/admin/estoque',
    })
  })

  if (pendingAppointments.length > 0) {
    alerts.push({
      id: 'pending-appt',
      icon: Clock,
      iconColor: 'text-green-400',
      bg: 'bg-green-500/[0.06]',
      border: 'border-green-500/20',
      title: `${pendingAppointments.length} agendamento${pendingAppointments.length > 1 ? 's' : ''} pendente${pendingAppointments.length > 1 ? 's' : ''}`,
      sub: 'Aguardando confirmação',
      href: '/admin/agendamentos',
    })
  }

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id))

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Visão geral da loja</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="group p-5 rounded-2xl bg-[#141414] border border-white/[0.06] hover:border-white/[0.12] transition-all hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center', bg)}>
                <Icon size={16} className={color} />
              </div>
              <ArrowUpRight size={14} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-[11px] text-zinc-700 mt-1">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-[#141414] border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Receita (últimos 7 dias)</h3>
              <p className="text-xs text-zinc-600">Demonstrativo semanal</p>
            </div>
            <span className="text-lg font-bold text-emerald-400">{formatCurrency(chartData.reduce((a, b) => a + b, 0))}</span>
          </div>
          <MiniChart data={chartData} />
        </div>

        {/* Alertas com dismiss */}
        <div className="rounded-2xl bg-[#141414] border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Alertas</h3>
            {visibleAlerts.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">{visibleAlerts.length}</span>
            )}
          </div>
          <div className="space-y-2.5">
            {visibleAlerts.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 size={24} className="text-green-400/40" />
                <p className="text-xs text-zinc-600">Nenhum alerta no momento</p>
              </div>
            )}
            {visibleAlerts.map(alert => {
              const Icon = alert.icon
              return (
                <div key={alert.id} className={cn('flex items-start gap-3 p-3 rounded-xl border', alert.bg, alert.border)}>
                  <Icon size={14} className={cn(alert.iconColor, 'mt-0.5 shrink-0')} />
                  <div className="min-w-0 flex-1">
                    <Link href={alert.href} className="text-xs font-medium text-white truncate block hover:underline">{alert.title}</Link>
                    <p className={cn('text-[11px]', alert.iconColor)}>{alert.sub}</p>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    title="Concluir / dispensar"
                    className="shrink-0 p-1 rounded-lg text-zinc-600 hover:text-white hover:bg-white/[0.08] transition-all active:scale-90"
                  >
                    <X size={11} />
                  </button>
                </div>
              )
            })}
            {dismissedAlerts.length > 0 && (
              <button onClick={() => setDismissedAlerts([])} className="text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors w-full text-center pt-1">
                Restaurar {dismissedAlerts.length} dispensado{dismissedAlerts.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
          <h3 className="text-sm font-semibold text-white">Últimas ordens de serviço</h3>
          <Link href="/admin/servicos" className="text-xs text-green-400 hover:text-green-300 transition-colors">Ver todas</Link>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {serviceOrders.slice(0, 4).map(order => (
            <Link
              key={order.id}
              href="/admin/servicos"
              className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] active:bg-white/[0.07] transition-colors cursor-pointer group/row"
            >
              <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover/row:border-green-500/25 group-hover/row:bg-green-500/[0.06] transition-all">
                <Wrench size={14} className="text-zinc-500 group-hover/row:text-green-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover/row:text-green-400 transition-colors">{order.customer_name}</p>
                <p className="text-xs text-zinc-500 truncate">{order.device_brand} {order.device_model} — {order.problem}</p>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <span className={cn('text-[10px] font-medium px-2 py-1 rounded-full border', serviceStatusColor[order.status])}>
                  {serviceStatusLabel[order.status]}
                </span>
                <p className="text-[10px] text-zinc-700">{formatDateTime(order.created_at)}</p>
              </div>
              <ArrowUpRight size={13} className="text-zinc-700 group-hover/row:text-green-400 transition-colors shrink-0" />
            </Link>
          ))}
          {serviceOrders.length === 0 && (
            <div className="px-5 py-8 text-center text-xs text-zinc-600">Nenhuma ordem de serviço registrada.</div>
          )}
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
          <h3 className="text-sm font-semibold text-white">Próximos agendamentos</h3>
          <Link href="/admin/agendamentos" className="text-xs text-green-400 hover:text-green-300 transition-colors">Ver todos</Link>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {appointments.slice(0, 5).map(appt => (
            <Link
              key={appt.id}
              href="/admin/agendamentos"
              className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] active:bg-white/[0.07] transition-colors cursor-pointer group/row"
            >
              <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover/row:border-green-500/25 group-hover/row:bg-green-500/[0.06] transition-all">
                <Calendar size={14} className="text-zinc-500 group-hover/row:text-green-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white group-hover/row:text-green-400 transition-colors">{appt.customer_name}</p>
                <p className="text-xs text-zinc-500 truncate">{appt.service_name} — {appt.device_info}</p>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <span className={cn('text-[10px] font-medium px-2 py-1 rounded-full border',
                  appt.status === 'confirmado' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  appt.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                  'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                )}>
                  {appointmentStatusLabel[appt.status]}
                </span>
                <p className="text-[10px] text-zinc-700">{formatDateTime(appt.scheduled_at)}</p>
              </div>
              <ArrowUpRight size={13} className="text-zinc-700 group-hover/row:text-green-400 transition-colors shrink-0" />
            </Link>
          ))}
          {appointments.length === 0 && (
            <div className="px-5 py-8 text-center text-xs text-zinc-600">Nenhum agendamento registrado.</div>
          )}
        </div>
      </div>
    </div>
  )
}
