import Link from 'next/link'
import { Battery, Monitor, Plug, HardDrive, Cpu, Sparkles, Camera, ArrowRight, Star, Shield, Clock, Wrench, CheckCircle, Quote, Zap, Tag } from 'lucide-react'
import { HeroBanner } from '@/components/store/HeroBanner'
import { ProductCard } from '@/components/store/ProductCard'
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/ui/FadeIn'
import { getProducts, getServices, getBanners } from '@/lib/db'
import {
  AppleLogo, AndroidLogo, PhoneCaseLogo,
  ScreenProtectorLogo, ChargerLogo, WrenchToolsLogo
} from '@/components/icons/BrandIcons'

const serviceIconMap: Record<string, React.ElementType> = {
  Monitor, Battery, Plug, HardDrive, Cpu, Sparkles, Camera, Wrench,
}

const categoryIcons: Record<string, React.ReactNode> = {
  iphone: <AppleLogo size={32} className="text-white" />,
  android: <AndroidLogo size={32} className="text-[#3DDC84]" />,
  capinha: <PhoneCaseLogo size={30} className="text-blue-400" />,
  pelicula: <ScreenProtectorLogo size={30} className="text-cyan-400" />,
  carregador: <ChargerLogo size={30} className="text-yellow-400" />,
  assistencia: <WrenchToolsLogo size={30} className="text-orange-400" />,
}

// Contagens são computadas em runtime com dados reais (ver HomePage)
const categoryCardDefs = [
  { href: '/loja?categoria=iphone',    label: 'iPhones',     sublabel: 'Apple',                  iconKey: 'iphone',     categoryKey: 'iphone' },
  { href: '/loja?categoria=android',   label: 'Android',     sublabel: 'Samsung & mais',          iconKey: 'android',    categoryKey: 'android' },
  { href: '/loja?categoria=capinha',   label: 'Capinhas',    sublabel: 'Cases & covers',          iconKey: 'capinha',    categoryKey: 'capinha' },
  { href: '/loja?categoria=pelicula',  label: 'Películas',   sublabel: 'Proteção de tela',        iconKey: 'pelicula',   categoryKey: 'pelicula' },
  { href: '/loja?categoria=carregador',label: 'Carregadores',sublabel: 'Originais & compatíveis', iconKey: 'carregador', categoryKey: 'carregador' },
  { href: '/servicos',                 label: 'Assistência', sublabel: 'Técnica especializada',   iconKey: 'assistencia',categoryKey: null },
] as const

const benefits = [
  { icon: Shield, label: 'Garantia', desc: '90 dias em todos os serviços' },
  { icon: Star, label: 'Qualidade', desc: 'Peças originais e homologadas' },
  { icon: Clock, label: 'Agilidade', desc: 'Maioria dos reparos no mesmo dia' },
  { icon: CheckCircle, label: 'Confiança', desc: 'Atendimento transparente' },
]

const brands = [
  { name: 'Apple', color: 'text-white' },
  { name: 'Samsung', color: 'text-blue-400' },
  { name: 'Motorola', color: 'text-[#5cb8e4]' },
  { name: 'Xiaomi', color: 'text-orange-400' },
  { name: 'Realme', color: 'text-yellow-400' },
  { name: 'ASUS', color: 'text-red-400' },
  { name: 'OnePlus', color: 'text-red-500' },
  { name: 'Google', color: 'text-green-400' },
]

const testimonials = [
  {
    name: 'Amanda Souza',
    avatar: 'AS',
    text: 'Troquei a tela do meu iPhone 14 aqui e ficou perfeito! Atendimento rápido, preço justo e prazo cumprido. Recomendo muito!',
    rating: 5,
    service: 'Troca de tela',
    time: 'há 2 semanas',
  },
  {
    name: 'Carlos Mendes',
    avatar: 'CM',
    text: 'Comprei um iPhone seminovo em ótimo estado, com garantia e nota fiscal. Aparelho exatamente como descrito. Voltarei com certeza!',
    rating: 5,
    service: 'iPhone Seminovo',
    time: 'há 1 mês',
  },
  {
    name: 'Patricia Lima',
    avatar: 'PL',
    text: 'Bateria do meu Android trocada no mesmo dia! Técnico super profissional, explicou tudo certinho. Atendimento 10/10.',
    rating: 5,
    service: 'Troca de bateria',
    time: 'há 3 semanas',
  },
]

