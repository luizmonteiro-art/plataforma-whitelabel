'use client'

import { useState } from 'react'
import { Calendar, CheckCircle, X, Clock, MessageCircle } from 'lucide-react'
import { formatDateTime, appointmentStatusLabel, cn } from '@/lib/utils'
import type { Appointment, AppointmentStatus } from '@/types'

interface Props { initialAppointments: Appointment[] }

export function AgendamentosClient({ initialAppointments }: Props) {
  const [appointments, setAppointments] = useState(initialAppointments)

  const updateStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const statusColors: Record<AppointmentStatus, string> = {
    pendente: 'bg-green-500/20 text-green-400 border-green-500/30',
    confirmado: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
    realizado: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }

  const groups: AppointmentStatus[] = ['pendente', 'confirmado', 'realizado', 'cancelado']

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Agendamentos</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {appointments.filter(a => a.status === 'pendente').length} pendente{appointments.filter(a => a.status === 'pendente').length !== 1 ? 's' : ''} de confirmação
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {groups.map(status => {
          const count = appointments.filter(a => a.status === status).length
          return (
            <div key={status} className="p-4 rounded-2xl bg-[#141414] border border-white/[0.06]">
              <p className="text-2xl font-bold text-white">{count}</p>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border mt-1 inline-block', statusColors[status])}>
                {appointmentStatusLabel[status]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Appointments list */}
      <div className="space-y-3">
        {appointments.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">Nenhum agendamento registrado.</div>
        )}
        {appointments.map(appt => (
          <div
            key={appt.id}
            className={cn(
              'rounded-2xl bg-[#141414] border p-5 transition-all',
              appt.status === 'pendente' ? 'border-green-500/20 bg-green-500/[0.02]' : 'border-white/[0.06]'
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', statusColors[appt.status])}>
                <Calendar size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-white">{appt.customer_name}</p>
                    <p className="text-xs text-zinc-500">{appt.customer_phone}</p>
                  </div>
                  <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full border shrink-0', statusColors[appt.status])}>
                    {appointmentStatusLabel[appt.status]}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-700">Serviço:</span>
                    <span className="text-zinc-300">{appt.service_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-700">Aparelho:</span>
                    <span className="text-zinc-300">{appt.device_info}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-green-500/70" />
                    <span className="text-green-400/80">{formatDateTime(appt.scheduled_at)}</span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-zinc-600 italic">&ldquo;{appt.problem}&rdquo;</p>

                {/* Actions */}
                {appt.status === 'pendente' && (
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => updateStatus(appt.id, 'confirmado')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-medium transition-all"
                    >
                      <CheckCircle size={12} /> Confirmar
                    </button>
                    <button
                      onClick={() => updateStatus(appt.id, 'cancelado')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-medium transition-all"
                    >
                      <X size={12} /> Cancelar
                    </button>
                    <a
                      href={`https://wa.me/55${appt.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${appt.customer_name}! Seu agendamento para ${appt.service_name} foi *confirmado* para ${formatDateTime(appt.scheduled_at)}. Aguardamos você! MM CELL.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-medium transition-all ml-auto"
                    >
                      <MessageCircle size={12} /> Notificar
                    </a>
                  </div>
                )}
                {appt.status === 'confirmado' && (
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => updateStatus(appt.id, 'realizado')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/25 text-purple-400 hover:bg-purple-500/20 rounded-xl text-xs font-medium transition-all"
                    >
                      <CheckCircle size={12} /> Marcar como realizado
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
