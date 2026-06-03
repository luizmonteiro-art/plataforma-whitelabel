import { MapPin, Clock, Phone, AtSign, MessageCircle, Shield, Star, Users, Wrench } from 'lucide-react'

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
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-5">MM CELL</h1>
          <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
            <p>
              Somos uma loja especializada em iPhones e smartphones, oferecendo aparelhos seminovos e lacrados com procedência garantida, além de assistência técnica especializada.
            </p>
            <p>
              Nossa missão é oferecer tecnologia de qualidade com atendimento próximo, transparente e preços justos. Cada aparelho passa por rigorosa avaliação antes de ser colocado à venda.
            </p>
            <p>
              Nossa equipe de técnicos certificados realiza reparos com peças de qualidade e garantia em todos os serviços, desde trocas simples de bateria até reparos complexos de placa.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="p-4 rounded-2xl bg-[#141414] border border-white/[0.06]">
                <Icon size={18} className="text-green-400 mb-2" />
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact + Hours */}
        <div className="space-y-6">
          {/* Contact Card */}
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
                  <a href="tel:+5511999999999" className="text-xs text-zinc-500 hover:text-green-400 transition-colors">(11) 99999-9999</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <MessageCircle size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">WhatsApp</p>
                  <a
                    href="https://wa.me/5511999999999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
                  >
                    (11) 99999-9999 — Clique para conversar
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                  <AtSign size={14} className="text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Instagram</p>
                  <a
                    href="https://instagram.com/mmcell"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 hover:text-pink-400 transition-colors"
                  >
                    @mmcell
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Hours Card */}
          <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center gap-2">
              <Clock size={14} className="text-green-400" />
              <h3 className="text-sm font-semibold text-white">Horário de funcionamento</h3>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {hours.map(({ day, time }) => {
                const isToday = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase().startsWith(day.toLowerCase().split('-')[0].trim())
                const isClosed = time === 'Fechado'
                return (
                  <div key={day} className={`flex items-center justify-between px-5 py-2.5 ${isToday ? 'bg-green-500/[0.04]' : ''}`}>
                    <span className={`text-xs font-medium ${isToday ? 'text-green-400' : 'text-zinc-400'}`}>
                      {day} {isToday && <span className="text-[10px] text-green-500/70">(hoje)</span>}
                    </span>
                    <span className={`text-xs font-semibold ${isClosed ? 'text-red-400/60' : isToday ? 'text-green-400' : 'text-zinc-300'}`}>
                      {time}
                    </span>
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
