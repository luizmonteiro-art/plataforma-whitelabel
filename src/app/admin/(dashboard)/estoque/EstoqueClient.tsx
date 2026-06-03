'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, X, Package, ChevronDown } from 'lucide-react'
import { formatCurrency, categoryLabel, conditionLabel, conditionColor, cn } from '@/lib/utils'
import type { Product, ProductCategory, ProductCondition } from '@/types'

interface Props { initialProducts: Product[] }

const emptyForm = {
  name: '', brand: '', category: 'iphone' as ProductCategory,
  condition: 'lacrado' as ProductCondition, price: '', promo_price: '',
  stock_qty: '', description: '',
}

export function EstoqueClient({ initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => { setForm(emptyForm); setEditProduct(null); setShowForm(true) }

  const openEdit = (p: Product) => {
    setForm({
      name: p.name, brand: p.brand, category: p.category,
      condition: p.condition, price: String(p.price),
      promo_price: p.promo_price ? String(p.promo_price) : '',
      stock_qty: String(p.stock_qty), description: p.description,
    })
    setEditProduct(p)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.name || !form.price || !form.stock_qty) return
    if (editProduct) {
      setProducts(prev => prev.map(p => p.id === editProduct.id ? {
        ...p, ...form,
        price: Number(form.price),
        promo_price: form.promo_price ? Number(form.promo_price) : undefined,
        stock_qty: Number(form.stock_qty),
      } : p))
    } else {
      const newProduct: Product = {
        id: String(Date.now()),
        slug: form.name.toLowerCase().replace(/\s+/g, '-'),
        images: [],
        is_featured: false, is_active: true,
        created_at: new Date().toISOString(),
        ...form,
        price: Number(form.price),
        promo_price: form.promo_price ? Number(form.promo_price) : undefined,
        stock_qty: Number(form.stock_qty),
      }
      setProducts(prev => [newProduct, ...prev])
    }
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Remover este produto?')) setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Estoque</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{products.length} produto{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-all text-sm hover:shadow-lg hover:shadow-green-500/25"
        >
          <Plus size={16} /> Novo produto
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar produto..."
          className="w-full bg-[#141414] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Produto', 'Categoria', 'Condição', 'Preço', 'Estoque', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center shrink-0">
                        <Package size={14} className="text-zinc-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-[160px]">{p.name}</p>
                        <p className="text-xs text-zinc-600">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-400">{categoryLabel[p.category]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', conditionColor[p.condition])}>
                      {conditionLabel[p.condition]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-sm font-semibold text-white">{formatCurrency(p.promo_price ?? p.price)}</span>
                      {p.promo_price && <p className="text-[10px] text-zinc-600 line-through">{formatCurrency(p.price)}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-sm font-semibold', p.stock_qty === 0 ? 'text-red-400' : p.stock_qty <= 2 ? 'text-orange-400' : 'text-white')}>
                      {p.stock_qty} un.
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-zinc-500 hover:text-green-400 hover:bg-green-500/10 transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">Nenhum produto encontrado.</div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">{editProduct ? 'Editar produto' : 'Novo produto'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="iPhone 15 Pro..." className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Marca *</label>
                  <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Apple" className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Categoria</label>
                  <div className="relative">
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ProductCategory }))} className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none">
                      {Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Condição</label>
                  <div className="relative">
                    <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value as ProductCondition }))} className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none">
                      <option value="lacrado">Lacrado</option>
                      <option value="novo">Novo</option>
                      <option value="seminovo">Seminovo</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Preço (R$) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="4299" className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Preço promo (R$)</label>
                  <input type="number" value={form.promo_price} onChange={e => setForm(f => ({ ...f, promo_price: e.target.value }))} placeholder="3899 (opcional)" className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Qtd. em estoque *</label>
                  <input type="number" value={form.stock_qty} onChange={e => setForm(f => ({ ...f, stock_qty: e.target.value }))} placeholder="5" className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Descrição do produto..." className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 resize-none transition-all" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] transition-all">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl text-sm transition-all">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
