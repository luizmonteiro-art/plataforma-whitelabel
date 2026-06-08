'use client'

import { useState, useMemo } from 'react'
import { Plus, TrendingUp, X, ChevronDown, Target, Trash2, CheckCircle, XCircle, Search, ArrowLeft, Edit2, Package, Percent, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDateTime, paymentMethodLabel, cn } from '@/lib/utils'
import { useSales, useProducts, useAdminStore } from '@/contexts/AdminStore'
import { insertSale, upsertSale, deleteSale, upsertProduct } from '@/lib/db'
import type { Sale, PaymentMethod } from '@/types'

interface SaleWithStatus extends Sale {
  saleStatus: 'aprovado' | 'pendente' | 'cancelado'
}

interface EditItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

interface Props { initialSales: Sale[] }
type DateFilter = 'todos' | 'hoje' | 'semana' | 'mes'

export function VendasClient({ initialSales: _ }: Props) {
  const router = useRouter()
  const { storeId } = useAdminStore()
  const [rawSales, setSalesRaw] = useSales()
  const [storeProducts, setProducts] = useProducts()
  const [sales, setSalesLocal] = useState<SaleWithStatus[]>(() =>
    rawSales.map(s => ({ ...s, saleStatus: 'aprovado' as const }))
  )
  const setSales = (fn: (prev: SaleWithStatus[]) => SaleWithStatus[]) => {
    setSalesLocal(prev => {
      const next = fn(prev)
      setSalesRaw(() => next.map(({ saleStatus: _, ...s }) => s as Sale))
      return next
    })
  }

  // ── Novo registro ──
  const [showForm, setShowForm] = useState(false)
  const [formProduct, setFormProduct] = useState('')
  const [formQty, setFormQty] = useState('1')
  const [formPayment, setFormPayment] = useState<PaymentMethod>('pix')
  const [formCustomer, setFormCustomer] = useState('')

  // ── Edição de venda ──
  const [editSale, setEditSale] = useState<SaleWithStatus | null>(null)
  const [editItems, setEditItems] = useState<EditItem[]>([])
  const [editCustomer, setEditCustomer] = useState('')
  const [editPayment, setEditPayment] = useState<PaymentMethod>('pix')
  const [editStatus, setEditStatus] = useState<SaleWithStatus['saleStatus']>('aprovado')
  const [editDiscount, setEditDiscount] = useState('0')      // % de desconto
  const [editTotalOverride, setEditTotalOverride] = useState('') // valor manual
  const [addProductId, setAddProductId] = useState('')

  // ── Filtros ──
  const [filterStatus, setFilterStatus] = useState<'todos' | 'aprovado' | 'pendente' | 'cancelado'>('todos')
  const [filterPayment, setFilterPayment] = useState<string>('todos')
  const [filterDate, setFilterDate] = useState<DateFilter>('todos')
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(10000)
  const [editMeta, setEditMeta] = useState(false)
  const [metaInput, setMetaInput] = useState('10000')

  // ─────────────── helpers edit ───────────────
  const openEdit = (sale: SaleWithStatus) => {
    setEditSale(sale)
    setEditItems(sale.items.map(i => ({ ...i })))
    setEditCustomer(sale.customer_name || '')
    setEditPayment(sale.payment_method)
    setEditStatus(sale.saleStatus)
    setEditDiscount('0')
    setEditTotalOverride('')
    setAddProductId('')
  }

  const editSubtotal = editItems.reduce((a, i) => a + i.unit_price * i.quantity, 0)
  const discountPct = Math.max(0, Math.min(100, Number(editDiscount) || 0))
  const discountAmt = (discountPct / 100) * editSubtotal
  const editTotal = editTotalOverride !== ''
    ? Number(editTotalOverride)
    : editSubtotal - discountAmt

  const addItemFromProduct = () => {
    const p = storeProducts.find(x => x.id === addProductId)
    if (!p) return
    setEditItems(prev => {
      const existing = prev.findIndex(i => i.product_id === p.id)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { ...next[existing], quantity: next[existing].quantity + 1 }
        return next
      }
      return [...prev, { product_id: p.id, product_name: p.name, quantity: 1, unit_price: p.promo_price ?? p.price }]
    })
    setAddProductId('')
  }

  const updateItem = (idx: number, field: keyof EditItem, value: string | number) => {
    setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: field === 'product_name' ? value : Number(value) } : item))
  }

  const removeItem = (idx: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx))
  }

  const saveEdit = async () => {
    if (!editSale || editItems.length === 0) return
    const changes = {
      id: editSale.id,
      items: editItems,
      total: editTotal,
      customer_name: editCustomer || undefined,
      payment_method: editPayment,
    }
    await upsertSale(storeId, changes).catch(console.error)
    setSales(prev => prev.map(s => s.id === editSale.id ? {
      ...s,
      ...changes,
      saleStatus: editStatus,
    } : s))
    setEditSale(null)
  }

  // ─────────────── filtros ───────────────
  const filtered = useMemo(() => {
    const now = new Date()
    return sales.filter(s => {
      if (filterStatus !== 'todos' && s.saleStatus !== filterStatus) return false
      if (filterPayment !== 'todos' && s.payment_method !== filterPayment) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!s.customer_name?.toLowerCase().includes(q) &&
            !s.items.some(i => i.product_name.toLowerCase().includes(q)) &&
            !s.id.toLowerCase().includes(q)) return false
      }
      if (filterDate !== 'todos') {
        const d = new Date(s.created_at)
        if (filterDate === 'hoje' && d.toDateString() !== now.toDateString()) return false
        if (filterDate === 'semana') { const w = new Date(now); w.setDate(w.getDate()-7); if (d < w) return false }
        if (filterDate === 'mes' && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false
      }
      return true
    })
  }, [sales, filterStatus, filterPayment, search, filterDate])

  const approved = sales.filter(s => s.saleStatus === 'aprovado')
  const totalRevenue = approved.reduce((a, s) => a + s.total, 0)
  const pendingRevenue = sales.filter(s => s.saleStatus === 'pendente').reduce((a, s) => a + s.total, 0)
  const metaPercent = Math.min(100, Math.round((totalRevenue / meta) * 100))

  const handleRegister = async () => {
    const product = storeProducts.find(p => p.id === formProduct)
    if (!product) return
    const qty = Number(formQty) || 1
    const total = (product.promo_price ?? product.price) * qty
    const payload = {
      items: [{ product_id: product.id, product_name: product.name, quantity: qty, unit_price: product.promo_price ?? product.price }],
      total,
      payment_method: formPayment,
      customer_name: formCustomer || undefined,
    }
    const saved = await insertSale(storeId, payload).catch(() => null)

    // Decrementa o estoque do produto vendido (persiste + atualiza UI)
    const newStock = Math.max(0, product.stock_qty - qty)
    upsertProduct(storeId, { id: product.id, stock_qty: newStock }).catch(console.error)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_qty: newStock } : p))

    const newSale: SaleWithStatus = {
      id: saved?.id ?? `VD${String(Date.now()).slice(-4)}`,
      created_at: saved?.created_at ?? new Date().toISOString(),
      ...payload,
      saleStatus: 'aprovado',
    }
    setSales(prev => [newSale, ...prev])
    setShowForm(false)
    setFormProduct(''); setFormQty('1'); setFormCustomer('')
  }

  const changeStatus = (id: string, status: SaleWithStatus['saleStatus']) =>
    setSales(prev => prev.map(s => s.id === id ? { ...s, saleStatus: status } : s))

  const removeSale = async (id: string) => {
    if (!confirm('Remover esta venda?')) return
    await deleteSale(storeId, id).catch(console.error)
    setSales(prev => prev.filter(s => s.id !== id))
  }

  const statusColors = {
    aprovado: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pendente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  const paymentColors: Record<string, string> = {
    pix: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    dinheiro: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    cartao_debito: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    cartao_credito: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }

  const inputCls = 'w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/40 transition-all'

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-1">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-white transition-colors group">
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Voltar
        </button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Vendas</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{filtered.length} de {sales.length} registros</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-400 active:scale-95 text-black font-semibold rounded-xl transition-all text-sm">
            <Plus size={16} /> Registrar venda
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-2 p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Receita aprovada</span>
            </div>
            <span className="text-xs text-zinc-600">{approved.length} vendas</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">{formatCurrency(totalRevenue)}</p>
          {pendingRevenue > 0 && <p className="text-xs text-yellow-400/70">+ {formatCurrency(pendingRevenue)} pendente</p>}
        </div>
        <div className="p-5 rounded-2xl bg-[#141414] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-green-400" />
              <span className="text-xs font-semibold text-zinc-400">Meta do mês</span>
            </div>
            <button onClick={() => { setEditMeta(true); setMetaInput(String(meta)) }} className="text-[10px] text-zinc-600 hover:text-green-400 transition-colors">Editar</button>
          </div>
          {editMeta ? (
            <div className="flex gap-2">
              <input type="number" value={metaInput} onChange={e => setMetaInput(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500/40" />
              <button onClick={() => { setMeta(Number(metaInput) || meta); setEditMeta(false) }}
                className="px-3 py-1.5 bg-green-500 active:scale-90 text-black font-semibold rounded-lg text-xs">OK</button>
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-white">{metaPercent}%</p>
              <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500', metaPercent >= 100 ? 'bg-emerald-400' : metaPercent >= 70 ? 'bg-green-400' : 'bg-yellow-400')}
                  style={{ width: `${metaPercent}%` }} />
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">{formatCurrency(totalRevenue)} / {formatCurrency(meta)}</p>
            </>
          )}
        </div>
        <div className="p-5 rounded-2xl bg-[#141414] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-zinc-400">Ticket médio</span>
          </div>
          <p className="text-xl font-bold text-white">{approved.length > 0 ? formatCurrency(totalRevenue / approved.length) : 'R$ —'}</p>
          <p className="text-[10px] text-zinc-600 mt-1">Por venda aprovada</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, produto ou ID..."
          className="w-full bg-[#141414] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 transition-all" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"><X size={13} /></button>}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-zinc-600 font-medium">Status:</span>
        {(['todos', 'aprovado', 'pendente', 'cancelado'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95',
              filterStatus === s ? 'bg-green-500 border-green-500 text-black' : 'bg-[#141414] border-white/[0.08] text-zinc-400 hover:text-white')}>
            {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <div className="w-px h-4 bg-white/[0.08]" />
        <span className="text-xs text-zinc-600 font-medium">Período:</span>
        {(['todos', 'hoje', 'semana', 'mes'] as const).map(d => (
          <button key={d} onClick={() => setFilterDate(d)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95',
              filterDate === d ? 'bg-blue-500 border-blue-500 text-white' : 'bg-[#141414] border-white/[0.08] text-zinc-400 hover:text-white')}>
            {d === 'todos' ? 'Todos' : d === 'hoje' ? 'Hoje' : d === 'semana' ? '7 dias' : 'Este mês'}
          </button>
        ))}
        <div className="w-px h-4 bg-white/[0.08]" />
        <div className="relative">
          <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
            className="bg-[#141414] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-zinc-400 focus:outline-none appearance-none pr-7">
            <option value="todos">Pagamento: Todos</option>
            {Object.entries(paymentMethodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
        </div>
        {(search || filterStatus !== 'todos' || filterDate !== 'todos' || filterPayment !== 'todos') && (
          <button onClick={() => { setSearch(''); setFilterStatus('todos'); setFilterDate('todos'); setFilterPayment('todos') }}
            className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 transition-colors">
            <X size={11} /> Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['ID', 'Produto(s)', 'Cliente', 'Pagamento', 'Status', 'Total', 'Data', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map(sale => (
                <tr key={sale.id} className={cn('transition-colors group', sale.saleStatus === 'cancelado' ? 'opacity-50' : 'hover:bg-white/[0.02]')}>
                  <td className="px-4 py-3 text-xs font-mono text-zinc-500">{sale.id}</td>
                  <td className="px-4 py-3 text-sm text-white max-w-[180px] truncate">{sale.items.map(i => `${i.product_name} (${i.quantity}x)`).join(', ')}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{sale.customer_name || <span className="text-zinc-700">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full border', paymentColors[sale.payment_method] ?? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30')}>
                      {paymentMethodLabel[sale.payment_method]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full border', statusColors[sale.saleStatus])}>
                      {sale.saleStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-400">{formatCurrency(sale.total)}</td>
                  <td className="px-4 py-3 text-xs text-zinc-600 whitespace-nowrap">{formatDateTime(sale.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Editar */}
                      <button onClick={() => openEdit(sale)} title="Editar venda"
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-blue-400 hover:bg-blue-500/10 active:scale-90 transition-all">
                        <Edit2 size={13} />
                      </button>
                      {sale.saleStatus === 'pendente' && (
                        <button onClick={() => changeStatus(sale.id, 'aprovado')} title="Aprovar"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90 transition-all">
                          <CheckCircle size={13} />
                        </button>
                      )}
                      {sale.saleStatus !== 'cancelado' && (
                        <button onClick={() => changeStatus(sale.id, 'cancelado')} title="Cancelar"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/10 active:scale-90 transition-all">
                          <XCircle size={13} />
                        </button>
                      )}
                      <button onClick={() => removeSale(sale.id)} title="Remover"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-zinc-600 text-sm">Nenhuma venda encontrada.</div>}
        </div>
      </div>

      {/* ═══════════ MODAL REGISTRAR VENDA ═══════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Registrar venda</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Produto *</label>
                <div className="relative">
                  <select value={formProduct} onChange={e => setFormProduct(e.target.value)}
                    className={inputCls + ' appearance-none'}>
                    <option value="">Selecionar produto...</option>
                    {storeProducts.filter(p => p.is_active && p.stock_qty > 0).map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.promo_price ?? p.price)}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Quantidade</label>
                  <input type="number" min="1" value={formQty} onChange={e => setFormQty(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Pagamento</label>
                  <div className="relative">
                    <select value={formPayment} onChange={e => setFormPayment(e.target.value as PaymentMethod)}
                      className={inputCls + ' appearance-none'}>
                      {Object.entries(paymentMethodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cliente (opcional)</label>
                <input value={formCustomer} onChange={e => setFormCustomer(e.target.value)} placeholder="Nome do cliente"
                  className={inputCls} />
              </div>
              {formProduct && (() => {
                const p = storeProducts.find(x => x.id === formProduct)
                return p ? (
                  <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20 text-sm">
                    <p className="text-zinc-400">Total: <span className="text-green-400 font-bold">
                      {formatCurrency((p.promo_price ?? p.price) * (Number(formQty) || 1))}
                    </span></p>
                  </div>
                ) : null
              })()}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] active:scale-95 transition-all">Cancelar</button>
              <button onClick={handleRegister} disabled={!formProduct} className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 active:scale-95 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all">Registrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL EDITAR VENDA ═══════════ */}
      {editSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-white">Editar venda</h3>
                <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">{editSale.id} · {formatDateTime(editSale.created_at)}</p>
              </div>
              <button onClick={() => setEditSale(null)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90"><X size={16} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Itens da venda */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Package size={13} className="text-green-400" /> Itens da venda
                  </label>
                  <span className="text-[10px] text-zinc-600">{editItems.length} produto{editItems.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="space-y-2">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_70px_90px_32px] gap-2 items-center bg-[#1a1a1a] border border-white/[0.06] rounded-xl px-3 py-2.5">
                      <input
                        value={item.product_name}
                        onChange={e => updateItem(idx, 'product_name', e.target.value)}
                        className="bg-transparent text-sm text-white focus:outline-none min-w-0 truncate"
                        placeholder="Produto"
                      />
                      <input
                        type="number" min="1"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                        className="bg-transparent text-sm text-zinc-300 text-center focus:outline-none w-full"
                        title="Quantidade"
                      />
                      <input
                        type="number" min="0" step="0.01"
                        value={item.unit_price}
                        onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                        className="bg-transparent text-sm text-emerald-400 font-bold text-right focus:outline-none w-full"
                        title="Preço unitário"
                      />
                      <button onClick={() => removeItem(idx)}
                        className="p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Legenda das colunas */}
                {editItems.length > 0 && (
                  <div className="grid grid-cols-[1fr_70px_90px_32px] gap-2 px-3 mt-1">
                    <span className="text-[9px] text-zinc-700">Produto</span>
                    <span className="text-[9px] text-zinc-700 text-center">Qtd</span>
                    <span className="text-[9px] text-zinc-700 text-right">Preço unit.</span>
                  </div>
                )}

                {/* Adicionar produto */}
                <div className="flex gap-2 mt-3">
                  <div className="relative flex-1">
                    <select value={addProductId} onChange={e => setAddProductId(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:border-green-500/40 appearance-none">
                      <option value="">+ Adicionar produto do estoque...</option>
                      {storeProducts.filter(p => p.is_active).map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.promo_price ?? p.price)}</option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                  <button
                    onClick={addItemFromProduct}
                    disabled={!addProductId}
                    className="px-3 py-2 bg-green-500/10 border border-green-500/25 text-green-400 rounded-xl text-xs font-medium hover:bg-green-500/20 disabled:opacity-40 active:scale-90 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Desconto */}
              <div className="rounded-xl bg-[#1a1a1a] border border-white/[0.06] p-4 space-y-3">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Percent size={13} className="text-yellow-400" /> Desconto / Ajuste de valor
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-600 mb-1">Desconto (%)</label>
                    <div className="relative">
                      <input
                        type="number" min="0" max="100" step="1"
                        value={editDiscount}
                        onChange={e => { setEditDiscount(e.target.value); setEditTotalOverride('') }}
                        placeholder="0"
                        className={inputCls + ' pr-7'}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-600 mb-1">Total manual (R$)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={editTotalOverride}
                      onChange={e => { setEditTotalOverride(e.target.value); setEditDiscount('0') }}
                      placeholder={String(editSubtotal - discountAmt)}
                      className={inputCls}
                    />
                  </div>
                </div>
                {/* Resumo */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <div className="text-xs text-zinc-500 space-y-0.5">
                    <p>Subtotal: <span className="text-white">{formatCurrency(editSubtotal)}</span></p>
                    {discountPct > 0 && <p className="text-yellow-400">Desconto {discountPct}%: − {formatCurrency(discountAmt)}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-600">Total final</p>
                    <p className="text-xl font-black text-emerald-400">{formatCurrency(editTotal)}</p>
                  </div>
                </div>
              </div>

              {/* Cliente e Pagamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cliente</label>
                  <input value={editCustomer} onChange={e => setEditCustomer(e.target.value)} placeholder="Nome do cliente"
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Pagamento</label>
                  <div className="relative">
                    <select value={editPayment} onChange={e => setEditPayment(e.target.value as PaymentMethod)}
                      className={inputCls + ' appearance-none'}>
                      {Object.entries(paymentMethodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Tag size={12} className="text-zinc-500" /> Status da venda
                </label>
                <div className="flex gap-2">
                  {(['aprovado', 'pendente', 'cancelado'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setEditStatus(s)}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95',
                        editStatus === s ? statusColors[s] : 'bg-[#1a1a1a] border-white/[0.08] text-zinc-500 hover:text-white'
                      )}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
              <button onClick={() => setEditSale(null)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] active:scale-95 transition-all">Cancelar</button>
              <button
                onClick={saveEdit}
                disabled={editItems.length === 0}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 active:scale-95 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all"
              >
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
