-- Comercial da MODS. Independente das vendas e do financeiro de cada loja.
begin;

create table if not exists public.commercial_projects (
  id uuid primary key default gen_random_uuid(),
  external_key text unique,
  kind text not null check (kind in ('site','sistema','erp','loja','outro')),
  title text not null check (length(trim(title)) > 0),
  client_name text not null check (length(trim(client_name)) > 0),
  contact_name text,
  contact_email text,
  contact_whatsapp text,
  source_request_id uuid unique references public.store_requests(id) on delete set null,
  store_id uuid references public.stores(id) on delete set null,
  stage text not null default 'novo' check (stage in ('novo','qualificado','proposta','negociacao','fechado','perdido')),
  history_incomplete boolean not null default false,
  delivery_stage text not null default 'a_iniciar' check (delivery_stage in ('a_iniciar','em_execucao','aguardando_cliente','entregue','cancelado')),
  proposed_cents bigint check (proposed_cents >= 0),
  contracted_cents bigint check (contracted_cents >= 0),
  lead_on date,
  proposal_sent_on date,
  won_on date,
  next_action_on date,
  next_action text,
  scope text,
  source_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (stage <> 'fechado' or history_incomplete or (contracted_cents is not null and won_on is not null)),
  check (not history_incomplete or stage = 'fechado')
);

create table if not exists public.commercial_subscriptions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.commercial_projects(id) on delete set null,
  store_id uuid references public.stores(id) on delete set null,
  client_name text not null check (length(trim(client_name)) > 0),
  description text not null default 'Mensalidade MODS',
  monthly_cents bigint not null check (monthly_cents > 0),
  billing_day integer not null check (billing_day between 1 and 28),
  starts_on date not null,
  ends_on date,
  status text not null default 'ativa' check (status in ('ativa','pausada','encerrada')),
  created_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create table if not exists public.commercial_receivables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.commercial_projects(id) on delete set null,
  subscription_id uuid references public.commercial_subscriptions(id) on delete set null,
  client_name text not null check (length(trim(client_name)) > 0),
  kind text not null check (kind in ('entrada','parcela','mensalidade','ajuste')),
  description text not null,
  amount_cents bigint not null check (amount_cents > 0),
  due_on date not null,
  competence_month date,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  check (project_id is not null or subscription_id is not null),
  check (kind <> 'mensalidade' or (subscription_id is not null and competence_month is not null)),
  check (competence_month is null or extract(day from competence_month) = 1),
  unique (subscription_id, competence_month)
);

create table if not exists public.commercial_receipts (
  id uuid primary key default gen_random_uuid(),
  receivable_id uuid not null references public.commercial_receivables(id) on delete restrict,
  operation_id uuid not null unique,
  amount_cents bigint not null check (amount_cents > 0),
  received_on date not null,
  method text not null check (method in ('pix','transferencia','boleto','cartao','dinheiro','outro')),
  reference text,
  created_by text not null,
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  void_reason text
);

create table if not exists public.commercial_events (
  id bigint generated always as identity primary key,
  project_id uuid references public.commercial_projects(id) on delete set null,
  receivable_id uuid references public.commercial_receivables(id) on delete set null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  actor text not null,
  created_at timestamptz not null default now()
);

create index if not exists commercial_projects_won_idx on public.commercial_projects(won_on);
create index if not exists commercial_projects_lead_idx on public.commercial_projects(lead_on);
create index if not exists commercial_receivables_due_idx on public.commercial_receivables(due_on) where canceled_at is null;
create index if not exists commercial_receipts_received_idx on public.commercial_receipts(received_on) where voided_at is null;
create index if not exists commercial_events_project_idx on public.commercial_events(project_id, created_at desc);

alter table public.commercial_projects enable row level security;
alter table public.commercial_subscriptions enable row level security;
alter table public.commercial_receivables enable row level security;
alter table public.commercial_receipts enable row level security;
alter table public.commercial_events enable row level security;

revoke all on public.commercial_projects, public.commercial_subscriptions,
  public.commercial_receivables, public.commercial_receipts, public.commercial_events from anon, authenticated;
revoke all on sequence public.commercial_events_id_seq from anon, authenticated;
grant all on public.commercial_projects, public.commercial_subscriptions,
  public.commercial_receivables, public.commercial_receipts, public.commercial_events to service_role;
grant usage, select on sequence public.commercial_events_id_seq to service_role;

create or replace function public.commercial_audit_project() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  insert into public.commercial_events(project_id,event_type,details,actor)
  values (new.id, case when tg_op = 'INSERT' then 'project_created' else 'project_changed' end,
    case when tg_op = 'INSERT'
      then jsonb_build_object('client_name',new.client_name,'kind',new.kind,'lead_on',new.lead_on)
      else jsonb_build_object('stage_before',old.stage,'stage_after',new.stage,
        'delivery_before',old.delivery_stage,'delivery_after',new.delivery_stage,
        'proposed_before',old.proposed_cents,'proposed_after',new.proposed_cents,
        'contracted_before',old.contracted_cents,'contracted_after',new.contracted_cents,
        'won_before',old.won_on,'won_after',new.won_on) end,
    'superadmin');
  return new;
