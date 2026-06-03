import Link from 'next/link'
import { Monitor, Battery, Plug, HardDrive, Cpu, Sparkles, Camera, Wrench, ArrowRight, Clock, Shield, Star } from 'lucide-react'
import { mockServices } from '@/data/mock'

const iconMap: Record<string, React.ElementType> = {
  Monitor, Battery, Plug, HardDrive, Cpu, Sparkles, Camera, Wrench,
}

const steps = [
  { num: '1', title: 'Agendamento', desc: 'Agende online em menos de 2 minutos' },
  { num: '2', title: 'Recebimento', desc: 'Traga seu aparelho no horário marcado' },
  { num: '3', title: 'Diagnóstico', desc: 'Análise gratuita e orçamento sem surpresas' },
  { num: '4', title: 'Reparo', desc: 'Serviço realizado por técnicos certificados' },
  { num: '5', title: 'Entrega', desc: 'Retire seu aparelho pronto com garantia' },
]

export default function ServicosPage() {
  const services = mockServices.filter(s => s.is_active)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[#0d0d0d] border-b border-white/[0.04] py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-semibold text-green-400 mb-4">
            <Wrench size={12} /> Assistência Técnica
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Nossos serviços</h1>
          <p className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed">
            Técnicos especializados, peças de qualidade e garantia em todos os serviços. Atendemos iPhones, Androids e todos os modelos.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-zinc-500">
            <div className="flex items-center gap-1.5"><Shield size={14} className="text-green-400" /> 90 dias de garantia</div>
            <div className="flex items-center gap-1.5"><Clock size={14} className="text-green-400" /> Mesmo dia</div>
            <div className="flex items-center gap-1.5"><Star size={14} className="text-green-400" /> Peças originais</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-16">
          {services.map(service => {
            const Icon = iconMap[service.icon] ?? Wrench
            const whatsappMsg = encodeURIComponent(`Olá! Tenho interesse no serviço: *${service.name}*. Gostaria de um orçamento.`)

            return (
              <div
                key={service.id}
                className="group flex gap-5 p-6 rounded-2xl bg-[#141414] border border-white/[0.06] hover:border-green-500/25 hover:bg-[#1a1a1a] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 group-hover:bg-green-500/15 transition-colors">
                  <Icon size={22} className="text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-semibold text-white group-hover:text-green-400 transition-colors">{service.name}</h3>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-zinc-600">A partir de</p>
                      <p className="text-sm font-bold text-green-400">R$ {service.price_from}</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed mb-3">{service.description}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 flex items-center gap-1">
                      <Clock size={11} /> ~{service.duration_minutes} min
                    </span>
                    <a
                      href={`https://wa.me/5511999999999?text=${whatsappMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                    >
                      Orçamento pelo WhatsApp <ArrowRight size={11} />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* How it works */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-1">Processo</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Como funciona</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {steps.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-green-500/30">
                  {step.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute left-[calc(50%+20px)] top-5 w-[calc(100%-40px)] h-px bg-gradient-to-r from-green-500/30 to-transparent" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 p-8 sm:p-10 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Pronto para agendar?</h3>
          <p className="text-sm text-zinc-500 mb-6">Leve seu celular para os melhores técnicos da cidade. Horário das 08h às 18h.</p>
          <Link
            href="/agendar"
            className="inline-flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all hover:shadow-xl hover:shadow-green-500/25"
          >
            Agendar serviço <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
