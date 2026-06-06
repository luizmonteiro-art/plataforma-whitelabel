import { MapPin, Clock, Phone, AtSign, MessageCircle, Shield, Star, Users, Wrench } from 'lucide-react'

const WA = 'https://wa.me/5519981499229'

const stats = [
  { icon: Users, value: '500+', label: 'Clientes atendidos' },
  { icon: Wrench, value: '1.200+', label: 'Reparos realizados' },
  { icon: Star, value: '4.9★', label: 'Avaliação média' },
  { icon: Shield, value: '90 dias', label: 'Garantia em serviços' },
]

const hours = [
  { day: 'Segunda-feira', time: '08h – 18h' },
  { day: 'Terça-feira', time: '08h – 18h' },
  { day: 'Quarta-feira', time: '08h – 18h' },
  { day: 'Quinta-feira', time: '08h – 18h' },
  { day: 'Sexta-feira', time: '08h – 18h' },
  { day: 'Sábado', time: '08h – 13h' },
  { day: 'Domingo', time: 'Fechado' },
]

export default function SobrePage() {
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* About */}
        <div>
          <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-1">Sobre nós</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-5">M CELL</h1>
          <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
            <p>Somos uma loja especializada em iPhones e smartphones, oferecendo aparelhos seminovos e lacrados com procedência garantida, além de assistência técnica especializada.</p>
            <p>Nossa missão é oferecer tecnologia de qualidade com atendimento próximo, transparente e preços justos. Cada aparelho passa por rigorosa avaliação antes de ser colocado à venda.</p>
            <p>Nossa equipe de técnicos certificados realiza reparos com peças de qualidade e garantia em todos os serviços, desde trocas simples de bateria até reparos complexos de placa.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="p-4 rounded-2xl bg-[#141414] border border-white/[0.06]">
                <Icon size={18} className="text-green-400 mb-2" />
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <div className="mt-8">
            <a
              href={`${WA}?text=${encodeURIComponent('Olá! Preciso de informações sobre a M CELL.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
            >
              <MessageCircle size={16} />
              Falar no WhatsApp
            </a>
          </div>
        </div>

        {/* Contact + Hours */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.04]">
              <h3 className="text-sm font-semibold text-white">Contato e localização</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <MapPin size={14} className="text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Endereço</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Rua das Flores, 123 — Centro<br />São Paulo, SP — 01310-100</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Phone size={14} className="text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Telefone</p>
                  <a href="tel:+5519981499229" className="text-xs text-zinc-500 hover:text-green-400 transition-colors">(19) 98149-9229</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <MessageCircle size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">WhatsApp</p>
                  <a href={WA} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors">
                    (19) 98149-9229 — Clique para conversar
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                  <AtSign size={14} className="text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Instagram</p>
                  <a href="https://instagram.com/mmcell" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-pink-400 transition-colors">
                    @mmcell
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center gap-2">
              <Clock size={14} className="text-green-400" />
              <h3 className="text-sm font-semibold text-white">Horário de funcionamento</h3>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {hours.map(({ day, time }) => {
                const isClosed = time === 'Fechado'
                return (
                  <div key={day} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-xs font-medium text-zinc-400">{day}</span>
                    <span className={`text-xs font-semibold ${isClosed ? 'text-red-400/60' : 'text-zinc-300'}`}>{time}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
