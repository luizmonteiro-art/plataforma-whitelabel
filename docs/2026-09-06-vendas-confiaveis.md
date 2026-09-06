# Primeira etapa: vendas e estoque confiáveis

Atualização: a segunda etapa está em `2026-09-06-homologacao-local.md`.
Ela registra os testes com PostgreSQL nativo e navegador e a resolução dos
avisos de dependências. Os resultados abaixo descrevem a primeira etapa.

## Estado e escopo

Checkout: `DEV/plataforma-whitelabel`. Em 06/09/2026, HEAD e main remoto apontavam
para `b2beb2009790131df6249ec6745d56bffd2223e5`. Há alterações locais anteriores
em superadmin, captação, estoque, autenticação, schema e outros arquivos. Foram
preservadas. A igualdade com o GitHub não identifica qual build está na Vercel.

Esta etapa modifica apenas código local e adiciona uma migração revisável.
Não houve SQL de produção, deploy, criação, ativação ou exclusão de lojas.

## Comportamento entregue

- Venda, diferença de estoque e histórico de movimentos são gravados em uma transação.
- A função confere usuário, empresa, plano, atividade, itens, quantidades, total e saldo.
- Operações de venda da mesma loja são serializadas; produtos são bloqueados em ordem estável.
- Cada requisição tem um UUID. Repetir a última requisição confirmada devolve a venda sem repetir a baixa.
- Revisão da venda impede sobrescrever mudanças feitas em outro acesso.
- Pendente reserva estoque; aprovado mantém a reserva/baixa; cancelado devolve o saldo.
- Edição ajusta somente a diferença de quantidades.
- Exclusão de venda foi retirada da interface. Cancelamento preserva a trilha.
- A interface confirma somente a resposta do banco; falhas mantêm o formulário e mostram mensagem.
- Dashboard e vendas usam status persistido; aprovação não equivale a pagamento recebido.
- Produto editado usa saldo anterior como condição da atualização para não sobrescrever uma venda posterior.
- Exclusão de produto que falhar não remove mais o cartão apenas na interface.

## Registros anteriores

Vendas existentes recebem `stock_managed=false`. Permanecem visíveis como
"A conferir", fora dos totais por situação e bloqueadas para mutações pela RPC.
Não é seguro deduzir seu status anterior, porque o frontend antigo não o persistia.
Não foram recalculados saldos históricos. A conciliação deve ser feita com o dono
da loja em uma etapa separada; não basta alterar a flag para true.

## Arquivos desta etapa

- `supabase/migrations/20260906_atomic_sales.sql`: migração incremental; não substitui o schema existente.
- `src/lib/db.ts`: RPC de vendas e atualização condicional de produto.
- `src/types/index.ts`: status, revisão e identificação de registros conferidos.
- `src/app/admin/(dashboard)/vendas/`: fluxo persistente e mensagens de erro.
- `src/app/admin/(dashboard)/dashboard/page.tsx`: totais por situação.
- `src/app/admin/(dashboard)/estoque/EstoqueClient.tsx`: protege saldo e trata falha de exclusão, preservando mudanças anteriores.
- `tests/atomic-sales.test.mjs`: PostgreSQL local via PGlite, sem acesso ao Supabase.
- `package.json` / lock: comando de teste e dependência de desenvolvimento PGlite.

## Validação e seus limites

`npm run test:sales`: 15 cenários executam a migração e a função SQL em PostgreSQL
isolado, usando estrutura mínima compatível com as tabelas lidas e escritas.
Cobrem gravação, retry, status, edição, cancelamento, saldo insuficiente, rollback
com múltiplos produtos, revisão antiga, propriedade, plano, inatividade, acesso
anônimo, bloqueio de escrita direta, histórico e saldo antigo de formulário.

PGlite não reproduz duas conexões PostgreSQL simultâneas, PostgREST, cookies,
RLS instalada na produção, rede mobile ou confirmação por pagamento. Não se
trata de homologação completa no Supabase. Build e TypeScript validam compilação.

## Sequência para homologação e eventual publicação

1. Preservar snapshot das alterações locais e revisar o diff desta etapa separadamente.
2. Conferir schema, grants, políticas e funções realmente instaladas no Supabase de destino.
3. Usar um projeto Supabase de homologação sem clientes/dados pessoais e revisar backup/restauração.
4. Aplicar o schema base em banco novo e, depois, a migração incremental acima.
   Não reaplicar o schema base sobre esta migração: ele contém políticas/grants antigos.
5. Publicar preview apontando exclusivamente para homologação.
6. Preparar duas empresas de demonstração e testar isolamento, edição, cancelamento,
   recarga, falha de rede, duplo clique e disputa real pelo último item em duas sessões.
7. Confirmar que uma sessão antiga não consegue inserir/editar/excluir vendas diretamente.
8. Conferir produto e venda em ambas as telas após cada operação; conferir os movimentos.
9. Somente depois, aprovar execução de SQL e deploy de produção em uma janela coordenada.

A migração revoga a escrita direta em `sales` de anon/authenticated. Isso faz
clientes antigos falharem em vez de contornar o novo fluxo. A tela antiga pode
mostrar sucesso falso mesmo assim: deve-se interromper seu uso e exigir recarga.
O frontend novo antes da migração bloqueia gravação com mensagem de atualização
pendente. Não publicar somente um dos lados como se a entrega estivesse completa.

Se houver falha depois da publicação, bloquear novas operações, preservar logs e
os movimentos, diagnosticar e corrigir para frente. Não apagar colunas, movimentos
ou reabilitar escrita direta como rollback automático.

## Pendências antes de considerar a operação pronta para escala

- Homologação real de browser, PostgREST e concorrência entre duas conexões.
- Idempotência de longa duração: o UUID de tentativa fica na memória da tela. Se
  uma resposta se perder e a página for recarregada, conferir o histórico antes
  de cadastrar novamente. A mesma operação não deve ser recriada como nova venda.
- Ajustes manuais de inventário ainda usam o fluxo existente, com comparação de
  saldo; a trilha desta etapa cobre movimentos de vendas, não todo o inventário.
- Exclusão de produto/loja com movimentos fica impedida por vínculos no banco.
  Preferir inativação; política de arquivamento/remoção precisa de desenho próprio.
- Não há conciliação financeira, confirmação de pagamento ou checkout integrado nesta etapa.
- Paginação e resumo por servidor ainda são necessários para grande volume.
- Auditoria de dependências apontou 7 avisos altos em pacotes existentes
  (`next`, `sharp`, `postcss`, `nanoid`, `js-yaml`, `browserslist`, `brace-expansion`).
  Atualização deve ser tratada e testada antes de produção, sem `audit fix --force` automático.
- A oferta comercial e o painel publicado têm planos distintos; unificar depois
  de concluir a demonstração operacional do nicho de celulares/assistência.
