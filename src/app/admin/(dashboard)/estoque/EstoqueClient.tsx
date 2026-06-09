'use client'

import { useState, useRef } from 'react'
import { Plus, Search, Edit2, Trash2, X, Package, ChevronDown, ArrowLeft, ImagePlus, Upload, Sparkles, ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, categoryLabel, conditionLabel, conditionColor, cn } from '@/lib/utils'
import { useProducts, useAdminStore, usePlan } from '@/contexts/AdminStore'
import { upsertProduct, deleteProduct, uploadImage } from '@/lib/db'
import { nextPlanWithMoreProducts } from '@/lib/plans'
import type { Product, ProductCategory, ProductCondition } from '@/types'

interface Props { initialProducts: Product[] }

const emptyForm = {
  name: '', brand: '', category: 'iphone' as ProductCategory,
  condition: 'lacrado' as ProductCondition, price: '', promo_price: '',
  stock_qty: '', description: '', images: [] as string[],
}

// Slug robusto: remove acentos e caracteres especiais (evita slug quebrado/colisão).
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function EstoqueClient({ initialProducts: _ }: Props) {
  const router = useRouter()
  const { storeId } = useAdminStore()
  const { planId, productLimit } = usePlan()
  const [products, setProductsRaw] = useProducts()
  const setProducts = (fn: (prev: Product[]) => Product[]) => setProductsRaw(fn)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const atLimit = products.length >= productLimit
  const nearLimit = products.length >= productLimit * 0.8
  const upgradePlan = nextPlanWithMoreProducts(planId)

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => {
    if (atLimit) { setShowLimitModal(true); return }
    setForm(emptyForm); setEditProduct(null); setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setForm({
      name: p.name, brand: p.brand, category: p.category,
      condition: p.condition, price: String(p.price),
      promo_price: p.promo_price ? String(p.promo_price) : '',
      stock_qty: String(p.stock_qty), description: p.description,
      images: [...p.images],
    })
    setEditProduct(p)
    setShowForm(true)
  }

  // Faz upload das imagens para o Supabase Storage (com fallback p/ base64) e adiciona ao form
  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const imageFiles = Array.from(files).slice(0, 8).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return
    setUploading(true)
    try {
      const urls = await Promise.all(imageFiles.map(f => uploadImage(f, 'products', storeId)))
      setForm(f => ({ ...f, images: [...f.images, ...urls] }))
    } catch (e) {
      console.error(e)
      alert('Não foi possível enviar as imagens. Verifique sua conexão e tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (idx: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
  }

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleImageFiles(e.dataTransfer.files)
  }

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock_qty) return
    if (editProduct) {
      const updated: Product = {
        ...editProduct, ...form,
        price: Number(form.price),
        promo_price: form.promo_price ? Number(form.promo_price) : undefined,
        stock_qty: Number(form.stock_qty),
        images: form.images,
      }
      const saved = await upsertProduct(storeId, updated).catch(e => { console.error(e); return null })
      if (!saved) {
        alert('Não foi possível salvar as alterações. Verifique sua conexão e tente novamente.')
        return // mantém o modal aberto para nova tentativa; não falsifica sucesso
      }
      setProducts(prev => prev.map(p => p.id === editProduct.id ? saved : p))
    } else {
      // Defesa extra: bloqueia criação acima do limite do plano
      if (atLimit) { setShowForm(false); setShowLimitModal(true); return }
      const payload = {
        slug: slugify(form.name),
        is_featured: false as const, is_active: true as const,
        name: form.name, brand: form.brand, category: form.category,
        condition: form.condition, description: form.description,
        images: form.images,
        price: Number(form.price),
        promo_price: form.promo_price ? Number(form.promo_price) : undefined,
        stock_qty: Number(form.stock_qty),
      }
      const saved = await upsertProduct(storeId, payload).catch(e => { console.error(e); return null })
      if (!saved) {
        alert('Não foi possível salvar o produto. Pode ser falha de conexão ou um produto com nome/slug já existente. Tente novamente.')
        return // não insere produto "fantasma" que sumiria ao recarregar
      }
      setProducts(prev => [saved, ...prev])
    }
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Remover este produto?')) {
      await deleteProduct(storeId, id).catch(console.error)
      setProducts(prev => prev.filter(p => p.id !== id))
    }
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
          <p className="text-sm text-zinc-500">
            <span className={cn(
              'font-medium',
              atLimit ? 'text-red-400' : nearLimit ? 'text-orange-400' : 'text-zinc-400'
            )}>
              {products.length}/{productLimit}
            </span>{' '}
            produtos · {filtered.length} exibido{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openNew}
          title={atLimit ? 'Limite de produtos do plano atingido' : undefined}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 font-semibold rounded-xl transition-all text-sm active:scale-95',
            atLimit
              ? 'bg-white/[0.06] text-zinc-500 hover:bg-white/[0.08]'
              : 'bg-[var(--accent)] hover:bg-[var(--accent)] text-black hover:shadow-lg hover:shadow-[var(--accent)]/25'
          )}
        >
          <Plus size={16} /> Novo produto
        </button>
      </div>

      {/* Aviso de limite atingido */}
      {atLimit && (
        <div className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] px-4 py-3">
          <Sparkles size={16} className="shrink-0 text-orange-400" />
          <p className="flex-1 text-sm text-zinc-300">
            Você atingiu o limite de <span className="font-semibold text-white">{productLimit} produtos</span> do plano.
            {upgradePlan && (
              <> Faça upgrade para o plano <span className="font-semibold text-orange-300">{upgradePlan.name}</span> e cadastre até {upgradePlan.productLimit}.</>
            )}
          </p>
          {upgradePlan && (
            <button
              onClick={() => setShowLimitModal(true)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-orange-500/90 px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-orange-400 active:scale-95"
            >
              Fazer upgrade <ArrowUpRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto ou marca..."
          className="w-full bg-[#141414] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all" />
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
              'hover:-translate-y-1 hover:bg-[#1d1d1d] hover:border-[var(--accent)]/20',
              'hover:shadow-xl hover:shadow-black/50 hover:z-10',
              p.stock_qty === 0 ? 'opacity-50' : ''
            )}
          >
            {/* Faixa lateral colorida */}
            <div className={cn(
              'absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-200',
              p.stock_qty === 0 ? 'bg-red-500/40' :
              p.stock_qty <= 2 ? 'bg-orange-500/60 group-hover:w-1.5' :
              'bg-[var(--accent)]/30 group-hover:w-1.5'
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
                <p className="text-sm font-semibold text-white group-hover:text-[var(--accent)] transition-colors truncate max-w-[220px]">{p.name}</p>
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
              <button onClick={() => openEdit(p)} className="p-2 rounded-xl text-zinc-500 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all active:scale-90">
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

            <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">

                {/* Nome */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="iPhone 15 Pro..."
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 transition-all" />
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Marca *</label>
                  <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Apple"
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 transition-all" />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Categoria</label>
                  <div className="relative">
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ProductCategory }))}
                      className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 appearance-none">
                      {Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>

                {/* Condição */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Condição</label>
                  <div className="relative">
                    <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value as ProductCondition }))}
                      className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 appearance-none">
                      <option value="lacrado">Lacrado</option>
                      <option value="novo">Novo</option>
                      <option value="seminovo">Seminovo</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>

                {/* Preço */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Preço (R$) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="4299"
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 transition-all" />
                </div>

                {/* Preço promo */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Preço promo (R$)</label>
                  <input type="number" value={form.promo_price} onChange={e => setForm(f => ({ ...f, promo_price: e.target.value }))} placeholder="3899 (opcional)"
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 transition-all" />
                </div>

                {/* Qtd */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Qtd. em estoque *</label>
                  <input type="number" value={form.stock_qty} onChange={e => setForm(f => ({ ...f, stock_qty: e.target.value }))} placeholder="5"
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 transition-all" />
                </div>

                {/* Upload de fotos */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Fotos do produto
                    <span className="text-zinc-600 font-normal ml-1">({form.images.length}/8 adicionadas)</span>
                  </label>

                  {/* Zona de upload */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all',
                      isDragging
                        ? 'border-[var(--accent)]/60 bg-[var(--accent)]/5'
                        : 'border-white/[0.10] bg-[#1a1a1a] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/[0.03]'
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                      {uploading
                        ? <Upload size={18} className="text-[var(--accent)] animate-pulse" />
                        : isDragging
                          ? <Upload size={18} className="text-[var(--accent)]" />
                          : <ImagePlus size={18} className="text-[var(--accent)]" />
                      }
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">
                        {uploading ? 'Enviando imagens…' : isDragging ? 'Solte as imagens aqui' : 'Toque para escolher fotos'}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        Galeria do celular · Pasta do computador · Arraste aqui
                      </p>
                      <p className="text-[10px] text-zinc-700 mt-1">JPG, PNG, WEBP — até 8 fotos</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={e => handleImageFiles(e.target.files)}
                      // "capture" attribute removed so both camera and gallery appear on mobile
                    />
                  </div>

                  {/* Preview das fotos */}
                  {form.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {form.images.map((src, i) => (
                        <div key={i} className="relative group/img aspect-square rounded-xl overflow-hidden border border-white/[0.08] bg-[#111]">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          {/* Badge principal */}
                          {i === 0 && (
                            <span className="absolute top-1 left-1 text-[8px] font-bold bg-[var(--accent)] text-black px-1.5 py-0.5 rounded-full">
                              CAPA
                            </span>
                          )}
                          {/* Botão remover */}
                          <button
                            onClick={e => { e.stopPropagation(); removeImage(i) }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}

                      {/* Botão de adicionar mais */}
                      {form.images.length < 8 && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-white/[0.10] bg-[#1a1a1a] flex flex-col items-center justify-center gap-1 hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/[0.03] transition-all"
                        >
                          <Plus size={16} className="text-zinc-600" />
                          <span className="text-[9px] text-zinc-700">Mais</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                    placeholder="Descrição do produto..."
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 resize-none transition-all" />
                </div>

              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] transition-all">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] text-black font-semibold rounded-xl text-sm transition-all active:scale-95">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de limite de produtos / upsell */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowLimitModal(false)}>
          <div
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0d100d] p-8 text-center shadow-2xl"
          >
            <div className="absolute inset-0 -z-10 blur-3xl opacity-40 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--accent)_25%,transparent),transparent_60%)]" />
            <button onClick={() => setShowLimitModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"><X size={16} /></button>

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/10">
              <Package size={22} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-xl font-bold text-white">Limite de produtos atingido</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Seu plano permite até <span className="font-semibold text-white">{productLimit} produtos</span>.
              {upgradePlan
                ? <> Faça upgrade para cadastrar mais e crescer sua loja.</>
                : <> Você já está no plano com maior capacidade.</>}
            </p>

            {upgradePlan && (
              <>
                <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.06] px-4 py-3">
                  <Sparkles size={15} className="text-[var(--accent)]" />
                  <span className="text-sm text-zinc-300">
                    Plano <span className="font-bold text-[var(--accent)]">{upgradePlan.name}</span>: até {upgradePlan.productLimit} produtos
                    {' '}— R$ {upgradePlan.priceBrl.toFixed(2).replace('.', ',')}/mês
                  </span>
                </div>
                <a
                  href={`https://wa.me/5519933005099?text=${encodeURIComponent(`Quero fazer upgrade para o plano ${upgradePlan.name}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-[var(--accent)] active:scale-95"
                >
                  Fazer upgrade <ArrowUpRight size={16} />
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