end $$;
drop trigger if exists commercial_project_audit on public.commercial_projects;
create trigger commercial_project_audit after insert or update on public.commercial_projects
for each row execute function public.commercial_audit_project();

create or replace function public.commercial_audit_subscription() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  insert into public.commercial_events(project_id,event_type,details,actor)
  values (new.project_id, case when tg_op = 'INSERT' then 'subscription_created' else 'subscription_changed' end,
    jsonb_build_object('subscription_id',new.id,'client_name',new.client_name,
      'status_before',case when tg_op = 'UPDATE' then old.status else null end,
      'status_after',new.status,'monthly_cents',new.monthly_cents), 'superadmin');
  return new;
end $$;
drop trigger if exists commercial_subscription_audit on public.commercial_subscriptions;
create trigger commercial_subscription_audit after insert or update on public.commercial_subscriptions
for each row execute function public.commercial_audit_subscription();

-- Fechamento e agenda financeira entram juntos. Uma falha reverte tudo.
create or replace function public.commercial_close_project(
  p_project_id uuid, p_amount_cents bigint, p_won_on date,
  p_schedule jsonb, p_actor text
) returns void language plpgsql security invoker set search_path = public as $$
declare
  v_project public.commercial_projects%rowtype;
  v_item jsonb;
  v_sum bigint := 0;
  v_count integer := 0;
  v_kind text;
  v_amount bigint;
  v_due date;
begin
  select * into v_project from public.commercial_projects where id = p_project_id for update;
  if not found then raise exception 'Projeto não encontrado'; end if;
  if v_project.stage = 'fechado' and not v_project.history_incomplete then raise exception 'Projeto já fechado'; end if;
  if v_project.history_incomplete and v_project.contracted_cents is not null and v_project.contracted_cents <> p_amount_cents then
    raise exception 'Valor confirmado do histórico difere do contrato';
  end if;
  if v_project.history_incomplete and v_project.won_on is not null and v_project.won_on <> p_won_on then
    raise exception 'Data confirmada do histórico difere do fechamento';
  end if;
  if p_amount_cents is null or p_amount_cents < 0 or p_won_on is null or jsonb_typeof(p_schedule) <> 'array' then
    raise exception 'Contrato ou agenda inválida';
  end if;
  for v_item in select value from jsonb_array_elements(p_schedule) loop
    v_kind := v_item->>'kind';
    v_amount := (v_item->>'amount_cents')::bigint;
    v_due := (v_item->>'due_on')::date;
    if v_kind not in ('entrada','parcela') or v_amount <= 0 or v_due is null then
      raise exception 'Parcela inválida';
    end if;
    v_sum := v_sum + v_amount;
    v_count := v_count + 1;
  end loop;
  if v_sum <> p_amount_cents or (p_amount_cents > 0 and v_count = 0) then
    raise exception 'A agenda deve somar exatamente o valor do contrato';
  end if;
  update public.commercial_projects set stage = 'fechado', history_incomplete = false, contracted_cents = p_amount_cents,
    won_on = p_won_on, updated_at = now() where id = p_project_id;
  for v_item in select value from jsonb_array_elements(p_schedule) loop
    insert into public.commercial_receivables(project_id, client_name, kind, description, amount_cents, due_on)
    values (p_project_id, v_project.client_name, v_item->>'kind',
      coalesce(nullif(trim(v_item->>'description'),''), case when v_item->>'kind' = 'entrada' then 'Entrada' else 'Parcela' end),
      (v_item->>'amount_cents')::bigint, (v_item->>'due_on')::date);
  end loop;
  insert into public.commercial_events(project_id,event_type,details,actor)
  values (p_project_id,'closed',jsonb_build_object('amount_cents',p_amount_cents,'won_on',p_won_on,'installments',v_count),p_actor);
end $$;

-- A trava de linha impede que dois pagamentos parciais ultrapassem o saldo.
create or replace function public.commercial_record_receipt(
  p_receivable_id uuid, p_operation_id uuid, p_amount_cents bigint,
  p_received_on date, p_method text, p_reference text, p_actor text
) returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_receivable public.commercial_receivables%rowtype;
  v_paid bigint;
  v_existing public.commercial_receipts%rowtype;
  v_id uuid;