// ISR: revalida a cada 60s em vez de renderizar do zero a cada visita.
// Produtos/banners atualizados no admin aparecem em até 1 minuto.
export const revalidate = 60

export default async function HomePage() {
  const [products, services, banners] = await Promise.all([
    getProducts().catch(() => []),
    getServices().catch(() => []),
    getBanners().catch(() => []),
  ])

  const featuredProducts = products.filter(p => p.is_featured && p.is_active).slice(0, 4)
  const activeBanners    = banners.filter(b => b.is_active)
  const activeServices   = services.filter(s => s.is_active).slice(0, 6)
  const promoProducts    = products.filter(p => p.promo_price && p.is_active).slice(0, 4)

  const categoryCards = categoryCardDefs.map(def => ({
    ...def,
    count: def.categoryKey
      ? products.filter(p => p.category === def.categoryKey && p.is_active).length
      : services.length,
  }))

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <HeroBanner banners={activeBanners} />

      {/* Benefits Strip */}
      <div className="border-y border-white/[0.04] bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{label}</p>
                  <p className="text-[11px] text-zinc-600 hidden sm:block">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <section className="py-14 sm:py-16 bg-[#0a0a0a] max-w-full px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-1">Categorias</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">O que você precisa?</h2>
              </div>
              <Link href="/loja" className="text-sm text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1">
                Ver tudo <ArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>
          <div className="flex gap-3 overflow-x-auto scroll-hidden snap-x snap-mandatory pb-2 cursor-grab active:cursor-grabbing">
            {categoryCards.map(({ href, label, sublabel, iconKey, count }) => (
              <Link
                key={href}
                href={href}
                className="group snap-start shrink-0 w-[130px] sm:w-[150px] flex flex-col items-center gap-3 p-4 rounded-2xl bg-[#141414] border border-white/[0.06] hover:border-green-500/30 hover:bg-[#1a1a1a] active:scale-95 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/[0.08] text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center group-hover:scale-110 group-hover:border-green-500/25 active:scale-90 transition-all duration-200">
                  {categoryIcons[iconKey]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-green-400 transition-colors leading-tight">{label}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{sublabel}</p>
                </div>
                <span className="text-[10px] font-medium text-green-500/60 bg-green-500/[0.07] px-2 py-0.5 rounded-full">{count} itens</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-6 sm:py-8 bg-[#0d0d0d] border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-1">Destaques</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Produtos em destaque</h2>
              </div>
              <Link href="/loja" className="text-sm text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1">
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>
          <StaggerChildren className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Brands marquee */}
      <div className="py-8 bg-[#0a0a0a] border-b border-white/[0.04] overflow-hidden">
        <div className="flex">
          <div className="marquee-track flex items-center gap-12 whitespace-nowrap">
            {[...brands, ...brands].map(({ name, color }, i) => (
              <span key={i} className={`text-sm font-bold tracking-widest uppercase opacity-30 hover:opacity-70 transition-opacity cursor-default ${color}`}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Services */}
      <section className="py-14 sm:py-16 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-1">Assistência Técnica</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Nossos serviços</h2>
              </div>
              <Link href="/servicos" className="text-sm text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1">
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>
          <StaggerChildren className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
            {activeServices.map((service) => {
              const Icon = serviceIconMap[service.icon] ?? Wrench
              return (
                <StaggerItem key={service.id}>
                  <Link
                    href="/agendar"
                    className="group flex items-start gap-4 p-5 rounded-2xl bg-[#141414] border border-white/[0.06] hover:border-green-500/25 hover:bg-[#1a1a1a] transition-all duration-300 hover:shadow-lg hover:shadow-green-500/[0.06]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 group-hover:bg-green-500/15 transition-colors">
                      <Icon size={18} className="text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors mb-0.5 truncate">{service.name}</h3>
                      <p className="text-xs text-zinc-600 line-clamp-2 hidden sm:block">{service.description}</p>
                      <p className="text-xs font-medium text-green-500/80 mt-1">A partir de R$ {service.price_from}</p>
                    </div>
                  </Link>
                </StaggerItem>
              )
            })}
          </StaggerChildren>

          {/* CTA Banner */}
          <FadeIn>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 p-8 sm:p-10">
              <div className="absolute inset-0 shimmer opacity-50" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-green-400" />
                    <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Agendamento Online</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Seu celular merece o melhor cuidado</h3>
                  <p className="text-sm text-zinc-500">Agende seu serviço em minutos, horário 08h às 18h, atendimento especializado.</p>
                </div>
                <Link
                  href="/agendar"
                  className="shrink-0 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all hover:shadow-xl hover:shadow-green-500/25 text-sm flex items-center gap-2"
                >
                  Agendar agora <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Promotions */}
      {promoProducts.length > 0 && (
        <section className="py-6 sm:py-8 bg-[#0d0d0d] border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <FadeIn>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-1">Promoções</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Ofertas especiais</h2>
                </div>
                <Link href="/loja" className="text-sm text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1">
                  Ver todas <ArrowRight size={14} />
                </Link>
              </div>
            </FadeIn>
            <StaggerChildren className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {promoProducts.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </section>
      )}

      {/* Novidades */}
      <section className="py-14 sm:py-16 bg-[#0d0d0d] border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={12} className="text-green-400" />
                  <p className="text-xs font-semibold text-green-500 uppercase tracking-widest">Feed da Loja</p>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Novidades</h2>
                <p className="text-sm text-zinc-500 mt-1">Últimas chegadas, ofertas e destaques da M CELL</p>
              </div>
              <Link href="/loja" className="text-sm text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1">
                Ver tudo <ArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>

          <StaggerChildren className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              ...products.filter(p => p.is_active && p.condition === 'lacrado').slice(0, 2),
              ...products.filter(p => p.is_active && p.promo_price).slice(0, 2),
              ...products.filter(p => p.is_active && p.condition === 'seminovo').slice(0, 2),
              ...products.filter(p => p.is_active && p.category === 'acessorio').slice(0, 2),
            ].slice(0, 8).map((product) => {
              const isPromo = !!product.promo_price
              const isNew = product.condition === 'lacrado'
              const tagLabel = isPromo ? 'Promoção' : isNew ? 'Novo' : 'Seminovo'
              const tagStyle = isPromo
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : isNew
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              return (
                <StaggerItem key={product.id}>
                  <Link
                    href={`/produto/${product.slug}`}
                    className="group block rounded-2xl overflow-hidden bg-[#141414] border border-white/[0.06] hover:border-green-500/25 hover:shadow-xl hover:shadow-green-500/[0.06] transition-all duration-300"
                  >
                    {/* Imagem */}
                    <div className="relative aspect-square overflow-hidden bg-[#111]">
                      {product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Tag */}
                      <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm flex items-center gap-1 ${tagStyle}`}>
                        <Tag size={8} /> {tagLabel}
                      </span>
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <p className="text-xs font-semibold text-white group-hover:text-green-400 transition-colors line-clamp-2 leading-snug">{product.name}</p>
                      <div className="flex items-baseline gap-1.5 mt-1.5">
                        <span className="text-sm font-black text-green-400">
                          {product.promo_price
                            ? `R$ ${product.promo_price.toLocaleString('pt-BR')}`
                            : `R$ ${product.price.toLocaleString('pt-BR')}`}
                        </span>
                        {product.promo_price && (
                          <span className="text-[10px] text-zinc-600 line-through">R$ {product.price.toLocaleString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              )
            })}
          </StaggerChildren>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14 sm:py-16 bg-[#0a0a0a] border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-1">Avaliações</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">O que nossos clientes dizem</h2>
              <div className="flex items-center justify-center gap-1 mt-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
                <span className="text-sm text-zinc-500 ml-2">4.9 · +200 avaliações</span>
              </div>
            </div>
          </FadeIn>

          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <StaggerItem key={t.name}>
                <div className="relative flex flex-col gap-4 p-6 rounded-2xl bg-[#141414] border border-white/[0.06] hover:border-green-500/20 transition-all duration-300 h-full">
                  <Quote size={20} className="text-green-500/30 absolute top-5 right-5" />
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-green-400">{t.avatar}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{t.name}</p>
                      <p className="text-[10px] text-zinc-600">{t.service} · {t.time}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>
    </div>
  )
}
