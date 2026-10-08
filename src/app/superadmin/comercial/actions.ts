'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { ensureSuperadmin } from '../actions'
import { parseReais, saoPauloDate, validDate, type CommercialSnapshot, type Project, type Receivable, type Receipt, type Subscription } from './model'

type Result = { ok: true; message: string } | { ok: false; error: string }
type InputProject = {
  kind: string; title: string; client_name: string; contact_name?: string; contact_email?: string;
  contact_whatsapp?: string; source_request_id?: string; store_id?: string; proposed_reais?: string;
  lead_on?: string; proposal_sent_on?: string; next_action_on?: string; next_action?: string;
  scope?: string; source_note?: string; external_key?: string; historical_closed?: boolean;
  won_on?: string; contracted_reais?: string; delivery_stage?: string;
}
type Installment = { kind: string; description: string; amount_reais: string; due_on: string }

const PROJECT_KINDS = ['site','sistema','erp','loja','outro']
const STAGES = ['novo','qualificado','proposta','negociacao','perdido']
const DELIVERY = ['a_iniciar','em_execucao','aguardando_cliente','entregue','cancelado']
const METHODS = ['pix','transferencia','boleto','cartao','dinheiro','outro']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function context() {
  const blocked = await ensureSuperadmin()
  if (blocked) throw new Error(blocked.error)
  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('Conexão administrativa indisponível.')
  return { admin, actor: (process.env.SUPERADMIN_EMAIL ?? '').trim().toLowerCase() }
}
function done(message: string): Result { revalidatePath('/superadmin/comercial'); return { ok: true, message } }
function fail(error: unknown): Result { return { ok: false, error: error instanceof Error ? error.message : 'Falha ao salvar.' } }
function limited(value: string | null | undefined, max = 300): string | null { return value?.trim().slice(0, max) || null }
function optionalDate(value: string | undefined): string | null {
  if (!value) return null
  if (!validDate(value)) throw new Error('Data inválida.')
  return value
}
function cents(value: string, allowZero = false): number {
  const parsed = parseReais(value)
  if (parsed === null || (!allowZero && parsed === 0)) throw new Error('Informe um valor válido em reais.')
  return parsed
}

export async function loadCommercial(): Promise<CommercialSnapshot> {
  const { admin } = await context()
  const queries = await Promise.all([
    admin.from('commercial_projects').select('*').order('created_at', { ascending: false }).limit(1000),
    admin.from('commercial_subscriptions').select('*').order('created_at', { ascending: false }).limit(1000),
    admin.from('commercial_receivables').select('*').order('due_on', { ascending: true }).limit(1000),
    admin.from('commercial_receipts').select('*').order('received_on', { ascending: false }).limit(1000),
    admin.from('store_requests').select('id,store_name,contact_name,email,whatsapp,created_at').order('created_at', { ascending: false }).limit(1000),
    admin.from('stores').select('id,slug,store_config(store_name)').order('created_at', { ascending: false }).limit(1000),
  ])
  for (const query of queries) if (query.error) throw new Error(`Falha ao carregar dados comerciais: ${query.error.message}`)
  if (queries.some(query => (query.data?.length ?? 0) === 1000)) throw new Error('O painel atingiu o limite de 1.000 registros por coleção. Paginação é necessária antes de apresentar totais confiáveis.')
  return {
    projects: (queries[0].data ?? []) as Project[], subscriptions: (queries[1].data ?? []) as Subscription[],
    receivables: (queries[2].data ?? []) as Receivable[], receipts: (queries[3].data ?? []) as Receipt[],
    leads: (queries[4].data ?? []) as CommercialSnapshot['leads'], stores: (queries[5].data ?? []) as CommercialSnapshot['stores'],
  }
}