begin
  if p_operation_id is null then raise exception 'Identificador da operação obrigatório'; end if;
  select * into v_existing from public.commercial_receipts where operation_id = p_operation_id;
  if found then
    if v_existing.voided_at is not null then raise exception 'Operação anterior estornada; use novo identificador'; end if;
    if v_existing.receivable_id <> p_receivable_id or v_existing.amount_cents <> p_amount_cents
       or v_existing.received_on <> p_received_on or v_existing.method <> p_method then
      raise exception 'Identificador já usado em outro recebimento';
    end if;
    return v_existing.id;
  end if;
  select * into v_receivable from public.commercial_receivables where id = p_receivable_id for update;
  if not found or v_receivable.canceled_at is not null then raise exception 'Cobrança indisponível'; end if;
  select * into v_existing from public.commercial_receipts where operation_id = p_operation_id;
  if found then
    if v_existing.voided_at is not null then raise exception 'Operação anterior estornada; use novo identificador'; end if;
    if v_existing.receivable_id <> p_receivable_id or v_existing.amount_cents <> p_amount_cents
       or v_existing.received_on <> p_received_on or v_existing.method <> p_method then
      raise exception 'Identificador já usado em outro recebimento';
    end if;
    return v_existing.id;
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 or p_received_on is null
     or p_method not in ('pix','transferencia','boleto','cartao','dinheiro','outro') then
    raise exception 'Recebimento inválido';
  end if;
  select coalesce(sum(amount_cents),0) into v_paid from public.commercial_receipts
    where receivable_id = p_receivable_id and voided_at is null;
  if v_paid + p_amount_cents > v_receivable.amount_cents then raise exception 'Valor acima do saldo'; end if;
  insert into public.commercial_receipts(receivable_id,operation_id,amount_cents,received_on,method,reference,created_by)
  values (p_receivable_id,p_operation_id,p_amount_cents,p_received_on,p_method,p_reference,p_actor)
  returning id into v_id;
  insert into public.commercial_events(project_id,receivable_id,event_type,details,actor)
  values (v_receivable.project_id,p_receivable_id,'receipt',jsonb_build_object('amount_cents',p_amount_cents,'received_on',p_received_on),p_actor);
  return v_id;
end $$;

create or replace function public.commercial_void_receipt(p_receipt_id uuid, p_reason text, p_actor text)
returns void language plpgsql security invoker set search_path = public as $$
declare v_receipt public.commercial_receipts%rowtype; v_project_id uuid;
begin
  select * into v_receipt from public.commercial_receipts where id = p_receipt_id for update;
  if not found or v_receipt.voided_at is not null then raise exception 'Recebimento indisponível'; end if;
  if length(trim(coalesce(p_reason,''))) < 5 then raise exception 'Informe o motivo do estorno'; end if;
  update public.commercial_receipts set voided_at = now(), void_reason = trim(p_reason) where id = p_receipt_id;
  select project_id into v_project_id from public.commercial_receivables where id = v_receipt.receivable_id;
  insert into public.commercial_events(project_id,receivable_id,event_type,details,actor)
  values (v_project_id,v_receipt.receivable_id,'receipt_voided',jsonb_build_object('receipt_id',p_receipt_id,'reason',p_reason),p_actor);
end $$;

create or replace function public.commercial_create_monthly_charge(p_subscription_id uuid, p_competence date, p_actor text)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v_subscription public.commercial_subscriptions%rowtype; v_due date; v_id uuid;
begin
  select * into v_subscription from public.commercial_subscriptions where id = p_subscription_id for update;
  if not found or v_subscription.status <> 'ativa' then raise exception 'Mensalidade não está ativa'; end if;
  if p_competence is null or extract(day from p_competence) <> 1 then raise exception 'Competência inválida'; end if;
  v_due := make_date(extract(year from p_competence)::integer, extract(month from p_competence)::integer, v_subscription.billing_day);
  if v_due < v_subscription.starts_on or (v_subscription.ends_on is not null and v_due > v_subscription.ends_on) then
    raise exception 'Vencimento fora da vigência do acordo';
  end if;
  insert into public.commercial_receivables(project_id,subscription_id,client_name,kind,description,amount_cents,due_on,competence_month)
  values (v_subscription.project_id,p_subscription_id,v_subscription.client_name,'mensalidade',v_subscription.description,
    v_subscription.monthly_cents,v_due,p_competence) returning id into v_id;
  insert into public.commercial_events(project_id,receivable_id,event_type,details,actor)
  values (v_subscription.project_id,v_id,'monthly_charge',jsonb_build_object('competence',p_competence),p_actor);
  return v_id;
end $$;

revoke all on function public.commercial_close_project(uuid,bigint,date,jsonb,text),
  public.commercial_record_receipt(uuid,uuid,bigint,date,text,text,text),
  public.commercial_void_receipt(uuid,text,text),
  public.commercial_create_monthly_charge(uuid,date,text) from public, anon, authenticated;
revoke all on function public.commercial_audit_project(), public.commercial_audit_subscription()
  from public, anon, authenticated;
grant execute on function public.commercial_close_project(uuid,bigint,date,jsonb,text),
  public.commercial_record_receipt(uuid,uuid,bigint,date,text,text,text),
  public.commercial_void_receipt(uuid,text,text),
  public.commercial_create_monthly_charge(uuid,date,text) to service_role;

commit;
