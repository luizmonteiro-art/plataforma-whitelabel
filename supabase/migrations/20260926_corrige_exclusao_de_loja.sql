-- ============================================================================
-- 20260926_corrige_exclusao_de_loja.sql
--
-- Excluir uma loja que ja registrou venda era IMPOSSIVEL. O botao "Excluir"
-- do /superadmin (deleteStore) falhava com:
--
--   23503 - update or delete on table "stores" violates foreign key constraint
--   "sale_stock_movements_store_id_fkey" on table "sale_stock_movements"
--
-- Todas as outras 12 tabelas filhas de `stores` ja tinham `on delete cascade`;
-- `sale_stock_movements` nasceu sem, em 20260906_atomic_sales.sql.
--
-- Tambem passa `sale_id` a cascatear: um movimento de estoque nao faz sentido
-- sem a venda que o gerou.
--
-- `product_id` fica DE PROPOSITO sem cascade: apagar um produto nao pode
-- apagar o historico de movimentacao dele. O painel ja avisa o lojista que
-- produto com venda vinculada precisa ser preservado.
--
-- As constraints sao localizadas pelo catalogo, nao pelo nome presumido.
-- ============================================================================
begin;

do $$
declare
  nome text;
begin
  -- store_id -> stores  (passa a cascatear)
  select c.conname into nome
    from pg_constraint c
    join pg_class src on src.oid = c.conrelid
    join pg_class tgt on tgt.oid = c.confrelid
    join pg_namespace n on n.oid = src.relnamespace
   where c.contype = 'f' and n.nspname = 'public'
     and src.relname = 'sale_stock_movements'
     and tgt.relname = 'stores';
  if nome is not null then
    execute format('alter table public.sale_stock_movements drop constraint %I', nome);
  end if;
  alter table public.sale_stock_movements
    add constraint sale_stock_movements_store_id_fkey
    foreign key (store_id) references public.stores(id) on delete cascade;

  -- sale_id -> sales  (passa a cascatear)
  select c.conname into nome
    from pg_constraint c
    join pg_class src on src.oid = c.conrelid
    join pg_class tgt on tgt.oid = c.confrelid
    join pg_namespace n on n.oid = src.relnamespace
   where c.contype = 'f' and n.nspname = 'public'
     and src.relname = 'sale_stock_movements'
     and tgt.relname = 'sales';
  if nome is not null then
    execute format('alter table public.sale_stock_movements drop constraint %I', nome);
  end if;
  alter table public.sale_stock_movements
    add constraint sale_stock_movements_sale_id_fkey
    foreign key (sale_id) references public.sales(id) on delete cascade;
end $$;

notify pgrst, 'reload schema';
commit;
