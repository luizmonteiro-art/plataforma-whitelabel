-- ============================================================================
-- 20260926_esconde_custo_do_publico.sql
--
-- `products.cost` estava legível pela chave anônima: qualquer visitante lia a
-- margem de qualquer loja. Comprovado gravando cost numa vitrine e lendo com a
-- anon key.
--
-- A política de RLS de leitura pública não restringe coluna, e no Postgres o
-- SELECT de TABELA cobre todas as colunas. Para esconder uma, é preciso revogar
-- o privilégio de tabela e conceder coluna a coluna.
--
-- A vitrine deixou de usar `select('*')` e passou a pedir a lista explícita
-- (getPublicProducts em src/lib/db.ts). As duas listas têm de bater.
--
-- Aplicar depois de 20260926_financeiro.sql.
-- ============================================================================
begin;

-- Tira o acesso amplo do público (mantém o do dono/equipe, que é authenticated).
revoke select on public.products from anon;

-- Devolve só o que a vitrine precisa mostrar. `cost` fica de fora.
grant select (
  id, store_id, name, slug, description, price, promo_price, stock_qty,
  category, brand, condition, images, is_featured, is_active, specs, created_at
) on public.products to anon;

notify pgrst, 'reload schema';
commit;
