'use client'

import { useState, useMemo } from 'react'
import { Plus, TrendingUp, X, ChevronDown, Target, Trash2, CheckCircle, XCircle, Search, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDateTime, paymentMethodLabel, cn } from '@/lib/utils'
import { useSales, useProducts } from '@/contexts/AdminStore'
import type { Sale, PaymentMethod } from '@/types'

interface SaleWithStatus extends Sale {
  saleStatus: 'aprovado' | 'pendente' | 'cancelado'
}

interface Props { initialSales: Sale[] }

type DateFilter = 'todos' | 'hoje' | 'semana' | 'mes'

export function VendasClient({ initialSales: _ }: Props) {
  const router = useRouter()
  const [rawSales, setSalesRaw] = useSales()
  const [storeProducts] = useProducts()
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
  const [showForm, setShowForm] = useState(false)
  const [formProduct, setFormProduct] = useState('')
  const [formQty, setFormQty] = useState('1')
  const [formPayment, setFormPayment] = useState<PaymentMethod>('pix')
  const [formCustomer, setFormCustomer] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'aprovado' | 'pendente' | 'cancelado'>('todos')
  const [filterPayment, setFilterPayment] = useState<string>('todos')
  const [filterDate, setFilterDate] = useState<DateFilter>('todos')
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(10000)
  const [editMeta, setEditMeta] = useState(false)
  const [metaInput, setMetaInput] = useState('10000')

  const filtered = useMemo(() => {
    const now = new Date()
    return sales.filter(s => {
      if (filterStatus !== 'todos' && s.saleStatus !== filterStatus) return false
      if (filterPayment !== 'todos' && s.payment_method !== filterPayment) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchCustomer = s.customer_name?.toLowerCase().includes(q)
        const matchProduct = s.items.some(i => i.product_name.toLowerCase().includes(q))
        const matchId = s.id.toLowerCase().includes(q)
        if (!matchCustomer && !matchProduct && !matchId) return false
      }
      if (filterDate !== 'todos') {
        const d = new Date(s.created_at)
        if (filterDate === 'hoje') {
          if (d.toDateString() !== now.toDateString()) return false
        } else if (filterDate === 'semana') {
          const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
          if (d < weekAgo) return false
        } else if (filterDate === 'mes') {
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false
        }
      }
      return true
    })
  }, [sales, filterStatus, filterPayment, search, filterDate])

  const approved = sales.filter(s => s.saleStatus === 'aprovado')
  const totalRevenue = approved.reduce((a, s) => a + s.total, 0)
  const pendingRevenue = sales.filter(s => s.saleStatus === 'pendente').reduce((a, s) => a + s.total, 0)
  const metaPercent = Math.min(100, Math.round((totalRevenue / meta) * 100))

  const handleRegister = () => {
    const product = storeProducts.find(p => p.id === formProduct)
    if (!product) return
    const qty = Number(formQty) || 1
    const total = (product.promo_price ?? product.price) * qty
    const newSale: SaleWithStatus = {
      id: `VD${String(Date.now()).slice(-4)}`,
      items: [{ product_id: product.id, product_name: product.name, quantity: qty, unit_price: product.promo_price ?? product.price }],
      total,
      payment_method: formPayment,
      customer_name: formCustomer || undefined,
      created_at: new Date().toISOString(),
      saleStatus: 'aprovado',
    }
    setSales(prev => [newSale, ...prev])
    setShowForm(false)
    setFormProduct(''); setFormQty('1'); setFormCustomer('')
  }

  const changeStatus = (id: string, status: SaleWithStatus['saleStatus']) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, saleStatus: status } : s))
  }
  const removeSale = (id: string) => {
    if (!confirm('Remover esta venda?')) return
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita */}
        <div className="col-span-2 p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Receita aprovada</span>
            </div>
            <span className="text-xs text-zinc-600">{approved.length} vendas</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">{formatCurrency(totalRevenue)}</p>
          {pendingRevenue > 0 && (
            <p className="text-xs text-yellow-400/70">+ {formatCurrency(pendingRevenue)} pendente</p>
          )}
        </div>

        {/* Meta */}
        <div className="p-5 rounded-2xl bg-[#141414] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-green-400" />
              <span className="text-xs font-semibold text-zinc-400">Meta do mês</span>
            </div>
            <button onClick={() => { setEditMeta(true); setMetaInput(String(meta)) }} className="text-[10px] text-zinc-600 hover:text-green-400 transition-colors active:scale-90">Editar</button>
          </div>
          {editMeta ? (
            <div className="flex gap-2">
              <input type="number" value={metaInput} onChange={e => setMetaInput(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500/40 w-full" />
              <button onClick={() => { setMeta(Number(metaInput) || meta); setEditMeta(false) }}
                className="px-3 py-1.5 bg-green-500 active:scale-90 text-black font-semibold rounded-lg text-xs">OK</button>
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-white">{metaPercent}%</p>
              <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', metaPercent >= 100 ? 'bg-emerald-400' : metaPercent >= 70 ? 'bg-green-400' : 'bg-yellow-400')}
                  style={{ width: `${metaPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">{formatCurrency(totalRevenue)} / {formatCurrency(meta)}</p>
            </>
          )}
        </div>

        {/* Ticket médio */}
        <div className="p-5 rounded-2xl bg-[#141414] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-zinc-400">Ticket médio</span>
          </div>
          <p className="text-xl font-bold text-white">
            {approved.length > 0 ? formatCurrency(totalRevenue / approved.length) : 'R$ —'}
          </p>
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
                <tr key={sale.id} className={cn('transition-colors', sale.saleStatus === 'cancelado' ? 'opacity-50' : 'hover:bg-white/[0.02]')}>
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
                      {sale.saleStatus === 'pendente' && (
                        <button onClick={() => changeStatus(sale.id, 'aprovado')} title="Aprovar" className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-90 transition-all">
                          <CheckCircle size={13} />
                        </button>
                      )}
                      {sale.saleStatus !== 'cancelado' && (
                        <button onClick={() => changeStatus(sale.id, 'cancelado')} title="Cancelar" className="p-1.5 rounded-lg text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/10 active:scale-90 transition-all">
                          <XCircle size={13} />
                        </button>
                      )}
                      <button onClick={() => removeSale(sale.id)} title="Remover" className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all">
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

      {/* Modal Registrar Venda */}
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
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none">
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
                  <input type="number" min="1" value={formQty} onChange={e => setFormQty(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Pagamento</label>
                  <div className="relative">
                    <select value={formPayment} onChange={e => setFormPayment(e.target.value as PaymentMethod)}
                      className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none">
                      {Object.entries(paymentMethodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cliente (opcional)</label>
                <input value={formCustomer} onChange={e => setFormCustomer(e.target.value)} placeholder="Nome do cliente"
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40" />
              </div>
              {formProduct && (
                <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20 text-sm">
                  <p className="text-zinc-400">Total: <span className="text-green-400 font-bold">
                    {formatCurrency((storeProducts.find(p => p.id === formProduct)?.promo_price ?? storeProducts.find(p => p.id === formProduct)?.price ?? 0) * (Number(formQty) || 1))}
                  </span></p>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] active:scale-95 transition-all">Cancelar</button>
              <button onClick={handleRegister} disabled={!formProduct} className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 active:scale-95 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all">Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
