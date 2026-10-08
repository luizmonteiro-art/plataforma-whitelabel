export type Project = {
  id: string; external_key: string | null; kind: string; title: string; client_name: string;
  contact_name: string | null; contact_email: string | null; contact_whatsapp: string | null;
  source_request_id: string | null; store_id: string | null; stage: string; history_incomplete: boolean; delivery_stage: string;
  proposed_cents: number | null; contracted_cents: number | null; lead_on: string | null;
  proposal_sent_on: string | null; won_on: string | null; next_action_on: string | null;
  next_action: string | null; scope: string | null; source_note: string | null; created_at: string;
}
export type Subscription = {
  id: string; project_id: string | null; store_id: string | null; client_name: string;
  description: string; monthly_cents: number; billing_day: number; starts_on: string;
  ends_on: string | null; status: string;
}
export type Receivable = {
  id: string; project_id: string | null; subscription_id: string | null; client_name: string;
  kind: string; description: string; amount_cents: number; due_on: string;
  competence_month: string | null; canceled_at: string | null;
}
export type Receipt = {
  id: string; receivable_id: string; amount_cents: number; received_on: string;
  method: string; reference: string | null; created_by: string; voided_at: string | null;
  void_reason: string | null;
}
export type CommercialSnapshot = {
  projects: Project[]; subscriptions: Subscription[]; receivables: Receivable[];
  receipts: Receipt[];
  leads: { id: string; store_name: string; contact_name: string; email: string; whatsapp: string; created_at: string }[];
  stores: { id: string; slug: string; store_config: { store_name: string }[] | null }[];
}

export function parseReais(raw: string): number | null {
  const input = raw.trim().replace(/^R\$\s*/, '').replace(/\s/g, '')
  if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(input)) return null
  const [whole, fraction = ''] = input.replace(/\./g, '').split(',')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : null
}

export function money(cents: number | null | undefined): string {
  return cents === null || cents === undefined ? 'Não informado'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export function validDate(value: string | null | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

export function saoPauloDate(timestamp: string): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.valueOf())) throw new Error('Data de origem inválida.')
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
}

export function monthMetrics(snapshot: CommercialSnapshot, month: string, today: string) {
  const inMonth = (value: string | null | undefined) => value?.slice(0, 7) === month
  const existingLeads = new Set(snapshot.leads.map(l => l.id))
  const leads = snapshot.leads.filter(l => l.created_at && inMonth(saoPauloDate(l.created_at))).length
    + snapshot.projects.filter(p => (!p.source_request_id || !existingLeads.has(p.source_request_id)) && inMonth(p.lead_on)).length
  const proposals = snapshot.projects.filter(p => inMonth(p.proposal_sent_on))
  const won = snapshot.projects.filter(p => inMonth(p.won_on) && p.stage === 'fechado')
  const validReceipts = snapshot.receipts.filter(r => !r.voided_at)
  const paid = new Map<string, number>()
  validReceipts.forEach(r => paid.set(r.receivable_id, (paid.get(r.receivable_id) ?? 0) + r.amount_cents))
  const open = snapshot.receivables.filter(r => !r.canceled_at).map(r => ({
    ...r, balance: Math.max(0, r.amount_cents - (paid.get(r.id) ?? 0)),
  })).filter(r => r.balance > 0)
  const activeSubscriptions = snapshot.subscriptions.filter(s => s.status === 'ativa' && s.starts_on <= today && (!s.ends_on || s.ends_on >= today))
  const unbilledProjects = snapshot.projects.filter(p => p.history_incomplete && p.stage === 'fechado'
    && !snapshot.receivables.some(r => r.project_id === p.id && r.kind !== 'mensalidade' && !r.canceled_at))
  return {
    leads,
    proposals: proposals.length, unpricedProposals: proposals.filter(p => p.proposed_cents === null).length,
    proposedCents: proposals.reduce((a, p) => a + (p.proposed_cents ?? 0), 0),
    won: won.length, unpricedWon: won.filter(p => p.contracted_cents === null).length,
    contractedCents: won.reduce((a, p) => a + (p.contracted_cents ?? 0), 0),
    receivedCents: validReceipts.filter(r => inMonth(r.received_on)).reduce((a, r) => a + r.amount_cents, 0),
    openCents: open.reduce((a, r) => a + r.balance, 0),
    dueMonthCents: open.filter(r => inMonth(r.due_on)).reduce((a, r) => a + r.balance, 0),
    overdueCents: open.filter(r => r.due_on < today).reduce((a, r) => a + r.balance, 0),
    overdue: open.filter(r => r.due_on < today),
    incompleteHistory: unbilledProjects.length,
    unbilledKnownCents: unbilledProjects.reduce((a, p) => a + (p.contracted_cents ?? 0), 0),
    activeSubscriptions: activeSubscriptions.length,
    mrrCents: activeSubscriptions.reduce((a, s) => a + s.monthly_cents, 0),
    pendingDelivery: snapshot.projects.filter(p => p.stage === 'fechado' && !['entregue','cancelado'].includes(p.delivery_stage)).length,
    open,
  }
}