export async function createCommercialProject(input: InputProject): Promise<Result> {
  try {
    const { admin } = await context()
    if (!PROJECT_KINDS.includes(input.kind)) throw new Error('Tipo de projeto inválido.')
    if (!input.title?.trim() || input.title.length > 160) throw new Error('Informe um título de até 160 caracteres.')
    let client = limited(input.client_name, 160)
    let contactName = limited(input.contact_name, 160)
    let email = limited(input.contact_email, 255)
    let whatsapp = limited(input.contact_whatsapp, 40)
    let leadOn = optionalDate(input.lead_on)
    const requestId = input.source_request_id || null
    if (requestId) {
      if (!UUID.test(requestId)) throw new Error('Lead inválido.')
      const { data, error } = await admin.from('store_requests').select('store_name,contact_name,email,whatsapp,created_at').eq('id', requestId).single()
      if (error || !data) throw new Error('Lead não encontrado.')
      client = data.store_name; contactName = data.contact_name; email = data.email; whatsapp = data.whatsapp
      leadOn = saoPauloDate(data.created_at) // preserva o histórico se o lead for excluído
    }
    if (!client) throw new Error('Informe o cliente.')
    if (input.store_id && !UUID.test(input.store_id)) throw new Error('Loja inválida.')
    const proposed = input.proposed_reais?.trim() ? cents(input.proposed_reais, true) : null
    const proposalSent = optionalDate(input.proposal_sent_on)
    const wonOn = optionalDate(input.won_on)
    const contracted = input.contracted_reais?.trim() ? cents(input.contracted_reais, true) : null
    if (!input.historical_closed && (wonOn || contracted !== null)) throw new Error('Fechamento histórico exige marcar o projeto como já fechado.')
    if (input.historical_closed && !input.source_note?.trim()) throw new Error('Informe a fonte ou pendência do histórico.')
    if (input.delivery_stage && !DELIVERY.includes(input.delivery_stage)) throw new Error('Etapa de entrega inválida.')
    const { error } = await admin.from('commercial_projects').insert({
      kind: input.kind, title: input.title.trim(), client_name: client, contact_name: contactName,
      contact_email: email, contact_whatsapp: whatsapp, source_request_id: requestId,
      store_id: input.store_id || null, proposed_cents: proposed, lead_on: leadOn,
      proposal_sent_on: proposalSent, won_on: input.historical_closed ? wonOn : null,
      contracted_cents: input.historical_closed ? contracted : null,
      history_incomplete: Boolean(input.historical_closed),
      stage: input.historical_closed ? 'fechado' : proposalSent ? 'proposta' : 'novo',
      delivery_stage: input.delivery_stage || 'a_iniciar',
      next_action_on: optionalDate(input.next_action_on), next_action: limited(input.next_action),
      scope: limited(input.scope, 2000), source_note: limited(input.source_note, 500),
      external_key: limited(input.external_key, 120),
    })
    if (error) throw new Error(error.code === '23505' ? 'Este lead ou identificador histórico já está ligado a um projeto.' : error.message)
    return done('Projeto registrado.')
  } catch (error) { return fail(error) }
}

