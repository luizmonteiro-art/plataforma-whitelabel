-- ═══════════════════════════════════════════════════════════════════
-- MIGRAÇÃO — tabela `posts` (Feed / Novidades da home)
-- Rodar 1x no Supabase → SQL Editor (projeto qikvzzskeeahydouhkpc).
-- Idempotente: pode rodar de novo sem erro.
-- ═══════════════════════════════════════════════════════════════════

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

-- leitura pública (a home mostra os posts ativos), escrita só do dono da loja
drop policy if exists posts_public_read on posts;
create policy posts_public_read on posts for select using (true);
drop policy if exists posts_owner_write on posts;
create policy posts_owner_write on posts for all
  using (owns_store(store_id)) with check (owns_store(store_id));
