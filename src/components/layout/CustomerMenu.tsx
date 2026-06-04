'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Menu, X, Smartphone, Wrench, Calendar, MapPin,
  Phone, MessageCircle, Package, Info, Clock, AtSign, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const WHATSAPP = '5511999999999'

const menuSections = [
  {
    title: 'Loja',
    items: [
      { icon: Smartphone, label: 'iPhones', href: '/loja?categoria=iphone', msg: 'Olá! Quero ver os iPhones disponíveis.' },
      { icon: Smartphone, label: 'Android', href: '/loja?categoria=android', msg: 'Olá! Quero ver os celulares Android.' },
      { icon: Package, label: 'Acessórios', href: '/loja?categoria=capinha', msg: 'Olá! Quero ver os acessórios.' },
      { icon: Package, label: 'Ver todo estoque', href: '/loja', msg: 'Olá! Quero ver todos os produtos disponíveis.' },
    ]
  },
  {
    title: 'Serviços',
    items: [
      { icon: Wrench, label: 'Assistência Técnica', href: '/servicos', msg: 'Olá! Preciso de assistência técnica.' },
      { icon: Calendar, label: 'Agendar Serviço', href: '/agendar', msg: 'Olá! Quero agendar um serviço.' },
    ]
  },
  {
    title: 'Contato',
    items: [
      { icon: Phone, label: '(11) 99999-9999', href: 'tel:+5511999999999', msg: '' },
      { icon: MapPin, label: 'Nossa localização', href: '/sobre', msg: 'Olá! Preciso do endereço da loja.' },
      { icon: Clock, label: 'Seg–Sex 08h–18h', href: '/sobre', msg: '' },
      { icon: AtSign, label: '@mmcell', href: 'https://instagram.com/mmcell', msg: '' },
    ]
  }
]

export function CustomerMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const whatsappHref = (msg: string) =>
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`

  return (
    <div ref={ref} className="relative z-50">
      {/* Botão hamburguer */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200 active:scale-95',
          open
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-white/[0.06] border-white/[0.10] text-zinc-300 hover:text-white hover:bg-white/[0.10]'
        )}
        aria-label="Menu da loja"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
        <span className="hidden sm:inline text-xs font-semibold">Menu</span>
      </button>

      {/* Painel deslizante */}
      {open && (
        <>
          {/* Overlay mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute left-0 top-full mt-2 w-[280px] sm:w-[300px] rounded-2xl bg-[#111] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-1.5 select-none">
                <span className="text-base font-black text-green-400 tracking-tighter drop-shadow-[0_0_8px_rgba(34,197,94,0.7)]">MM</span>
                <span className="text-base font-black text-white tracking-tighter ml-0.5">CELL</span>
              </div>
              <span className="text-[10px] text-zinc-600">Celulares & Assistência</span>
            </div>

            {/* Sections */}
            <div className="max-h-[70vh] overflow-y-auto scroll-hidden">
              {menuSections.map(section => (
                <div key={section.title} className="py-2">
                  <p className="px-4 py-1 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{section.title}</p>
                  {section.items.map(item => {
                    const Icon = item.icon
                    const isExternal = item.href.startsWith('http') || item.href.startsWith('tel')
                    const content = (
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-all group/item">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover/item:border-green-500/20 transition-all">
                          <Icon size={13} className="text-green-400" />
                        </div>
                        <span className="text-xs text-zinc-300 group-hover/item:text-white transition-colors flex-1">{item.label}</span>
                        {item.msg && (
                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(whatsappHref(item.msg), '_blank') }}
                            className="shrink-0 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-90 transition-all"
                            title="Perguntar pelo WhatsApp"
                          >
                            <MessageCircle size={11} />
                          </button>
                        )}
                        {!item.msg && <ChevronRight size={12} className="text-zinc-700 group-hover/item:text-zinc-500 shrink-0" />}
                      </div>
                    )

                    return isExternal ? (
                      <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" onClick={() => setOpen(false)}>
                        {content}
                      </a>
                    ) : (
                      <Link key={item.label} href={item.href} onClick={() => setOpen(false)}>
                        {content}
                      </Link>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* WhatsApp CTA fixo */}
            <div className="p-3 border-t border-white/[0.06]">
              <a
                href={whatsappHref('Olá! Vim pelo site da MM CELL e gostaria de mais informações.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20"
              >
                <MessageCircle size={16} />
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Botão flutuante WhatsApp (canto inferior direito) ── */
export function WhatsAppFloat() {
  const [pulse, setPulse] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <a
      href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Vim pelo site da MM CELL.')}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-5 z-50 group"
      aria-label="Falar no WhatsApp"
    >
      <div className={cn(
        'relative flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-90 rounded-full shadow-xl shadow-emerald-500/30 transition-all duration-300 group-hover:shadow-emerald-500/50',
        pulse ? 'px-4 py-3' : 'p-3.5'
      )}>
        {/* Ping animation */}
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />

        <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>

        {pulse && (
          <span className="text-white text-xs font-bold whitespace-nowrap">Fale conosco</span>
        )}
      </div>
    </a>
  )
}
