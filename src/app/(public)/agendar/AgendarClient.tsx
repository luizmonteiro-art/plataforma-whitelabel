'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Clock, CheckCircle, ChevronDown, Smartphone, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Service } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  phone: z.string().min(10, 'Telefone inv�lido').max(20),
  service_id: z.string().min(1, 'Selecione um servi�o'),
  device: z.string().min(3, 'Descreva o aparelho'),
  problem: z.string().min(10, 'Descreva o problema (m�n. 10 caracteres)'),
  date: z.string().min(1, 'Selecione a data'),
  time: z.string().min(1, 'Selecione o hor�rio'),
})

type FormData = z.infer<typeof schema>

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
]

function getMinDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function getMaxDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

interface Props {
  services: Service[]
}

export function AgendarClient({ services }: Props) {
  const [submitted, setSubmitted] = useState<FormData | null>(null)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const selectedServiceId = watch('service_id')
  const selectedService = services.find(s => s.id === selectedServiceId)
  const selectedDate = watch('date')
  const selectedTime = watch('time')
  const selectedName = watch('name')
  const selectedPhone = watch('phone')
  const selectedDevice = watch('device')
  const selectedProblem = watch('problem')

  const onSubmit = async (data: FormData) => {
    await new Promise(r => setTimeout(r, 800))
    setSubmitted(data)
  }

  if (submitted) {
    const service = services.find(s => s.id === submitted.service_id)
    const msg = encodeURIComponent(
      `Ol�! Gostaria de confirmar meu agendamento:\n\n` +
      `*Nome:* ${submitted.name}\n` +
      `*Aparelho:* ${submitted.device}\n` +
      `*Servi�o:* ${service?.name}\n` +
      `*Problema:* ${submitted.problem}\n` +
      `*Data:* ${new Date(submitted.date + 'T12:00:00').toLocaleDateString('pt-BR')}\n` +
      `*Hor�rio:* ${submitted.time}`
    )

    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Agendamento recebido!</h2>
        <p className="text-zinc-500 text-sm mb-2">
          {submitted.name}, seu agendamento para <strong className="text-white">{service?.name}</strong> foi registrado para{' '}
          <strong className="text-green-400">{new Date(submitted.date + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> às{' '}
          <strong className="text-green-400">{submitted.time}</strong>.
        </p>
        <p className="text-zinc-600 text-xs mb-8">Nossa equipe entrará em contato para confirmar. Aguarde!</p>
        <a
          href={`https://wa.me/5519981499229?text=${msg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25 text-sm"
        >
          <MessageCircle size={16} />
          Confirmar pelo WhatsApp
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Personal */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.04]">
          <h3 className="text-sm font-semibold text-white">Seus dados</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome completo *</label>
            <input
              {...register('name')}
              placeholder="Jo�o Silva"
              className={cn(
                'w-full bg-[#1a1a1a] border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:bg-[#202020] transition-all',
                errors.name ? 'border-red-500/50 focus:border-red-500/70' : 'border-white/[0.08] focus:border-green-500/40'
              )}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">WhatsApp / Telefone *</label>
            <input
              {...register('phone')}
              placeholder="(11) 99999-9999"
              className={cn(
                'w-full bg-[#1a1a1a] border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:bg-[#202020] transition-all',
                errors.phone ? 'border-red-500/50 focus:border-red-500/70' : 'border-white/[0.08] focus:border-green-500/40'
              )}
            />
            {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>}
          </div>
        </div>
      </div>

      {/* Device + Service */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.04]">
          <h3 className="text-sm font-semibold text-white">Aparelho e servi�o</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Aparelho *</label>
            <div className="relative">
              <Smartphone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                {...register('device')}
                placeholder="Ex: iPhone 13, Samsung Galaxy S23..."
                className={cn(
                  'w-full bg-[#1a1a1a] border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:bg-[#202020] transition-all',
                  errors.device ? 'border-red-500/50' : 'border-white/[0.08] focus:border-green-500/40'
                )}
              />
            </div>
            {errors.device && <p className="text-xs text-red-400 mt-1">{errors.device.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Servi�o desejado *</label>
            <div className="relative">
              <select
                {...register('service_id')}
                className={cn(
                  'w-full bg-[#1a1a1a] border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:bg-[#202020] transition-all appearance-none',
                  errors.service_id ? 'border-red-500/50' : 'border-white/[0.08] focus:border-green-500/40'
                )}
              >
                <option value="">Selecione um servi�o...</option>
                {services.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#1a1a1a]">
                    {s.name} � A partir de R$ {s.price_from}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
            </div>
            {errors.service_id && <p className="text-xs text-red-400 mt-1">{errors.service_id.message}</p>}
            {selectedService && (
              <p className="text-xs text-green-500/70 mt-1 flex items-center gap-1">
                <Clock size={10} /> Tempo estimado: ~{selectedService.duration_minutes} minutos
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Descreva o problema *</label>
            <textarea
              {...register('problem')}
              rows={3}
              placeholder="Ex: A tela trincou e tem uma mancha escura no canto..."
              className={cn(
                'w-full bg-[#1a1a1a] border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:bg-[#202020] transition-all resize-none',
                errors.problem ? 'border-red-500/50' : 'border-white/[0.08] focus:border-green-500/40'
              )}
            />
            {errors.problem && <p className="text-xs text-red-400 mt-1">{errors.problem.message}</p>}
          </div>
        </div>
      </div>

      {/* Date + Time */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.04]">
          <h3 className="text-sm font-semibold text-white">Data e hor�rio</h3>
          <p className="text-xs text-zinc-600 mt-0.5">Atendemos de segunda a s�bado, das 08h �s 18h</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Data *</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="date"
                {...register('date')}
                min={getMinDate()}
                max={getMaxDate()}
                className={cn(
                  'w-full bg-[#1a1a1a] border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:bg-[#202020] transition-all',
                  errors.date ? 'border-red-500/50' : 'border-white/[0.08] focus:border-green-500/40'
                )}
              />
            </div>
            {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Hor�rio *</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {timeSlots.map(slot => {
                const isSelected = watch('time') === slot
                return (
                  <label key={slot} className={cn(
                    'flex items-center justify-center py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all',
                    isSelected
                      ? 'bg-green-500 border-green-500 text-black'
                      : 'bg-[#1a1a1a] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
                  )}>
                    <input type="radio" value={slot} {...register('time')} className="sr-only" />
                    {slot}
                  </label>
                )
              })}
            </div>
            {errors.time && <p className="text-xs text-red-400 mt-1">{errors.time.message}</p>}
          </div>
        </div>
      </div>

      {/* Summary + Submit */}
      {selectedDate && selectedTime && selectedService && selectedName && (
        <div className="rounded-2xl bg-green-500/5 border border-green-500/20 p-4 text-sm">
          <p className="font-semibold text-green-400 mb-2">Resumo do agendamento</p>
          <div className="space-y-1 text-zinc-400 text-xs">
            <p>Servi�o: <span className="text-white font-medium">{selectedService.name}</span></p>
            {selectedDevice && <p>Aparelho: <span className="text-white font-medium">{selectedDevice}</span></p>}
            <p>Data: <span className="text-white font-medium">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span></p>
            <p>Hor�rio: <span className="text-white font-medium">{selectedTime}</span></p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-green-500 hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all hover:shadow-xl hover:shadow-green-500/25 text-sm flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Calendar size={16} />
            Confirmar agendamento
          </>
        )}
      </button>
    </form>
  )
}
