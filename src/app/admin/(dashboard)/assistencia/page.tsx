'use client'

import { useState } from 'react'
import {
  Plus, Search, Edit2, Trash2, X, ArrowLeft, ChevronDown,
  Monitor, Battery, Plug, Unlock, HardDrive, Cpu, Sparkles, Camera,
  Wrench, Shield, Zap, Wifi, Volume2, Smartphone, Clock, DollarSign,
  ToggleLeft, ToggleRight, Eye, EyeOff,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useServices } from '@/contexts/AdminStore'
import { upsertService, deleteService } from '@/lib/db'
import { formatCurrency, cn } from '@/lib/utils'
import type { Service } from '@/types'

// ── Ícones disponíveis para serviço ──────────────────────────────────────────
const ICONS: { key: string; label: string; component: React.ElementType }[] = [
  { key: 'Monitor',    label: 'Tela',        component: Monitor },
  { key: 'Battery',   label: 'Bateria',      component: Battery },
  { key: 'Plug',      label: 'Conector',     component: Plug },
  { key: 'Unlock',    label: 'Desbloqueio',  component: Unlock },
  { key: 'HardDrive', label: 'Dados',        component: HardDrive },
  { key: 'Cpu',       label: 'Placa',        component: Cpu },
  { key: 'Sparkles',  label: 'Higienização', component: Sparkles },
  { key: 'Camera',    label: 'Câmera',       component: Camera },
  { key: 'Wrench',    label: 'Reparo',       component: Wrench },
  { key: 'Shield',    label: 'Garantia',     component: Shield },
  { key: 'Zap',       label: 'Elétrico',     component: Zap },
  { key: 'Wifi',      label: 'Rede/Wifi',    component: Wifi },
  { key: 'Volume2',   label: 'Som',          component: Volume2 },
  { key: 'Smartphone',label: 'Geral',        component: Smartphone },
]

function ServiceIcon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const found = ICONS.find(i => i.key === name)
  if (!found) return <Wrench size={size} className={className} />
  const Icon = found.component
  return <Icon size={size} className={className} />
}

const emptyForm: Omit<Service, 'id'> = {
  name: '',
  description: '',
  price_from: 0,
  duration_minutes: 60,
  is_active: true,
  icon: 'Wrench',
}

