'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { ProductCard } from '@/components/store/ProductCard'
import { cn, categoryLabel, conditionLabel } from '@/lib/utils'
import type { Product, ProductCategory, ProductCondition } from '@/types'

const ALL_CATEGORIES: ProductCategory[] = ['iphone', 'android', 'capinha', 'pelicula', 'carregador', 'acessorio']
const ALL_CONDITIONS: ProductCondition[] = ['lacrado', 'novo', 'seminovo']

interface CatalogClientProps {
  products: Product[]
  initialCategory?: string
}

export function CatalogClient({ products, initialCategory }: CatalogClientProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | 'todos'>(
    (initialCategory as ProductCategory) || 'todos'
  )
  const [condition, setCondition] = useState<ProductCondition | 'todos'>('todos')
  const [sort, setSort] = useState<'relevance' | 'price_asc' | 'price_desc' | 'newest'>('relevance')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    let result = products.filter(p => p.is_active)

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )
    }

    if (category !== 'todos') result = result.filter(p => p.category === category)
    if (condition !== 'todos') result = result.filter(p => p.condition === condition)

    if (sort === 'price_asc') result = [...result].sort((a, b) => (a.promo_price ?? a.price) - (b.promo_price ?? b.price))
    else if (sort === 'price_desc') result = [...result].sort((a, b) => (b.promo_price ?? b.price) - (a.promo_price ?? a.price))
    else if (sort === 'newest') result = [...result].sort((a, b) => b.created_at.localeCompare(a.created_at))

    return result
  }, [products, search, category, condition, sort])

  const hasActiveFilters = category !== 'todos' || condition !== 'todos' || search.trim()

  const clearFilters = () => {
    setSearch('')
    setCategory('todos')
    setCondition('todos')
    setSort('relevance')
  }

  return (
    <div className="py-10 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-1">Catálogo</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Nossa Loja</h1>
        <p className="text-sm text-zinc-500 mt-1">{filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, marca..."
            className="w-full bg-[#141414] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 focus:bg-[#1a1a1a] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
            showFilters || hasActiveFilters
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-[#141414] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
          )}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filtros</span>
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 rounded-2xl bg-[#111] border border-white/[0.06] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Categoria</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCategory('todos')}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', category === 'todos' ? 'bg-green-500 text-black' : 'bg-white/[0.06] text-zinc-400 hover:text-white')}
                >
                  Todos
                </button>
                {ALL_CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', category === c ? 'bg-green-500 text-black' : 'bg-white/[0.06] text-zinc-400 hover:text-white')}
                  >
                    {categoryLabel[c]}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Condição</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCondition('todos')}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', condition === 'todos' ? 'bg-green-500 text-black' : 'bg-white/[0.06] text-zinc-400 hover:text-white')}
                >
                  Todas
                </button>
                {ALL_CONDITIONS.map(c => (
                  <button
                    key={c}
                    onClick={() => setCondition(c)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', condition === c ? 'bg-green-500 text-black' : 'bg-white/[0.06] text-zinc-400 hover:text-white')}
                  >
                    {conditionLabel[c]}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Ordenar por</p>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-green-500/40"
              >
                <option value="relevance">Relevância</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="newest">Mais recente</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Category quick tabs (desktop) */}
      <div className="hidden sm:flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setCategory('todos')}
          className={cn('shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all', category === 'todos' ? 'bg-green-500 text-black' : 'bg-[#141414] text-zinc-400 border border-white/[0.06] hover:text-white')}
        >
          Todos
        </button>
        {ALL_CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn('shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all', category === c ? 'bg-green-500 text-black' : 'bg-[#141414] text-zinc-400 border border-white/[0.06] hover:text-white')}
          >
            {categoryLabel[c]}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-lg font-semibold text-white mb-2">Nenhum produto encontrado</p>
          <p className="text-sm text-zinc-500 mb-6">Tente ajustar os filtros ou a busca.</p>
          <button onClick={clearFilters} className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/25 rounded-xl text-sm hover:bg-green-500/20 transition-all">
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  )
}
