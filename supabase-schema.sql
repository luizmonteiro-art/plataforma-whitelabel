-- ═══════════════════════════════════════════════════════════════════
-- PLATAFORMA WHITE-LABEL — Schema Multi-tenant
-- 1 Supabase project → N lojas (store resolvida por subdomínio/slug)
-- Cole no: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─── plans ────────────────────────────────────────────────────────
-- Definição estática dos planos oferecidos pela plataforma.
create table if not exists plans (
  id              text primary key,              -- 'vitrine' | 'loja' | 'master'
  name            text not null,
  price_brl       numeric(10,2) not null,
  product_limit   integer not null,              -- max produtos cadastrados
  modules         text[] not null,               -- feature flags ativas
  created_at      timestamptz default now()
);

insert into plans (id, name, price_brl, product_limit, modules) values
  ('vitrine', 'Vitrine', 99.90, 30,
   ARRAY['VITRINE_PUBLICA','ESTOQUE','CONFIGURACOES','PROMOCOES']),
  ('loja', 'Loja', 179.90, 150,
   ARRAY['VITRINE_PUBLICA','ESTOQUE','CONFIGURACOES','PROMOCOES','DASHBOARD','VENDAS','ORDENS_SERVICO','ORCAMENTOS','AGENDAMENTOS']),
  ('master', 'Master', 299.00, 300,
   ARRAY['VITRINE_PUBLICA','ESTOQUE','CONFIGURACOES','DASHBOARD','VENDAS','ORDENS_SERVICO','ORCAMENTOS','AGENDAMENTOS','PROMOCOES'])
on conflict (id) do nothing;

-- ─── stores ───────────────────────────────────────────────────────
-- Cada loja provisionada na plataforma.
create table if not exists stores (
  id                uuid primary key default uuid_generate_v4(),
  slug              text unique not null,           -- ex.: "mcell" → mcell.plataforma.com
  plan_id           text not null references plans(id),
  trial_expires_at  timestamptz,                    -- NULL = não está mais em trial
  is_active         boolean not null default false, -- Luiz ativa após aceitar pedido
  admin_email       text not null,                  -- e-mail do usuário admin do lojista
  created_at        timestamptz default now()
);

-- ─── store_config ─────────────────────────────────────────────────
-- Identidade visual e dados de contato de cada loja.
create table if not exists store_config (
  id              uuid primary key default uuid_generate_v4(),
  store_id        uuid not null unique references stores(id) on delete cascade,
  store_name      text not null default 'Minha Loja',
  whatsapp        text not null default '11999999999',
  phone           text default '',
  address         text default '',
  instagram       text default '',
  hours_weekday   text default '08:00 - 18:00',
  hours_saturday  text default '08:00 - 13:00',
  accent_color    text not null default '#22c55e',
  about           text default '',
  logo_url        text default '',
  updated_at      timestamptz default now()
);

-- ─── products ─────────────────────────────────────────────────────
create table if not exists products (
  id          uuid primary key default uuid_generate_v4(),
  store_id    uuid not null references stores(id) on delete cascade,
  name        text not null,
  slug        text not null,
  description text default '',
  price       numeric(10,2) not null,
  promo_price numeric(10,2),
  stock_qty   int not null default 0,
  category    text not null,
  brand       text not null default '',
  condition   text not null default 'lacrado',
  images      text[] default '{}',
  is_featured boolean default false,
  is_active   boolean default true,
  specs       jsonb default '{}',
  created_at  timestamptz default now(),
  unique(store_id, slug)
);

-- ─── services ─────────────────────────────────────────────────────
create table if not exists services (
  id               uuid primary key default uuid_generate_v4(),
  store_id         uuid not null references stores(id) on delete cascade,
  name             text not null,
  description      text default '',
  price_from       numeric(10,2) not null default 0,
  duration_minutes int default 60,
  is_active        boolean default true,
  icon             text default '🔧',
  created_at       timestamptz default now()
);

