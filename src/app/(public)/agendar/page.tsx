import { Calendar, Shield, Clock, Star } from 'lucide-react'
import { getServices, getStoreConfig } from '@/lib/db'
import { getStoreIdFromHeaders } from '@/lib/store-headers'
import { AgendarClient } from './AgendarClient'

export const revalidate = 60

export default async function AgendarPage() {
  const storeId = await getStoreIdFromHeaders()
  const [allServices, config] = await Promise.all([
    getServices(storeId).catch(() => []),
    getStoreConfig(storeId).catch(() => null),
  ])
  const services = allServices.filter(s => s.is_active)
  const waNumber = config?.whatsapp
    ? `55${config.whatsapp.replace(/\D/g, '')}`
    : '5519981499229'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[#0d0d0d] border-b border-white/[0.04] py-12 sm:py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-semibold text-green-400 mb-4">
            <Calendar size={12} /> Agendamento Online
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Agende seu serviço</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Preencha o formulário abaixo e nossa equipe confirmará em breve. Atendemos de segunda a sábado das 08h às 18h.
          </p>
          <div className="flex items-center justify-center gap-6 mt-5 text-xs text-zinc-600">
            <div className="flex items-center gap-1.5"><Shield size={12} className="text-green-400" /> 90 dias garantia</div>
            <div className="flex items-center gap-1.5"><Clock size={12} className="text-green-400" /> Resposta rápida</div>
            <div className="flex items-center gap-1.5"><Star size={12} className="text-green-400" /> Técnicos certificados</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <AgendarClient storeId={storeId} services={services} waNumber={waNumber} />
      </div>
    </div>
  )
}
