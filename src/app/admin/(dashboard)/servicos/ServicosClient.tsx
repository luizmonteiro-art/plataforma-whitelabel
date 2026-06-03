'use client'

import { useState } from 'react'
import { Plus, Wrench, MessageCircle, X, ChevronDown } from 'lucide-react'
import { formatCurrency, formatDateTime, serviceStatusLabel, serviceStatusColor, cn } from '@/lib/utils'
import type { ServiceOrder, ServiceStatus } from '@/types'

interface Props { initialOrders: ServiceOrder[] }

const KANBAN_COLS: { status: ServiceStatus; label: string; color: string }[] = [
  { status: 'recebido', label: 'Recebido', color: 'border-zinc-500/30' },
  { status: 'em_analise', label: 'Em análise', color: 'border-blue-500/30' },
  { status: 'aguardando_peca', label: 'Aguardando peça', color: 'border-orange-500/30' },
  { status: 'em_reparo', label: 'Em reparo', color: 'border-yellow-500/30' },
  { status: 'pronto', label: 'Pronto', color: 'border-emerald-500/30' },
  { status: 'entregue', label: 'Entregue', color: 'border-purple-500/30' },
]

const emptyForm = { customer_name: '', customer_phone: '', device_brand: '', device_model: '', problem: '' }

export function ServicosClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')

  const handleCreate = () => {
    if (!form.customer_name || !form.device_brand || !form.problem) return
    const newOrder: ServiceOrder = {
      id: `OS${String(Date.now()).slice(-3)}`,
      ...form,
      status: 'recebido',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setOrders(prev => [newOrder, ...prev])
    setShowForm(false)
    setForm(emptyForm)
  }

  const moveStatus = (id: string, status: ServiceStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Ordens de Serviço</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{orders.filter(o => o.status !== 'entregue').length} em aberto</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#141414] border border-white/[0.08] rounded-xl p-1">
            <button onClick={() => setView('kanban')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', view === 'kanban' ? 'bg-green-500 text-black' : 'text-zinc-500 hover:text-white')}>Kanban</button>
            <button onClick={() => setView('list')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', view === 'list' ? 'bg-green-500 text-black' : 'text-zinc-500 hover:text-white')}>Lista</button>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-all text-sm">
            <Plus size={16} /> Nova O.S.
          </button>
        </div>
      </div>

      {/* Kanban */}
      {view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLS.map(col => {
            const colOrders = orders.filter(o => o.status === col.status)
            return (
              <div key={col.status} className={cn('shrink-0 w-64 rounded-2xl border bg-[#111] p-3 space-y-2', col.color)}>
                <div className="flex items-center justify-between mb-3">
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', serviceStatusColor[col.status])}>
                    {col.label}
                  </span>
                  <span className="text-xs text-zinc-600">{colOrders.length}</span>
                </div>
                {colOrders.map(order => (
                  <div key={order.id} className="bg-[#181818] border border-white/[0.06] rounded-xl p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-white">{order.customer_name}</p>
                      <span className="text-[10px] font-mono text-zinc-600 shrink-0">{order.id}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{order.device_brand} {order.device_model}</p>
                    <p className="text-xs text-zinc-600 line-clamp-2">{order.problem}</p>
                    {order.price && <p className="text-xs font-semibold text-green-400">{formatCurrency(order.price)}</p>}
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="relative flex-1">
                        <select
                          value={order.status}
                          onChange={e => moveStatus(order.id, e.target.value as ServiceStatus)}
                          className="w-full bg-[#222] border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] text-zinc-400 focus:outline-none appearance-none"
                        >
                          {KANBAN_COLS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                      </div>
                      <a
                        href={`https://wa.me/55${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${order.customer_name}! Seu aparelho ${order.device_brand} ${order.device_model} está com status: *${serviceStatusLabel[order.status]}*. Qualquer dúvida, estamos à disposição! MM CELL.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                        title="Notificar cliente no WhatsApp"
                      >
                        <MessageCircle size={12} />
                      </a>
                    </div>
                  </div>
                ))}
                {colOrders.length === 0 && (
                  <p className="text-center text-xs text-zinc-700 py-6">Vazio</p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['O.S.', 'Cliente', 'Aparelho', 'Problema', 'Status', 'Data', 'Ação'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-zinc-500">{order.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white">{order.customer_name}</p>
                      <p className="text-xs text-zinc-600">{order.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{order.device_brand} {order.device_model}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500 max-w-[160px] truncate">{order.problem}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-medium px-2 py-1 rounded-full border', serviceStatusColor[order.status])}>
                        {serviceStatusLabel[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://wa.me/55${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${order.customer_name}! Status do seu ${order.device_brand} ${order.device_model}: *${serviceStatusLabel[order.status]}*. MM CELL.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all inline-flex"
                      >
                        <MessageCircle size={14} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Nova ordem de serviço</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome do cliente *</label>
                    <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="João Silva" className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Telefone</label>
                    <input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder="(11) 99999-9999" className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Marca *</label>
                  <input value={form.device_brand} onChange={e => setForm(f => ({ ...f, device_brand: e.target.value }))} placeholder="Apple" className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Modelo</label>
                  <input value={form.device_model} onChange={e => setForm(f => ({ ...f, device_model: e.target.value }))} placeholder="iPhone 13" className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Problema relatado *</label>
                  <textarea value={form.problem} onChange={e => setForm(f => ({ ...f, problem: e.target.value }))} rows={3} placeholder="Descreva o defeito..." className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 resize-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] transition-all">Cancelar</button>
              <button onClick={handleCreate} className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                <Wrench size={14} /> Criar O.S.
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
