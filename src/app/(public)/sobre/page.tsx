import { MapPin, Clock, Phone, AtSign, MessageCircle, Shield, Star, Users, Wrench } from 'lucide-react'
import { getStoreConfig } from '@/lib/db'

const stats = [
  { icon: Users, value: '500+', label: 'Clientes atendidos' },
  { icon: Wrench, value: '1.200+', label: 'Reparos realizados' },
  { icon: Star, value: '4.9★', label: 'Avaliação média' },
  { icon: Shield, value: '90 dias', label: 'Garantia em serviços' },
]

export const dynamic = 'force-dynamic'

export default async function SobrePage() {
  const config = await getStoreConfig().catch(() => null)

  const storeName  = config?.store_name    ?? 'M CELL'
  const about      = config?.about         ?? 'Somos uma loja especializada em iPhones e smartphones, oferecendo aparelhos seminovos e lacrados com procedência garantida, além de assistência técnica especializada.'
  const address    = config?.address       ?? 'Rua das Flores, 123 — Centro, São Paulo/SP'
  const phone      = config?.phone         ?? '(19) 98149-9229'
  const instagram  = config?.instagram     ?? '@mcell'
  const whatsapp   = config?.whatsapp      ? `55${config.whatsapp.replace(/\D/g, '')}` : '5519981499229'
  const weekday    = config?.hours_weekday ?? '08h – 18h'
  const saturday   = config?.hours_saturday ?? '08h – 13h'

  const WA = `https://wa.me/${whatsapp}`

  const hours = [
    { day: 'Segunda-feira',  time: weekday },
    { day: 'Terça-feira',    time: weekday },
    { day: 'Quarta-feira',   time: weekday },
    { day: 'Quinta-feira',   time: weekday },
    { day: 'Sexta-feira',    time: weekday },
    { day: 'Sábado',         time: saturday },
    { day: 'Domingo',        time: 'Fechado' },
  ]

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* About */}
        <div>
          <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-1">Sobre nós</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-5">{storeName}</h1>
          <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
            <p>{about}</p>
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

          <div className="mt-8">
            <a
              href={`${WA}?text=${encodeURIComponent(`Olá! Preciso de informações sobre a ${storeName}.`)}`}
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
              {address && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Endereço</p>
                    <p className="text-xs text-zinc-500 mt-0.5 whitespace-pre-line">{address}</p>
                  </div>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Telefone</p>
                    <a href={`tel:${phone.replace(/\D/g, '')}`} className="text-xs text-zinc-500 hover:text-green-400 transition-colors">{phone}</a>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <MessageCircle size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">WhatsApp</p>
                  <a href={WA} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors">
                    {phone || whatsapp} — Clique para conversar
                  </a>
                </div>
              </div>
              {instagram && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                    <AtSign size={14} className="text-pink-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Instagram</p>
                    <a
                      href={`https://instagram.com/${instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-500 hover:text-pink-400 transition-colors"
                    >
                      {instagram.startsWith('@') ? instagram : `@${instagram}`}
                    </a>
                  </div>
                </div>
              )}
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
