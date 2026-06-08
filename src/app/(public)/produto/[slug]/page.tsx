import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MessageCircle, Calendar, CheckCircle, Package } from 'lucide-react'
import { getProducts, getStoreConfig } from '@/lib/db'
import { getStoreIdFromHeaders } from '@/lib/store-headers'
import { formatCurrency, conditionLabel, conditionColor, cn } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const storeId = await getStoreIdFromHeaders()
  const [products, config] = await Promise.all([
    getProducts(storeId).catch(() => []),
    getStoreConfig(storeId).catch(() => null),
  ])
  const product = products.find(p => p.slug === slug && p.is_active)
  if (!product) notFound()

  const waNumber = config?.whatsapp ? `55${config.whatsapp.replace(/\D/g, '')}` : '5511999999999'

  const discount = product.promo_price
    ? Math.round(((product.price - product.promo_price) / product.price) * 100)
    : 0

  const related = products.filter(p => p.category === product.category && p.id !== product.id && p.is_active).slice(0, 3)

  const whatsappMsg = encodeURIComponent(`Olá! Tenho interesse no produto: *${product.name}* (${conditionLabel[product.condition]}) — ${formatCurrency(product.promo_price ?? product.price)}. Ainda disponível?`)
  const whatsappUrl = `https://wa.me/${waNumber}?text=${whatsappMsg}`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
        <Link href="/" className="hover:text-amber-400 transition-colors">Início</Link>
        <span>/</span>
        <Link href="/loja" className="hover:text-amber-400 transition-colors">Loja</Link>
        <span>/</span>
        <span className="text-zinc-300 truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#141414] border border-white/[0.06]">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
                <Package size={64} />
              </div>
            )}
            {discount > 0 && (
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-500 text-white shadow-lg">
                  -{discount}%
                </span>
              </div>
            )}
          </div>
          {/* Thumbnail row (visual placeholder for multiple images) */}
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/[0.08] cursor-pointer hover:border-amber-500/40 transition-all">
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          {/* Brand + Condition */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{product.brand}</span>
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', conditionColor[product.condition])}>
              {conditionLabel[product.condition]}
            </span>
          </div>

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{product.name}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-amber-400">
              {formatCurrency(product.promo_price ?? product.price)}
            </span>
            {product.promo_price && (
              <span className="text-lg text-zinc-600 line-through">{formatCurrency(product.price)}</span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-400 leading-relaxed">{product.description}</p>

          {/* Stock */}
          <div className="flex items-center gap-2">
            {product.stock_qty > 0 ? (
              <>
                <CheckCircle size={15} className="text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">
                  {product.stock_qty > 5 ? 'Em estoque' : `Apenas ${product.stock_qty} unidade${product.stock_qty > 1 ? 's' : ''}`}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm text-red-400 font-medium">Produto esgotado</span>
              </>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25 text-sm"
            >
              <MessageCircle size={18} />
              Comprar pelo WhatsApp
            </a>
            <Link
              href="/agendar"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-semibold rounded-xl transition-all text-sm"
            >
              <Calendar size={18} />
              Agendar visita
            </Link>
          </div>

          {/* Specs */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="mt-2 rounded-2xl border border-white/[0.06] bg-[#111] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.04]">
                <h3 className="text-sm font-semibold text-white">Especificações</h3>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex items-center px-5 py-3">
                    <span className="w-1/2 text-xs text-zinc-500 font-medium">{key}</span>
                    <span className="w-1/2 text-xs text-zinc-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-white mb-6">Produtos relacionados</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {related.map(p => (
              <Link
                key={p.id}
                href={`/produto/${p.slug}`}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-[#141414] border border-white/[0.06] hover:border-amber-500/25 hover:bg-[#1a1a1a] transition-all"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#111] shrink-0">
                  {p.images[0] && <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="64px" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-amber-400 transition-colors">{p.name}</p>
                  <p className="text-xs text-amber-400 font-medium mt-0.5">{formatCurrency(p.promo_price ?? p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back */}
      <div className="mt-10">
        <Link href="/loja" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-amber-400 transition-colors">
          <ArrowLeft size={16} /> Voltar à loja
        </Link>
      </div>
    </div>
  )
}
