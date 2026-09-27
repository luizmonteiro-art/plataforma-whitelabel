-- ============================================================================
-- 20260926_troca_de_aparelho.sql — Entrada de aparelho usado como pagamento.
--
-- O cliente entrega um aparelho avaliado em X e leva um produto de Y.
--   Y > X  → ele paga a diferença.
--   X > Y  → a loja devolve o troco.
--
-- Aditiva, como as anteriores: save_sale_atomic continua dona do estoque e do
-- total da venda. O valor da troca NÃO entra no total (o total é o preço do
-- produto); ele abate o que o cliente ainda deve.
--
-- Aplicar depois de 20260926_financeiro.sql.
-- ============================================================================
begin;

alter table public.sales add column if not exists trade_in_device text;
alter table public.sales add column if not exists trade_in_value numeric(10,2) not null default 0
  check (trade_in_value >= 0);

comment on column public.sales.trade_in_value is
  'Valor avaliado do aparelho recebido na troca. Abate o saldo devedor; nao entra no total da venda.';

-- ─── Registrar (ou limpar) a troca de uma venda ─────────────────────────────
-- Guardado numa funcao porque `sales` tem insert/update revogados e porque o
-- valor precisa ser conferido contra a venda com a linha travada.
create or replace function public.set_sale_trade_in(
  p_store_id uuid, p_sale_id uuid, p_device text, p_value numeric
) returns public.sales
language plpgsql security definer set search_path = '' as $$
declare
  venda public.sales;
  valor numeric;
begin
  if auth.uid() is null or not public.owns_store(p_store_id) then
    raise exception 'Acesso negado.';
  end if;

  valor := coalesce(round(p_value, 2), 0);
  if valor < 0 or valor::text in ('NaN','Infinity','-Infinity') then
    raise exception 'Valor de avaliacao invalido.';
  end if;
  if valor > 0 and coalesce(btrim(p_device), '') = '' then
    raise exception 'Descreva o aparelho recebido na troca.';
  end if;

  select * into venda from public.sales
   where id = p_sale_id and store_id = p_store_id for update;
  if not found then raise exception 'Venda nao encontrada.'; end if;
  if venda.status = 'cancelado' then
    raise exception 'Venda cancelada nao recebe troca.';
  end if;

  update public.sales
     set trade_in_device = nullif(btrim(coalesce(p_device, '')), ''),
         trade_in_value  = valor,
         revision        = revision + 1
   where id = p_sale_id and store_id = p_store_id
  returning * into venda;

  return venda;
end;
$$;
revoke all     on function public.set_sale_trade_in(uuid,uuid,text,numeric) from public;
revoke all     on function public.set_sale_trade_in(uuid,uuid,text,numeric) from anon;
grant  execute on function public.set_sale_trade_in(uuid,uuid,text,numeric) to authenticated;

notify pgrst, 'reload schema';
commit;
