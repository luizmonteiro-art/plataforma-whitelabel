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
   ARRAY['VITRINE_PUBLICA','ESTOQUE','CONFIGURACOES']),
  ('loja', 'Loja', 179.90, 150,
   ARRAY['VITRINE_PUBLICA','ESTOQUE','CONFIGURACOES','DASHBOARD','VENDAS','ORDENS_SERVICO','ORCAMENTOS','AGENDAMENTOS']),
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

-- Helper: a loja informada pertence ao usuário autenticado?
-- SECURITY DEFINER → ignora a RLS de `stores` na checagem (evita recursão).
create or replace function owns_store(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from stores
    where id = p_store_id
      and admin_email = (auth.jwt() ->> 'email')
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
  using (bucket_id = 'store-assets')
  with check (bucket_id = 'store-assets');
