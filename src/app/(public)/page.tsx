import Link from 'next/link'
import { Smartphone, Battery, Monitor, Plug, HardDrive, Cpu, Sparkles, Camera, ArrowRight, Star, Shield, Clock, Wrench, CheckCircle } from 'lucide-react'
import { HeroBanner } from '@/components/store/HeroBanner'
import { ProductCard } from '@/components/store/ProductCard'
import { mockBanners, mockProducts, mockServices } from '@/data/mock'

const serviceIconMap: Record<string, React.ElementType> = {
  Monitor, Battery, Plug, HardDrive, Cpu, Sparkles, Camera, Wrench,
}

const categoryCards = [
  { href: '/loja?categoria=iphone', label: 'iPhones', sublabel: 'Apple', icon: '🍎', count: mockProducts.filter(p => p.category === 'iphone').length },
  { href: '/loja?categoria=android', label: 'Android', sublabel: 'Samsung & mais', icon: '🤖', count: mockProducts.filter(p => p.category === 'android').length },
  { href: '/loja?categoria=capinha', label: 'Capinhas', sublabel: 'Cases & covers', icon: '📱', count: mockProducts.filter(p => p.category === 'capinha').length },
  { href: '/loja?categoria=pelicula', label: 'Películas', sublabel: 'Proteção de tela', icon: '🛡️', count: mockProducts.filter(p => p.category === 'pelicula').length },
  { href: '/loja?categoria=carregador', label: 'Carregadores', sublabel: 'Originais & compatíveis', icon: '⚡', count: mockProducts.filter(p => p.category === 'carregador').length },
  { href: '/servicos', label: 'Assistência', sublabel: 'Técnica especializada', icon: '🔧', count: mockServices.length },
]

const benefits = [
  { icon: Shield, label: 'Garantia', desc: '90 dias em todos os serviços' },
  { icon: Star, label: 'Qualidade', desc: 'Peças originais e homologadas' },
  { icon: Clock, label: 'Agilidade', desc: 'Maioria dos reparos no mesmo dia' },
  { icon: CheckCircle, label: 'Confiança', desc: 'Atendimento transparente' },
]

export default function HomePage() {
  const featuredProducts = mockProducts.filter(p => p.is_featured && p.is_active).slice(0, 4)
  const activeBanners = mockBanners.filter(b => b.is_active)
  const activeServices = mockServices.filter(s => s.is_active).slice(0, 6)

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
      <section className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-1">Categorias</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">O que você precisa?</h2>
          </div>
          <Link href="/loja" className="text-sm text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1">
            Ver tudo <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categoryCards.map(({ href, label, sublabel, icon, count }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#141414] border border-white/[0.06] hover:border-green-500/25 hover:bg-[#1a1a1a] transition-all duration-300 hover:-translate-y-1 text-center"
            >
              <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-green-400 transition-colors">{label}</p>
                <p className="text-[10px] sm:text-xs text-zinc-600 hidden sm:block">{sublabel}</p>
              </div>
              <span className="text-[10px] font-medium text-green-500/70">{count} itens</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-6 sm:py-8 bg-[#0d0d0d] border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-1">Destaques</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Produtos em destaque</h2>
            </div>
            <Link href="/loja" className="text-sm text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-1">Assistência Técnica</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Nossos serviços</h2>
          </div>
          <Link href="/servicos" className="text-sm text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
          {activeServices.map((service) => {
            const Icon = serviceIconMap[service.icon] ?? Wrench
            return (
              <Link
                key={service.id}
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
            )
          })}
        </div>

        {/* CTA Banner */}
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
      </section>

      {/* Promotions section — products with promo_price */}
      {mockProducts.some(p => p.promo_price) && (
        <section className="py-6 sm:py-8 bg-[#0d0d0d] border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-1">Promoções</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Ofertas especiais</h2>
              </div>
              <Link href="/loja" className="text-sm text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1">
                Ver todas <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockProducts.filter(p => p.promo_price && p.is_active).slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
