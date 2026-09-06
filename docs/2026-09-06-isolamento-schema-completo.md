# Isolamento com o schema completo — 6 de setembro de 2026

## Resultado

O teste executa `supabase-schema.sql` sem remover tabelas, funções ou políticas,
em PostgreSQL nativo temporário. Aplica a migração de vendas e valida a correção
de visibilidade pública. Não lê `.env.local` nem acessa o projeto remoto.

Onze verificações cobrem propriedade de loja, resolução pública sem e-mail,
tentativa de escrita cruzada em produtos, venda e repetição idempotente,
privacidade de vendas/movimentos/orçamentos/ordens/agendamentos e escrita de
arquivos limitada ao prefixo da loja. Também cobrem a visibilidade de produtos,
serviços, banners, posts e configuração em lojas ativas, inativas e em teste.

## Falha reproduzida e correção preparada

As políticas originais de leitura pública usam `using (true)`. Um produto marcado
como desativado continuava acessível por consulta direta ao banco/API, mesmo que
a interface não o exibisse. O teste comprova o comportamento antes da correção.

`20260906_public_catalog_visibility.sql` restringe a leitura pública a itens ativos
de lojas ativas ou com teste ainda válido. A configuração pública também respeita
a disponibilidade da loja. As políticas existentes do dono preservam o acesso
administrativo. A migração não altera dados nem transforma a vitrine em área privada.
Imagens já públicas no Storage permanecem públicas; não é uma revogação de URLs
de arquivos já publicados.

## Reproduzir

```powershell
npm run test:isolation
npm run test:concurrency
```

O primeiro teste cria um cluster temporário em `127.0.0.1:55443` e o encerra ao
terminar. Usa banco UTF-8 separado porque a inicialização padrão do PostgreSQL
neste Windows usa WIN1252. O segundo continua usando a estrutura reduzida e a
porta 55439, para testar concorrência de vendas com conexões independentes.

## O que ainda não foi validado

As funções de interface `auth.jwt()`/`auth.uid()` recebem identidades fictícias.
As tabelas da infraestrutura Storage são mínimas; os helpers e as políticas do
aplicativo vêm do schema real do repositório. Isso valida o SQL local, mas não
o servidor Supabase Auth, a assinatura de JWTs, cookies, PostgREST ou uploads HTTP.
Também não comprova que o schema remoto esteja igual ao arquivo do repositório.

## Próxima validação em ambiente separado

1. Identificar um segundo projeto Supabase de homologação, sem dados reais.
2. Conferir seu schema e aplicar a base seguida das duas migrações, na ordem:
   vendas atômicas, visibilidade pública. Não reaplicar a base depois das migrações,
   pois ela recria as políticas públicas antigas.
3. Criar duas lojas e duas contas fictícias, com confirmação de e-mail, nesse ambiente.
4. Executar a aplicação usando exclusivamente URL e chave pública da homologação.
   Chaves administrativas ficam somente no servidor para provisionamento.
5. Testar login real, troca de loja, expiração, venda/repetição/cancelamento,
   acesso cruzado pela API, catálogo e upload. Conferir celular e desktop.
6. Revisar o schema efetivo de produção e aprovar separadamente SQL e publicação.

Nenhuma migração remota, criação de conta real, push ou publicação ocorreu nesta etapa.
