'use client'

import { useState } from 'react'
import { Plus, Tag, Percent, X, Package } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { mockProducts, mockBanners } from '@/data/mock'
import type { Banner, Product } from '@/types'

export default function PromocoesAdminPage() {
  const [banners, setBanners] = useState<Banner[]>(mockBanners)
  const [promoProducts, setPromoProducts] = useState<Product[]>(mockProducts)
  const [showBannerForm, setShowBannerForm] = useState(false)
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', badge: '', cta_text: 'Aproveitar', cta_href: '/loja' })

  const toggleBanner = (id: string) => setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !b.is_active } : b))

  const handleCreateBanner = () => {
    if (!bannerForm.title) return
    setBanners(prev => [...prev, {
      id: String(Date.now()),
      ...bannerForm,
      image_url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200',
      is_active: true,
      order: prev.length + 1,
    }])
    setShowBannerForm(false)
    setBannerForm({ title: '', subtitle: '', badge: '', cta_text: 'Aproveitar', cta_href: '/loja' })
  }

  const togglePromo = (id: string) => {
    setPromoProducts(prev => prev.map(p => p.id === id
      ? { ...p, promo_price: p.promo_price ? undefined : Math.round(p.price * 0.9) }
      : p
    ))
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Promoções</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Gerencie banners da home e descontos nos produtos</p>
      </div>

      {/* Banners Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Tag size={16} className="text-green-400" /> Banners da Home
          </h2>
          <button onClick={() => setShowBannerForm(true)} className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20 rounded-xl text-xs font-medium transition-all">
            <Plus size={14} /> Novo banner
          </button>
        </div>
        <div className="space-y-3">
          {banners.map(banner => (
            <div key={banner.id} className={cn('flex items-center gap-4 p-4 rounded-2xl border transition-all', banner.is_active ? 'bg-[#141414] border-white/[0.06]' : 'bg-[#0f0f0f] border-white/[0.03] opacity-60')}>
              <div className="w-16 h-10 rounded-lg overflow-hidden bg-[#1a1a1a] shrink-0">
                <img src={banner.image_url} alt="" className="w-full h-full object-cover opacity-70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{banner.title}</p>
                <p className="text-xs text-zinc-500 truncate">{banner.subtitle}</p>
              </div>
              {banner.badge && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 shrink-0">
                  {banner.badge}
                </span>
              )}
              <button
                onClick={() => toggleBanner(banner.id)}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0', banner.is_active
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-zinc-500/10 border-zinc-500/25 text-zinc-500 hover:bg-zinc-500/20'
                )}
              >
                {banner.is_active ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Promo Products */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Percent size={16} className="text-green-400" /> Descontos em produtos
        </h2>
        <p className="text-xs text-zinc-600">Ative/desative promoção rápida de 10% nos produtos. Em produção, você pode definir o percentual exato.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {promoProducts.filter(p => p.is_active).map(p => (
            <div key={p.id} className="flex items-center gap-3 p-4 rounded-2xl bg-[#141414] border border-white/[0.06]">
              <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-white/[0.04] flex items-center justify-center shrink-0">
                <Package size={14} className="text-zinc-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-zinc-400">{formatCurrency(p.price)}</p>
                  {p.promo_price && (
                    <span className="text-xs text-green-400">→ {formatCurrency(p.promo_price)}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => togglePromo(p.id)}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0', p.promo_price
                  ? 'bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20'
                  : 'bg-green-500/10 border-green-500/25 text-green-400 hover:bg-green-500/20'
                )}
              >
                {p.promo_price ? 'Remover promo' : 'Ativar -10%'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Banner Form Modal */}
      {showBannerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Novo banner</h3>
              <button onClick={() => setShowBannerForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06]"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Título *', key: 'title', placeholder: 'iPhone 15 Pro Max' },
                { label: 'Subtítulo', key: 'subtitle', placeholder: 'Titanium. Desempenho Pro.' },
                { label: 'Badge', key: 'badge', placeholder: 'Novo, Promoção...' },
                { label: 'Texto do botão', key: 'cta_text', placeholder: 'Ver produto' },
                { label: 'Link do botão', key: 'cta_href', placeholder: '/produto/...' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
                  <input
                    value={(bannerForm as Record<string, string>)[key]}
                    onChange={e => setBannerForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowBannerForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm">Cancelar</button>
              <button onClick={handleCreateBanner} className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl text-sm">Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
