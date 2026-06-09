import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, Phone, AtSign, MessageCircle, Store } from 'lucide-react'
import type { Brand } from '@/lib/brand'
import { waLink } from '@/lib/brand'

export function Footer({ brand }: { brand: Brand }) {
  const hasWa = !!brand.whatsapp
  return (
    <footer className="bg-[#080808] border-t border-white/[0.06] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {brand.logoUrl ? (
                <Image src={brand.logoUrl} alt={brand.name} height={40} width={40} className="object-contain rounded-lg" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                  <Store size={18} className="text-[var(--accent)]" />
                </span>
              )}
              <div className="flex flex-col leading-none">
                <span className="text-base font-black text-white tracking-tight">{brand.name}</span>
                <span className="text-[10px] text-zinc-600 mt-0.5">Celulares & Assistência</span>
              </div>
            </div>
            {brand.about && (
              <p className="text-sm text-zinc-500 leading-relaxed">{brand.about}</p>
            )}
            <div className="flex items-center gap-3">
              {brand.instagramUrl && (
                <a
                  href={brand.instagramUrl}
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/10 transition-all active:scale-90"
                >
                  <AtSign size={16} />
                </a>
              )}
              {hasWa && (
                <a
                  href={waLink(brand)}
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/10 transition-all active:scale-90"
                >
                  <MessageCircle size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Navegação */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Navegação</h3>
            <ul className="space-y-2">
              {[
                { href: '/loja', label: 'Loja' },
                { href: '/loja?categoria=iphone', label: 'iPhones' },
                { href: '/loja?categoria=android', label: 'Android' },
                { href: '/loja?categoria=capinha', label: 'Acessórios' },
                { href: '/servicos', label: 'Serviços' },
                { href: '/agendar', label: 'Agendamento' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-zinc-500 hover:text-[var(--accent)] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Serviços */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Serviços</h3>
            <ul className="space-y-2">
              {['Troca de Tela', 'Troca de Bateria', 'Reparo de Conector', 'Desbloqueio', 'Recuperação de Dados', 'Reparo de Placa'].map((s) => (
                <li key={s}>
                  <Link href="/servicos" className="text-sm text-zinc-500 hover:text-[var(--accent)] transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Contato</h3>
            <ul className="space-y-3">
              {brand.address && (
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                  <span className="text-sm text-zinc-500">{brand.address}</span>
                </li>
              )}
              {brand.phone && (
                <li className="flex items-center gap-3">
                  <Phone size={16} className="text-[var(--accent)] shrink-0" />
                  <a href={`tel:${brand.phone.replace(/[^\d+]/g, '')}`} className="text-sm text-zinc-500 hover:text-[var(--accent)] transition-colors">
                    {brand.phone}
                  </a>
                </li>
              )}
              {(brand.hoursWeekday || brand.hoursSaturday) && (
                <li className="flex items-start gap-3">
                  <Clock size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                  <span className="text-sm text-zinc-500">
                    {brand.hoursWeekday && <>Seg – Sex: {brand.hoursWeekday}<br /></>}
                    {brand.hoursSaturday && <>Sábado: {brand.hoursSaturday}<br /></>}
                    <span className="text-zinc-600">Domingo: Fechado</span>
                  </span>
                </li>
              )}
              {brand.whatsapp && (
                <li>
                  <a
                    href={waLink(brand, `Olá! Vim pelo site da ${brand.name}.`)}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-[var(--accent)] hover:bg-[var(--accent)]/20 rounded-xl text-xs font-medium transition-all active:scale-95"
                  >
                    <MessageCircle size={13} /> Falar no WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} {brand.name}. Todos os direitos reservados.</p>
          <p className="text-xs text-zinc-700">Feito com dedicação para você</p>
        </div>
      </div>
    </footer>
  )
}
