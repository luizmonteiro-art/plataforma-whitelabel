-- ============================================================================
-- 20260926_financeiro.sql — Lucro, fiado, despesas e meta do período.
--
-- Aditiva de propósito: NÃO reescreve save_sale_atomic. Reescrever uma função
-- existente partindo de uma cópia do repositório já apagou defesas em silêncio
-- em outro projeto; aqui só acrescentamos colunas e funções novas.
--
-- Aplicar depois de 20260906_store_staff.sql.
-- ============================================================================
begin;

-- ─── 1. Custo do produto (base de todo cálculo de lucro) ────────────────────
alter table public.products add column if not exists cost numeric(10,2);

comment on column public.products.cost is
  'Quanto a loja pagou pelo produto. Sem isto não há cálculo de lucro.';

-- ─── 2. Venda a prazo (fiado) ───────────────────────────────────────────────
alter table public.sales add column if not exists payment_type text not null default 'avista'
  check (payment_type in ('avista', 'aprazo'));
alter table public.sales add column if not exists valor_pago numeric(10,2) not null default 0
  check (valor_pago >= 0);
alter table public.sales add column if not exists vencimento date;

comment on column public.sales.valor_pago is
  'Quanto já foi recebido. Em venda à vista o app grava o total; a prazo cresce a cada pagamento.';

-- Vendas anteriores a esta migração são à vista e já quitadas: sem isto elas
-- apareceriam todas como dívida em aberto no primeiro acesso à tela Devedores.
update public.sales set valor_pago = total
 where payment_type = 'avista' and valor_pago = 0 and status <> 'cancelado';

-- ─── 3. Despesas (saídas de caixa) ──────────────────────────────────────────
create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  description    text not null,
  amount         numeric(10,2) not null check (amount > 0),
  category       text not null default 'outros',
  payment_method text not null default 'dinheiro',
  date           date not null default current_date,
  notes          text default '',
  -- Nem toda despesa sai do caixa (ex.: lançada só para registro contábil).
  affects_cash   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_expenses_store on public.expenses(store_id, date desc);

alter table public.expenses enable row level security;
drop policy if exists expenses_owner_all on public.expenses;
create policy expenses_owner_all on public.expenses for all
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));
revoke all on public.expenses from anon;
grant select, insert, update, delete on public.expenses to authenticated;

drop trigger if exists trg_expenses_updated on public.expenses;
create trigger trg_expenses_updated before update on public.expenses
  for each row execute function public.set_updated_at();

-- ─── 4. Período do dashboard + meta de vendas ───────────────────────────────
create table if not exists public.dashboard_periods (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  meta_valor numeric(10,2) not null default 0 check (meta_valor >= 0),
  created_at timestamptz not null default now()
);
-- Garante no banco que só existe UM período aberto por loja.
create unique index if not exists dashboard_periods_one_active
  on public.dashboard_periods (store_id) where (ended_at is null);

alter table public.dashboard_periods enable row level security;
drop policy if exists periods_owner_all on public.dashboard_periods;
create policy periods_owner_all on public.dashboard_periods for all
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));
revoke all on public.dashboard_periods from anon;
grant select, insert, update, delete on public.dashboard_periods to authenticated;

-- ─── 5. Registrar pagamento de uma venda a prazo ────────────────────────────
-- Função nova em vez de UPDATE direto: `sales` tem insert/update revogados
-- desde 20260906_atomic_sales.sql, e o saldo não pode ficar negativo nem ser
-- gravado por duas abas ao mesmo tempo.
create or replace function public.register_sale_payment(
  p_store_id uuid, p_sale_id uuid, p_valor numeric
) returns public.sales
language plpgsql security definer set search_path = '' as $$
declare
  venda public.sales;
  saldo numeric;
begin
  if auth.uid() is null or not public.owns_store(p_store_id) then
    raise exception 'Acesso negado.';
  end if;
  if p_valor is null or p_valor <= 0 or p_valor::text in ('NaN','Infinity','-Infinity') then
    raise exception 'Informe um valor de pagamento maior que zero.';
  end if;

  select * into venda from public.sales
   where id = p_sale_id and store_id = p_store_id for update;
  if not found then raise exception 'Venda não encontrada.'; end if;
  if venda.status = 'cancelado' then
    raise exception 'Venda cancelada não recebe pagamento.';
  end if;

  saldo := venda.total - venda.valor_pago;
  if saldo <= 0 then raise exception 'Esta venda já está quitada.'; end if;
  if round(p_valor, 2) > saldo then
    raise exception 'O valor informado é maior que o saldo devedor.';
  end if;

  update public.sales
     set valor_pago = valor_pago + round(p_valor, 2),
         revision   = revision + 1
   where id = p_sale_id and store_id = p_store_id
  returning * into venda;

  return venda;
end;
$$;
revoke all     on function public.register_sale_payment(uuid,uuid,numeric) from public;
revoke all     on function public.register_sale_payment(uuid,uuid,numeric) from anon;
grant  execute on function public.register_sale_payment(uuid,uuid,numeric) to authenticated;

-- ─── 6. Definir as condições de pagamento de uma venda ──────────────────────
-- Também aditiva: save_sale_atomic continua dona do estoque e do total; esta
-- só marca como a prazo e guarda o vencimento, logo após a venda ser gravada.
create or replace function public.set_sale_payment_terms(
  p_store_id uuid, p_sale_id uuid, p_payment_type text,
  p_valor_pago numeric, p_vencimento date
) returns public.sales
language plpgsql security definer set search_path = '' as $$
declare
  venda public.sales;
begin
  if auth.uid() is null or not public.owns_store(p_store_id) then
    raise exception 'Acesso negado.';
  end if;
  if p_payment_type is null or p_payment_type not in ('avista','aprazo') then
    raise exception 'Condição de pagamento inválida.';
  end if;

  select * into venda from public.sales
   where id = p_sale_id and store_id = p_store_id for update;
  if not found then raise exception 'Venda não encontrada.'; end if;

  if p_payment_type = 'avista' then
    -- À vista: quitada no ato, sem vencimento pendente.
    update public.sales
       set payment_type = 'avista', valor_pago = total, vencimento = null,
           revision = revision + 1
     where id = p_sale_id and store_id = p_store_id
    returning * into venda;
  else
    if p_valor_pago is null or p_valor_pago < 0 or round(p_valor_pago,2) > venda.total then
      raise exception 'Entrada inválida: use um valor entre zero e o total da venda.';
    end if;
    update public.sales
       set payment_type = 'aprazo', valor_pago = round(p_valor_pago, 2),
           vencimento = p_vencimento, revision = revision + 1
     where id = p_sale_id and store_id = p_store_id
    returning * into venda;
  end if;

  return venda;
end;
$$;
revoke all     on function public.set_sale_payment_terms(uuid,uuid,text,numeric,date) from public;
revoke all     on function public.set_sale_payment_terms(uuid,uuid,text,numeric,date) from anon;
grant  execute on function public.set_sale_payment_terms(uuid,uuid,text,numeric,date) to authenticated;

notify pgrst, 'reload schema';
commit;