export async function updateCommercialProject(id: string, input: {
  stage: string; delivery_stage: string; proposed_reais: string; proposal_sent_on: string;
  next_action: string; next_action_on: string; scope: string;
}): Promise<Result> {
  try {
    const { admin } = await context()
    if (!UUID.test(id) || !DELIVERY.includes(input.delivery_stage)) throw new Error('Projeto ou etapa inválida.')
    const { data: current, error: readError } = await admin.from('commercial_projects').select('stage,proposed_cents,proposal_sent_on,delivery_stage').eq('id', id).single()
    if (readError || !current) throw new Error('Projeto não encontrado.')
    if (current.stage !== 'fechado' && !STAGES.includes(input.stage)) throw new Error('Etapa comercial inválida.')
    if (current.stage === 'fechado' && input.stage !== 'fechado') throw new Error('Contrato fechado não volta ao funil sem ajuste financeiro.')
    const proposed = input.proposed_reais?.trim() ? cents(input.proposed_reais, true) : null
    const proposalSent = optionalDate(input.proposal_sent_on)
    const { error } = await admin.from('commercial_projects').update({
      stage: current.stage === 'fechado' ? 'fechado' : input.stage,
      delivery_stage: input.delivery_stage, proposed_cents: proposed, proposal_sent_on: proposalSent,
      next_action: limited(input.next_action), next_action_on: optionalDate(input.next_action_on),
      scope: limited(input.scope, 2000), updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) throw new Error(error.message)
    return done('Projeto atualizado.')
  } catch (error) { return fail(error) }
}

export async function closeCommercialProject(id: string, amountReais: string, wonOn: string, schedule: Installment[]): Promise<Result> {
  try {
    const { admin, actor } = await context()
    if (!UUID.test(id) || !validDate(wonOn)) throw new Error('Projeto ou data de fechamento inválida.')
    const amount = cents(amountReais, true)
    if (!Array.isArray(schedule) || schedule.length > 60) throw new Error('Agenda de cobrança inválida.')
    const installments = schedule.map(item => {
      if (!['entrada','parcela'].includes(item.kind) || !validDate(item.due_on)) throw new Error('Entrada ou parcela inválida.')
      return { kind: item.kind, description: limited(item.description, 160), amount_cents: cents(item.amount_reais), due_on: item.due_on }
    })
    if (installments.reduce((sum, item) => sum + item.amount_cents, 0) !== amount) throw new Error('A soma da entrada e das parcelas precisa ser igual ao contrato.')
    const { error } = await admin.rpc('commercial_close_project', {
      p_project_id: id, p_amount_cents: amount, p_won_on: wonOn, p_schedule: installments, p_actor: actor,
    })
    if (error) throw new Error(error.message)
    return done('Contrato fechado e cobranças criadas.')
  } catch (error) { return fail(error) }
}

export async function createCommercialSubscription(input: {
  project_id?: string; store_id?: string; client_name: string; description: string;
  monthly_reais: string; billing_day: number; starts_on: string; ends_on?: string;
}): Promise<Result> {
  try {
    const { admin } = await context()
    if (!validDate(input.starts_on) || (input.ends_on && (!validDate(input.ends_on) || input.ends_on < input.starts_on))) throw new Error('Período inválido.')
    if (!Number.isInteger(input.billing_day) || input.billing_day < 1 || input.billing_day > 28) throw new Error('Dia de cobrança deve ficar entre 1 e 28.')
    if (input.project_id && !UUID.test(input.project_id)) throw new Error('Projeto inválido.')
    if (input.store_id && !UUID.test(input.store_id)) throw new Error('Loja inválida.')
    let clientName = limited(input.client_name, 160)
    if (input.project_id) {
      const { data } = await admin.from('commercial_projects').select('client_name').eq('id', input.project_id).single()
      if (!data) throw new Error('Projeto não encontrado.')
      clientName = data.client_name
    }
    if (!clientName) throw new Error('Informe o cliente.')
    const { error } = await admin.from('commercial_subscriptions').insert({
      project_id: input.project_id || null, store_id: input.store_id || null, client_name: clientName,
      description: limited(input.description, 160) ?? 'Mensalidade MODS',
      monthly_cents: cents(input.monthly_reais), billing_day: input.billing_day,
      starts_on: input.starts_on, ends_on: input.ends_on || null,
    })
    if (error) throw new Error(error.message)
    return done('Mensalidade acordada registrada. Nenhuma cobrança retroativa foi criada.')
  } catch (error) { return fail(error) }
}

export async function setSubscriptionStatus(id: string, status: string): Promise<Result> {
  try {
    const { admin } = await context()
    if (!UUID.test(id) || !['ativa','pausada','encerrada'].includes(status)) throw new Error('Mensalidade inválida.')
    const { error } = await admin.from('commercial_subscriptions').update({ status }).eq('id', id)
    if (error) throw new Error(error.message)
    return done('Estado da mensalidade atualizado.')
  } catch (error) { return fail(error) }
}

export async function generateMonthlyCharge(id: string, competence: string): Promise<Result> {
  try {
    const { admin, actor } = await context()
    if (!UUID.test(id) || !/^\d{4}-\d{2}$/.test(competence) || !validDate(`${competence}-01`)) throw new Error('Competência inválida.')
    const { error } = await admin.rpc('commercial_create_monthly_charge', {
      p_subscription_id: id, p_competence: `${competence}-01`, p_actor: actor,
    })
    if (error) throw new Error(error.code === '23505' ? 'Esta competência já foi lançada.' : error.message)
    return done('Cobrança mensal gerada.')
  } catch (error) { return fail(error) }
}

export async function recordCommercialReceipt(input: {
  receivable_id: string; operation_id: string; amount_reais: string; received_on: string;
  method: string; reference?: string;
}): Promise<Result> {
  try {
    const { admin, actor } = await context()
    if (!UUID.test(input.receivable_id) || !UUID.test(input.operation_id) || !validDate(input.received_on) || !METHODS.includes(input.method)) throw new Error('Recebimento inválido.')
    const { error } = await admin.rpc('commercial_record_receipt', {
      p_receivable_id: input.receivable_id, p_operation_id: input.operation_id,
      p_amount_cents: cents(input.amount_reais), p_received_on: input.received_on,
      p_method: input.method, p_reference: limited(input.reference, 200), p_actor: actor,
    })
    if (error) throw new Error(error.message)
    return done('Recebimento registrado.')
  } catch (error) { return fail(error) }
}

export async function voidCommercialReceipt(id: string, reason: string): Promise<Result> {
  try {
    const { admin, actor } = await context()
    if (!UUID.test(id) || !reason?.trim() || reason.trim().length < 5) throw new Error('Informe um motivo de pelo menos 5 caracteres.')
    const { error } = await admin.rpc('commercial_void_receipt', { p_receipt_id: id, p_reason: reason.trim().slice(0, 500), p_actor: actor })
    if (error) throw new Error(error.message)
    return done('Recebimento estornado. O histórico foi preservado.')
  } catch (error) { return fail(error) }
}
