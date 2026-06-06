import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, Phone, AtSign, MessageCircle } from 'lucide-react'

const WA = 'https://wa.me/5519981499229'

export function Footer() {
  return (
    <footer className="bg-[#080808] border-t border-white/[0.06] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/mcelllogo.jpeg" alt="M CELL" height={40} width={40} className="object-contain rounded-lg drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
              <div className="flex flex-col leading-none">
                <span className="text-base font-black text-white tracking-tight">M <span className="text-green-400">CELL</span></span>
                <span className="text-[10px] text-zinc-600 mt-0.5">Celulares & Assistência</span>
              </div>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Sua loja especializada em iPhones e smartphones. Seminovos, lacrados e assistência técnica com garantia.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com/mmcell"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-green-400 hover:border-green-500/30 hover:bg-green-500/10 transition-all active:scale-90"
              >
                <AtSign size={16} />
              </a>
              <a
                href={WA}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all active:scale-90"
              >
                <MessageCircle size={16} />
              </a>
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
                  <Link href={href} className="text-sm text-zinc-500 hover:text-green-400 transition-colors">
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
                  <Link href="/servicos" className="text-sm text-zinc-500 hover:text-green-400 transition-colors">
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
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-zinc-500">Rua das Flores, 123<br />Centro — São Paulo, SP</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-green-500 shrink-0" />
                <a href="tel:+5519981499229" className="text-sm text-zinc-500 hover:text-green-400 transition-colors">
                  (19) 98149-9229
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} className="text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-zinc-500">
                  Seg – Sex: 08h às 18h<br />
                  Sábado: 08h às 13h<br />
                  <span className="text-zinc-600">Domingo: Fechado</span>
                </span>
              </li>
              <li>
                <a
                  href={`${WA}?text=${encodeURIComponent('Olá! Vim pelo site da M CELL.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-medium transition-all active:scale-95"
                >
                  <MessageCircle size={13} /> Falar no WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">© 2024 M CELL. Todos os direitos reservados.</p>
          <p className="text-xs text-zinc-700">Feito com dedicação para você</p>
        </div>
      </div>
    </footer>
  )
}
