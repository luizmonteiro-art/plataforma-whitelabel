-- Apply after the existing supabase-schema.sql. Review in staging first.
begin;
alter table public.sales add column if not exists status text not null default 'aprovado'
  check (status in ('aprovado', 'pendente', 'cancelado'));
alter table public.sales add column if not exists revision integer not null default 0;
-- Historical stock cannot safely be inferred; old sales remain read-only.
alter table public.sales add column if not exists stock_managed boolean not null default false;
alter table public.sales add column if not exists last_request_id uuid;

create table if not exists public.sale_stock_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  sale_id uuid not null references public.sales(id),
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity <> 0),
  request_id uuid not null,
  created_at timestamptz not null default now()
);
alter table public.sale_stock_movements enable row level security;
drop policy if exists sale_movements_owner_read on public.sale_stock_movements;
create policy sale_movements_owner_read on public.sale_stock_movements
  for select to authenticated using (public.owns_store(store_id));
grant select on public.sale_stock_movements to authenticated;
revoke insert, update, delete on public.sale_stock_movements from anon, authenticated;

create or replace function public.save_sale_atomic(
  p_store_id uuid, p_sale_id uuid, p_request_id uuid, p_revision integer,
  p_items jsonb, p_total numeric, p_payment_method text,
  p_customer_name text, p_status text
) returns public.sales
language plpgsql security definer set search_path = '' as $$
declare
  previous public.sales;
  saved public.sales;
  tenant public.stores;
  item jsonb;
  product public.products;
  normalized jsonb := '[]'::jsonb;
  subtotal numeric := 0;
  delta record;
begin
  if auth.uid() is null or not public.owns_store(p_store_id) then
    raise exception 'Acesso negado.';
  end if;
  -- Serialize sales for one store; different stores remain independent.
  select * into tenant from public.stores where id = p_store_id for update;
  if not found or not (tenant.is_active or coalesce(tenant.trial_expires_at > now(),false)) then
    raise exception 'Loja inativa ou teste expirado.';
  end if;
  if not exists (select 1 from public.plans where id = tenant.plan_id
    and 'VENDAS' = any(modules)) then
    raise exception 'O plano não permite registrar vendas.';
  end if;
  if p_sale_id is null or p_request_id is null or p_revision is null then
    raise exception 'Identificação da operação ausente.';
  end if;
  select * into previous from public.sales where id = p_sale_id for update;
  if found then
    if previous.store_id <> p_store_id then raise exception 'Acesso negado.'; end if;
    if previous.last_request_id = p_request_id then return previous; end if;
    if not previous.stock_managed then
      raise exception 'Venda antiga: confira o histórico e o estoque antes de migrar este registro.';
    end if;
    if previous.revision <> p_revision then
      raise exception 'Esta venda mudou em outro acesso. Atualize a página antes de continuar.';
    end if;
  elsif p_revision <> 0 then
    raise exception 'Venda não encontrada. Atualize a página.';
  end if;
  if p_status is null or p_status not in ('aprovado','pendente','cancelado')
    or p_payment_method is null or p_payment_method not in ('pix','dinheiro','cartao_debito','cartao_credito') then
    raise exception 'Situação ou pagamento inválido.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'Itens inválidos.'; end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 100 then
    raise exception 'Informe entre 1 e 100 itens.';
  end if;
  -- Lock affected products in stable order before reading stock.
  perform id from public.products where store_id = p_store_id and id in (
    select (value->>'product_id')::uuid from jsonb_array_elements(p_items)
    union select (value->>'product_id')::uuid from jsonb_array_elements(coalesce(previous.items,'[]'))
  ) order by id for update;
  for item in select value from jsonb_array_elements(p_items) loop
    if (item->>'quantity') is null or (item->>'quantity') !~ '^[1-9][0-9]*$'
      or (item->>'unit_price') is null then raise exception 'Quantidade ou preço inválido.'; end if;
    if (item->>'unit_price')::numeric < 0 or (item->>'unit_price')::numeric::text in ('NaN','Infinity','-Infinity') then
      raise exception 'Preço inválido.';
    end if;
    if exists (select 1 from jsonb_array_elements(normalized) n where n->>'product_id' = item->>'product_id') then
      raise exception 'Agrupe as quantidades do mesmo produto.';
    end if;
    select * into product from public.products where id = (item->>'product_id')::uuid and store_id = p_store_id;
    if not found then raise exception 'Produto não pertence à loja.'; end if;
    normalized := normalized || jsonb_build_array(jsonb_build_object(
      'product_id',product.id,'product_name',product.name,
      'quantity',(item->>'quantity')::integer,'unit_price',round((item->>'unit_price')::numeric,2)));
    subtotal := subtotal + (item->>'quantity')::integer * round((item->>'unit_price')::numeric,2);
  end loop;
  if p_total is null or p_total < 0 or p_total > subtotal or p_total::text in ('NaN','Infinity','-Infinity') then
    raise exception 'Total inválido: use um valor entre zero e o subtotal.';
  end if;
  insert into public.sales(id,store_id,items,total,payment_method,customer_name,status,revision,stock_managed,last_request_id)
  values(p_sale_id,p_store_id,normalized,round(p_total,2),p_payment_method,p_customer_name,p_status,1,true,p_request_id)
  on conflict(id) do update set items=excluded.items,total=excluded.total,payment_method=excluded.payment_method,
    customer_name=excluded.customer_name,status=excluded.status,revision=public.sales.revision+1,last_request_id=p_request_id
  returning * into saved;
  -- Pending sales reserve stock too. Cancellation returns it exactly once.
  for delta in
    select product_id,sum(qty)::integer as qty from (
      select (value->>'product_id')::uuid product_id, (value->>'quantity')::integer qty
      from jsonb_array_elements(coalesce(previous.items,'[]'))
      where previous.status <> 'cancelado'
      union all
      select (value->>'product_id')::uuid, -(value->>'quantity')::integer
      from jsonb_array_elements(normalized) where p_status <> 'cancelado'
    ) d group by product_id having sum(qty) <> 0 order by product_id
  loop
    update public.products set stock_qty=stock_qty+delta.qty
      where id=delta.product_id and store_id=p_store_id and stock_qty+delta.qty >= 0
        and (delta.qty > 0 or is_active = true);
    if not found then raise exception 'Estoque insuficiente ou produto inativo. Nenhuma alteração foi salva.'; end if;
    insert into public.sale_stock_movements(store_id,sale_id,product_id,quantity,request_id)
      values(p_store_id,p_sale_id,delta.product_id,delta.qty,p_request_id);
  end loop;
  return saved;
end;
$$;
revoke all on function public.save_sale_atomic(uuid,uuid,uuid,integer,jsonb,numeric,text,text,text) from public, anon;
grant execute on function public.save_sale_atomic(uuid,uuid,uuid,integer,jsonb,numeric,text,text,text) to authenticated;
-- Old clients must fail safely rather than bypass the transaction.
revoke insert, update, delete on public.sales from anon, authenticated;
notify pgrst, 'reload schema';
commit;
