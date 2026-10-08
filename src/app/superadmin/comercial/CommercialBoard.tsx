'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, CalendarDays, CircleDollarSign, Clock3, FolderKanban, Plus, ReceiptText, Repeat2 } from 'lucide-react'
import { ModsLogo } from '@/components/brand/ModsLogo'
import {
  closeCommercialProject, createCommercialProject, createCommercialSubscription,
  generateMonthlyCharge, recordCommercialReceipt, setSubscriptionStatus,
  updateCommercialProject, voidCommercialReceipt,
} from './actions'
import { money, monthMetrics, parseReais, type CommercialSnapshot, type Project, type Receivable, type Subscription } from './model'

type Result = { ok: true; message: string } | { ok: false; error: string }
type Tab = 'resumo' | 'projetos' | 'financeiro' | 'mensalidades'

const field = 'min-h-11 w-full rounded-xl border border-white/15 bg-[#11231c] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#79e2ad] focus:ring-2 focus:ring-[#79e2ad]/20'
const button = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#79e2ad] px-4 py-2 text-sm font-semibold text-[#07130f] transition-colors hover:bg-[#c9f7df] disabled:cursor-not-allowed disabled:opacity-50'
const secondary = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/[0.09] disabled:opacity-50'
const card = 'rounded-2xl border border-white/[0.09] bg-white/[0.035] p-4 sm:p-5'
const label = 'grid gap-1.5 text-xs font-medium text-zinc-300'
const kindName: Record<string, string> = { site: 'Site', sistema: 'Sistema', erp: 'ERP', loja: 'Loja', outro: 'Outro' }
const stageName: Record<string, string> = { novo: 'Novo', qualificado: 'Qualificado', proposta: 'Proposta', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' }
const deliveryName: Record<string, string> = { a_iniciar: 'A iniciar', em_execucao: 'Em execução', aguardando_cliente: 'Aguardando cliente', entregue: 'Entregue', cancelado: 'Cancelado' }

function dateLabel(value: string | null | undefined) {
  return value ? value.slice(0, 10).split('-').reverse().join('/') : 'Sem data'
}
function Status({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'good' | 'warn' }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone === 'good' ? 'border-[#79e2ad]/25 bg-[#79e2ad]/10 text-[#a7edc7]' : tone === 'warn' ? 'border-amber-300/25 bg-amber-300/10 text-amber-200' : 'border-white/15 bg-white/[0.05] text-zinc-300'}`}>{text}</span>
}

export function CommercialBoard({ snapshot, today }: { snapshot: CommercialSnapshot; today: string }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('resumo')
  const [month, setMonth] = useState(today.slice(0, 7))
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null)
  const [pending, startTransition] = useTransition()
  const metrics = monthMetrics(snapshot, month, today)
  const execute = (task: () => Promise<Result>) => startTransition(async () => {
    try {
      const result = await task()
      setNotice({ text: result.ok ? result.message : result.error, ok: result.ok })
      if (result.ok) router.refresh()
    } catch (error) { setNotice({ text: error instanceof Error ? error.message : 'Falha ao salvar.', ok: false }) }
  })
  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(49,94,77,0.3),transparent_35%),#07130f] px-4 py-5 text-white sm:px-6 sm:py-8">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <ModsLogo width={144} priority />
        <Link href="/superadmin" className={secondary}><ArrowLeft size={16} /> Leads e lojas</Link>
      </header>
      <div className="mt-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.23em] text-[#79e2ad]">MODS · operação comercial</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Projetos & financeiro</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">Acompanhe contratos, execução, cobranças e dinheiro recebido. Valores de proposta e mensalidades acordadas aparecem separados do caixa.</p>
        </div>
        <label className={`${label} w-full sm:w-44`}>Mês de referência<input type="month" value={month} onChange={e => setMonth(e.target.value)} className={field} /></label>
      </div>
      <nav aria-label="Áreas do comercial" className="mt-7 grid grid-cols-2 gap-2 sm:flex">
        {([['resumo','Visão geral'],['projetos','Projetos'],['financeiro','Financeiro'],['mensalidades','Mensalidades']] as const).map(([key, text]) =>
          <button key={key} type="button" onClick={() => setTab(key)} aria-current={tab === key ? 'page' : undefined} className={`min-h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#79e2ad] ${tab === key ? 'bg-[#79e2ad] text-[#07130f]' : 'border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.09]'}`}>{text}</button>
        )}
      </nav>
      {notice && <div role="status" className={`mt-5 rounded-xl border p-3 text-sm ${notice.ok ? 'border-[#79e2ad]/30 bg-[#79e2ad]/10 text-[#c9f7df]' : 'border-red-400/30 bg-red-400/10 text-red-200'}`}>{notice.text}</div>}

      {tab === 'resumo' && <>
        <section aria-label="Indicadores do mês" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={FolderKanban} title="Leads recebidos" value={String(metrics.leads)} foot="Pedidos + projetos manuais · mês" />
          <Metric icon={ArrowUpRight} title="Propostas enviadas" value={String(metrics.proposals)} foot={`${metrics.proposals > 0 && metrics.unpricedProposals === metrics.proposals ? 'Valor não informado' : `${money(metrics.proposedCents)} confirmados`} · mês${metrics.unpricedProposals ? ` · ${metrics.unpricedProposals} sem valor` : ''}`} />
          <Metric icon={CircleDollarSign} title="Contratos fechados" value={metrics.won > 0 && metrics.unpricedWon === metrics.won ? 'Valor não informado' : money(metrics.contractedCents)} foot={`${metrics.won} fechamentos · mês${metrics.unpricedWon ? ` · ${metrics.unpricedWon} sem valor` : ''}`} accent />
          <Metric icon={ReceiptText} title="Recebido em caixa" value={money(metrics.receivedCents)} foot="Pagamentos válidos · mês" accent />
          <Metric icon={Clock3} title="A receber" value={money(metrics.openCents)} foot={`${money(metrics.dueMonthCents)} vence neste mês · cobranças lançadas`} />
          <Metric icon={CalendarDays} title="Vencido" value={money(metrics.overdueCents)} foot={`${metrics.overdue.length} cobranças com saldo`} warn={metrics.overdueCents > 0} />
          <Metric icon={Repeat2} title="Mensalidades ativas" value={money(metrics.mrrCents)} foot={`${metrics.activeSubscriptions} contratos · valor mensal`} />
          <Metric icon={FolderKanban} title="Entregas pendentes" value={String(metrics.pendingDelivery)} foot="Projetos fechados ainda em operação" />
          <Metric icon={Clock3} title="Históricos sem cobrança" value={String(metrics.incompleteHistory)} foot={`${money(metrics.unbilledKnownCents)} contratados conhecidos, sem agenda`} warn={metrics.incompleteHistory > 0} />
        </section>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className={card}><h2 className="text-lg font-semibold">Próximas ações</h2><div className="mt-4 space-y-3">
            {snapshot.projects.filter(p => p.stage !== 'perdido' && p.next_action).sort((a,b) => (a.next_action_on ?? '9999').localeCompare(b.next_action_on ?? '9999')).slice(0,6).map(p =>
              <div key={p.id} className="border-t border-white/10 pt-3 text-sm"><p className="font-medium">{p.client_name} · {p.next_action}</p><p className="mt-1 text-xs text-zinc-400">{dateLabel(p.next_action_on)} · {stageName[p.stage]}</p></div>)}
            {!snapshot.projects.some(p => p.stage !== 'perdido' && p.next_action) && <p className="text-sm text-zinc-400">Nenhuma próxima ação cadastrada.</p>}
          </div></section>
          <section className={card}><h2 className="text-lg font-semibold">Cobranças vencidas</h2><div className="mt-4 space-y-3">
            {metrics.overdue.slice(0,6).map(r => <div key={r.id} className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-3 text-sm"><div><p className="font-medium">{r.client_name}</p><p className="text-xs text-zinc-400">{r.description} · {dateLabel(r.due_on)}</p></div><strong className="text-amber-200">{money(r.balance)}</strong></div>)}
            {!metrics.overdue.length && <p className="text-sm text-zinc-400">Nenhuma cobrança vencida.</p>}
          </div></section>
        </div>
      </>}

      {tab === 'projetos' && <Projects snapshot={snapshot} today={today} pending={pending} execute={execute} />}
      {tab === 'financeiro' && <Finance snapshot={snapshot} month={month} today={today} pending={pending} execute={execute} />}
      {tab === 'mensalidades' && <Subscriptions snapshot={snapshot} month={month} today={today} pending={pending} execute={execute} />}
      <p className="mt-10 pb-4 text-xs leading-5 text-zinc-500">Visão operacional da MODS. O cadastro de uma loja e o preço do plano não registram pagamento. Projetos históricos sem valores ou datas confirmadas ficam fora dos totais correspondentes.</p>
    </div>
  </main>
}

function Metric({ icon: Icon, title, value, foot, accent, warn }: { icon: typeof FolderKanban; title: string; value: string; foot: string; accent?: boolean; warn?: boolean }) {
  return <div className={card}><div className="flex items-center gap-2 text-xs text-zinc-400"><Icon size={15} className={accent ? 'text-[#79e2ad]' : warn ? 'text-amber-200' : 'text-zinc-400'} />{title}</div><p className={`mt-4 break-words text-2xl font-semibold tracking-tight ${accent ? 'text-[#c9f7df]' : warn ? 'text-amber-200' : 'text-white'}`}>{value}</p><p className="mt-2 text-xs text-zinc-400">{foot}</p></div>
}

type Executor = (task: () => Promise<Result>) => void
function Projects({ snapshot, today, pending, execute }: { snapshot: CommercialSnapshot; today: string; pending: boolean; execute: Executor }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [kind, setKind] = useState('site')
  const [lead, setLead] = useState('')
  const [client, setClient] = useState('')
  const [title, setTitle] = useState('')
  const [proposed, setProposed] = useState('')
  const [leadOn, setLeadOn] = useState('')
  const [proposalOn, setProposalOn] = useState('')
  const [source, setSource] = useState('')
  const [scope, setScope] = useState('')
  const [historicalClosed, setHistoricalClosed] = useState(false)
  const [wonOn, setWonOn] = useState('')
  const [contracted, setContracted] = useState('')
  const [delivery, setDelivery] = useState('a_iniciar')
  const [externalKey, setExternalKey] = useState('')
  const linked = new Set(snapshot.projects.map(p => p.source_request_id))
  const availableLeads = snapshot.leads.filter(l => !linked.has(l.id))
  return <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
    <section className={card}><h2 className="flex items-center gap-2 text-lg font-semibold"><Plus size={18} className="text-[#79e2ad]" /> Novo projeto</h2><p className="mt-1 text-xs leading-5 text-zinc-400">Para projetos antigos, informe as datas reais. Deixe em branco o que ainda não foi confirmado.</p>
      <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); execute(() => createCommercialProject({ kind, title, client_name: client, source_request_id: lead || undefined, proposed_reais: proposed, lead_on: leadOn, proposal_sent_on: proposalOn, source_note: source, scope, historical_closed: historicalClosed, won_on: wonOn, contracted_reais: contracted, delivery_stage: delivery, external_key: externalKey })) }}>
        <label className={label}>Tipo<select className={field} value={kind} onChange={e => setKind(e.target.value)}>{Object.entries(kindName).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label>
        <label className={label}>Vincular lead de loja<select className={field} value={lead} onChange={e => { setLead(e.target.value); const found = availableLeads.find(l => l.id === e.target.value); if (found) setClient(found.store_name) }}><option value="">Sem vínculo</option>{availableLeads.map(l => <option key={l.id} value={l.id}>{l.store_name}</option>)}</select></label>
        <label className={label}>Cliente / empresa<input className={field} value={client} onChange={e => setClient(e.target.value)} required maxLength={160} placeholder="Nome da empresa" disabled={!!lead} /></label>
        <label className={label}>Projeto<input className={field} value={title} onChange={e => setTitle(e.target.value)} required maxLength={160} placeholder="Site institucional, implantação..." /></label>
        <label className={label}>Valor da proposta, R$<input className={field} inputMode="decimal" value={proposed} onChange={e => setProposed(e.target.value)} placeholder="Ex.: 2.500,00" /></label>
        <label className={label}>Data real do lead<input className={field} type="date" value={leadOn} onChange={e => setLeadOn(e.target.value)} disabled={!!lead} /></label>
        <label className={label}>Proposta enviada em<input className={field} type="date" value={proposalOn} onChange={e => setProposalOn(e.target.value)} /></label>
        <label className={label}>Fonte do histórico<input className={field} value={source} onChange={e => setSource(e.target.value)} maxLength={500} placeholder="Contrato, planilha, conversa..." /></label>
        <label className={label}>Identificador histórico<input className={field} value={externalKey} onChange={e => setExternalKey(e.target.value)} maxLength={120} placeholder="Nº do contrato ou código, se houver" /></label>
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-200 sm:col-span-2"><input type="checkbox" checked={historicalClosed} onChange={e => setHistoricalClosed(e.target.checked)} className="h-5 w-5 accent-[#79e2ad]" />Projeto antigo já fechado; dados financeiros ainda incompletos</label>
        {historicalClosed && <>
          <label className={label}>Data real do fechamento<input className={field} type="date" value={wonOn} onChange={e => setWonOn(e.target.value)} /></label>
          <label className={label}>Valor contratado confirmado, R$<input className={field} inputMode="decimal" value={contracted} onChange={e => setContracted(e.target.value)} placeholder="Deixe vazio se desconhecido" /></label>
          <label className={`${label} sm:col-span-2`}>Situação da entrega<select className={field} value={delivery} onChange={e => setDelivery(e.target.value)}>{Object.entries(deliveryName).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label>
        </>}
        <label className={`${label} sm:col-span-2`}>Escopo / observação<textarea className={`${field} min-h-24`} value={scope} onChange={e => setScope(e.target.value)} maxLength={2000} /></label>
        <button className={`${button} sm:col-span-2`} disabled={pending}>Registrar projeto</button>
      </form>
    </section>
    <section className={card}><h2 className="text-lg font-semibold">Projetos <span className="text-zinc-400">({snapshot.projects.length})</span></h2>
      <div className="mt-4 space-y-3">{snapshot.projects.map(p => <div key={p.id} className="rounded-xl border border-white/10 bg-black/10 p-3">
        <button type="button" onClick={() => setSelected(selected === p.id ? null : p.id)} aria-expanded={selected === p.id} className="w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-[#79e2ad]">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{p.client_name}</p><p className="mt-1 text-xs text-zinc-400">{p.title} · {kindName[p.kind] ?? p.kind}</p></div><Status text={p.history_incomplete ? 'Histórico incompleto' : stageName[p.stage] ?? p.stage} tone={p.history_incomplete ? 'warn' : p.stage === 'fechado' ? 'good' : 'neutral'} /></div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-300"><span>Contrato: {money(p.contracted_cents)}</span><span>Entrega: {deliveryName[p.delivery_stage]}</span><span>Fechamento: {dateLabel(p.won_on)}</span></div>
        </button>
        {selected === p.id && <ProjectDetail key={p.id} project={p} today={today} pending={pending} execute={execute} />}
      </div>)}{!snapshot.projects.length && <p className="text-sm text-zinc-400">Nenhum projeto cadastrado.</p>}</div>
    </section>
  </div>
}

function ProjectDetail({ project: p, today, pending, execute }: { project: Project; today: string; pending: boolean; execute: Executor }) {
  const [stage, setStage] = useState(p.stage)
  const [delivery, setDelivery] = useState(p.delivery_stage)
  const [proposed, setProposed] = useState(p.proposed_cents === null ? '' : String(p.proposed_cents / 100).replace('.', ','))
  const [proposalOn, setProposalOn] = useState(p.proposal_sent_on ?? '')
  const [nextAction, setNextAction] = useState(p.next_action ?? '')
  const [nextOn, setNextOn] = useState(p.next_action_on ?? '')
  const [scope, setScope] = useState(p.scope ?? '')
  const [amount, setAmount] = useState(p.contracted_cents === null ? '' : String(p.contracted_cents / 100).replace('.', ','))
  const [wonOn, setWonOn] = useState(p.history_incomplete ? p.won_on ?? '' : today)
  const [installments, setInstallments] = useState([{ kind: 'entrada', description: 'Entrada', amount_reais: '', due_on: today }])
  const sum = installments.reduce((n, i) => n + (parseReais(i.amount_reais) ?? 0), 0)
  const target = parseReais(amount)
  return <div className="mt-4 border-t border-white/10 pt-4">
    {p.source_note && <p className="mb-3 text-xs text-zinc-400">Fonte: {p.source_note}</p>}
    <p className="mb-3 text-xs text-zinc-400">Lead: {dateLabel(p.lead_on)} · Proposta: {dateLabel(p.proposal_sent_on)}{p.stage === 'fechado' && !p.source_note ? ' · Confira a fonte do histórico' : ''}</p>
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); execute(() => updateCommercialProject(p.id, { stage, delivery_stage: delivery, proposed_reais: proposed, proposal_sent_on: proposalOn, next_action: nextAction, next_action_on: nextOn, scope })) }}>
      <label className={label}>Etapa comercial<select className={field} value={stage} onChange={e => setStage(e.target.value)} disabled={p.stage === 'fechado'}>{[...Object.entries(stageName)].filter(([v]) => v !== 'fechado' || p.stage === 'fechado').map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label>
      <label className={label}>Entrega<select className={field} value={delivery} onChange={e => setDelivery(e.target.value)}>{Object.entries(deliveryName).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label>
      <label className={label}>Proposta, R$<input className={field} inputMode="decimal" value={proposed} onChange={e => setProposed(e.target.value)} /></label>
      <label className={label}>Proposta enviada em<input className={field} type="date" value={proposalOn} onChange={e => setProposalOn(e.target.value)} /></label>
      <label className={label}>Próxima ação<input className={field} value={nextAction} onChange={e => setNextAction(e.target.value)} /></label>
      <label className={label}>Data da ação<input className={field} type="date" value={nextOn} onChange={e => setNextOn(e.target.value)} /></label>
      <label className={`${label} sm:col-span-2`}>Escopo<textarea className={`${field} min-h-20`} value={scope} onChange={e => setScope(e.target.value)} /></label>
      <button className={`${secondary} sm:col-span-2`} disabled={pending}>Salvar acompanhamento</button>
    </form>
    {(p.stage !== 'fechado' || p.history_incomplete) && <form className="mt-5 rounded-xl border border-[#79e2ad]/20 bg-[#79e2ad]/[0.04] p-3" onSubmit={e => { e.preventDefault(); execute(() => closeCommercialProject(p.id, amount, wonOn, installments)) }}>
      <h3 className="font-semibold text-[#c9f7df]">{p.history_incomplete ? 'Completar histórico financeiro' : 'Fechar contrato'}</h3><p className="mt-1 text-xs leading-5 text-zinc-400">Use a data real do acordo, inclusive para projetos antigos. Entrada e parcelas devem somar o total exato.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className={label}>Valor contratado, R$<input className={field} inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} required /></label><label className={label}>Fechado em<input className={field} type="date" value={wonOn} onChange={e => setWonOn(e.target.value)} required /></label></div>
      <div className="mt-4 space-y-3">{installments.map((item, index) => <div key={index} className="grid gap-2 rounded-lg border border-white/10 p-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <label className={label}>Tipo<select className={field} value={item.kind} onChange={e => setInstallments(rows => rows.map((r,i) => i === index ? { ...r, kind: e.target.value } : r))}><option value="entrada">Entrada</option><option value="parcela">Parcela</option></select></label>
        <label className={label}>Valor, R$<input className={field} inputMode="decimal" value={item.amount_reais} onChange={e => setInstallments(rows => rows.map((r,i) => i === index ? { ...r, amount_reais: e.target.value } : r))} required /></label>
        <label className={label}>Vencimento<input className={field} type="date" value={item.due_on} onChange={e => setInstallments(rows => rows.map((r,i) => i === index ? { ...r, due_on: e.target.value } : r))} required /></label>
        <button type="button" aria-label={`Remover parcela ${index + 1}`} className={`${secondary} self-end`} onClick={() => setInstallments(rows => rows.filter((_,i) => i !== index))}>×</button>
      </div>)}</div>
      <button type="button" className={`${secondary} mt-3`} onClick={() => setInstallments(rows => [...rows, { kind: 'parcela', description: `Parcela ${rows.length}`, amount_reais: '', due_on: today }])}>+ Parcela</button>
      <p className={`mt-3 text-sm ${target !== null && target === sum ? 'text-[#c9f7df]' : 'text-amber-200'}`}>Agenda: {money(sum)} / Contrato: {money(target)}</p>
      <button className={`${button} mt-3 w-full`} disabled={pending || target === null || target !== sum}>Confirmar fechamento</button>
    </form>}
  </div>
}

