# Homologação local — segunda etapa

## Resultado

- Next.js e eslint-config-next atualizados para 16.3.4.
- Dependências transitivas vulneráveis atualizadas dentro das faixas compatíveis.
- `npm audit`: zero vulnerabilidades conhecidas, incluindo desenvolvimento.
- `npm audit --omit=dev`: zero vulnerabilidades conhecidas.
- `npm run build`: aprovado no Next.js atualizado.
- `npm run test:sales`: 15 testes aprovados em PGlite.
- `npm run test:concurrency`: 3 cenários aprovados em PostgreSQL nativo, duas conexões independentes.

Os três cenários adicionais verificam disputa pelo último item (a segunda
conexão realmente aguarda o lock), retry simultâneo do mesmo identificador e
duas edições usando a mesma revisão. Apenas uma operação conflitante é aceita.

## Interface exercitada no navegador

A demonstração usa os componentes reais de Vendas, Dashboard e AdminStore,
com transporte de testes para um PostgreSQL temporário exclusivo. Não lê `.env`,
não autentica no Supabase real e não altera dados do projeto publicado.

- Falha antes de salvar: zero vendas, formulário preservado e mensagem de erro.
- Resposta perdida após commit: a repetição recuperou uma única venda.
- Venda normal: registro confirmado e total atualizado.
- Cancelamento: confirmação dentro do painel, histórico preservado, saldo devolvido.
- Recarga: venda continuou cancelada.
- Dashboard: cancelada ficou fora das vendas aprovadas.
- Tela estreita: cartões em vez de tabela; ações visíveis sem rolagem horizontal.
- Medição final: viewport de 426 px, documento de 420 px, sem transbordamento.
  A tentativa de forçar 390 px no navegador interno não foi aplicada como solicitado;
  não considerar este ensaio como validação de iPhone físico ou de viewport 390 px.

A confirmação nativa do Chrome bloqueou a automação. Foi substituída por uma
confirmação no componente; a validação final foi concluída no navegador interno.
Também foi adicionada mensagem de carregamento para não exibir totais zero
enquanto os registros ainda estão sendo buscados.

## Executar novamente

```powershell
npm run test:sales
npm run test:concurrency
npm run qa:sales
```

O teste de concorrência abre somente `127.0.0.1:55439` e encerra o PostgreSQL ao
terminar. A demonstração abre `127.0.0.1:3018` e PostgreSQL em `127.0.0.1:55440`.
Variáveis `QA_PORT` e `QA_PG_PORT` podem escolher outras portas locais.
Digite `stop` no processo de demonstração ou encerre com Ctrl+C para fechar
servidor e banco. Os diretórios temporários `modus-qa-*` contêm somente fixtures.
Não são cópias do banco real. A demonstração atual foi iniciada em 3019/55441.

## Limites e próximo passo

Esta validação substitui a limitação de concorrência local descrita no relatório
da primeira etapa. Também resolve os sete avisos de dependências ali registrados.

Ainda não certifica cookies, Supabase Auth, PostgREST, RLS do projeto remoto,
provisionamento de loja, vitrine ou checkout end-to-end. A identidade de teste é
simulada no banco local; não foi apresentado como teste da autenticação real.

Antes de produção:

1. Conferir o schema efetivo e usar um Supabase separado para homologação.
2. Conferir encaminhamento de `x-store-id`/`x-store-plan` no proxy: o código
   existente coloca valores nos headers da resposta, enquanto o layout os lê
   da requisição. Este caminho não é exercitado pelo harness e precisa de correção/validação.
3. Conferir regra de atividade: trial nulo não deve, sozinho, reativar loja inativa.
4. Validar recuperação após recarga quando a resposta de uma venda se perde
   (a chave de tentativa da versão atual vive na memória da tela).
5. Testar login, isolamento e fluxo da loja completa nesse ambiente separado.
6. Revisar e aprovar a migração e a publicação de produção em uma janela coordenada.

Nenhum SQL remoto, deploy, push ou alteração de lojas reais foi realizado nesta etapa.
