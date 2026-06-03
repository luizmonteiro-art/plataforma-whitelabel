import { TrendingUp, Package, Calendar, Wrench, ArrowUpRight, AlertTriangle, Clock } from 'lucide-react'
import { formatCurrency, formatDateTime, serviceStatusLabel, serviceStatusColor, appointmentStatusLabel, cn } from '@/lib/utils'
import { mockSales, mockProducts, mockAppointments, mockServiceOrders } from '@/data/mock'
import Link from 'next/link'

// Simple sales chart (static bars for demo)
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
  const totalRevenue = mockSales.reduce((acc, s) => acc + s.total, 0)
  const lowStockProducts = mockProducts.filter(p => p.stock_qty <= 2 && p.is_active)
  const pendingAppointments = mockAppointments.filter(a => a.status === 'pendente')
  const activeOrders = mockServiceOrders.filter(o => !['entregue'].includes(o.status))

  const chartData = [3200, 4100, 2800, 5200, 3900, 1800, 0]

  const statCards = [
    {
      label: 'Receita Total',
      value: formatCurrency(totalRevenue),
      sub: `${mockSales.length} vendas registradas`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      href: '/admin/vendas',
    },
    {
      label: 'Produtos no Estoque',
      value: mockProducts.filter(p => p.is_active).length.toString(),
      sub: `${lowStockProducts.length} com estoque baixo`,
      icon: Package,
      color: lowStockProducts.length > 0 ? 'text-orange-400' : 'text-blue-400',
      bg: lowStockProducts.length > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-blue-500/10 border-blue-500/20',
      href: '/admin/estoque',
    },
    {
      label: 'Agendamentos',
      value: mockAppointments.length.toString(),
      sub: `${pendingAppointments.length} pendente${pendingAppointments.length !== 1 ? 's' : ''}`,
      icon: Calendar,
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20',
      href: '/admin/agendamentos',
    },
    {
      label: 'Ordens de Serviço',
      value: mockServiceOrders.length.toString(),
      sub: `${activeOrders.length} em aberto`,
      icon: Wrench,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      href: '/admin/servicos',
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Visão geral da loja</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg, href }) => (
          <Link
            key={label}
            href={href}
            className="group p-5 rounded-2xl bg-[#141414] border border-white/[0.06] hover:border-white/[0.12] transition-all hover:-translate-y-0.5"
          >
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
        {/* Chart */}
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

        {/* Alerts */}
        <div className="rounded-2xl bg-[#141414] border border-white/[0.06] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Alertas</h3>
          <div className="space-y-3">
            {lowStockProducts.length > 0 && lowStockProducts.map(p => (
              <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/[0.06] border border-orange-500/20">
                <AlertTriangle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">{p.name}</p>
                  <p className="text-[11px] text-orange-400">Apenas {p.stock_qty} un. em estoque</p>
                </div>
              </div>
            ))}
            {pendingAppointments.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/[0.06] border border-green-500/20">
                <Clock size={14} className="text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white">{pendingAppointments.length} agendamento{pendingAppointments.length > 1 ? 's' : ''} pendente{pendingAppointments.length > 1 ? 's' : ''}</p>
                  <p className="text-[11px] text-green-500/70">Aguardando confirmação</p>
                </div>
              </div>
            )}
            {lowStockProducts.length === 0 && pendingAppointments.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-4">Nenhum alerta no momento</p>
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
          {mockServiceOrders.slice(0, 4).map(order => (
            <div key={order.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center shrink-0">
                <Wrench size={14} className="text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{order.customer_name}</p>
                <p className="text-xs text-zinc-500 truncate">{order.device_brand} {order.device_model} — {order.problem}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={cn('text-[10px] font-medium px-2 py-1 rounded-full border', serviceStatusColor[order.status])}>
                  {serviceStatusLabel[order.status]}
                </span>
                <p className="text-[10px] text-zinc-700 mt-1">{formatDateTime(order.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
          <h3 className="text-sm font-semibold text-white">Próximos agendamentos</h3>
          <Link href="/admin/agendamentos" className="text-xs text-green-400 hover:text-green-300 transition-colors">Ver todos</Link>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {mockAppointments.map(appt => (
            <div key={appt.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center shrink-0">
                <Calendar size={14} className="text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{appt.customer_name}</p>
                <p className="text-xs text-zinc-500 truncate">{appt.service_name} — {appt.device_info}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={cn(
                  'text-[10px] font-medium px-2 py-1 rounded-full border',
                  appt.status === 'confirmado' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  appt.status === 'pendente' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                )}>
                  {appointmentStatusLabel[appt.status]}
                </span>
                <p className="text-[10px] text-zinc-700 mt-1">{formatDateTime(appt.scheduled_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
