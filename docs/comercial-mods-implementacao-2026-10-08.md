# Comercial e financeiro MODS — implementação de 08/10/2026

## O que foi construído

- `/superadmin/comercial`: visão mensal de leads, propostas, contratos, caixa recebido, cobranças em aberto/vencidas, mensalidades ativas, entregas pendentes e históricos ainda sem agenda de cobrança. Abas para projetos, contas a receber e mensalidades. Link na home do superadmin.
- Projeto manual de site, sistema, ERP, loja ou outro; vinculação opcional ao lead da captação. O lead vinculado não duplica o indicador. O nome do cliente e a data do lead ficam preservados se o pedido original for excluído.
- Fechamento transacional com valor contratado e agenda de entrada/parcelas que deve somar exatamente o contrato.
- Recebimento parcial com data real, meio e referência; bloqueio de excesso, identificador de operação para reenvio e estorno com motivo. O histórico não é apagado.
- Acordo de mensalidade com valor próprio, vigência, dia de vencimento, pausa/encerramento e lançamento controlado por competência. Nenhuma cobrança retroativa é gerada automaticamente.
- Cadastro manual de projeto antigo com data, valor e fonte, quando conhecidos. Um projeto já fechado pode ficar como **histórico incompleto** até haver data, valor e agenda de cobrança confirmados. A ficha permite completar depois. Identificador histórico opcional evita duplicação de cadastros repetidos. Os cinco nomes do portfólio social não foram lançados como contratos por falta de datas e valores reais.

## Isolamento e regras

A migração `supabase/migrations/20261008_mods_commercial.sql` cria `commercial_projects`, `commercial_subscriptions`, `commercial_receivables`, `commercial_receipts` e `commercial_events`. A receita MODS não usa `sales` nem `expenses` das lojas. As tabelas têm RLS, sem leitura/escrita para `anon` ou `authenticated`. Apenas funções no servidor, depois de validar sessão e e-mail do superadmin, usam a chave administrativa. Vínculos com `stores` e `store_requests` usam `ON DELETE SET NULL`.

Valores são gravados em centavos inteiros. Proposta, contrato, mensalidade contratada, cobrança e recebimento são grandezas distintas. Projetos sem data/valor confirmado não criam números fictícios. O painel mostra erro se uma coleção atingir 1.000 registros; será preciso paginar antes de afirmar totais acima desse volume.

## Verificações locais

- `npm run build`: aprovado após remover o preview temporário.
- `npx tsc --noEmit` e ESLint dos arquivos alterados: aprovados.
- `npm test`: 43 testes passaram; `npm run test:commercial`: 3 testes passaram, incluindo PostgreSQL embutido, RLS, parcelas, pagamento, estorno, mensalidade e histórico incompleto.
- `npm run test:isolation`: 11 verificações do schema completo passaram.
- Preview sintético em 390 px e 1440 px: visão geral, projeto expandido e recebimento sem rolagem horizontal. O preview e as imagens temporárias foram removidos; não foram enviados dados sintéticos ao banco.

## Publicação

O código e a migração estão preparados localmente. Antes de disponibilizar a rota em produção, aplicar a migração no Supabase `qikvzzskeeahydouhkpc` e verificar as tabelas/funções. Essa referência foi conferida na `.env.local` e nos arquivos JavaScript públicos do login atual em `plataforma-whitelabel.vercel.app`; README e HANDOFF antigos apontam a um projeto anterior. A Vercel tem as variáveis necessárias cadastradas em Production, mas os valores secretos são write-only e não foram inspecionados.

Depois da migração, publicar o checkout, verificar redirecionamento sem sessão, entrada autenticada e consulta às listas. Não criar contratos ou recebimentos sintéticos na base real. Para os projetos antigos, preencher os dados a partir de contratos, comprovantes ou controles confirmados e registrar a fonte na ficha.

## Próximas melhorias quando houver volume

- Importação em lote com prévia e reconciliação de totais por mês. A primeira versão inclui entrada manual revisável e chave externa de idempotência, mas ainda não oferece CSV.
- Paginação no servidor para mais de 1.000 registros por coleção.
- Exportação CSV e lembretes automáticos; dependem da política de cobrança recorrente definida pela operação.
