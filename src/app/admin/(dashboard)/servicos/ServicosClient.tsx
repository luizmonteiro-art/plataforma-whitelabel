'use client'

import { useState, useRef } from 'react'
import { Plus, Wrench, MessageCircle, X, ChevronDown, Edit2, Paperclip, CheckCircle, Archive, ArrowLeft, GripVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDateTime, serviceStatusLabel, serviceStatusColor, cn } from '@/lib/utils'
import { useServiceOrders, useAdminStore, useStoreConfig } from '@/contexts/AdminStore'
import { upsertServiceOrder, deleteServiceOrder } from '@/lib/db'
import type { ServiceOrder, ServiceStatus } from '@/types'

interface Props { initialOrders: ServiceOrder[] }

interface ArchivedOrder extends ServiceOrder { archived_at: string }

const KANBAN_COLS: { status: ServiceStatus; label: string; color: string; bg: string; accent: string }[] = [
  { status: 'recebido',        label: 'Recebido',      color: 'border-zinc-500/40',    bg: 'bg-zinc-500/5',    accent: 'bg-zinc-400' },
  { status: 'em_analise',      label: 'Em análise',    color: 'border-blue-500/40',    bg: 'bg-blue-500/5',    accent: 'bg-blue-400' },
  { status: 'aguardando_peca', label: 'Ag. Peça',      color: 'border-orange-500/40',  bg: 'bg-orange-500/5',  accent: 'bg-orange-400' },
  { status: 'em_reparo',       label: 'Em Reparo',     color: 'border-yellow-500/40',  bg: 'bg-yellow-500/5',  accent: 'bg-yellow-400' },
  { status: 'pronto',          label: 'Pronto ✓',      color: 'border-[var(--accent)]/40', bg: 'bg-[var(--accent)]/5', accent: 'bg-[var(--accent)]' },
  { status: 'entregue',        label: 'Entregue',      color: 'border-purple-500/40',  bg: 'bg-purple-500/5',  accent: 'bg-purple-400' },
]

const emptyForm = { customer_name: '', customer_phone: '', device_brand: '', device_model: '', problem: '' }

interface Attachment { name: string; url: string; type: string; addedAt: string }
type OrderAttachments = Record<string, Attachment[]>