-- ─── appointments ─────────────────────────────────────────────────
create table if not exists appointments (
  id             uuid primary key default uuid_generate_v4(),
  store_id       uuid not null references stores(id) on delete cascade,
  customer_name  text not null,
  customer_phone text not null,
  service_id     uuid references services(id) on delete set null,
  service_name   text not null,
  device_info    text default '',
  problem        text default '',
  scheduled_at   timestamptz not null,
  status         text not null default 'pendente',
  notes          text,
  created_at     timestamptz default now()
);

-- ─── service_orders ───────────────────────────────────────────────
create table if not exists service_orders (
  id             text primary key,              -- ex.: "OS123456"
  store_id       uuid not null references stores(id) on delete cascade,
  customer_name  text not null,
  customer_phone text not null,
  device_brand   text not null,
  device_model   text not null,
  problem        text not null,
  diagnosis      text,
  price          numeric(10,2),
  status         text not null default 'recebido',
  appointment_id uuid references appointments(id) on delete set null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─── sales ────────────────────────────────────────────────────────
create table if not exists sales (
  id             uuid primary key default uuid_generate_v4(),
  store_id       uuid not null references stores(id) on delete cascade,
  items          jsonb not null default '[]',
  total          numeric(10,2) not null,
  payment_method text not null default 'pix',
  customer_name  text,
  customer_phone text,
  notes          text,
  created_at     timestamptz default now()
);

-- ─── banners ──────────────────────────────────────────────────────
create table if not exists banners (
  id         uuid primary key default uuid_generate_v4(),
  store_id   uuid not null references stores(id) on delete cascade,
  title      text not null,
  subtitle   text default '',
  image_url  text default '',
  badge      text,
  cta_text   text default 'Ver produto',
  cta_href   text default '#',
  is_active  boolean default true,
  "order"    int default 0,
  created_at timestamptz default now()
);

-- ─── quotes (orçamentos) ──────────────────────────────────────────
create table if not exists quotes (
  id             uuid primary key default uuid_generate_v4(),
  store_id       uuid not null references stores(id) on delete cascade,
  customer_name  text not null,
  customer_phone text default '',
  device         text not null,
  items          jsonb not null default '[]',
  desconto       numeric(10,2) default 0,
  observacoes    text default '',
  validade       date,
  status         text not null default 'pendente',
  created_at     timestamptz default now()
);

-- ─── store_requests ───────────────────────────────────────────────
-- Pedidos vindos do site de captação (antes do provisionamento).
create table if not exists store_requests (
  id             uuid primary key default uuid_generate_v4(),
  store_name     text not null,
  contact_name   text not null,
  email          text not null,
  whatsapp       text not null,
  plan_id        text not null references plans(id),
  accent_color   text not null default '#22c55e',
  modules_wanted text[] default '{}',
  notes          text default '',
  status         text not null default 'pendente',  -- pendente | em_contato | provisionado | cancelado
  created_at     timestamptz default now()
);

-- ─── Índices por store_id (performance) ───────────────────────────
create index if not exists idx_products_store       on products(store_id);
create index if not exists idx_services_store       on services(store_id);
create index if not exists idx_appointments_store   on appointments(store_id);
create index if not exists idx_service_orders_store on service_orders(store_id);
create index if not exists idx_sales_store          on sales(store_id);
create index if not exists idx_banners_store        on banners(store_id);
create index if not exists idx_quotes_store         on quotes(store_id);
create index if not exists idx_stores_slug          on stores(slug);

-- ═══════════════════════════════════════════════════════════════════
-- RLS — Row Level Security (isolamento entre lojas)
-- Modelo:
--   • Conteúdo da vitrine (products, services, banners, store_config, plans)
--     → leitura PÚBLICA; escrita só do dono da loja.
--   • Dados privados (sales, service_orders, quotes, appointments)
--     → só o dono. appointments também aceita INSERT público (agendamento).
--   • stores → o dono lê a própria; provisionamento via service_role (superadmin).
--   • store_requests → INSERT público (captação); leitura só via service_role.
-- O "dono" é o usuário autenticado cujo e-mail == stores.admin_email.
-- ═══════════════════════════════════════════════════════════════════

-- Helper: o e-mail autenticado é o DONO (admin_email) da loja informada?
-- Distinto de owns_store: usado onde só o dono pode agir (gerenciar equipe).
-- SECURITY DEFINER → ignora a RLS de `stores` na checagem (evita recursão).
create or replace function is_store_owner(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from stores
    where id = p_store_id
      and admin_email = (auth.jwt() ->> 'email')
  )
$$;
grant execute on function is_store_owner(uuid) to anon, authenticated;

-- store_staff: logins extras (plano Master) com acesso operacional igual ao dono.
create table if not exists store_staff (
  id          uuid primary key default uuid_generate_v4(),
  store_id    uuid not null references stores(id) on delete cascade,
  email       text not null,
  created_at  timestamptz default now(),
  unique (store_id, email)
);

-- Helper: a loja informada pertence ao usuário autenticado (dono OU equipe)?
-- Usado por todas as políticas de dados operacionais da loja.
create or replace function owns_store(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select is_store_owner(p_store_id) or exists (
    select 1 from store_staff
    where store_id = p_store_id
      and email = (auth.jwt() ->> 'email')
  )
$$;
grant execute on function owns_store(uuid) to anon, authenticated;

-- Helper público: resolve a loja pelo slug (usado pelo middleware com chave anon).
-- Retorna só campos não sensíveis (sem admin_email).
create or replace function resolve_store(p_slug text)
returns table (id uuid, plan_id text, is_active boolean, trial_expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select id, plan_id, is_active, trial_expires_at
  from stores
  where slug = p_slug
$$;
grant execute on function resolve_store(text) to anon, authenticated;

-- ── Habilitar RLS em todas as tabelas ──
alter table plans          enable row level security;
alter table stores         enable row level security;
alter table store_config   enable row level security;
alter table products       enable row level security;
alter table services       enable row level security;
alter table appointments   enable row level security;
alter table service_orders enable row level security;
alter table sales          enable row level security;
alter table banners        enable row level security;
alter table quotes         enable row level security;
alter table store_requests enable row level security;
alter table store_staff    enable row level security;

-- ── plans: leitura pública (app + captação precisam dos planos) ──
drop policy if exists plans_read on plans;
create policy plans_read on plans for select using (true);

-- ── stores: o dono lê a própria; escrita só via service_role (bypassa RLS) ──
drop policy if exists stores_owner_read on stores;
create policy stores_owner_read on stores for select
  using (admin_email = (auth.jwt() ->> 'email'));

-- ── Conteúdo público da vitrine: leitura por qualquer um, escrita do dono ──
-- products
drop policy if exists products_public_read on products;
create policy products_public_read on products for select using (true);
drop policy if exists products_owner_write on products;
create policy products_owner_write on products for all
  using (owns_store(store_id)) with check (owns_store(store_id));

-- services
drop policy if exists services_public_read on services;
create policy services_public_read on services for select using (true);
drop policy if exists services_owner_write on services;
create policy services_owner_write on services for all
  using (owns_store(store_id)) with check (owns_store(store_id));

-- banners
drop policy if exists banners_public_read on banners;
create policy banners_public_read on banners for select using (true);
drop policy if exists banners_owner_write on banners;
create policy banners_owner_write on banners for all
  using (owns_store(store_id)) with check (owns_store(store_id));

-- store_config
drop policy if exists config_public_read on store_config;
create policy config_public_read on store_config for select using (true);
drop policy if exists config_owner_write on store_config;
create policy config_owner_write on store_config for all
  using (owns_store(store_id)) with check (owns_store(store_id));

-- ── Dados privados: somente o dono (todas as operações) ──
-- service_orders
drop policy if exists so_owner_all on service_orders;
create policy so_owner_all on service_orders for all
  using (owns_store(store_id)) with check (owns_store(store_id));

-- sales
drop policy if exists sales_owner_all on sales;
create policy sales_owner_all on sales for all
  using (owns_store(store_id)) with check (owns_store(store_id));

-- quotes
drop policy if exists quotes_owner_all on quotes;
create policy quotes_owner_all on quotes for all
  using (owns_store(store_id)) with check (owns_store(store_id));

-- appointments: o dono gerencia tudo; o público pode CRIAR (agendamento pelo site)
drop policy if exists appointments_owner_all on appointments;
create policy appointments_owner_all on appointments for all
  using (owns_store(store_id)) with check (owns_store(store_id));
drop policy if exists appointments_public_insert on appointments;
create policy appointments_public_insert on appointments for insert
  with check (true);

-- ── store_requests (captação): qualquer um cria; leitura só via service_role ──
drop policy if exists requests_public_insert on store_requests;
create policy requests_public_insert on store_requests for insert
  with check (true);

-- ── store_staff: só o DONO gerencia (adicionar/remover equipe) ──
drop policy if exists store_staff_owner_all on store_staff;
create policy store_staff_owner_all on store_staff for all
  using (is_store_owner(store_id)) with check (is_store_owner(store_id));

-- ─── Trigger: updated_at automático ──────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_so_updated on service_orders;
create trigger trg_so_updated
  before update on service_orders
  for each row execute function set_updated_at();

drop trigger if exists trg_config_updated on store_config;
create trigger trg_config_updated
  before update on store_config
  for each row execute function set_updated_at();

-- ─── Enforce: limite de produtos por plano (server-side) ──────────
-- Espelha o product_limit de `plans`. Impede exceder o limite mesmo via
-- API direta (não só pela UI do estoque). SECURITY DEFINER para enxergar
-- stores/plans independentemente da RLS de quem está inserindo.
create or replace function enforce_product_limit()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_limit int;
  v_count int;
begin
  select p.product_limit into v_limit
  from stores s join plans p on p.id = s.plan_id
  where s.id = new.store_id;

  -- Loja/plano não encontrados: a FK já protege; não bloqueia aqui.
  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count from products where store_id = new.store_id;

  if v_count >= v_limit then
    raise exception 'Limite de % produtos do plano atingido para esta loja.', v_limit
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_product_limit on products;
create trigger trg_product_limit
  before insert on products
  for each row execute function enforce_product_limit();

-- ─── Storage: bucket de imagens ───────────────────────────────────
insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

drop policy if exists "store-assets leitura publica" on storage.objects;
create policy "store-assets leitura publica" on storage.objects
  for select using (bucket_id = 'store-assets');

-- Escrita (upload/upsert/remoção) só para usuários autenticados (admin da loja).
-- O cliente do admin já envia a sessão; visitantes anônimos não fazem upload.
drop policy if exists "store-assets upload" on storage.objects;
drop policy if exists "store-assets escrita" on storage.objects;
create policy "store-assets escrita" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'store-assets'
    and exists (
      select 1
      from stores
      where stores.id::text = split_part(name, '/', 1)
        and stores.admin_email = (auth.jwt() ->> 'email')
    )
  )
  with check (
    bucket_id = 'store-assets'
    and exists (
      select 1
      from stores
      where stores.id::text = split_part(name, '/', 1)
        and stores.admin_email = (auth.jwt() ->> 'email')
    )
  );

-- ─── posts (Feed / Novidades da home) ─────────────────────────────
create table if not exists posts (
  id          uuid primary key default uuid_generate_v4(),
  store_id    uuid not null references stores(id) on delete cascade,
  image_url   text default '',
  caption     text default '',
  tag         text default '',
  link        text default '/loja',
  is_active   boolean default true,
  "order"     int default 0,
  created_at  timestamptz default now()
);
create index if not exists idx_posts_store on posts(store_id);

alter table posts enable row level security;
drop policy if exists posts_public_read on posts;
create policy posts_public_read on posts for select using (true);
drop policy if exists posts_owner_write on posts;
create policy posts_owner_write on posts for all
  using (owns_store(store_id)) with check (owns_store(store_id));

-- MODS commercial: synchronized with supabase/migrations/20261008_mods_commercial.sql
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
