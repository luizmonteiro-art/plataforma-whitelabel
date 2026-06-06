'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, X, Package, ChevronDown, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, categoryLabel, conditionLabel, conditionColor, cn } from '@/lib/utils'
import { useProducts } from '@/contexts/AdminStore'
import type { Product, ProductCategory, ProductCondition } from '@/types'

interface Props { initialProducts: Product[] }

const emptyForm = {
  name: '', brand: '', category: 'iphone' as ProductCategory,
  condition: 'lacrado' as ProductCondition, price: '', promo_price: '',
  stock_qty: '', description: '', images: '',
}

export function EstoqueClient({ initialProducts: _ }: Props) {
  const router = useRouter()
  const [products, setProductsRaw] = useProducts()
  const setProducts = (fn: (prev: Product[]) => Product[]) => setProductsRaw(fn)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => { setForm(emptyForm); setEditProduct(null); setShowForm(true) }

  const parseImages = (raw: string) => raw.split(',').map(s => s.trim()).filter(Boolean)

  const openEdit = (p: Product) => {
    setForm({
      name: p.name, brand: p.brand, category: p.category,
      condition: p.condition, price: String(p.price),
      promo_price: p.promo_price ? String(p.promo_price) : '',
      stock_qty: String(p.stock_qty), description: p.description,
      images: p.images.join(', '),
    })
    setEditProduct(p)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.name || !form.price || !form.stock_qty) return
    const parsedImages = parseImages(form.images)
    if (editProduct) {
      setProducts(prev => prev.map(p => p.id === editProduct.id ? {
        ...p, ...form,
        price: Number(form.price),
        promo_price: form.promo_price ? Number(form.promo_price) : undefined,
        stock_qty: Number(form.stock_qty),
        images: parsedImages,
      } : p))
    } else {
      const newProduct: Product = {
        id: String(Date.now()),
        slug: form.name.toLowerCase().replace(/\s+/g, '-'),
        is_featured: false, is_active: true,
        created_at: new Date().toISOString(),
        name: form.name, brand: form.brand, category: form.category,
        condition: form.condition, description: form.description,
        images: parsedImages,
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-white transition-colors group">
            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">Estoque</h1>
          <p className="text-sm text-zinc-500">{products.length} produto{products.length !== 1 ? 's' : ''} · {filtered.length} exibido{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-all text-sm hover:shadow-lg hover:shadow-green-500/25 active:scale-95">
          <Plus size={16} /> Novo produto
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto ou marca..."
          className="w-full bg-[#141414] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 transition-all" />
      </div>

      {/* Cards — efeito "puxar pasta do arquivo" */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">Nenhum produto encontrado.</div>
        )}
        {filtered.map(p => (
          <div
            key={p.id}
            className={cn(
              'group relative flex items-center gap-4 p-4 rounded-2xl bg-[#141414] border border-white/[0.06]',
              'transition-all duration-200 cursor-default',
              'hover:-translate-y-1 hover:bg-[#1d1d1d] hover:border-green-500/20',
              'hover:shadow-xl hover:shadow-black/50 hover:z-10',
              p.stock_qty === 0 ? 'opacity-50' : ''
            )}
          >
            {/* Faixa lateral colorida */}
            <div className={cn(
              'absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-200',
              p.stock_qty === 0 ? 'bg-red-500/40' :
              p.stock_qty <= 2 ? 'bg-orange-500/60 group-hover:w-1.5' :
              'bg-green-500/30 group-hover:w-1.5'
            )} />

            {/* Imagem com zoom no hover */}
            <div className="w-14 h-14 rounded-xl bg-[#111] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg">
              {p.images[0]
                ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                : <Package size={20} className="text-zinc-600" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors truncate max-w-[220px]">{p.name}</p>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', conditionColor[p.condition])}>
                  {conditionLabel[p.condition]}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{p.brand} · {categoryLabel[p.category]}</p>
            </div>

            {/* Preço */}
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-sm font-bold text-white">{formatCurrency(p.promo_price ?? p.price)}</p>
              {p.promo_price && <p className="text-[10px] text-zinc-600 line-through">{formatCurrency(p.price)}</p>}
            </div>

            {/* Estoque */}
            <div className="shrink-0 text-center hidden sm:block min-w-[60px]">
              <p className={cn('text-lg font-black', p.stock_qty === 0 ? 'text-red-400' : p.stock_qty <= 2 ? 'text-orange-400' : 'text-white')}>
                {p.stock_qty}
              </p>
              <p className="text-[10px] text-zinc-600">un.</p>
            </div>

            {/* Ações — aparecem no hover */}
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
              <button onClick={() => openEdit(p)} className="p-2 rounded-xl text-zinc-500 hover:text-green-400 hover:bg-green-500/10 transition-all active:scale-90">
                <Edit2 size={15} />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">{editProduct ? 'Editar produto' : 'Novo produto'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="iPhone 15 Pro..."
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Marca *</label>
                  <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Apple"
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Categoria</label>
                  <div className="relative">
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ProductCategory }))}
                      className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none">
                      {Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Condição</label>
                  <div className="relative">
                    <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value as ProductCondition }))}
                      className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none">
                      <option value="lacrado">Lacrado</option>
                      <option value="novo">Novo</option>
                      <option value="seminovo">Seminovo</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Preço (R$) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="4299"
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Preço promo (R$)</label>
                  <input type="number" value={form.promo_price} onChange={e => setForm(f => ({ ...f, promo_price: e.target.value }))} placeholder="3899 (opcional)"
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Qtd. em estoque *</label>
                  <input type="number" value={form.stock_qty} onChange={e => setForm(f => ({ ...f, stock_qty: e.target.value }))} placeholder="5"
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Fotos (URLs separadas por vírgula)</label>
                  <textarea value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))} rows={2}
                    placeholder="https://... , https://..."
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 resize-none transition-all font-mono text-xs" />
                  {parseImages(form.images).length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {parseImages(form.images).map((url, i) => (
                        <div key={i} className="w-12 h-12 rounded-lg overflow-hidden border border-white/[0.08] bg-[#111]">
                          <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                    placeholder="Descrição do produto..."
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 resize-none transition-all" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] transition-all">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl text-sm transition-all active:scale-95">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
