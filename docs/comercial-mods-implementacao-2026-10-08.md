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

Migração aplicada em 08/10/2026 no Supabase `qikvzzskeeahydouhkpc` pelo SQL Editor. A execução retornou sucesso. As cinco tabelas `commercial_*` foram conferidas com RLS ativo e sem privilégio de leitura direta para `anon` ou `authenticated`. As tabelas preexistentes `stores` e `store_requests` continuaram presentes. Essa referência de projeto foi conferida na `.env.local` e nos arquivos JavaScript públicos do login; README e HANDOFF antigos apontam a um projeto anterior. Os valores secretos da Vercel não foram inspecionados.

Deploy de produção `dpl_Fa1qwDuyTqwEy5kkGrMRgha2kmbm` concluído com build e TypeScript aprovados; a Vercel atribuiu o alias `https://usemods.com.br`. A rota `/superadmin/comercial` redirecionou para login sem sessão no domínio próprio. Em sessão já autenticada no hostname `plataforma-whitelabel.vercel.app`, a visão geral carregou os leads existentes, e as abas Projetos, Financeiro e Mensalidades abriram com listas vazias e formulários disponíveis. A página pública `/captacao` continuou carregando em `usemods.com.br`. A entrada autenticada no domínio próprio não foi repetida porque a sessão existente está vinculada ao hostname da Vercel.

Nenhum contrato, mensalidade ou recebimento sintético foi criado na base real. Para cadastrar projetos antigos, preencher os dados a partir de contratos, comprovantes ou controles confirmados e registrar a fonte na ficha.

## Próximas melhorias quando houver volume

- Importação em lote com prévia e reconciliação de totais por mês. A primeira versão inclui entrada manual revisável e chave externa de idempotência, mas ainda não oferece CSV.
- Paginação no servidor para mais de 1.000 registros por coleção.
- Exportação CSV e lembretes automáticos; dependem da política de cobrança recorrente definida pela operação.
