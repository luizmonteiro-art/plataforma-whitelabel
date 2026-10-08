'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight, AlertTriangle, Check, CheckCircle2, Clock, Copy, ExternalLink,
  FileText, Inbox, KeyRound, Loader2, LogOut, MessageCircle, Plus,
  Power, Search, Settings2, Store, Trash2, X,
} from 'lucide-react'
import { PLANS } from '@/lib/plans'
import { ModsLogo } from '@/components/brand/ModsLogo'
import {
  addRequestInternalNote,
  createStore,
  deleteRequest,
  deleteStore,
  resetStorePassword,
  setStoreActive,
  updateRequestStatus,
  type CreateStoreInput,
  type RequestRow,
  type StoreRow,
} from './actions'

function storeHref(slug: string): string {
  return `/?store=${encodeURIComponent(slug)}`
}

function storeSlug(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function adminLoginUrl(slug: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/admin/login?store=${encodeURIComponent(slug)}`
}

function whatsappDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.startsWith('55') && (digits.length === 12 || digits.length === 13)
    ? digits
    : `55${digits}`
}

function firstStoreConfig(store: StoreRow): { store_name?: string | null; whatsapp?: string | null; accent_color?: string | null } | null {
  if (!store.store_config) return null
  return Array.isArray(store.store_config) ? (store.store_config[0] ?? null) : store.store_config
}

const REQUEST_STATUS: Record<string, { label: string; cls: string }> = {
  novo: { label: 'Novo', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  qualificado: { label: 'Qualificado', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  proposta: { label: 'Proposta', cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  aguardando_pagto: { label: 'Aguard. pagto', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  implantacao: { label: 'Implantacao', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  pendente: { label: 'Pendente', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  em_contato: { label: 'Em contato', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  provisionado: { label: 'Provisionado', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  ativo: { label: 'Ativo', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  pausado: { label: 'Pausado', cls: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

const REQUEST_PIPELINE_NEXT: Record<string, string | null> = {
  novo: 'qualificado',
  pendente: 'qualificado',
  qualificado: 'proposta',
  em_contato: 'proposta',
  proposta: 'aguardando_pagto',
  aguardando_pagto: 'implantacao',
  implantacao: 'ativo',
  pausado: 'ativo',
  ativo: null,
  provisionado: null,
  cancelado: null,
}

interface Props {
  stores: StoreRow[]
  requests: RequestRow[]
  envStatus: {
    publicUrl: boolean
    publicAnonKey: boolean
    serviceRole: boolean
    superadminEmail: boolean
  }
}

const emptyForm: CreateStoreInput = {
  slug: '',
  store_name: '',
  plan_id: 'vitrine',
  admin_email: '',
  whatsapp: '',
  accent_color: '#79e2ad',
}

export function SuperadminBoard({ stores, requests, envStatus }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateStoreInput>(emptyForm)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [tempPass, setTempPass] = useState<{ email: string; pass: string; slug: string; whatsapp: string } | null>(null)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [internalNoteDraft, setInternalNoteDraft] = useState('')
  const [nowTs] = useState(() => Date.now())
  const [requestQuery, setRequestQuery] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('abertos')
  const [requestPlanFilter, setRequestPlanFilter] = useState('todos')
  const [requestWindowFilter, setRequestWindowFilter] = useState('todos')
  const [requestSort, setRequestSort] = useState('recentes')
  const [storeQuery, setStoreQuery] = useState('')
  const [storeStatusFilter, setStoreStatusFilter] = useState('todas')
  const [storePlanFilter, setStorePlanFilter] = useState('todos')
  const [storeSort, setStoreSort] = useState('recentes')

  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'

  const fmtDateTime = (s: string | null) =>
    s ? new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

  const daysSince = (s: string | null) => {
    if (!s) return null
    return Math.max(0, Math.floor((nowTs - new Date(s).getTime()) / 86400_000))
  }

  const trialLeft = (s: string | null) => {
    if (!s) return null
    return Math.ceil((new Date(s).getTime() - nowTs) / 86400_000)
  }

  const openNew = (prefill?: Partial<CreateStoreInput>) => {
    setForm({ ...emptyForm, ...prefill, slug: storeSlug(prefill?.slug || prefill?.store_name || '') })
    setShowForm(true)
  }

  const finishToast = (ms = 4500) => {
    setTimeout(() => setToast(null), ms)
  }

  const submitCreate = () => {
    startTransition(async () => {
      const res = await createStore(form)
      if (res.ok) {
        setToast({ kind: 'ok', text: res.message })
        if (res.tempPassword) {
          setTempPass({
            email: form.admin_email,
            pass: res.tempPassword,
            slug: res.slug ?? form.slug,
            whatsapp: form.whatsapp,
          })
        }
        setShowForm(false)
        setForm(emptyForm)
        router.refresh()
      } else {
        setToast({ kind: 'err', text: res.error })
      }
      finishToast(6000)
    })
  }

  const toggleActive = (store: StoreRow) => {
    startTransition(async () => {
      const res = await setStoreActive(store.id, !store.is_active)
      setToast(res.ok ? { kind: 'ok', text: res.message } : { kind: 'err', text: res.error })
      router.refresh()
      finishToast()
    })
  }

  const setReqStatus = (request: RequestRow, status: string) => {
    startTransition(async () => {
      const res = await updateRequestStatus(request.id, status)
      setToast(res.ok ? { kind: 'ok', text: res.message } : { kind: 'err', text: res.error })
      router.refresh()
      finishToast()
    })
  }

  const saveInternalNote = (request: RequestRow) => {
    startTransition(async () => {
      const res = await addRequestInternalNote(request.id, internalNoteDraft)
      if (res.ok) {
        setToast({ kind: 'ok', text: res.message })
        setInternalNoteDraft('')
        router.refresh()
      } else {
        setToast({ kind: 'err', text: res.error })
      }
      finishToast()
    })
  }

  const advanceRequest = (request: RequestRow) => {
    const nextStatus = REQUEST_PIPELINE_NEXT[request.status]
    if (nextStatus) setReqStatus(request, nextStatus)
  }

  const removeRequest = (request: RequestRow) => {
    const ok = confirm(
      `Remover o pedido "${request.store_name}" da base?\n\n` +
      'Use isso apenas para leads encerrados. Esta acao e permanente.'
    )
    if (!ok) return

    startTransition(async () => {
      const res = await deleteRequest(request.id)
      setToast(res.ok ? { kind: 'ok', text: res.message } : { kind: 'err', text: res.error })
      if (res.ok && selectedRequestId === request.id) {
        setSelectedRequestId(null)
        setInternalNoteDraft('')
      }
      router.refresh()
      finishToast(5000)
    })
  }

  const removeStore = (store: StoreRow) => {
    const ok = confirm(
      `EXCLUIR a loja "${store.slug}" e TODOS os dados dela ` +
      '(produtos, servicos, vendas, ordens, agendamentos e o login do lojista)?\n\n' +
      'Esta acao e PERMANENTE e nao tem volta.'
    )
    if (!ok) return

    startTransition(async () => {
      const res = await deleteStore(store.id)
      setToast(res.ok ? { kind: 'ok', text: res.message } : { kind: 'err', text: res.error })
      router.refresh()
      finishToast(5000)
    })
  }

  const resetPassword = (store: StoreRow) => {
    const ok = confirm(`Gerar uma nova senha temporaria para "${store.admin_email}"? A senha atual deixa de funcionar.`)
    if (!ok) return

    startTransition(async () => {
      const res = await resetStorePassword(store.id)
      if (res.ok) {
        setToast({ kind: 'ok', text: res.message })
        if (res.tempPassword) {
          const cfg = firstStoreConfig(store)
          setTempPass({
            email: store.admin_email,
            pass: res.tempPassword,
            slug: res.slug ?? store.slug,
            whatsapp: cfg?.whatsapp ?? '',
          })
        }
      } else {
        setToast({ kind: 'err', text: res.error })
      }
      finishToast(6000)
    })
  }

  const logout = async () => {
    const { getSupabaseBrowser } = await import('@/lib/supabase-browser')
    const sb = getSupabaseBrowser()
    if (sb) await sb.auth.signOut()
    router.push('/superadmin/login')
  }

  const pendingReqs = requests.filter((request) => request.status === 'pendente').length
  const activeStores = stores.filter((store) => store.is_active).length
  const norm = (value: string | null | undefined) => (value ?? '').toLowerCase()
  const openStatuses = ['novo', 'qualificado', 'proposta', 'aguardando_pagto', 'implantacao', 'pendente', 'em_contato', 'ativo', 'pausado']
  const closedStatuses = ['cancelado', 'provisionado']
  const crmOpenRequests = requests.filter((request) => openStatuses.includes(request.status)).length
  const crmClosedRequests = requests.filter((request) => closedStatuses.includes(request.status)).length
  const requestHighlights = [
    { label: 'Novos', value: requests.filter((request) => ['novo', 'pendente'].includes(request.status)).length },
    { label: 'Qualificados', value: requests.filter((request) => ['qualificado', 'em_contato'].includes(request.status)).length },
    { label: 'Proposta', value: requests.filter((request) => ['proposta', 'aguardando_pagto'].includes(request.status)).length },
    { label: 'Implantacao', value: requests.filter((request) => ['implantacao', 'ativo'].includes(request.status)).length },
  ]

  const filteredRequests = requests.filter((request) => {
    const query = requestQuery.trim().toLowerCase()
    const matchesQuery = !query || [
      request.store_name,
      request.contact_name,
      request.email,
      request.whatsapp,
      request.customer_notes,
      request.internal_notes.map((item) => item.text).join(' '),
      PLANS[request.plan_id]?.name ?? request.plan_id,
    ].some((value) => norm(value).includes(query))

    const matchesStatus = (
      requestStatusFilter === 'todos'
      || (requestStatusFilter === 'abertos' && openStatuses.includes(request.status))
      || (requestStatusFilter === 'encerrados' && closedStatuses.includes(request.status))
      || request.status === requestStatusFilter
    )

    const matchesPlan = requestPlanFilter === 'todos' || request.plan_id === requestPlanFilter
    const age = daysSince(request.created_at)
    const matchesWindow = (
      requestWindowFilter === 'todos'
      || (requestWindowFilter === '7d' && age !== null && age <= 7)
      || (requestWindowFilter === '30d' && age !== null && age <= 30)
      || (requestWindowFilter === '90d' && age !== null && age <= 90)
    )

    return matchesQuery && matchesStatus && matchesPlan && matchesWindow
  }).sort((a, b) => {
    if (requestSort === 'antigos') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (requestSort === 'loja') return a.store_name.localeCompare(b.store_name, 'pt-BR')
    if (requestSort === 'plano') return (PLANS[a.plan_id]?.name ?? a.plan_id).localeCompare(PLANS[b.plan_id]?.name ?? b.plan_id, 'pt-BR')
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const selectedRequest = requests.find((request) => request.id === selectedRequestId) ?? null
  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? null

  const filteredStores = stores.filter((store) => {
    const cfg = firstStoreConfig(store)
    const query = storeQuery.trim().toLowerCase()
    const matchesQuery = !query || [
      store.slug,
      store.admin_email,
      cfg?.store_name,
      cfg?.whatsapp,
      PLANS[store.plan_id]?.name ?? store.plan_id,
    ].some((value) => norm(value).includes(query))

    const left = trialLeft(store.trial_expires_at)
    const matchesStatus = (
      storeStatusFilter === 'todas'
      || (storeStatusFilter === 'ativas' && store.is_active)
      || (storeStatusFilter === 'inativas' && !store.is_active)
      || (storeStatusFilter === 'trial' && left !== null && left > 0)
      || (storeStatusFilter === 'expiradas' && left !== null && left <= 0)
    )

    const matchesPlan = storePlanFilter === 'todos' || store.plan_id === storePlanFilter
    return matchesQuery && matchesStatus && matchesPlan
  }).sort((a, b) => {
    if (storeSort === 'nome') {
      const aName = firstStoreConfig(a)?.store_name || a.slug
      const bName = firstStoreConfig(b)?.store_name || b.slug
      return aName.localeCompare(bName, 'pt-BR')
    }
    if (storeSort === 'trial') return new Date(a.trial_expires_at ?? 0).getTime() - new Date(b.trial_expires_at ?? 0).getTime()
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const missingEnv = [
    !envStatus.publicUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !envStatus.publicAnonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    !envStatus.superadminEmail && 'SUPERADMIN_EMAIL',
    !envStatus.serviceRole && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean) as string[]

  const localReadOnlyMode = !envStatus.publicUrl || !envStatus.publicAnonKey

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-[#07130f] text-zinc-100"
      style={{
        backgroundImage: `
          radial-gradient(circle_at_top_left, rgba(121,226,173,0.16), transparent 30%),
          radial-gradient(circle_at_top_right, rgba(49,94,77,0.22), transparent 28%),
          linear-gradient(180deg, #081513 0%, #07130f 42%, #081614 100%)
        `,
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(201,247,223,0.08)_1px, transparent_1px), linear-gradient(90deg, rgba(201,247,223,0.08)_1px, transparent_1px)', backgroundSize: '72px 72px' }} />
      <div className="pointer-events-none absolute left-[-10rem] top-24 h-[28rem] w-[28rem] rounded-full bg-[#315e4d]/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-8rem] top-0 h-[26rem] w-[26rem] rounded-full bg-[#79e2ad]/14 blur-[140px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex items-center justify-between">
          <ModsLogo width={150} priority />
          <button onClick={logout} className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs text-zinc-300 backdrop-blur transition-all hover:bg-white/[0.06] hover:text-white">
            <LogOut size={13} /> Sair
          </button>
        </header>

        <section className="relative mb-8 overflow-hidden rounded-[36px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] p-6 shadow-[0_40px_120px_rgba(7,19,15,0.28)] sm:p-8">
          <div className="pointer-events-none absolute inset-x-[-6%] top-[6%] h-[78%] rounded-[44px] border border-[#c9f7df]/8 bg-[radial-gradient(circle_at_18%_18%,rgba(201,247,223,0.14),transparent_26%),radial-gradient(circle_at_78%_20%,rgba(121,226,173,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.005))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 backdrop-blur">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#79e2ad] shadow-[0_0_12px_rgba(121,226,173,0.85)]" />
                Painel de operação MODS
              </div>
              <h2 className="font-display mt-5 text-4xl font-bold leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Uma base para gerar,
                <span className="block text-[#c9f7df]">organizar e ativar lojas</span>
                <span className="block bg-gradient-to-r from-[#79e2ad] via-[#c9f7df] to-[#79e2ad] bg-clip-text text-transparent">
                  sem atrito desnecessário.
                </span>
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
                Acompanhe pedidos recebidos pela landing, organize o próximo passo de cada lead e prepare lojas em um só lugar.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <HeroMetric label="Pipeline ativo" value={crmOpenRequests} />
              <HeroMetric label="Lojas ativas" value={activeStores} />
              <HeroMetric label="Leads encerrados" value={crmClosedRequests} />
              <HeroMetric label="Base provisionada" value={stores.length} />
            </div>
          </div>
        </section>

        <Link href="/superadmin/comercial" className="mb-8 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-[#79e2ad]/25 bg-[#79e2ad]/10 px-5 py-3 text-sm font-semibold text-[#c9f7df] transition-colors hover:bg-[#79e2ad]/15 focus-visible:outline-2 focus-visible:outline-[#79e2ad]">
          <span>Projetos, contratos, mensalidades e financeiro da MODS</span>
          <ArrowRight size={18} className="shrink-0" />
        </Link>

        {missingEnv.length > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.06] px-4 py-3 text-sm text-yellow-300">
            <AlertTriangle size={16} className="shrink-0" />
            <div className="space-y-1">
              <p>
                Ambiente incompleto para operar o superadmin localmente.
                {localReadOnlyMode ? ' O painel fica sem dados reais.' : ' Algumas acoes administrativas ficam bloqueadas.'}
              </p>
              <p className="text-yellow-200">
                Faltando: <code className="font-mono">{missingEnv.join(', ')}</code>
              </p>
            </div>
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Lojas" value={stores.length} icon={Store} />
          <Stat label="Ativas" value={activeStores} icon={Power} accent />
          <Stat label="Pedidos" value={requests.length} icon={Inbox} />
          <Stat label="Pendentes" value={pendingReqs} icon={Clock} accent={pendingReqs > 0} />
        </div>

        <section className="mb-10 rounded-[32px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5 shadow-[0_24px_80px_rgba(7,19,15,0.16)] sm:p-6">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#79e2ad]">CRM</p>
              <h2 className="font-display mt-2 flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
                <Inbox size={18} className="text-[#79e2ad]" /> Pedidos e pipeline
              </h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 lg:w-[860px]">
              <label className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  value={requestQuery}
                  onChange={(e) => setRequestQuery(e.target.value)}
                  placeholder="Buscar pedido por loja, contato ou e-mail"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0d211b] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#79e2ad]/50 focus:outline-none"
                />
              </label>
              <select value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value)} className="rounded-xl border border-white/[0.08] bg-[#0d211b] px-3 py-2.5 text-sm text-zinc-300 focus:border-[#79e2ad]/50 focus:outline-none">
                <option value="abertos">Pipeline aberto</option>
                <option value="encerrados">Encerrados</option>
                <option value="todos">Todos os status</option>
                {Object.entries(REQUEST_STATUS).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
              <select value={requestPlanFilter} onChange={(e) => setRequestPlanFilter(e.target.value)} className="rounded-xl border border-white/[0.08] bg-[#0d211b] px-3 py-2.5 text-sm text-zinc-300 focus:border-[#79e2ad]/50 focus:outline-none">
                <option value="todos">Todos os planos</option>
                {Object.values(PLANS).map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={requestWindowFilter} onChange={(e) => setRequestWindowFilter(e.target.value)} className="rounded-xl border border-white/[0.08] bg-[#0d211b] px-3 py-2.5 text-sm text-zinc-300 focus:border-[#79e2ad]/50 focus:outline-none">
                  <option value="todos">Periodo</option>
                  <option value="7d">7 dias</option>
                  <option value="30d">30 dias</option>
                  <option value="90d">90 dias</option>
                </select>
                <select value={requestSort} onChange={(e) => setRequestSort(e.target.value)} className="rounded-xl border border-white/[0.08] bg-[#0d211b] px-3 py-2.5 text-sm text-zinc-300 focus:border-[#79e2ad]/50 focus:outline-none">
                  <option value="recentes">Mais recentes</option>
                  <option value="antigos">Mais antigos</option>
                  <option value="loja">Nome da loja</option>
                  <option value="plano">Plano</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
            <MiniStat label="Em andamento" value={crmOpenRequests} accent />
            <MiniStat label="Encerrados" value={crmClosedRequests} />
            {requestHighlights.map((item) => (
              <MiniStat key={item.label} label={item.label} value={item.value} />
            ))}
          </div>

          {filteredRequests.length === 0 ? (
            <EmptyHint text="Nenhum pedido ainda. Eles aparecem aqui quando um lojista envia o formulario do site." />
          ) : (
            <div className="space-y-2">
              {filteredRequests.map((request) => {
                const st = REQUEST_STATUS[request.status] ?? REQUEST_STATUS.pendente
                const age = daysSince(request.created_at)
                return (
                  <div key={request.id} className="rounded-[26px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.16)]">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="break-words text-sm font-semibold text-white">{request.store_name}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${st.cls}`}>{st.label}</span>
                          <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] text-zinc-400">{PLANS[request.plan_id]?.name ?? request.plan_id}</span>
                          {request.internal_notes.length > 0 && (
                            <span className="rounded-full border border-[#79e2ad]/20 bg-[#79e2ad]/10 px-2 py-0.5 text-[10px] text-[#c9f7df]">
                              {request.internal_notes.length} observ.
                            </span>
                          )}
                        </div>
                        <p className="mt-1 break-words text-xs text-zinc-500">
                          {request.contact_name} · {request.email} · {request.whatsapp}
                        </p>
                        {request.customer_notes && (
                        <p className="mt-1 line-clamp-2 max-w-2xl break-words text-xs italic text-zinc-600">&ldquo;{request.customer_notes}&rdquo;</p>
                        )}
                        <p className="mt-1 text-[10px] text-zinc-700">
                          Recebido em {fmtDate(request.created_at)}
                          {age === 0 ? ' · hoje' : age !== null ? ` · há ${age} ${age === 1 ? 'dia' : 'dias'}` : ''}
                        </p>
                      </div>
                      <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
                        <button
                          onClick={() => {
                            setSelectedRequestId(request.id)
                            setInternalNoteDraft('')
                          }}
                          className="flex items-center gap-1 rounded-lg border border-[#79e2ad]/25 bg-[#c9f7df]/8 px-2.5 py-1.5 text-[11px] text-[#c9f7df] transition-all hover:bg-[#c9f7df]/12"
                        >
                          <FileText size={11} /> Detalhes
                        </button>
                        <a
                          href={`https://wa.me/${whatsappDigits(request.whatsapp)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-zinc-300 hover:bg-white/[0.05] transition-all"
                        >
                          WhatsApp
                        </a>
                        {request.status !== 'provisionado' && (
                          <button
                            onClick={() => openNew({
                              store_name: request.store_name,
                              slug: request.store_name,
                              plan_id: request.plan_id,
                              admin_email: request.email,
                              whatsapp: request.whatsapp,
                              accent_color: request.accent_color,
                              request_id: request.id,
                            })}
                            className="rounded-lg bg-[#79e2ad] px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-[#9decc2] transition-all"
                          >
                            Criar loja
                          </button>
                        )}
                        {REQUEST_PIPELINE_NEXT[request.status] && (
                          <button
                            onClick={() => advanceRequest(request)}
                            disabled={pending}
                            className="flex items-center gap-1 rounded-lg border border-[#79e2ad]/30 bg-[#c9f7df]/8 px-2.5 py-1.5 text-[11px] font-semibold text-[#c9f7df] transition-all hover:bg-[#c9f7df]/14 disabled:opacity-50"
                          >
                            Avancar <ArrowRight size={11} />
                          </button>
                        )}
                        <select value={request.status} onChange={(e) => setReqStatus(request, e.target.value)} className="rounded-lg border border-white/[0.08] bg-[#0d211b] px-2 py-1.5 text-[11px] text-zinc-300 focus:border-[#79e2ad]/50 focus:outline-none">
                          {Object.entries(REQUEST_STATUS).map(([key, meta]) => (
                            <option key={key} value={key}>{meta.label}</option>
                          ))}
                        </select>
                        {closedStatuses.includes(request.status) && (
                          <button
                            onClick={() => removeRequest(request)}
                            disabled={pending}
                            title="Remover lead encerrado da tela"
                            className="rounded-lg border border-red-500/30 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all disabled:opacity-50"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5 shadow-[0_24px_80px_rgba(7,19,15,0.16)] sm:p-6">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#79e2ad]">Operacao</p>
              <h2 className="font-display mt-2 flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
                <Store size={18} className="text-[#79e2ad]" /> Lojas provisionadas
              </h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 lg:w-[860px]">
              <label className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input value={storeQuery} onChange={(e) => setStoreQuery(e.target.value)} placeholder="Buscar loja por slug, nome, e-mail ou WhatsApp" className="w-full rounded-xl border border-white/[0.08] bg-[#0d211b] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#79e2ad]/50 focus:outline-none" />
              </label>
              <select value={storeStatusFilter} onChange={(e) => setStoreStatusFilter(e.target.value)} className="rounded-xl border border-white/[0.08] bg-[#0d211b] px-3 py-2.5 text-sm text-zinc-300 focus:border-[#79e2ad]/50 focus:outline-none">
                <option value="todas">Todas</option>
                <option value="ativas">Ativas</option>
                <option value="inativas">Inativas</option>
                <option value="trial">Em trial</option>
                <option value="expiradas">Trial expirado</option>
              </select>
              <select value={storePlanFilter} onChange={(e) => setStorePlanFilter(e.target.value)} className="rounded-xl border border-white/[0.08] bg-[#0d211b] px-3 py-2.5 text-sm text-zinc-300 focus:border-[#79e2ad]/50 focus:outline-none">
                <option value="todos">Todos os planos</option>
                {Object.values(PLANS).map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={storeSort} onChange={(e) => setStoreSort(e.target.value)} className="rounded-xl border border-white/[0.08] bg-[#0d211b] px-3 py-2.5 text-sm text-zinc-300 focus:border-[#79e2ad]/50 focus:outline-none">
                  <option value="recentes">Mais recentes</option>
                  <option value="nome">Nome da loja</option>
                  <option value="trial">Vencimento trial</option>
                </select>
                <button onClick={() => openNew()} className="flex items-center justify-center gap-2 rounded-full bg-[#79e2ad] px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-[#9decc2]">
                  <Plus size={14} /> Nova loja
                </button>
              </div>
            </div>
          </div>

          {filteredStores.length === 0 ? (
            <EmptyHint text="Nenhuma loja provisionada ainda." />
          ) : (
            <div className="space-y-2">
              {filteredStores.map((store) => {
                const left = trialLeft(store.trial_expires_at)
                const cfg = firstStoreConfig(store)
                const storeName = cfg?.store_name?.trim() || store.slug
                return (
                  <div key={store.id} className="flex flex-wrap items-center gap-3 rounded-[26px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.16)]">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${store.is_active ? 'border-green-500/30 bg-green-500/10' : 'border-white/[0.08] bg-white/[0.03]'}`}>
                      <Store size={16} className={store.is_active ? 'text-green-400' : 'text-zinc-500'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{storeName}</p>
                        <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] text-zinc-500">/{store.slug}</span>
                        <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] text-zinc-400">{PLANS[store.plan_id]?.name ?? store.plan_id}</span>
                        {store.is_active
                          ? <span className="rounded-full border border-green-500/30 bg-green-500/15 px-2 py-0.5 text-[10px] text-green-400">Ativa</span>
                          : <span className="rounded-full border border-zinc-500/30 bg-zinc-500/15 px-2 py-0.5 text-[10px] text-zinc-400">Inativa</span>}
                        {left !== null && (
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${left <= 0 ? 'border-red-500/30 text-red-400' : 'border-white/[0.08] text-zinc-500'}`}>
                            {left <= 0 ? 'Trial expirado' : `Trial: ${left}d`}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 break-all text-xs text-zinc-500">{store.admin_email}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-600">
                        {cfg?.whatsapp && <span>WhatsApp: {cfg.whatsapp}</span>}
                        <span>Criada em {fmtDate(store.created_at)}</span>
                        {store.trial_expires_at && <span>Trial ate {fmtDate(store.trial_expires_at)}</span>}
                      </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
                      <button onClick={() => setSelectedStoreId(store.id)} className="rounded-lg border border-[#79e2ad]/25 bg-[#c9f7df]/8 px-2.5 py-1.5 text-[11px] text-[#c9f7df] transition-all hover:bg-[#c9f7df]/12">
                        Ativacao
                      </button>
                      <a href={storeHref(store.slug)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-zinc-300 hover:bg-white/[0.05] transition-all">
                        Abrir <ExternalLink size={11} />
                      </a>
                      <a href={adminLoginUrl(store.slug)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-zinc-300 hover:bg-white/[0.05] transition-all">
                        Painel <Settings2 size={11} />
                      </a>
                      <button onClick={() => toggleActive(store)} disabled={pending} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-50 ${store.is_active ? 'border border-white/[0.08] text-zinc-300 hover:bg-white/[0.05]' : 'bg-[#79e2ad] text-black hover:bg-[#9decc2]'}`}>
                        {store.is_active ? <><Power size={12} /> Desativar</> : <><Check size={12} /> Ativar</>}
                      </button>
                      <button onClick={() => resetPassword(store)} disabled={pending} title="Gerar nova senha temporaria para o lojista" className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-zinc-300 hover:bg-white/[0.05] transition-all disabled:opacity-50">
                        <KeyRound size={12} /> Resetar senha
                      </button>
                      <button onClick={() => removeStore(store)} disabled={pending} title="Excluir loja e todos os dados (permanente)" className="flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all disabled:opacity-50">
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/72 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => { setSelectedRequestId(null); setInternalNoteDraft('') }}>
          <div onClick={(e) => e.stopPropagation()} className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-x-hidden overflow-y-auto rounded-[28px] border border-white/[0.08] bg-[#0d211b] shadow-[0_40px_120px_rgba(0,0,0,0.48)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[34px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(121,226,173,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(49,94,77,0.22),transparent_26%)]" />
            <div className="relative border-b border-white/[0.06] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#79e2ad]/70">Detalhes do lead</p>
                  <h3 className="font-display mt-2 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">{selectedRequest.store_name}</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className={`rounded-full border px-2.5 py-1 ${REQUEST_STATUS[selectedRequest.status]?.cls ?? REQUEST_STATUS.pendente.cls}`}>{REQUEST_STATUS[selectedRequest.status]?.label ?? selectedRequest.status}</span>
                    <span className="rounded-full border border-white/[0.08] px-2.5 py-1">{PLANS[selectedRequest.plan_id]?.name ?? selectedRequest.plan_id}</span>
                    <span className="rounded-full border border-white/[0.08] px-2.5 py-1">Recebido em {fmtDateTime(selectedRequest.created_at)}</span>
                  </div>
                </div>
                <button onClick={() => { setSelectedRequestId(null); setInternalNoteDraft('') }} className="rounded-xl border border-white/[0.08] p-2 text-zinc-500 transition-all hover:bg-white/[0.04] hover:text-white">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="relative grid min-w-0 grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="min-w-0 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailCard label="Contato" value={selectedRequest.contact_name} />
                  <DetailCard label="Email" value={selectedRequest.email} />
                  <DetailCard label="WhatsApp" value={selectedRequest.whatsapp} />
                  <DetailCard label="Cor da marca" value={selectedRequest.accent_color || '#79e2ad'} mono />
                </div>

                <div className="rounded-[26px] border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Brief do lead</p>
                      <p className="mt-1 text-xs text-zinc-500">Informacoes vindas do formulario original.</p>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-2">
                      {selectedRequest.modules_wanted?.length > 0 ? selectedRequest.modules_wanted.map((module) => (
                        <span key={module} className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] text-zinc-400">{module}</span>
                      )) : (
                        <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] text-zinc-500">Sem modulos marcados</span>
                      )}
                    </div>
                  </div>
                  <div className="break-words rounded-2xl border border-white/[0.06] bg-[#10271f] p-4 text-sm leading-7 text-zinc-300">
                    {selectedRequest.customer_notes || 'O lead nao deixou observacoes no formulario.'}
                  </div>
                </div>

                <div className="rounded-[26px] border border-[#79e2ad]/12 bg-[linear-gradient(180deg,rgba(121,226,173,0.08),rgba(255,255,255,0.02))] p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Observacoes internas</p>
                      <p className="mt-1 text-xs text-zinc-500">Notas privadas do comercial e operacao.</p>
                    </div>
                    <span className="rounded-full border border-[#79e2ad]/20 bg-[#79e2ad]/10 px-2.5 py-1 text-[10px] text-[#c9f7df]">
                      {selectedRequest.internal_notes.length} registradas
                    </span>
                  </div>

                  <textarea
                    value={internalNoteDraft}
                    onChange={(e) => setInternalNoteDraft(e.target.value)}
                    placeholder="Ex.: lead pediu retorno amanha, quer migrar do Instagram para vitrine com catalogo e precisa de onboarding guiado."
                    className="min-h-28 w-full rounded-2xl border border-white/[0.08] bg-[#10271f] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#79e2ad]/50 focus:outline-none"
                  />

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] text-zinc-500">Cada nova observacao entra no historico automaticamente.</p>
                    <button
                      onClick={() => saveInternalNote(selectedRequest)}
                      disabled={pending || !internalNoteDraft.trim()}
                      className="rounded-full bg-[#79e2ad] px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-[#9decc2] disabled:opacity-50"
                    >
                      {pending ? 'Salvando...' : 'Salvar observacao'}
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedRequest.internal_notes.length === 0 ? (
                      <EmptyHint text="Nenhuma observacao interna ainda." />
                    ) : selectedRequest.internal_notes.map((note) => (
                      <div key={note.id} className="rounded-2xl border border-white/[0.06] bg-[#10271f] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="break-all text-[11px] uppercase tracking-[0.18em] text-[#79e2ad]/70">{note.author}</p>
                          <p className="text-[11px] text-zinc-600">{fmtDateTime(note.created_at)}</p>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-zinc-300">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[26px] border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">Acao rapida</p>
                  <p className="mt-1 text-xs text-zinc-500">Sem sair do detalhe do lead.</p>
                  <div className="mt-4 grid gap-2">
                    <button
                      onClick={() => openNew({
                        store_name: selectedRequest.store_name,
                        slug: selectedRequest.store_name,
                        plan_id: selectedRequest.plan_id,
                        admin_email: selectedRequest.email,
                        whatsapp: selectedRequest.whatsapp,
                        accent_color: selectedRequest.accent_color,
                        request_id: selectedRequest.id,
                      })}
                      className="rounded-2xl bg-[#79e2ad] px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-[#9decc2]"
                    >
                      Criar loja deste lead
                    </button>
                    <a href={`https://wa.me/${whatsappDigits(selectedRequest.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-white/[0.08] px-4 py-3 text-center text-sm text-zinc-300 transition-all hover:bg-white/[0.05]">
                      Abrir WhatsApp
                    </a>
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Historico do lead</p>
                      <p className="mt-1 text-xs text-zinc-500">Linha do tempo comercial e operacional.</p>
                    </div>
                    <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] text-zinc-500">
                      {selectedRequest.history.length} eventos
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedRequest.history.map((entry, index) => (
                      <div key={entry.id} className="relative rounded-2xl border border-white/[0.06] bg-[#10271f] p-4">
                        {index < selectedRequest.history.length - 1 && (
                          <div className="pointer-events-none absolute bottom-[-18px] left-[21px] top-[52px] w-px bg-white/[0.08]" />
                        )}
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-[#79e2ad]/20 bg-[#79e2ad]/10 text-[#c9f7df]">
                            {entry.type === 'status_changed' ? <ArrowRight size={13} /> : entry.type === 'note_added' ? <FileText size={13} /> : <CheckCircle2 size={13} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-white">{entry.text}</p>
                              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">{entry.author}</span>
                            </div>
                            <p className="mt-1 text-[11px] text-zinc-500">{fmtDateTime(entry.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedStore && (() => {
        const cfg = firstStoreConfig(selectedStore)
        const checklist = [
          { label: 'Slug provisionado', done: Boolean(selectedStore.slug), helper: `/${selectedStore.slug}` },
          { label: 'Login do lojista definido', done: Boolean(selectedStore.admin_email), helper: selectedStore.admin_email || 'Sem e-mail' },
          { label: 'WhatsApp configurado', done: Boolean(cfg?.whatsapp), helper: cfg?.whatsapp || 'Sem WhatsApp' },
          { label: 'Identidade base criada', done: Boolean(cfg?.store_name && cfg?.accent_color), helper: `${cfg?.store_name || 'Sem nome'} · ${cfg?.accent_color || 'Sem cor'}` },
          { label: 'Trial configurado', done: Boolean(selectedStore.trial_expires_at), helper: selectedStore.trial_expires_at ? `Ate ${fmtDate(selectedStore.trial_expires_at)}` : 'Sem trial' },
          { label: 'Loja ativada', done: selectedStore.is_active, helper: selectedStore.is_active ? 'Liberada para operar' : 'Ainda depende de ativacao final' },
        ]
        const completed = checklist.filter((item) => item.done).length

        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/72 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setSelectedStoreId(null)}>
          <div onClick={(e) => e.stopPropagation()} className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-x-hidden overflow-y-auto rounded-[28px] border border-white/[0.08] bg-[#0d211b] shadow-[0_40px_120px_rgba(0,0,0,0.48)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[34px]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(121,226,173,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(49,94,77,0.22),transparent_26%)]" />
              <div className="relative border-b border-white/[0.06] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#79e2ad]/70">Checklist de ativação</p>
                    <h3 className="font-display mt-2 text-3xl font-bold tracking-tight text-white">{cfg?.store_name?.trim() || selectedStore.slug}</h3>
                    <p className="mt-2 text-sm text-zinc-400">Checklist operacional para tirar a loja do provisionamento e levar para ativacao consistente.</p>
                  </div>
                  <button onClick={() => setSelectedStoreId(null)} className="rounded-xl border border-white/[0.08] p-2 text-zinc-500 transition-all hover:bg-white/[0.04] hover:text-white">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="relative p-6">
                <div className="mb-5 rounded-[28px] border border-[#79e2ad]/15 bg-[linear-gradient(180deg,rgba(121,226,173,0.08),rgba(255,255,255,0.02))] p-5">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Progresso da ativacao</p>
                      <p className="mt-1 text-xs text-zinc-500">Use isso para bater o olho e ver o que falta antes de considerar a loja pronta.</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-4xl font-bold tracking-tight text-[#c9f7df]">{completed}/{checklist.length}</p>
                      <p className="text-xs text-zinc-500">itens concluidos</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#79e2ad] to-[#c9f7df]" style={{ width: `${(completed / checklist.length) * 100}%` }} />
                  </div>
                </div>

                <div className="grid gap-3">
                  {checklist.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border ${item.done ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-white/[0.08] bg-[#10271f] text-zinc-500'}`}>
                          <CheckCircle2 size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="mt-1 text-xs text-zinc-500">{item.helper}</p>
                        </div>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] ${item.done ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300'}`}>
                        {item.done ? 'OK' : 'Pendente'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={storeHref(selectedStore.slug)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/[0.08] px-4 py-2 text-xs text-zinc-300 transition-all hover:bg-white/[0.05]">
                    Abrir vitrine
                  </a>
                  <a href={adminLoginUrl(selectedStore.slug)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/[0.08] px-4 py-2 text-xs text-zinc-300 transition-all hover:bg-white/[0.05]">
                    Abrir painel
                  </a>
                  <button onClick={() => toggleActive(selectedStore)} disabled={pending} className="rounded-full bg-[#79e2ad] px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-[#9decc2] disabled:opacity-50">
                    {selectedStore.is_active ? 'Marcar como revisada' : 'Ativar loja'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setShowForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#0d211b] shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <h3 className="text-sm font-semibold text-white">Nova loja</h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-4 p-6">
              <Field label="Nome da loja">
                <input value={form.store_name} onChange={(e) => setForm((state) => ({ ...state, store_name: e.target.value, slug: state.slug || e.target.value }))} placeholder="Ex: TechCell" className={inputCls} />
              </Field>
              <Field label="Identificador da loja" hint={storeHref(storeSlug(form.slug || form.store_name || 'loja'))}>
                <input value={form.slug} onChange={(e) => setForm((state) => ({ ...state, slug: e.target.value }))} placeholder="mcell" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Plano">
                  <select value={form.plan_id} onChange={(e) => setForm((state) => ({ ...state, plan_id: e.target.value }))} className={inputCls}>
                    {Object.values(PLANS).map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                  </select>
                </Field>
                <Field label="Cor de destaque">
                  <input type="color" value={form.accent_color} onChange={(e) => setForm((state) => ({ ...state, accent_color: e.target.value }))} className="h-[42px] w-full cursor-pointer rounded-xl border border-white/[0.08] bg-[#0d211b] p-1" />
                </Field>
              </div>
              <Field label="E-mail do lojista (login)">
                <input type="email" value={form.admin_email} onChange={(e) => setForm((state) => ({ ...state, admin_email: e.target.value }))} placeholder="lojista@email.com" className={inputCls} />
              </Field>
              <Field label="WhatsApp">
                <input value={form.whatsapp} onChange={(e) => setForm((state) => ({ ...state, whatsapp: e.target.value }))} placeholder="11999999999" className={inputCls} />
              </Field>
            </div>
            <div className="flex gap-3 border-t border-white/[0.06] px-6 py-4">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-full border border-white/[0.08] py-2.5 text-sm text-zinc-400 hover:bg-white/[0.04]">Cancelar</button>
              <button onClick={submitCreate} disabled={pending || !form.admin_email} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#79e2ad] py-2.5 text-sm font-semibold text-black hover:bg-[#9decc2] disabled:opacity-50">
                {pending ? <><Loader2 size={15} className="animate-spin" /> Criando...</> : 'Criar loja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tempPass && (() => {
        const loginUrl = adminLoginUrl(tempPass.slug)
        const msg =
          `Ola! O sistema da sua loja ja esta pronto.\n\n` +
          `Acesse o painel:\n${loginUrl}\n\n` +
          `Login: ${tempPass.email}\nSenha: ${tempPass.pass}\n\n` +
          'Recomendo trocar a senha no primeiro acesso.'
        const waDigits = tempPass.whatsapp.replace(/\D/g, '')
        const waHref = waDigits ? `https://wa.me/55${waDigits}?text=${encodeURIComponent(msg)}` : null
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-green-500/20 bg-[#0d211b] p-6 shadow-2xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10">
                <KeyRound size={20} className="text-green-400" />
              </div>
              <h3 className="text-center text-base font-bold text-white">Credenciais do lojista</h3>
              <p className="mt-1 text-center text-xs text-zinc-500">
                Envie agora pelo WhatsApp ou copie tudo. <span className="text-zinc-300">A senha nao aparece de novo.</span>
              </p>
              <div className="mt-4 space-y-2">
                <CopyRow label="Link de acesso" value={loginUrl} />
                <CopyRow label="E-mail" value={tempPass.email} />
                <CopyRow label="Senha temporaria" value={tempPass.pass} />
              </div>

              <div className="mt-4 space-y-2">
                {waHref && (
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#79e2ad] py-2.5 text-sm font-semibold text-black hover:bg-[#9decc2] transition-all">
                    <MessageCircle size={15} /> Enviar no WhatsApp
                  </a>
                )}
                <CopyAllButton text={msg} />
              </div>

              <button onClick={() => setTempPass(null)} className="mt-3 w-full rounded-full border border-white/[0.08] py-2.5 text-sm text-zinc-400 hover:bg-white/[0.04]">Ja anotei, fechar</button>
            </div>
          </div>
        )
      })()}

      {toast && (
        <div className={`fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2.5 text-sm shadow-xl ${toast.kind === 'ok' ? 'border-green-500/30 bg-[#0f1a0f] text-green-300' : 'border-red-500/30 bg-[#1a0f0f] text-red-300'}`}>
          {toast.kind === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.text}
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full rounded-xl border border-white/[0.08] bg-[#0d211b] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-[#79e2ad]/50 focus:outline-none'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      {children}
      {hint && <p className="mt-1 font-mono text-[10px] text-zinc-600">{hint}</p>}
    </div>
  )
}

function DetailCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={`mt-2 break-words text-sm text-white ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ElementType; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'border-green-500/20 bg-green-500/[0.05]' : 'border-white/[0.07] bg-[#0d211b]'}`}>
      <div className="flex items-center justify-between">
        <p className={`text-2xl font-black ${accent ? 'text-green-400' : 'text-white'}`}>{value}</p>
        <Icon size={16} className={accent ? 'text-green-400' : 'text-zinc-600'} />
      </div>
      <p className="mt-1 text-[11px] text-zinc-500">{label}</p>
    </div>
  )
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${accent ? 'border-green-500/20 bg-green-500/[0.05]' : 'border-white/[0.07] bg-[#0d211b]'}`}>
      <p className={`text-lg font-black ${accent ? 'text-green-400' : 'text-white'}`}>{value}</p>
      <p className="mt-1 text-[11px] text-zinc-500">{label}</p>
    </div>
  )
}

function HeroMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-white/[0.06] bg-black/15 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#79e2ad]/70">{label}</p>
      <p className="font-display mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/[0.08] py-10 text-center text-sm text-zinc-600">{text}</div>
}

function CopyAllButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(text)
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }

  return (
    <button onClick={copy} className="flex w-full items-center justify-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.06] py-2.5 text-sm font-semibold text-green-300 transition-all hover:bg-green-500/10">
      {done ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar tudo (link + login + senha)</>}
    </button>
  )
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-[#0d211b] px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] text-zinc-600">{label}</p>
        <p className="truncate font-mono text-sm text-white">{value}</p>
      </div>
      <button onClick={copy} className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.05] hover:text-green-400">
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
    </div>
  )
}
