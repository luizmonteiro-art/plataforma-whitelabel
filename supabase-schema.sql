-- ═══════════════════════════════════════════════════
-- FAST APP — Schema Multi-tenant
-- 1 Supabase project → N lojas (store_id por deploy)
-- Cole no: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─── store_config ─────────────────────────────────
-- Cada loja tem 1 linha aqui.
create table if not exists store_config (
  id             uuid primary key default uuid_generate_v4(),
  store_id       text not null unique,          -- ex: "mmcell", "techstore"
  store_name     text not null default 'Minha Loja',
  whatsapp       text not null default '11999999999',
  phone          text default '',
  address        text default '',
  instagram      text default '',
  hours_weekday  text default '08:00 - 18:00',
  hours_saturday text default '08:00 - 13:00',
  accent_color   text not null default '#22c55e',
  about          text default '',
  logo_url       text default '',
  updated_at     timestamptz default now()
);

-- ─── products ─────────────────────────────────────
create table if not exists products (
  id          uuid primary key default uuid_generate_v4(),
  store_id    text not null,
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

-- ─── services ─────────────────────────────────────
create table if not exists services (
  id               uuid primary key default uuid_generate_v4(),
  store_id         text not null,
  name             text not null,
  description      text default '',
  price_from       numeric(10,2) not null default 0,
  duration_minutes int default 60,
  is_active        boolean default true,
  icon             text default '🔧',
  created_at       timestamptz default now()
);

-- ─── appointments ─────────────────────────────────
create table if not exists appointments (
  id             uuid primary key default uuid_generate_v4(),
  store_id       text not null,
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

-- ─── service_orders ───────────────────────────────
-- id é TEXT (gerado no client, formato "OS123456" — legível p/ o cliente)
create table if not exists service_orders (
  id             text primary key,
  store_id       text not null,
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

-- ─── sales ────────────────────────────────────────
create table if not exists sales (
  id             uuid primary key default uuid_generate_v4(),
  store_id       text not null,
  items          jsonb not null default '[]',
  total          numeric(10,2) not null,
  payment_method text not null default 'pix',
  customer_name  text,
  customer_phone text,
  notes          text,
  created_at     timestamptz default now()
);

-- ─── banners ──────────────────────────────────────
create table if not exists banners (
  id         uuid primary key default uuid_generate_v4(),
  store_id   text not null,
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

-- ─── quotes (orçamentos) ──────────────────────────
create table if not exists quotes (
  id             uuid primary key default uuid_generate_v4(),
  store_id       text not null,
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

-- ─── Índices por store_id (performance) ───────────
create index if not exists idx_products_store       on products(store_id);
create index if not exists idx_services_store       on services(store_id);
create index if not exists idx_appointments_store   on appointments(store_id);
create index if not exists idx_service_orders_store on service_orders(store_id);
create index if not exists idx_sales_store          on sales(store_id);
create index if not exists idx_banners_store        on banners(store_id);
create index if not exists idx_quotes_store         on quotes(store_id);

-- ─── RLS desabilitado (validação — reabilitar em produção) ────────────────
alter table store_config   disable row level security;
alter table products       disable row level security;
alter table services       disable row level security;
alter table appointments   disable row level security;
alter table service_orders disable row level security;
alter table sales          disable row level security;
alter table banners        disable row level security;
alter table quotes         disable row level security;

-- ─── Trigger: updated_at automático ──────────────
create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_so_updated
  before update on service_orders
  for each row execute function set_updated_at();

-- ─── Cria a primeira loja (ajuste o store_id) ─────
insert into store_config (store_id, store_name, accent_color)
values ('mmcell', 'M CELL', '#22c55e')
on conflict (store_id) do nothing;

-- ─── Storage: bucket de imagens (OPCIONAL) ────────
-- Necessário só para upload de fotos ao Storage.
-- Sem isto, o app guarda as imagens inline (base64) e continua funcionando.
insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

drop policy if exists "store-assets leitura publica" on storage.objects;
create policy "store-assets leitura publica" on storage.objects
  for select using (bucket_id = 'store-assets');

drop policy if exists "store-assets upload" on storage.objects;
create policy "store-assets upload" on storage.objects
  for insert with check (bucket_id = 'store-assets');