export default function AssistenciaPage() {
  const router = useRouter()
  const [services, setServicesRaw] = useServices()
  const setServices = (fn: (prev: Service[]) => Service[]) => setServicesRaw(fn)

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [form, setForm] = useState<Omit<Service, 'id'>>(emptyForm)
  const [priceInput, setPriceInput] = useState('')
  const [durationInput, setDurationInput] = useState('60')
  const [filterActive, setFilterActive] = useState<'todos' | 'ativo' | 'inativo'>('todos')

  const filtered = services.filter(s => {
    if (filterActive === 'ativo' && !s.is_active) return false
    if (filterActive === 'inativo' && s.is_active) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    }
    return true
  })

  const openNew = () => {
    setForm(emptyForm)
    setPriceInput('')
    setDurationInput('60')
    setEditService(null)
    setShowForm(true)
  }

  const openEdit = (s: Service) => {
    setForm({ name: s.name, description: s.description, price_from: s.price_from, duration_minutes: s.duration_minutes, is_active: s.is_active, icon: s.icon })
    setPriceInput(String(s.price_from))
    setDurationInput(String(s.duration_minutes))
    setEditService(s)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    const data: Omit<Service, 'id'> = {
      ...form,
      price_from: Number(priceInput) || 0,
      duration_minutes: Number(durationInput) || 60,
    }
    if (editService) {
      const updated = { ...editService, ...data }
      await upsertService(updated).catch(console.error)
      setServices(prev => prev.map(s => s.id === editService.id ? updated : s))
    } else {
      const saved = await upsertService(data).catch(() => null)
      const newService: Service = saved ?? { id: String(Date.now()), ...data }
      setServices(prev => [...prev, newService])
    }
    setShowForm(false)
  }

  const toggleActive = async (id: string) => {
    const service = services.find(s => s.id === id)
    if (!service) return
    const is_active = !service.is_active
    await upsertService({ id, is_active }).catch(console.error)
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_active } : s))
  }

  const handleDelete = async (id: string) => {
    if (confirm('Remover este serviço do catálogo?')) {
      await deleteService(id).catch(console.error)
      setServices(prev => prev.filter(s => s.id !== id))
    }
  }

  const inputCls = 'w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 transition-all'

  const activeCount = services.filter(s => s.is_active).length

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="space-y-1">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-white transition-colors group">
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Voltar
        </button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Serviços de Assistência</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {activeCount} ativo{activeCount !== 1 ? 's' : ''} · {services.length} total — aparecem no site para agendamento
            </p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-400 active:scale-95 text-black font-semibold rounded-xl transition-all text-sm hover:shadow-lg hover:shadow-green-500/25">
            <Plus size={16} /> Novo serviço
          </button>
        </div>
      </div>

      {/* KPI rápido */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-white/[0.06] text-center">
          <p className="text-2xl font-black text-white">{services.length}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Total de serviços</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-green-500/20 text-center">
          <p className="text-2xl font-black text-green-400">{activeCount}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Ativos no site</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-white/[0.06] text-center">
          <p className="text-2xl font-black text-white">
            {services.length > 0 ? formatCurrency(Math.min(...services.map(s => s.price_from))) : '—'}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Menor preço</p>
        </div>
      </div>

      {/* Busca + filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar serviço..."
            className="w-full bg-[#141414] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 transition-all" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"><X size={13} /></button>}
        </div>
        {(['todos', 'ativo', 'inativo'] as const).map(f => (
          <button key={f} onClick={() => setFilterActive(f)}
            className={cn('px-3 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95',
              filterActive === f ? 'bg-green-500 border-green-500 text-black' : 'bg-[#141414] border-white/[0.08] text-zinc-400 hover:text-white')}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista de serviços */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">Nenhum serviço encontrado.</div>
        )}
        {filtered.map(service => (
          <div
            key={service.id}
            className={cn(
              'group relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200',
              'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40',
              service.is_active
                ? 'bg-[#141414] border-white/[0.06] hover:border-green-500/20'
                : 'bg-[#0f0f0f] border-white/[0.04] opacity-60'
            )}
          >
            {/* Ícone */}
            <div className={cn(
              'w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all',
              service.is_active
                ? 'bg-green-500/10 border-green-500/20 group-hover:bg-green-500/15'
                : 'bg-zinc-500/10 border-zinc-500/20'
            )}>
              <ServiceIcon name={service.icon} size={20} className={service.is_active ? 'text-green-400' : 'text-zinc-500'} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white">{service.name}</p>
                {!service.is_active && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-500/20 text-zinc-500 border border-zinc-500/30">Inativo</span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{service.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <DollarSign size={11} className="text-green-400" />
                  A partir de <span className="font-semibold text-green-400 ml-1">{formatCurrency(service.price_from)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-600">
                  <Clock size={11} />
                  {service.duration_minutes < 60
                    ? `${service.duration_minutes} min`
                    : `${Math.floor(service.duration_minutes / 60)}h${service.duration_minutes % 60 > 0 ? ` ${service.duration_minutes % 60}min` : ''}`
                  }
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle ativo/inativo */}
              <button
                onClick={() => toggleActive(service.id)}
                title={service.is_active ? 'Desativar no site' : 'Ativar no site'}
                className={cn(
                  'p-2 rounded-xl border transition-all active:scale-90',
                  service.is_active
                    ? 'text-green-400 bg-green-500/10 border-green-500/25 hover:bg-green-500/20'
                    : 'text-zinc-600 bg-white/[0.04] border-white/[0.08] hover:text-green-400'
                )}
              >
                {service.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button onClick={() => openEdit(service)}
                className="p-2 rounded-xl text-zinc-600 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/25 active:scale-90 transition-all">
                <Edit2 size={15} />
              </button>
              <button onClick={() => handleDelete(service.id)}
                className="p-2 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/25 active:scale-90 transition-all">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info sobre visibilidade */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/[0.04] border border-green-500/15">
        <Eye size={14} className="text-green-400 shrink-0" />
        <p className="text-xs text-zinc-500">
          Serviços <span className="text-green-400 font-medium">ativos</span> aparecem na página{' '}
          <span className="text-white font-medium">/servicos</span> e no formulário de agendamento do site.
          Desativar um serviço o esconde do cliente sem apagá-lo.
        </p>
      </div>

      {/* ═══════════ MODAL NOVO / EDITAR ═══════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
              <h3 className="text-sm font-semibold text-white">
                {editService ? `Editar: ${editService.name}` : 'Novo serviço'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90"><X size={16} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Nome */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome do serviço *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Troca de Tela"
                  className={inputCls}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Descrição (aparece no site)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descreva o serviço, o que inclui, garantia..."
                  rows={3}
                  className={inputCls + ' resize-none'}
                />
              </div>

              {/* Preço + duração */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Preço a partir de (R$) *
                  </label>
                  <div className="relative">
                    <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400" />
                    <input
                      type="number" min="0" step="1"
                      value={priceInput}
                      onChange={e => setPriceInput(e.target.value)}
                      placeholder="249"
                      className={inputCls + ' pl-8'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Duração estimada (min)
                  </label>
                  <div className="relative">
                    <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="number" min="15" step="15"
                      value={durationInput}
                      onChange={e => setDurationInput(e.target.value)}
                      placeholder="60"
                      className={inputCls + ' pl-8'}
                    />
                  </div>
                  {Number(durationInput) >= 60 && (
                    <p className="text-[10px] text-zinc-600 mt-1">
                      ≈ {Math.floor(Number(durationInput) / 60)}h{Number(durationInput) % 60 > 0 ? ` ${Number(durationInput) % 60}min` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Seletor de ícone */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Ícone do serviço</label>
                <div className="grid grid-cols-7 gap-2">
                  {ICONS.map(({ key, label, component: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, icon: key }))}
                      title={label}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-xl border transition-all active:scale-90',
                        form.icon === key
                          ? 'bg-green-500/15 border-green-500/40 text-green-400'
                          : 'bg-[#1a1a1a] border-white/[0.08] text-zinc-500 hover:text-white hover:border-white/20'
                      )}
                    >
                      <Icon size={18} />
                      <span className="text-[8px] leading-none">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status ativo */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a1a] border border-white/[0.06]">
                <div>
                  <p className="text-sm font-medium text-white">Visível no site</p>
                  <p className="text-xs text-zinc-600 mt-0.5">Clientes podem ver e agendar este serviço</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className="transition-all active:scale-90"
                >
                  {form.is_active
                    ? <ToggleRight size={36} className="text-green-400" />
                    : <ToggleLeft size={36} className="text-zinc-600" />
                  }
                </button>
              </div>

              {/* Preview */}
              <div className="rounded-xl bg-[#111] border border-white/[0.04] p-4">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-3">Preview no site</p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                    <ServiceIcon name={form.icon} size={18} className="text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{form.name || 'Nome do serviço'}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{form.description || 'Descrição aparecerá aqui...'}</p>
                    <p className="text-xs text-green-400 font-semibold mt-1.5">
                      A partir de {priceInput ? formatCurrency(Number(priceInput)) : 'R$ 0,00'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] active:scale-95 transition-all">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 active:scale-95 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all"
              >
                {editService ? 'Salvar alterações' : 'Criar serviço'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
