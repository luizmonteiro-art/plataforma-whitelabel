'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Hexagon, Plus, Store, Inbox, X, Check, Power, ExternalLink, Copy,
  LogOut, AlertTriangle, Clock, CheckCircle2, Loader2, KeyRound, MessageCircle, Trash2,
} from 'lucide-react'
import { PLANS } from '@/lib/plans'
import {
  createStore, setStoreActive, updateRequestStatus, deleteStore,
  type StoreRow, type RequestRow, type CreateStoreInput,
} from './actions'

const PLATFORM_HOST = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? 'plataforma.com'

/**
 * Link seguro para abrir a vitrine da loja.
 * Usa ?store=<slug> na MESMA origem (relativo) — funciona em dev (localhost) e
 * em produção (o proxy honra ?store= antes do subdomínio). Evita apontar para
 * {slug}.plataforma.com, que é domínio de terceiros (risco de página maliciosa).
 * É um <a> normal (não window.open) para não ser barrado pelo bloqueador de pop-up.
 */
function storeHref(slug: string): string {
  return `/?store=${encodeURIComponent(slug)}`
}

/**
 * URL de login do painel do lojista — link COMPLETO (origem atual) com ?store=.
 * Subdomínio de loja só existe com domínio próprio + DNS wildcard; em *.vercel.app
 * NÃO há subdomínios de loja, então montar `slug.host` gera um link que não abre.
 * O `?store=` funciona em qualquer host (o proxy resolve e fixa por cookie).
 */