export function ServicosClient({ initialOrders: _ }: Props) {
  const router = useRouter()
  const { storeId } = useAdminStore()
  const config = useStoreConfig()
  const storeName = config?.store_name?.trim() || 'nossa loja'
  const waCustomer = (phone: string, text: string) =>
    `https://wa.me/55${(phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
  const [orders, setOrdersRaw] = useServiceOrders()
  const setOrders = (fn: (prev: ServiceOrder[]) => ServiceOrder[]) => setOrdersRaw(fn)
  const [archived, setArchived] = useState<ArchivedOrder[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [showArchived, setShowArchived] = useState(false)

  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<ServiceStatus | null>(null)

  const [editOrder, setEditOrder] = useState<ServiceOrder | null>(null)
  const [attachments, setAttachments] = useState<OrderAttachments>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreate = async () => {
    if (!form.customer_name || !form.device_brand || !form.problem) return
    // id gerado no client — service_orders.id é TEXT PRIMARY KEY (sem default no DB)
    const newOrder: ServiceOrder = {
      id: `OS${String(Date.now()).slice(-6)}`,
      ...form,
      status: 'recebido',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const saved = await upsertServiceOrder(storeId, newOrder).catch(() => newOrder)
    setOrders(prev => [saved, ...prev])
    setShowForm(false)
    setForm(emptyForm)
  }

  const moveStatus = (id: string, status: ServiceStatus) => {
    const updated_at = new Date().toISOString()
    upsertServiceOrder(storeId, { id, status, updated_at }).catch(console.error)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, updated_at } : o))
    if (editOrder?.id === id) setEditOrder(prev => prev ? { ...prev, status } : null)
  }

  const finalizeOrder = async (id: string) => {
    const order = orders.find(o => o.id === id)
    if (!order) return
    await upsertServiceOrder(storeId, { id, status: 'entregue', updated_at: new Date().toISOString() }).catch(console.error)
    setOrders(prev => prev.filter(o => o.id !== id))
    setArchived(prev => [...prev, { ...order, status: 'entregue', archived_at: new Date().toISOString() }])
    if (editOrder?.id === id) setEditOrder(null)
  }

  const onDragStart = (e: React.DragEvent, orderId: string) => {
    setDragging(orderId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('orderId', orderId)
  }
  const onDragOver = (e: React.DragEvent, status: ServiceStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(status)
  }
  const onDrop = (e: React.DragEvent, status: ServiceStatus) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('orderId')
    if (id) moveStatus(id, status)
    setDragging(null)
    setDragOver(null)
  }
  const onDragEnd = () => { setDragging(null); setDragOver(null) }

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editOrder || !e.target.files?.length) return
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = ev => {
      const att: Attachment = { name: file.name, url: ev.target?.result as string, type: file.type, addedAt: new Date().toISOString() }
      setAttachments(prev => ({ ...prev, [editOrder.id]: [...(prev[editOrder.id] ?? []), att] }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const saveEdit = async () => {
    if (!editOrder) return
    const updated = { ...editOrder, updated_at: new Date().toISOString() }
    await upsertServiceOrder(storeId, updated).catch(console.error)
    setOrders(prev => prev.map(o => o.id === editOrder.id ? updated : o))
    setEditOrder(null)
  }

  const openCard = (order: ServiceOrder) => { setEditOrder(order) }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-white transition-colors group">
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Voltar
        </button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Ordens de Serviço</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {orders.length} em aberto · {archived.length} arquivada{archived.length !== 1 ? 's' : ''} · Arraste os cards para mover entre etapas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#141414] border border-white/[0.08] rounded-xl p-1">
              <button onClick={() => setView('kanban')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', view === 'kanban' ? 'bg-[var(--accent)] text-black' : 'text-zinc-500 hover:text-white')}>Kanban</button>
              <button onClick={() => setView('list')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', view === 'list' ? 'bg-[var(--accent)] text-black' : 'text-zinc-500 hover:text-white')}>Lista</button>
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] active:scale-95 text-black font-semibold rounded-xl transition-all text-sm">
              <Plus size={16} /> Nova O.S.
            </button>
          </div>
        </div>
      </div>

      {/* ── KANBAN ── */}
      {view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4 scroll-hidden">
          {KANBAN_COLS.map(col => {
            const colOrders = orders.filter(o => o.status === col.status)
            const isOver = dragOver === col.status
            return (
              <div
                key={col.status}
                className={cn(
                  'shrink-0 w-60 rounded-2xl border transition-all duration-200 p-3',
                  col.color, col.bg,
                  isOver && 'ring-2 ring-[var(--accent)]/50 scale-[1.01] shadow-xl shadow-[var(--accent)]/10'
                )}
                onDragOver={e => onDragOver(e, col.status)}
                onDrop={e => onDrop(e, col.status)}
                onDragLeave={() => setDragOver(null)}
              >
                {/* Coluna header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', col.accent)} />
                    <span className="text-xs font-semibold text-white">{col.label}</span>
                  </div>
                  <span className="text-xs text-zinc-600 font-mono bg-white/[0.05] px-1.5 py-0.5 rounded-md">{colOrders.length}</span>
                </div>

                <div className="space-y-2">
                  {colOrders.map(order => (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={e => onDragStart(e, order.id)}
                      onDragEnd={onDragEnd}
                      className={cn(
                        'group bg-[#1a1a1a] border border-white/[0.08] rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all',
                        'hover:border-[var(--accent)]/25 hover:bg-[#212121] hover:shadow-lg hover:shadow-black/40',
                        dragging === order.id && 'opacity-40 scale-95 rotate-1'
                      )}
                    >
                      {/* Drag handle + actions */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <GripVertical size={12} className="text-zinc-700 group-hover:text-zinc-500" />
                          <span className="text-[10px] font-mono text-zinc-600">{order.id}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); openCard(order) }}
                            className="p-1 rounded-lg text-zinc-600 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all active:scale-90">
                            <Edit2 size={10} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); if (confirm('Finalizar e arquivar esta O.S.?')) finalizeOrder(order.id) }}
                            title="Finalizar e arquivar"
                            className="p-1 rounded-lg text-zinc-600 hover:text-purple-400 hover:bg-purple-500/10 transition-all active:scale-90">
                            <Archive size={10} />
                          </button>
                        </div>
                      </div>

                      {/* Card content — clicável */}
                      <div onClick={() => openCard(order)} className="cursor-pointer space-y-1.5">
                        <p className="text-xs font-semibold text-white leading-snug group-hover:text-[var(--accent)] transition-colors">{order.customer_name}</p>
                        <p className="text-[11px] text-zinc-500">{order.device_brand} {order.device_model}</p>
                        <p className="text-[11px] text-zinc-600 line-clamp-2 italic">{order.problem}</p>
                        {order.price && <p className="text-xs font-bold text-[var(--accent)]">{formatCurrency(order.price)}</p>}
                        {order.diagnosis && (
                          <p className="text-[10px] text-blue-400/70 line-clamp-1">📋 {order.diagnosis}</p>
                        )}
                        {attachments[order.id]?.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-400">
                            <Paperclip size={9} /> {attachments[order.id].length} anexo{attachments[order.id].length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/[0.05]">
                        <span className="text-[9px] text-zinc-700">{formatDateTime(order.created_at)}</span>
                        <div className="ml-auto">
                          <a
                            href={waCustomer(order.customer_phone, `Olá ${order.customer_name}! Seu ${order.device_brand} ${order.device_model}: *${serviceStatusLabel[order.status]}*. ${storeName}.`)}
                            target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 active:scale-90 transition-all flex items-center"
                          >
                            <MessageCircle size={10} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}

                  {colOrders.length === 0 && (
                    <div className={cn('border-2 border-dashed rounded-xl p-6 text-center text-[11px] transition-all', isOver ? 'border-[var(--accent)]/40 text-[var(--accent)]/60 bg-[var(--accent)]/5' : 'border-white/[0.06] text-zinc-700')}>
                      {isOver ? '↓ Soltar aqui' : 'Vazio'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Lista */
        <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['O.S.', 'Cliente', 'Aparelho', 'Problema', 'Status', 'Data', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => openCard(order)}>
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
                    <td className="px-4 py-3 text-xs text-zinc-600 whitespace-nowrap">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openCard(order)} className="p-1.5 rounded-lg text-zinc-500 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all active:scale-90">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => { if (confirm('Finalizar e arquivar?')) finalizeOrder(order.id) }} className="p-1.5 rounded-lg text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all active:scale-90">
                          <Archive size={13} />
                        </button>
                        <a href={waCustomer(order.customer_phone, `Olá ${order.customer_name}! Status: *${serviceStatusLabel[order.status]}*. ${storeName}.`)}
                          target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all active:scale-90">
                          <MessageCircle size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <div className="text-center py-12 text-zinc-600 text-sm">Nenhuma ordem em aberto.</div>}
          </div>
        </div>
      )}

      {/* Arquivados */}
      {archived.length > 0 && (
        <div>
          <button onClick={() => setShowArchived(v => !v)} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors mb-3">
            <Archive size={13} />
            {showArchived ? 'Ocultar' : 'Ver'} {archived.length} ordem{archived.length !== 1 ? 's' : ''} arquivada{archived.length !== 1 ? 's' : ''}
            <ChevronDown size={12} className={cn('transition-transform', showArchived && 'rotate-180')} />
          </button>
          {showArchived && (
            <div className="space-y-2 opacity-60">
              {archived.map(order => (
                <div key={order.id} className="flex items-center gap-4 p-4 rounded-2xl bg-[#111] border border-white/[0.04]">
                  <Archive size={14} className="text-purple-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-400">{order.customer_name} · {order.device_brand} {order.device_model}</p>
                    <p className="text-xs text-zinc-600">Arquivado em {formatDateTime(order.archived_at)}</p>
                  </div>
                  <span className="text-[10px] text-purple-400/70 border border-purple-500/20 px-2 py-0.5 rounded-full">Entregue</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Nova O.S. */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Nova ordem de serviço</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: 'customer_name', label: 'Nome do cliente *', placeholder: 'João Silva' },
                { key: 'customer_phone', label: 'Telefone / WhatsApp', placeholder: '(19) 98149-9229' },
                { key: 'device_brand', label: 'Marca do aparelho *', placeholder: 'Apple' },
                { key: 'device_model', label: 'Modelo', placeholder: 'iPhone 13' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
                  <input value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]/40" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Problema relatado *</label>
                <textarea value={form.problem} onChange={e => setForm(f => ({ ...f, problem: e.target.value }))} rows={3} placeholder="Descreva o defeito..."
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]/40 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] active:scale-95 transition-all">Cancelar</button>
              <button onClick={handleCreate} className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] active:scale-95 text-black font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                <Wrench size={14} /> Criar O.S.
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar O.S. */}
      {editOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">O.S. {editOrder.id}</h3>
                  <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', serviceStatusColor[editOrder.status])}>
                    {serviceStatusLabel[editOrder.status]}
                  </span>
                </div>
                <p className="text-xs text-zinc-600">{editOrder.customer_name} · {editOrder.device_brand} {editOrder.device_model}</p>
              </div>
              <button onClick={() => setEditOrder(null)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Mudar status */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Etapa / Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {KANBAN_COLS.map(col => (
                    <button key={col.status}
                      onClick={() => setEditOrder(prev => prev ? { ...prev, status: col.status } : null)}
                      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95',
                        editOrder.status === col.status
                          ? `${serviceStatusColor[col.status]} bg-white/[0.05]`
                          : 'border-white/[0.06] text-zinc-500 hover:text-white hover:bg-white/[0.04]'
                      )}>
                      <div className={cn('w-1.5 h-1.5 rounded-full', col.accent)} />
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info do cliente */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cliente</label>
                  <input value={editOrder.customer_name} onChange={e => setEditOrder(p => p ? { ...p, customer_name: e.target.value } : null)}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Telefone</label>
                  <input value={editOrder.customer_phone} onChange={e => setEditOrder(p => p ? { ...p, customer_phone: e.target.value } : null)}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40" />
                </div>
              </div>

              {/* Diagnóstico */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Diagnóstico técnico</label>
                <textarea value={editOrder.diagnosis ?? ''} onChange={e => setEditOrder(p => p ? { ...p, diagnosis: e.target.value } : null)}
                  rows={2} placeholder="Descreva o diagnóstico..."
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]/40 resize-none" />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Valor do serviço (R$)</label>
                <input type="number" value={editOrder.price ?? ''} onChange={e => setEditOrder(p => p ? { ...p, price: Number(e.target.value) || undefined } : null)}
                  placeholder="Ex: 349"
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40" />
              </div>

              {/* Anexos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-zinc-400">Anexos</label>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20 active:scale-95 rounded-xl text-xs font-medium transition-all">
                    <Paperclip size={12} /> Anexar
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileAttach} />
                </div>
                {attachments[editOrder.id]?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {attachments[editOrder.id].map((att, i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#1a1a1a]">
                        {att.type.startsWith('image/') ? <img src={att.url} alt={att.name} className="w-full h-20 object-cover" /> : <div className="h-20 flex items-center justify-center"><Paperclip size={20} className="text-zinc-600" /></div>}
                        <p className="text-[9px] text-zinc-600 px-2 py-1 truncate">{att.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-700 italic">Adicione fotos, comprovantes ou autorizações.</p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="p-3 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/15">
                <p className="text-xs font-medium text-[var(--accent)] mb-2">Notificar cliente</p>
                <a href={waCustomer(editOrder.customer_phone, `Olá ${editOrder.customer_name}! Atualização: *${serviceStatusLabel[editOrder.status]}*. ${editOrder.diagnosis ? `Diagnóstico: ${editOrder.diagnosis}. ` : ''}${editOrder.price ? `Valor: R$ ${editOrder.price}. ` : ''}${storeName}.`)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-[var(--accent)] hover:bg-[var(--accent)]/20 active:scale-95 rounded-xl text-xs font-medium transition-all w-fit">
                  <MessageCircle size={12} /> Enviar atualização pelo WhatsApp
                </a>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => { if (confirm('Finalizar e arquivar esta O.S.?')) finalizeOrder(editOrder.id) }}
                className="px-4 py-2.5 bg-purple-500/10 border border-purple-500/25 text-purple-400 hover:bg-purple-500/20 active:scale-95 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
                <Archive size={14} /> Arquivar
              </button>
              <button onClick={() => setEditOrder(null)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] active:scale-95 transition-all">Cancelar</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] active:scale-95 text-black font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                <CheckCircle size={14} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
