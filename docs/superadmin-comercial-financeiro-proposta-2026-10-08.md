# MODS — proposta para Comercial e Financeiro no superadmin (08/10/2026)

## Objetivo confirmado

Controlar, no superadmin da MODS, leads de lojas e de projetos sob medida, propostas, fechamentos do mês, execução dos projetos, entradas/parcelas e mensalidades das lojas. Incluir também projetos antigos com **datas e valores reais confirmados**. O painel registra o **financeiro da MODS**. As vendas da tabela `sales` pertencem a cada loja cliente e não entram na receita da MODS.

## Diagnóstico do projeto atual

- `/superadmin` já busca `stores` e `store_requests` em `src/app/superadmin/page.tsx`. O CRM existente filtra pedidos, altera status e guarda notas/histórico em JSON dentro de `store_requests.notes` (`SuperadminBoard.tsx` e `actions.ts`).
- `store_requests` é específico da captação de lojas: exige `plan_id`, cor e módulos. Não representa naturalmente um site, sistema ou ERP. O painel não tem preço negociado, data de fechamento, parcelas, pagamentos ou competência da mensalidade.
- `stores.is_active`, `trial_expires_at` e o preço de catálogo de `plans` não comprovam contrato nem pagamento. Provisionar uma loja não pode lançar receita automaticamente.
- Existe um módulo financeiro na plataforma para as **vendas de cada lojista** (`sales` e `supabase/migrations/20260926_financeiro.sql`). Ele deve continuar isolado do novo financeiro comercial da MODS.
- `SuperadminBoard.tsx` tem mais de mil linhas. Acrescentar todo o financeiro à mesma tela aumentaria o custo de manutenção e dificultaria a leitura no celular. A proteção em `src/proxy.ts` cobre rotas iniciadas por `/superadmin`; cada consulta e ação nova ainda deve verificar a sessão de superadmin no servidor.
- Leads encerrados e lojas podem ser excluídos hoje. Um registro financeiro vinculado a eles precisa continuar existindo, com nome do cliente preservado e chaves opcionais `ON DELETE SET NULL`, nunca `CASCADE`.

## Modelo de negócio no painel

Uma **oportunidade/projeto** nasce manualmente (site, sistema, ERP) ou é vinculada a um pedido de loja. Ela pode passar por `novo → qualificado → proposta → negociação → fechado` ou `perdido`. Após o fechamento, acompanha-se a entrega em trilha separada: `a iniciar → em execução → aguardando cliente → entregue → cancelado`.

O valor estimado da proposta é informativo. Ao fechar, registra-se o valor contratado e a agenda de cobrança: entrada e parcelas. Para lojas, também pode existir uma **mensalidade acordada**, com valor próprio; o preço de tabela do plano serve como referência, não substitui o acordo comercial. Uma mensalidade gera uma cobrança por competência, mesmo quando a loja ainda não pagou. O recebimento efetivo é registrado à parte e pode ser parcial.

Não usar um único campo `status = pago/pendente` para negócio, entrega e financeiro. As três trilhas respondem a perguntas diferentes.

## Dados novos propostos

| Tabela | Campos principais | Regra importante |
| --- | --- | --- |
| `commercial_projects` | `id`, tipo (`site`, `sistema`, `erp`, `loja`, `outro`), título, empresa/contato, `source_request_id?`, `store_id?`, etapa comercial, valor proposto, valor contratado, `proposal_sent_at`, `won_at`, etapa de entrega, próxima ação/data | `source_request_id` único quando informado; guardar nome da empresa no próprio registro. Valores em centavos (`bigint`) ou `numeric(12,2)`; nunca ponto flutuante. |
| `commercial_subscriptions` | cliente, `store_id?`, `project_id?`, valor mensal acordado, dia de cobrança, início, fim, estado (`ativa`, `pausada`, `encerrada`) | Acordo de mensalidade separado de `plans.price_brl` e de `stores.is_active`. |
| `commercial_receivables` | projeto ou assinatura, tipo (`entrada`, `parcela`, `mensalidade`, `ajuste`), descrição, valor, vencimento, competência, cancelamento | Uma cobrança por parcela ou por mês; unicidade `(subscription_id, competence_month)` para não lançar mensalidade duplicada. Não apagar cobrança quitada. |
| `commercial_receipts` | cobrança, valor recebido, data, meio, referência, autor e eventual estorno/correção | Pagamentos parciais permitidos. Impedir recebimento maior que o saldo em operação transacional com trava da cobrança. Preservar correções no histórico. |
| `commercial_events` | projeto/cobrança, tipo de evento, antes/depois, autor e data | Registro de mudança de etapa, valor e vencimento. Não calcular indicadores a partir de texto livre em `notes`. |