function adminLoginUrl(slug: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/admin/login?store=${encodeURIComponent(slug)}`
}

const REQUEST_STATUS: Record<string, { label: string; cls: string }> = {
  pendente:     { label: 'Pendente',     cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  em_contato:   { label: 'Em contato',   cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  provisionado: { label: 'Provisionado', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  cancelado:    { label: 'Cancelado',    cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

interface Props {
  stores: StoreRow[]
  requests: RequestRow[]
  configured: boolean
}

const emptyForm: CreateStoreInput = {
  slug: '', store_name: '', plan_id: 'vitrine', admin_email: '', whatsapp: '', accent_color: '#22c55e',
}

export function SuperadminBoard({ stores, requests, configured }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateStoreInput>(emptyForm)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [tempPass, setTempPass] = useState<{ email: string; pass: string; slug: string; whatsapp: string } | null>(null)

  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'

  const trialLeft = (s: string | null) => {
    if (!s) return null
    const days = Math.ceil((new Date(s).getTime() - Date.now()) / 86400_000)
    return days
  }

  const openNew = (prefill?: Partial<CreateStoreInput>) => {
    setForm({ ...emptyForm, ...prefill })
    setShowForm(true)
  }

  const submitCreate = () => {
    startTransition(async () => {
      const res = await createStore(form)
      if (res.ok) {
        setToast({ kind: 'ok', text: res.message })
        if (res.tempPassword) setTempPass({
          email: form.admin_email,
          pass: res.tempPassword,
          slug: res.slug ?? form.slug,
          whatsapp: form.whatsapp,
        })
        setShowForm(false)
        setForm(emptyForm)
        router.refresh()
      } else {
        setToast({ kind: 'err', text: res.error })
      }
      setTimeout(() => setToast(null), 6000)
    })
  }

  const toggleActive = (s: StoreRow) => {
    startTransition(async () => {
      const res = await setStoreActive(s.id, !s.is_active)
      setToast(res.ok ? { kind: 'ok', text: res.message } : { kind: 'err', text: res.error })
      router.refresh()
      setTimeout(() => setToast(null), 4000)
    })
  }

  const removeStore = (s: StoreRow) => {
    const ok = confirm(
      `EXCLUIR a loja "${s.slug}" e TODOS os dados dela ` +
      `(produtos, serviços, vendas, ordens, agendamentos e o login do lojista)?\n\n` +
      `Esta ação é PERMANENTE e não tem volta.`
    )
    if (!ok) return
    startTransition(async () => {
      const res = await deleteStore(s.id)
      setToast(res.ok ? { kind: 'ok', text: res.message } : { kind: 'err', text: res.error })
      router.refresh()
      setTimeout(() => setToast(null), 5000)
    })
  }

  const setReqStatus = (r: RequestRow, status: string) => {
    startTransition(async () => {
      const res = await updateRequestStatus(r.id, status)
      if (!res.ok) setToast({ kind: 'err', text: res.error })
      router.refresh()
    })
  }

  const logout = async () => {
    const { getSupabaseBrowser } = await import('@/lib/supabase-browser')
    const sb = getSupabaseBrowser()
    if (sb) await sb.auth.signOut()
    window.location.href = '/superadmin/login'
  }

  const pendingReqs = requests.filter(r => r.status === 'pendente').length
  const activeStores = stores.filter(s => s.is_active).length

  return (
    <div className="min-h-screen bg-[#0a0d0a] text-white">
      {/* textura de pontos sutil (MODUS) */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.15]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-600/20 border border-green-500/30">
              <Hexagon size={20} className="text-green-400 fill-green-400/20" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">Super<span className="text-green-400">admin</span></h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">Provisionamento de lojas</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all">
            <LogOut size={13} /> Sair
          </button>
        </header>

        {!configured && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.06] px-4 py-3 text-sm text-yellow-300">
            <AlertTriangle size={16} className="shrink-0" />
            Service role não configurada. Defina <code className="font-mono text-yellow-200">SUPABASE_SERVICE_ROLE_KEY</code> no servidor para provisionar lojas.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Stat label="Lojas" value={stores.length} icon={Store} />
          <Stat label="Ativas" value={activeStores} icon={Power} accent />
          <Stat label="Pedidos" value={requests.length} icon={Inbox} />
          <Stat label="Pendentes" value={pendingReqs} icon={Clock} accent={pendingReqs > 0} />
        </div>

        {/* Pedidos de captação */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
            <Inbox size={15} className="text-green-400" /> Pedidos de captação
          </h2>
          {requests.length === 0 ? (
            <EmptyHint text="Nenhum pedido ainda. Eles aparecem aqui quando um lojista envia o formulário do site." />
          ) : (
            <div className="space-y-2">
              {requests.map(r => {
                const st = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.pendente
                return (
                  <div key={r.id} className="rounded-2xl border border-white/[0.07] bg-[#0f120f] p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{r.store_name}</p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.08] text-zinc-400">{PLANS[r.plan_id]?.name ?? r.plan_id}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          {r.contact_name} · {r.email} · {r.whatsapp}
                        </p>
                        {r.notes && <p className="text-xs text-zinc-600 mt-1 italic">&ldquo;{r.notes}&rdquo;</p>}
                        <p className="text-[10px] text-zinc-700 mt-1">Recebido em {fmtDate(r.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`https://wa.me/55${r.whatsapp.replace(/\D/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-zinc-300 hover:bg-white/[0.05] transition-all"
                        >
                          WhatsApp
                        </a>
                        {r.status !== 'provisionado' && (
                          <button
                            onClick={() => openNew({
                              store_name: r.store_name, slug: r.store_name, plan_id: r.plan_id,
                              admin_email: r.email, whatsapp: r.whatsapp, accent_color: r.accent_color, request_id: r.id,
                            })}
                            className="rounded-lg bg-green-500 px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-green-400 transition-all"
                          >
                            Criar loja
                          </button>
                        )}
                        <select
                          value={r.status}
                          onChange={e => setReqStatus(r, e.target.value)}
                          className="rounded-lg border border-white/[0.08] bg-[#161a16] px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-green-500/40"
                        >
                          {Object.entries(REQUEST_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Lojas */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <Store size={15} className="text-green-400" /> Lojas
            </h2>
            <button
              onClick={() => openNew()}
              className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-xs font-semibold text-black hover:bg-green-400 transition-all"
            >
              <Plus size={14} /> Nova loja
            </button>
          </div>

          {stores.length === 0 ? (
            <EmptyHint text="Nenhuma loja provisionada ainda." />
          ) : (
            <div className="space-y-2">
              {stores.map(s => {
                const left = trialLeft(s.trial_expires_at)
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0f120f] p-4 flex-wrap">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${s.is_active ? 'border-green-500/30 bg-green-500/10' : 'border-white/[0.08] bg-white/[0.03]'}`}>
                      <Store size={16} className={s.is_active ? 'text-green-400' : 'text-zinc-500'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{s.slug}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.08] text-zinc-400">{PLANS[s.plan_id]?.name ?? s.plan_id}</span>
                        {s.is_active
                          ? <span className="text-[10px] px-2 py-0.5 rounded-full border border-green-500/30 bg-green-500/15 text-green-400">Ativa</span>
                          : <span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-500/30 bg-zinc-500/15 text-zinc-400">Inativa</span>}
                        {left !== null && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${left <= 0 ? 'border-red-500/30 text-red-400' : 'border-white/[0.08] text-zinc-500'}`}>
                            {left <= 0 ? 'Trial expirado' : `Trial: ${left}d`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{s.admin_email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={storeHref(s.slug)}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-zinc-300 hover:bg-white/[0.05] transition-all"
                      >
                        Abrir <ExternalLink size={11} />
                      </a>
                      <button
                        onClick={() => toggleActive(s)}
                        disabled={pending}
                        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-50 ${
                          s.is_active
                            ? 'border border-white/[0.08] text-zinc-300 hover:bg-white/[0.05]'
                            : 'bg-green-500 text-black hover:bg-green-400'
                        }`}
                      >
                        {s.is_active ? <><Power size={12} /> Desativar</> : <><Check size={12} /> Ativar</>}
                      </button>
                      <button
                        onClick={() => removeStore(s)}
                        disabled={pending}
                        title="Excluir loja e todos os dados (permanente)"
                        className="flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all disabled:opacity-50"
                      >
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

      {/* ── Modal: nova loja ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0f120f] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Nova loja</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06]"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Nome da loja">
                <input value={form.store_name} onChange={e => setForm(f => ({ ...f, store_name: e.target.value, slug: f.slug || e.target.value }))} placeholder="Ex: TechCell" className={inputCls} />
              </Field>
              <Field label="Slug (subdomínio)" hint={`${form.slug || 'loja'}.${PLATFORM_HOST}`}>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="mcell" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Plano">
                  <select value={form.plan_id} onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))} className={inputCls}>
                    {Object.values(PLANS).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
                <Field label="Cor de destaque">
                  <input type="color" value={form.accent_color} onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))} className="w-full h-[42px] bg-[#161a16] border border-white/[0.08] rounded-xl cursor-pointer p-1" />
                </Field>
              </div>
              <Field label="E-mail do lojista (login)">
                <input type="email" value={form.admin_email} onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))} placeholder="lojista@email.com" className={inputCls} />
              </Field>
              <Field label="WhatsApp">
                <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="11999999999" className={inputCls} />
              </Field>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-full border border-white/[0.08] py-2.5 text-sm text-zinc-400 hover:bg-white/[0.04]">Cancelar</button>
              <button
                onClick={submitCreate}
                disabled={pending || !form.admin_email}
                className="flex-1 rounded-full bg-green-500 py-2.5 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pending ? <><Loader2 size={15} className="animate-spin" /> Criando...</> : 'Criar loja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: senha temporária ── */}
      {tempPass && (() => {
        const loginUrl = adminLoginUrl(tempPass.slug)
        const msg =
          `Olá! O sistema da sua loja já está pronto 🎉\n\n` +
          `Acesse o painel:\n${loginUrl}\n\n` +
          `Login: ${tempPass.email}\nSenha: ${tempPass.pass}\n\n` +
          `Recomendo trocar a senha no primeiro acesso.`
        const waDigits = tempPass.whatsapp.replace(/\D/g, '')
        const waHref = waDigits ? `https://wa.me/55${waDigits}?text=${encodeURIComponent(msg)}` : null
        return (
        // NÃO fecha ao clicar fora: evita perder a senha por engano (ela não reaparece).
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-green-500/20 bg-[#0f120f] p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10">
              <KeyRound size={20} className="text-green-400" />
            </div>
            <h3 className="text-base font-bold text-white text-center">Credenciais do lojista</h3>
            <p className="mt-1 text-xs text-zinc-500 text-center">
              Envie agora pelo WhatsApp ou copie tudo — <span className="text-zinc-300">a senha não aparece de novo</span>.
            </p>
            <div className="mt-4 space-y-2">
              <CopyRow label="Link de acesso" value={loginUrl} />
              <CopyRow label="E-mail" value={tempPass.email} />
              <CopyRow label="Senha temporária" value={tempPass.pass} />
            </div>

            <div className="mt-4 space-y-2">
              {waHref && (
                <a
                  href={waHref} target="_blank" rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-green-500 py-2.5 text-sm font-semibold text-black hover:bg-green-400 transition-all"
                >
                  <MessageCircle size={15} /> Enviar no WhatsApp
                </a>
              )}
              <CopyAllButton text={msg} />
            </div>

            <button onClick={() => setTempPass(null)} className="mt-3 w-full rounded-full border border-white/[0.08] py-2.5 text-sm text-zinc-400 hover:bg-white/[0.04]">Já anotei — fechar</button>
          </div>
        </div>
        )
      })()}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm shadow-xl ${
          toast.kind === 'ok' ? 'border-green-500/30 bg-[#0f1a0f] text-green-300' : 'border-red-500/30 bg-[#1a0f0f] text-red-300'
        }`}>
          {toast.kind === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.text}
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full bg-[#161a16] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40 transition-all'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-zinc-600 mt-1 font-mono">{hint}</p>}
    </div>
  )
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ElementType; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'border-green-500/20 bg-green-500/[0.05]' : 'border-white/[0.07] bg-[#0f120f]'}`}>
      <div className="flex items-center justify-between">
        <p className={`text-2xl font-black ${accent ? 'text-green-400' : 'text-white'}`}>{value}</p>
        <Icon size={16} className={accent ? 'text-green-400' : 'text-zinc-600'} />
      </div>
      <p className="text-[11px] text-zinc-500 mt-1">{label}</p>
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
    <button
      onClick={copy}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.06] py-2.5 text-sm font-semibold text-green-300 hover:bg-green-500/10 transition-all"
    >
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
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-[#161a16] px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] text-zinc-600">{label}</p>
        <p className="text-sm text-white font-mono truncate">{value}</p>
      </div>
      <button onClick={copy} className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:text-green-400 hover:bg-white/[0.05]">
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
    </div>
  )
}
