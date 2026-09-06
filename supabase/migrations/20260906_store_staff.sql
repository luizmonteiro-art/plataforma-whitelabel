-- Apply after 20260906_atomic_sales.sql and 20260906_public_catalog_visibility.sql.
-- Adds staff logins (Master plan) with the same operational access as the owner.
begin;

-- Helper: o e-mail autenticado é o DONO (admin_email) da loja informada?
-- Distinto de owns_store: usado onde só o dono pode agir (gerenciar equipe).
create or replace function public.is_store_owner(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.stores
    where id = p_store_id
      and admin_email = (auth.jwt() ->> 'email')
  )
$$;
revoke all on function public.is_store_owner(uuid) from public;
grant execute on function public.is_store_owner(uuid) to anon, authenticated;

create table if not exists public.store_staff (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now(),
  unique (store_id, email)
);
alter table public.store_staff enable row level security;
drop policy if exists store_staff_owner_all on public.store_staff;
create policy store_staff_owner_all on public.store_staff for all
  using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
revoke all on public.store_staff from anon, authenticated;
grant select, insert, update, delete on public.store_staff to authenticated;

-- owns_store passa a cobrir dono OU equipe (acesso operacional igual em toda a loja).
create or replace function public.owns_store(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_store_owner(p_store_id) or exists (
    select 1 from public.store_staff
    where store_id = p_store_id
      and email = (auth.jwt() ->> 'email')
  )
$$;
revoke all on function public.owns_store(uuid) from public;
grant execute on function public.owns_store(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