As relações com `store_requests` e `stores` não devem excluir registros comerciais ao apagar um lead/loja. A primeira versão pode guardar dados de cliente no projeto; uma tabela de clientes única só se justifica quando surgirem vários projetos por empresa e duplicidade operacional real.

## Indicadores do mês

Filtro de mês no fuso `America/Sao_Paulo`, com opção de ver todos os projetos. Cada cartão deve trazer sua data de referência:

| Indicador | Cálculo |
| --- | --- |
| **Leads recebidos** | Pedidos em `store_requests.created_at` + projetos manuais criados no mês, sem contar novamente um projeto ligado a pedido. |
| **Propostas enviadas** | Projetos com `proposal_sent_at` no mês; mostrar quantidade e valor proposto separadamente. |
| **Contratos fechados** | Projetos com `won_at` no mês; somar valor contratado. Não contar proposta aberta como venda. |
| **Recebido no mês** | Soma de recebimentos válidos por `received_on`, inclusive entradas, parcelas e mensalidades; excluir estornos. |
| **A receber** | Soma do valor das cobranças menos pagamentos válidos, agrupada por vencimento: no mês, futuro e vencido. |
| **Mensalidades ativas** | Quantidade e valor mensal contratado das assinaturas ativas. Isso é receita recorrente contratada, não dinheiro já recebido. |
| **Entregas pendentes** | Projetos fechados com entrega diferente de `entregue` e `cancelado`. Mostrar separado de propostas ainda abertas. |

Exemplo ilustrativo: um projeto fechado por R$ 6.000 com entrada de R$ 2.000 paga e duas parcelas futuras de R$ 2.000 gera **R$ 6.000 em fechamentos**, **R$ 2.000 recebidos** e **R$ 4.000 a receber**. Uma loja em teste sem acordo/pagamento gera **R$ 0 recebido**, mesmo que já exista em `stores`.

## Experiência no superadmin

Navegação superior: **Visão geral · Leads · Projetos · Financeiro · Lojas**. No desktop, tabelas com filtro e painel lateral de detalhe; no celular, cartões empilhados com empresa, etapa, próximo passo e saldo visíveis sem rolagem horizontal.

- **Visão geral:** números do mês e listas curtas de propostas sem resposta, parcelas vencidas e projetos aguardando ação.
- **Leads:** pedidos atuais de lojas + entrada manual para sites/sistemas. Ação “Criar projeto” a partir de um lead copia contato e mantém o vínculo; o lead continua rastreável.
- **Projetos:** tipo, cliente, valor proposto/contratado, etapas comercial e de entrega, próxima ação e histórico. A ficha abre parcelas, recebimentos e eventual loja vinculada.
- **Financeiro:** filtros por mês, cliente, projeto, tipo e situação; cartões de fechado/recebido/a receber/vencido; lista de cobranças com ação “Registrar recebimento”. O formulário informa valor, data, meio e referência e mostra o saldo antes de confirmar.
- **Lojas:** ligação com o cadastro existente e a mensalidade acordada. `is_active` e trial continuam operacionais; cobrança e pagamento aparecem como dados comerciais separados.

Evitar inserir a seção inteira no atual `SuperadminBoard.tsx`. Criar rotas como `/superadmin/projetos` e `/superadmin/financeiro`, consultas e ações próprias, mantendo o mesmo layout e identidade MODS. Não alterar o fluxo de vendas das lojas.

## Segurança e integridade

1. Tabelas comerciais: RLS habilitada, privilégios de `anon` e `authenticated` revogados, sem políticas públicas. Acesso pela chave administrativa somente no servidor e **após** validação da sessão/e-mail de superadmin em cada query/action. A chave jamais vai para o browser.
2. Validar tipo, etapa, valor positivo ou zero onde permitido, vencimento, competência e referências no servidor e no banco. Converter entrada em reais para centavos antes de gravar; nunca somar `number` fracionário no cliente como fonte oficial.
   Ao confirmar um contrato, a soma da entrada e das parcelas precisa fechar exatamente o valor contratado; alterações posteriores exigem ajuste registrado.
