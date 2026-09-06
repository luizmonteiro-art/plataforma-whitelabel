-- Public storefront content must respect item and store availability even
-- when the REST API is called directly. Owners retain their existing access.
begin;

create or replace function public.store_is_available(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.stores
    where id = p_store_id
      and (is_active or trial_expires_at > now())
  )
$$;
revoke all on function public.store_is_available(uuid) from public;
grant execute on function public.store_is_available(uuid) to anon, authenticated;

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select
  using (is_active and public.store_is_available(store_id));

drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services for select
  using (is_active and public.store_is_available(store_id));

drop policy if exists banners_public_read on public.banners;
create policy banners_public_read on public.banners for select
  using (is_active and public.store_is_available(store_id));

drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select
  using (is_active and public.store_is_available(store_id));

drop policy if exists config_public_read on public.store_config;
create policy config_public_read on public.store_config for select
  using (public.store_is_available(store_id));

notify pgrst, 'reload schema';
commit;
