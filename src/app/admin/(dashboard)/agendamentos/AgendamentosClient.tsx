'use client'

import { useState } from 'react'
import { Calendar, CheckCircle, X, Clock, MessageCircle, Star, ArrowLeft, AlertTriangle, Edit2, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDateTime, appointmentStatusLabel, cn } from '@/lib/utils'
import { useAppointments } from '@/contexts/AdminStore'
import type { Appointment, AppointmentStatus } from '@/types'

interface Props { initialAppointments: Appointment[] }

const statusColors: Record<AppointmentStatus, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmado: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
  realizado: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const timeSlots = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']

export function AgendamentosClient({ initialAppointments: _ }: Props) {
  const router = useRouter()
  const [appointments, setAppointmentsRaw] = useAppointments()
  const setAppointments = (fn: (prev: Appointment[]) => Appointment[]) => setAppointmentsRaw(fn)
  const [prioritized, setPrioritized] = useState<string[]>([])
  const [editAppt, setEditAppt] = useState<Appointment | null>(null)
  const [filter, setFilter] = useState<AppointmentStatus | 'todos'>('todos')

  const updateStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const togglePriority = (id: string) => {
    setPrioritized(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const saveEdit = () => {
    if (!editAppt) return
    setAppointments(prev => prev.map(a => a.id === editAppt.id ? editAppt : a))
    setEditAppt(null)
  }

  const groups: AppointmentStatus[] = ['pendente', 'confirmado', 'realizado', 'cancelado']

  const filtered = appointments.filter(a => filter === 'todos' || a.status === filter)
  const sorted = [...filtered].sort((a, b) => {
    const ap = prioritized.includes(a.id) ? 1 : 0
    const bp = prioritized.includes(b.id) ? 1 : 0
    return bp - ap
  })

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="space-y-1">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-white transition-colors group">
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Voltar
        </button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Agendamentos</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {appointments.filter(a => a.status === 'pendente').length} pendente{appointments.filter(a => a.status === 'pendente').length !== 1 ? 's' : ''} · {prioritized.length} priorizado{prioritized.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {groups.map(status => {
          const count = appointments.filter(a => a.status === status).length
          return (
            <button
              key={status}
              onClick={() => setFilter(prev => prev === status ? 'todos' : status)}
              className={cn(
                'p-4 rounded-2xl bg-[#141414] border transition-all text-left',
                filter === status ? 'border-green-500/40 bg-green-500/5' : 'border-white/[0.06] hover:border-white/[0.12]'
              )}
            >
              <p className="text-2xl font-bold text-white">{count}</p>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border mt-1 inline-block', statusColors[status])}>
                {appointmentStatusLabel[status]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filter active indicator */}
      {filter !== 'todos' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Filtrando por:</span>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', statusColors[filter])}>
            {appointmentStatusLabel[filter]}
          </span>
          <button onClick={() => setFilter('todos')} className="text-xs text-zinc-600 hover:text-white transition-colors flex items-center gap-1">
            <X size={11} /> Limpar
          </button>
        </div>
      )}

      {/* Cards list */}
      <div className="space-y-3">
        {sorted.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">Nenhum agendamento encontrado.</div>
        )}
        {sorted.map(appt => {
          const isPriority = prioritized.includes(appt.id)
          return (
            <div
              key={appt.id}
              className={cn(
                'rounded-2xl bg-[#141414] border p-5 transition-all',
                isPriority ? 'border-yellow-500/30 bg-yellow-500/[0.02]' :
                appt.status === 'pendente' ? 'border-yellow-500/20 bg-yellow-500/[0.01]' : 'border-white/[0.06]'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', statusColors[appt.status])}>
                  <Calendar size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{appt.customer_name}</p>
                      {isPriority && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 px-1.5 py-0.5 rounded-full">
                          <Star size={9} className="fill-yellow-400" /> Prioritário
                        </span>
                      )}
                    </div>
                    <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full border shrink-0', statusColors[appt.status])}>
                      {appointmentStatusLabel[appt.status]}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{appt.customer_phone}</p>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-500">
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

                  {/* Ações */}
                  <div className="flex items-center flex-wrap gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                    {/* Aceitar/Confirmar */}
                    {(appt.status === 'pendente') && (
                      <button onClick={() => updateStatus(appt.id, 'confirmado')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-medium transition-all active:scale-90">
                        <CheckCircle size={12} /> Aceitar
                      </button>
                    )}

                    {/* Recusar/Cancelar */}
                    {appt.status !== 'cancelado' && appt.status !== 'realizado' && (
                      <button onClick={() => updateStatus(appt.id, 'cancelado')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-medium transition-all active:scale-90">
                        <X size={12} /> {appt.status === 'pendente' ? 'Recusar' : 'Cancelar'}
                      </button>
                    )}

                    {/* Marcar como realizado */}
                    {appt.status === 'confirmado' && (
                      <button onClick={() => updateStatus(appt.id, 'realizado')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/25 text-purple-400 hover:bg-purple-500/20 rounded-xl text-xs font-medium transition-all active:scale-90">
                        <CheckCircle size={12} /> Realizado
                      </button>
                    )}

                    {/* Priorizar */}
                    {appt.status !== 'cancelado' && appt.status !== 'realizado' && (
                      <button onClick={() => togglePriority(appt.id)}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-90',
                          isPriority
                            ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-white/[0.04] border-white/[0.08] text-zinc-500 hover:text-yellow-400 hover:border-yellow-500/30'
                        )}>
                        <Star size={12} className={isPriority ? 'fill-yellow-400' : ''} />
                        {isPriority ? 'Priorizado' : 'Priorizar'}
                      </button>
                    )}

                    {/* Alterar horário */}
                    {appt.status !== 'cancelado' && appt.status !== 'realizado' && (
                      <button onClick={() => setEditAppt(appt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20 rounded-xl text-xs font-medium transition-all active:scale-90">
                        <Edit2 size={12} /> Alterar
                      </button>
                    )}

                    {/* Notificar WhatsApp */}
                    <a
                      href={`https://wa.me/55${appt.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${appt.customer_name}! Seu agendamento para ${appt.service_name} foi *${appointmentStatusLabel[appt.status]}* para ${formatDateTime(appt.scheduled_at)}. M CELL.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-medium transition-all ml-auto active:scale-90">
                      <MessageCircle size={12} /> Notificar
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Alterar agendamento */}
      {editAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Alterar agendamento</h3>
              <button onClick={() => setEditAppt(null)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-zinc-500 mb-3">{editAppt.customer_name} · {editAppt.service_name}</p>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nova data</label>
                <input
                  type="date"
                  value={editAppt.scheduled_at.split('T')[0]}
                  onChange={e => setEditAppt(prev => prev ? { ...prev, scheduled_at: e.target.value + 'T' + editAppt.scheduled_at.split('T')[1] } : null)}
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Novo horário</label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map(slot => (
                    <label key={slot} className={cn(
                      'flex items-center justify-center py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all',
                      editAppt.scheduled_at.includes(slot)
                        ? 'bg-green-500 border-green-500 text-black'
                        : 'bg-[#1a1a1a] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
                    )}>
                      <input type="radio" name="time" value={slot} className="sr-only"
                        onChange={() => setEditAppt(prev => prev ? { ...prev, scheduled_at: editAppt.scheduled_at.split('T')[0] + 'T' + slot + ':00' } : null)} />
                      {slot}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
                <div className="relative">
                  <select
                    value={editAppt.status}
                    onChange={e => setEditAppt(prev => prev ? { ...prev, status: e.target.value as AppointmentStatus } : null)}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none"
                  >
                    {groups.map(s => <option key={s} value={s}>{appointmentStatusLabel[s]}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setEditAppt(null)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] active:scale-95 transition-all">Cancelar</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 active:scale-95 text-black font-semibold rounded-xl text-sm transition-all">Salvar alterações</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