3. Registrar pagamento de forma atômica no banco: travar cobrança, conferir saldo, inserir recebimento e rejeitar duplicidade/valor acima do saldo. Usar identificador de operação para evitar duplo clique/reenvio.
4. Alterações financeiras ficam auditáveis. Corrigir pagamento por estorno ou marcação de reversão, não por exclusão silenciosa. Cancelar cobrança sem apagar seu histórico.
5. Não gerar mensalidades retroativas automaticamente ao cadastrar uma assinatura antiga; backfill requer datas e valores reais. Na primeira versão, lançamento manual de mensalidades é aceitável; automação só após validar as regras de competência, pausa e reajuste.
   Assinatura pausada ou encerrada não deve gerar nova cobrança automática; cobranças anteriores continuam visíveis.
6. O painel é uma visão operacional de contratos e caixa recebido. Não é emissão fiscal, conciliação bancária nem apuração contábil de lucro. Margem por projeto depende de custos registrados e fica fora do primeiro corte.

## Sequência de implementação

1. **Base e CRM:** migração aditiva, projetos manuais, vínculo com `store_requests`, etapas e histórico; navegação nova sem alterar a captação atual.
2. **Contas a receber:** parcelas/entrada, mensalidade acordada, recebimentos parciais/estornos, validação transacional e visão mensal.
3. **Operação recorrente:** geração controlada de mensalidades por competência, lembretes e exportação CSV; avaliar despesas/margem quando os valores de custo estiverem confiáveis.

### Importação dos projetos antigos

Na primeira versão, cadastrar os projetos antigos em uma tela/importação revisável: empresa, tipo, descrição do escopo, data real do lead (se conhecida), data real da proposta/fechamento, valor contratado, entrada e parcelas combinadas, cada recebimento com sua data e mensalidade acordada quando houver. O total importado precisa bater com os documentos/controles existentes antes de confirmar a carga.

Um projeto antigo pode ser registrado no portfólio operacional mesmo quando falta algum dado financeiro. Datas ou valores desconhecidos ficam vazios e o projeto aparece como **histórico incompleto**, fora dos totais mensais correspondentes. Não usar a data de importação como se fosse a data do fechamento, nem reconstruir pagamentos a partir do preço de tabela dos planos. Registrar fonte e observação da importação para correções futuras.

A carga inicial deve ser idempotente (identificador externo por linha) e conferida em prévia: linhas válidas, duplicadas, incompletas e totais por mês. Aplicar somente após revisar a prévia e preservar o estado anterior para correção. Os cinco projetos selecionados para o portfólio social são candidatos para essa carga, mas o financeiro deve abranger todos os contratos antigos que o usuário quiser registrar, não só esses cinco.

Arquivos principais: nova migração em `supabase/migrations/`; novas rotas e componentes em `src/app/superadmin/`; ações/consultas separadas de `src/app/superadmin/actions.ts`; testes de cálculo financeiro e autorização. `supabase-schema.sql` deve refletir as novas tabelas para instalação limpa depois que a migração estiver validada. `src/lib/db.ts`, `src/lib/period.ts`, `sales` e a migração do financeiro das lojas são sensíveis e não devem ser reaproveitados para a receita da MODS.

## Verificação antes de publicar

- Sem sessão, usuário de loja e acesso direto à API não leem nem alteram dados comerciais da MODS.
- Lead de loja convertido aparece uma vez nos indicadores; projeto manual também aparece sem exigir `plan_id`.
- Fechamento, entrada, parcela, pagamento parcial, vencimento, estorno e troca de mês produzem os totais esperados.
- Apagar um pedido encerrado ou loja não apaga contrato, cobrança ou recebimento da MODS.
- Mobile de 390 px: sem rolagem horizontal; detalhes e ação de recebimento claros. Desktop: filtros/tabelas legíveis.
- Dados de produção continuam intactos até aprovação da migração e teste com registros sintéticos isolados.
