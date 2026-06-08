'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Tag, Percent, X, Package, Upload, Image as ImageIcon, ArrowUp, ArrowDown, Eye, EyeOff, ArrowLeft, Newspaper, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, cn } from '@/lib/utils'
import { getBanners, upsertBanner, deleteBanner as deleteBannerDb, getProducts } from '@/lib/db'
import { useAdminStore } from '@/contexts/AdminStore'
import type { Banner, Product } from '@/types'

type Tab = 'banners' | 'descontos' | 'feed'

interface Post {
  id: string
  image: string
  caption: string
  tag: string
  tagColor: string
  link: string
  is_active: boolean
  created_at: string
}

const TAG_OPTIONS = [
  { label: 'Novo', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { label: 'Promoção', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { label: 'Destaque', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { label: 'Seminovo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { label: 'Exclusivo', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
]

export default function PromocoesAdminPage() {
  const router = useRouter()
  const { storeId } = useAdminStore()
  const [tab, setTab] = useState<Tab>('banners')
  const [banners, setBanners] = useState<Banner[]>([])
  const [promoProducts, setPromoProducts] = useState<Product[]>([])
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    if (!storeId) return
    getBanners(storeId).then(setBanners).catch(console.error)
    getProducts(storeId).then(setPromoProducts).catch(console.error)
  }, [storeId])

  // Banner state
  const [showBannerForm, setShowBannerForm] = useState(false)
  const [editBannerId, setEditBannerId] = useState<string | null>(null)
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', badge: '', cta_text: 'Aproveitar', cta_href: '/loja', image_url: '' })
  const bannerFileRef = useRef<HTMLInputElement>(null)

  // Post state
  const [showPostForm, setShowPostForm] = useState(false)
  const [postForm, setPostForm] = useState({ image: '', caption: '', tag: 'Novo', tagColor: TAG_OPTIONS[0].color, link: '/loja' })
  const postFileRef = useRef<HTMLInputElement>(null)

  // Banner functions
  const toggleBanner = (id: string) => {
    setBanners(prev => {
      const next = prev.map(b => b.id === id ? { ...b, is_active: !b.is_active } : b)
      const updated = next.find(b => b.id === id)
      if (updated) upsertBanner(storeId, { id, is_active: updated.is_active }).catch(console.error)
      return next
    })
  }

  const moveBanner = (id: string, dir: 'up' | 'down') => {
    setBanners(prev => {
      const idx = prev.findIndex(b => b.id === id)
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      // persist new order positions
      upsertBanner(storeId, { id: next[idx].id, order: idx }).catch(console.error)
      upsertBanner(storeId, { id: next[swap].id, order: swap }).catch(console.error)
      return next
    })
  }

  const handleBannerImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setBannerForm(f => ({ ...f, image_url: ev.target?.result as string }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleBannerImageFileDrop = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const image_url = ev.target?.result as string
      setBanners(prev => prev.map(b => b.id === id ? { ...b, image_url } : b))
      upsertBanner(storeId, { id, image_url }).catch(console.error)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const createBanner = async () => {
    if (!bannerForm.title) return
    const payload = {
      ...bannerForm,
      image_url: bannerForm.image_url || 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200',
      is_active: true,
      order: banners.length + 1,
    }
    const saved = await upsertBanner(storeId, payload).catch(() => null)
    const newBanner: Banner = saved ?? { id: String(Date.now()), ...payload }
    setBanners(prev => [...prev, newBanner])
    setShowBannerForm(false)
    setBannerForm({ title: '', subtitle: '', badge: '', cta_text: 'Aproveitar', cta_href: '/loja', image_url: '' })
  }

  const deleteBanner = async (id: string) => {
    if (confirm('Remover este banner?')) {
      await deleteBannerDb(storeId, id).catch(console.error)
      setBanners(prev => prev.filter(b => b.id !== id))
    }
  }

  // Post functions
  const handlePostImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPostForm(f => ({ ...f, image: ev.target?.result as string }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const createPost = () => {
    if (!postForm.image && !postForm.caption) return
    const tagOpt = TAG_OPTIONS.find(t => t.label === postForm.tag) ?? TAG_OPTIONS[0]
    setPosts(prev => [...prev, {
      id: String(Date.now()),
      image: postForm.image,
      caption: postForm.caption,
      tag: postForm.tag,
      tagColor: tagOpt.color,
      link: postForm.link,
      is_active: true,
      created_at: new Date().toISOString(),
    }])
    setShowPostForm(false)
    setPostForm({ image: '', caption: '', tag: 'Novo', tagColor: TAG_OPTIONS[0].color, link: '/loja' })
  }

  const togglePost = (id: string) => setPosts(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p))
  const deletePost = (id: string) => { if (confirm('Remover este post?')) setPosts(prev => prev.filter(p => p.id !== id)) }

  const togglePromo = (id: string) => {
    setPromoProducts(prev => prev.map(p => p.id === id
      ? { ...p, promo_price: p.promo_price ? undefined : Math.round(p.price * 0.9) }
      : p
    ))
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="space-y-1">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-white transition-colors group">
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Voltar
        </button>
        <h1 className="text-2xl font-bold text-white">Promoções & Feed</h1>
        <p className="text-sm text-zinc-500">Gerencie banners da home, descontos e novidades da loja</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#141414] border border-white/[0.08] rounded-xl p-1 w-fit">
        {([
          { key: 'banners', label: 'Banners', icon: ImageIcon },
          { key: 'feed', label: 'Feed / Novidades', icon: Newspaper },
          { key: 'descontos', label: 'Descontos', icon: Percent },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all', tab === key ? 'bg-green-500 text-black' : 'text-zinc-500 hover:text-white')}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── BANNERS TAB ── */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2"><Tag size={16} className="text-green-400" /> Banners do Hero</h2>
              <p className="text-xs text-zinc-600 mt-0.5">Arraste para reordenar. Clique na imagem para substituir.</p>
            </div>
            <button onClick={() => setShowBannerForm(true)} className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20 rounded-xl text-xs font-medium transition-all active:scale-95">
              <Plus size={14} /> Novo banner
            </button>
          </div>

          <div className="space-y-3">
            {banners.map((banner, idx) => {
              const fileId = `banner-img-${banner.id}`
              return (
                <div key={banner.id} className={cn('flex items-center gap-4 p-4 rounded-2xl border transition-all', banner.is_active ? 'bg-[#141414] border-white/[0.06]' : 'bg-[#0f0f0f] border-white/[0.03] opacity-50')}>
                  {/* Imagem clicável */}
                  <label htmlFor={fileId} className="relative w-20 h-12 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/[0.08] shrink-0 cursor-pointer group/img">
                    <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload size={14} className="text-white" />
                    </div>
                    <input id={fileId} type="file" accept="image/*" className="hidden"
                      onChange={e => handleBannerImageFileDrop(banner.id, e)} />
                  </label>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{banner.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{banner.subtitle}</p>
                    {banner.badge && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 mt-1 inline-block">{banner.badge}</span>}
                  </div>

                  {/* Controles */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => moveBanner(banner.id, 'up')} disabled={idx === 0} className="p-1.5 rounded-lg text-zinc-600 hover:text-white disabled:opacity-20 transition-all"><ArrowUp size={13} /></button>
                    <button onClick={() => moveBanner(banner.id, 'down')} disabled={idx === banners.length - 1} className="p-1.5 rounded-lg text-zinc-600 hover:text-white disabled:opacity-20 transition-all"><ArrowDown size={13} /></button>
                    <button onClick={() => toggleBanner(banner.id)}
                      className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0',
                        banner.is_active ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20' : 'bg-zinc-500/10 border-zinc-500/25 text-zinc-500 hover:bg-zinc-500/20')}>
                      {banner.is_active ? <><Eye size={12} /> Ativo</> : <><EyeOff size={12} /> Inativo</>}
                    </button>
                    <button onClick={() => deleteBanner(banner.id)} className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Modal criar banner */}
          {showBannerForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-white">Novo banner</h3>
                  <button onClick={() => setShowBannerForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06]"><X size={16} /></button>
                </div>
                <div className="p-6 space-y-4">
                  {/* Upload de imagem */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">Imagem do banner</label>
                    <div className="flex gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/[0.12] rounded-xl text-xs text-zinc-500 hover:border-green-500/40 hover:text-green-400 transition-all cursor-pointer">
                        <Upload size={14} /> {bannerForm.image_url ? 'Trocar imagem' : 'Enviar foto'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleBannerImageFile} ref={bannerFileRef} />
                      </label>
                      {bannerForm.image_url && (
                        <div className="w-20 h-12 rounded-xl overflow-hidden border border-white/[0.08]">
                          <img src={bannerForm.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-700 mt-1">Ou cole um link abaixo</p>
                    <input value={bannerForm.image_url} onChange={e => setBannerForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..."
                      className="w-full mt-1 bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 font-mono text-xs" />
                  </div>

                  {[
                    { label: 'Título *', key: 'title', placeholder: 'iPhone 15 Pro Max' },
                    { label: 'Subtítulo', key: 'subtitle', placeholder: 'Titânio. Câmera Pro.' },
                    { label: 'Badge', key: 'badge', placeholder: 'Novo, Promoção...' },
                    { label: 'Texto do botão', key: 'cta_text', placeholder: 'Ver produto' },
                    { label: 'Link do botão', key: 'cta_href', placeholder: '/produto/...' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
                      <input value={(bannerForm as Record<string, string>)[key]} onChange={e => setBannerForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                        className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
                  <button onClick={() => setShowBannerForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm">Cancelar</button>
                  <button onClick={createBanner} disabled={!bannerForm.title} className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm active:scale-95 transition-all">Criar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FEED TAB ── */}
      {tab === 'feed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2"><Newspaper size={16} className="text-green-400" /> Feed de Novidades</h2>
              <p className="text-xs text-zinc-600 mt-0.5">Posts aparecem na seção "Novidades" da home. Adicione fotos dos produtos, promoções e lançamentos.</p>
            </div>
            <button onClick={() => setShowPostForm(true)} className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20 rounded-xl text-xs font-medium transition-all active:scale-95">
              <Plus size={14} /> Novo post
            </button>
          </div>

          {posts.length === 0 && (
            <div className="text-center py-16 rounded-2xl bg-[#141414] border border-white/[0.06]">
              <Newspaper size={36} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white mb-1">Nenhum post ainda</p>
              <p className="text-xs text-zinc-500 mb-4">Adicione fotos de produtos, promoções e novidades da loja.</p>
              <button onClick={() => setShowPostForm(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20 rounded-xl text-sm font-medium transition-all mx-auto active:scale-95">
                <Plus size={14} /> Criar primeiro post
              </button>
            </div>
          )}

          {/* Grid de posts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {posts.map(post => (
              <div key={post.id} className={cn('group relative rounded-2xl overflow-hidden border transition-all', post.is_active ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-50')}>
                {/* Imagem */}
                <div className="aspect-square bg-[#1a1a1a]">
                  {post.image
                    ? <img src={post.image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={32} className="text-zinc-700" /></div>
                  }
                </div>
                {/* Tag */}
                {post.tag && (
                  <div className="absolute top-2 left-2">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm', post.tagColor)}>{post.tag}</span>
                  </div>
                )}
                {/* Caption */}
                <div className="p-3 bg-[#141414]">
                  <p className="text-xs text-zinc-300 line-clamp-2">{post.caption || '—'}</p>
                </div>
                {/* Ações */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => togglePost(post.id)} className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-all">
                    {post.is_active ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                  <button onClick={() => deletePost(post.id)} className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-all">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal criar post */}
          {showPostForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-white">Novo post</h3>
                  <button onClick={() => setShowPostForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06]"><X size={16} /></button>
                </div>
                <div className="p-6 space-y-4">
                  {/* Upload */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">Foto *</label>
                    <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-white/[0.12] rounded-xl cursor-pointer hover:border-green-500/40 transition-all group/upload">
                      {postForm.image
                        ? <img src={postForm.image} alt="" className="max-h-32 rounded-lg object-contain" />
                        : <>
                            <Upload size={24} className="text-zinc-600 group-hover/upload:text-green-400 transition-colors" />
                            <span className="text-xs text-zinc-500">Clique para enviar foto</span>
                            <span className="text-[10px] text-zinc-700">JPG, PNG, WEBP</span>
                          </>
                      }
                      <input type="file" accept="image/*" className="hidden" onChange={handlePostImageFile} ref={postFileRef} />
                    </label>
                    <p className="text-[10px] text-zinc-700 mt-1">Ou cole um link:</p>
                    <input value={postForm.image} onChange={e => setPostForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..."
                      className="w-full mt-1 bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 font-mono text-xs" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Legenda / descrição</label>
                    <textarea value={postForm.caption} onChange={e => setPostForm(f => ({ ...f, caption: e.target.value }))} rows={2}
                      placeholder="iPhone 15 Pro chegou! 🔥 Pronta entrega, garantia de 1 ano..."
                      className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tag</label>
                      <div className="flex flex-wrap gap-1.5">
                        {TAG_OPTIONS.map(t => (
                          <button key={t.label} onClick={() => setPostForm(f => ({ ...f, tag: t.label, tagColor: t.color }))}
                            className={cn('px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all',
                              postForm.tag === t.label ? t.color : 'border-white/[0.08] text-zinc-500 hover:text-white')}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Link ao clicar</label>
                      <input value={postForm.link} onChange={e => setPostForm(f => ({ ...f, link: e.target.value }))} placeholder="/loja"
                        className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
                  <button onClick={() => setShowPostForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm">Cancelar</button>
                  <button onClick={createPost} disabled={!postForm.image && !postForm.caption} className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm active:scale-95 transition-all">Publicar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DESCONTOS TAB ── */}
      {tab === 'descontos' && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Percent size={16} className="text-green-400" /> Descontos rápidos em produtos
          </h2>
          <p className="text-xs text-zinc-600">Ative ou desative promoção de 10% por produto. Em produção, você pode definir o percentual exato.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {promoProducts.filter(p => p.is_active).map(p => (
              <div key={p.id} className="flex items-center gap-3 p-4 rounded-2xl bg-[#141414] border border-white/[0.06]">
                <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-white/[0.04] flex items-center justify-center shrink-0 overflow-hidden">
                  {p.images[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="text-zinc-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-zinc-400">{formatCurrency(p.price)}</p>
                    {p.promo_price && <span className="text-xs text-green-400">→ {formatCurrency(p.promo_price)}</span>}
                  </div>
                </div>
                <button onClick={() => togglePromo(p.id)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0 active:scale-95', p.promo_price
                    ? 'bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20'
                    : 'bg-green-500/10 border-green-500/25 text-green-400 hover:bg-green-500/20')}>
                  {p.promo_price ? 'Remover' : 'Ativar -10%'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