function Finance({ snapshot, month, today, pending, execute }: { snapshot: CommercialSnapshot; month: string; today: string; pending: boolean; execute: Executor }) {
  const [filter, setFilter] = useState('abertas')
  const paid = new Map<string, number>()
  snapshot.receipts.filter(r => !r.voided_at).forEach(r => paid.set(r.receivable_id, (paid.get(r.receivable_id) ?? 0) + r.amount_cents))
  const rows = snapshot.receivables.filter(r => !r.canceled_at).map(r => ({ ...r, balance: Math.max(0, r.amount_cents - (paid.get(r.id) ?? 0)) }))
    .filter(r => filter === 'todas' || filter === 'abertas' && r.balance > 0 || filter === 'vencidas' && r.balance > 0 && r.due_on < today || filter === 'mes' && r.due_on.slice(0,7) === month)
  return <section className={`${card} mt-6`}><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Contas a receber</h2><p className="mt-1 text-xs text-zinc-400">Vencimento, saldo e pagamentos reais de cada cobrança.</p></div><label className={`${label} w-full sm:w-44`}>Mostrar<select className={field} value={filter} onChange={e => setFilter(e.target.value)}><option value="abertas">Em aberto</option><option value="vencidas">Vencidas</option><option value="mes">Vencem no mês</option><option value="todas">Todas</option></select></label></div>
    <div className="mt-5 grid gap-3">{rows.map(r => <ReceivableCard key={r.id} receivable={r} balance={r.balance} receipts={snapshot.receipts.filter(x => x.receivable_id === r.id)} today={today} pending={pending} execute={execute} />)}{!rows.length && <p className="py-6 text-sm text-zinc-400">Nenhuma cobrança neste filtro.</p>}</div>
  </section>
}
function ReceivableCard({ receivable: r, balance, receipts, today, pending, execute }: { receivable: Receivable; balance: number; receipts: CommercialSnapshot['receipts']; today: string; pending: boolean; execute: Executor }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [receivedOn, setReceivedOn] = useState(today)
  const [method, setMethod] = useState('pix')
  const [reference, setReference] = useState('')
  const [operation, setOperation] = useState(() => crypto.randomUUID())
  return <div className="rounded-xl border border-white/10 bg-black/10 p-3 sm:p-4">
    <div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{r.client_name}</p><p className="mt-1 text-xs text-zinc-400">{r.description} · vence {dateLabel(r.due_on)}</p><div className="mt-2 flex gap-2"><Status text={r.kind} /><Status text={balance === 0 ? 'Quitada' : r.due_on < today ? 'Vencida' : 'Em aberto'} tone={balance === 0 ? 'good' : r.due_on < today ? 'warn' : 'neutral'} /></div></div><div className="text-left sm:text-right"><p className="text-lg font-semibold text-[#c9f7df]">{money(balance)}</p><p className="text-xs text-zinc-400">de {money(r.amount_cents)}</p></div></div>
    <button type="button" className={`${secondary} mt-3`} onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Fechar detalhes' : 'Ver e registrar pagamento'}</button>
    {open && <div className="mt-4 border-t border-white/10 pt-4"><h3 className="text-sm font-semibold">Recebimentos</h3><div className="mt-2 space-y-2">{receipts.map(x => <div key={x.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300"><span>{dateLabel(x.received_on)} · {money(x.amount_cents)} · {x.method}{x.reference ? ` · ${x.reference}` : ''}{x.voided_at ? ' · ESTORNADO' : ''}</span>{!x.voided_at && <button type="button" className="min-h-11 cursor-pointer text-red-200 underline" onClick={() => { const reason = window.prompt('Motivo do estorno (mínimo 5 caracteres):'); if (reason) execute(() => voidCommercialReceipt(x.id, reason)) }} disabled={pending}>Estornar</button>}</div>)}{!receipts.length && <p className="text-xs text-zinc-500">Nenhum pagamento registrado.</p>}</div>
      {balance > 0 && <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={e => { e.preventDefault(); execute(async () => { const result = await recordCommercialReceipt({ receivable_id: r.id, operation_id: operation, amount_reais: amount, received_on: receivedOn, method, reference }); if (result.ok) setOperation(crypto.randomUUID()); return result }) }}>
        <label className={label}>Valor recebido, R$<input className={field} inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="Até o saldo" /></label>
        <label className={label}>Recebido em<input className={field} type="date" value={receivedOn} onChange={e => setReceivedOn(e.target.value)} required /></label>
        <label className={label}>Meio<select className={field} value={method} onChange={e => setMethod(e.target.value)}>{['pix','transferencia','boleto','cartao','dinheiro','outro'].map(v => <option key={v} value={v}>{v}</option>)}</select></label>
        <label className={label}>Referência<input className={field} value={reference} onChange={e => setReference(e.target.value)} placeholder="Opcional" /></label>
        <button className={`${button} sm:col-span-2 lg:col-span-4`} disabled={pending || (parseReais(amount) ?? 0) > balance}>Registrar recebimento</button>
      </form>}
    </div>}
  </div>
}

function Subscriptions({ snapshot, month, today, pending, execute }: { snapshot: CommercialSnapshot; month: string; today: string; pending: boolean; execute: Executor }) {
  const [projectId, setProjectId] = useState('')
  const [storeId, setStoreId] = useState('')
  const [client, setClient] = useState('')
  const [description, setDescription] = useState('Mensalidade MODS')
  const [monthly, setMonthly] = useState('')
  const [day, setDay] = useState(10)
  const [starts, setStarts] = useState(today)
  const [ends, setEnds] = useState('')
  return <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
    <section className={card}><h2 className="text-lg font-semibold">Novo acordo mensal</h2><p className="mt-1 text-xs leading-5 text-zinc-400">O acordo não lança pagamentos. Gere uma cobrança para cada competência confirmada.</p>
      <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); execute(() => createCommercialSubscription({ project_id: projectId || undefined, store_id: storeId || undefined, client_name: client, description, monthly_reais: monthly, billing_day: day, starts_on: starts, ends_on: ends || undefined })) }}>
        <label className={label}>Projeto vinculado<select className={field} value={projectId} onChange={e => { setProjectId(e.target.value); const found = snapshot.projects.find(p => p.id === e.target.value); if (found) setClient(found.client_name) }}><option value="">Sem vínculo</option>{snapshot.projects.map(p => <option key={p.id} value={p.id}>{p.client_name} · {p.title}</option>)}</select></label>
        <label className={label}>Loja vinculada<select className={field} value={storeId} onChange={e => setStoreId(e.target.value)}><option value="">Sem vínculo</option>{snapshot.stores.map(s => <option key={s.id} value={s.id}>{s.store_config?.[0]?.store_name ?? s.slug}</option>)}</select></label>
        <label className={label}>Cliente<input className={field} value={client} onChange={e => setClient(e.target.value)} disabled={!!projectId} required /></label>
        <label className={label}>Descrição<input className={field} value={description} onChange={e => setDescription(e.target.value)} required /></label>
        <label className={label}>Valor mensal, R$<input className={field} inputMode="decimal" value={monthly} onChange={e => setMonthly(e.target.value)} required /></label>
        <label className={label}>Dia de vencimento (1 a 28)<input className={field} type="number" min={1} max={28} value={day} onChange={e => setDay(Number(e.target.value))} required /></label>
        <label className={label}>Início real<input className={field} type="date" value={starts} onChange={e => setStarts(e.target.value)} required /></label>
        <label className={label}>Fim, se houver<input className={field} type="date" value={ends} onChange={e => setEnds(e.target.value)} /></label>
        <button className={`${button} sm:col-span-2`} disabled={pending}>Registrar mensalidade</button>
      </form>
    </section>
    <section className={card}><h2 className="text-lg font-semibold">Acordos <span className="text-zinc-400">({snapshot.subscriptions.length})</span></h2><div className="mt-4 space-y-3">
      {snapshot.subscriptions.map(s => <SubscriptionCard key={s.id} subscription={s} month={month} pending={pending} execute={execute} />)}
      {!snapshot.subscriptions.length && <p className="text-sm text-zinc-400">Nenhuma mensalidade cadastrada.</p>}
    </div></section>
  </div>
}
function SubscriptionCard({ subscription: s, month, pending, execute }: { subscription: Subscription; month: string; pending: boolean; execute: Executor }) {
  const [competence, setCompetence] = useState(month)
  return <div className="rounded-xl border border-white/10 bg-black/10 p-3"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{s.client_name}</p><p className="mt-1 text-xs text-zinc-400">{s.description} · dia {s.billing_day} · desde {dateLabel(s.starts_on)}</p></div><div className="text-left sm:text-right"><p className="font-semibold text-[#c9f7df]">{money(s.monthly_cents)}/mês</p><Status text={s.status} tone={s.status === 'ativa' ? 'good' : 'neutral'} /></div></div>
    <div className="mt-3 flex flex-wrap gap-2"><select aria-label="Estado da mensalidade" className={`${field} max-w-44`} value={s.status} onChange={e => execute(() => setSubscriptionStatus(s.id, e.target.value))} disabled={pending}><option value="ativa">Ativa</option><option value="pausada">Pausada</option><option value="encerrada">Encerrada</option></select><input type="month" aria-label="Competência" className={`${field} max-w-44`} value={competence} onChange={e => setCompetence(e.target.value)} /><button className={secondary} disabled={pending || s.status !== 'ativa'} onClick={() => execute(() => generateMonthlyCharge(s.id, competence))}>Gerar cobrança</button></div>
  </div>
}
