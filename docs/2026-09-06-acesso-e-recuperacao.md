# Acesso à loja e recuperação de vendas — validação local

## Alterações

- Proxy encaminha `x-store-id` e `x-store-plan` na requisição recebida pelo layout,
  sobrescrevendo valores enviados pelo cliente. A renovação de cookies mantém esse contexto.
- Redirecionamento ao login preserva loja, destino e cookies renovados.
- Loja inativa sem trial válido fica bloqueada; erro de consulta retorna 503.
- Superadmin em produção fica indisponível quando o e-mail autorizado não está configurado.
- Operação de venda é registrada em `sessionStorage` antes de enviar ao banco,
  com identificador da venda, identificador da tentativa e dados necessários à retomada.
  A chave é separada por loja. O banco continua sendo a fonte de verdade.
- Após falha de transporte, novas gravações ficam bloqueadas até retomar a operação.
  Recarregar a mesma aba preserva a retomada. A recuperação exige ação do usuário.
- Exceção transacional PostgreSQL `P0001` libera a tentativa porque a transação foi revertida.
  Falhas de transporte mantêm a recuperação porque pode ter ocorrido gravação.

## Evidências

- 7 testes do proxy real com NextRequest/NextResponse e respostas Supabase simuladas.
- 3 testes do registro de recuperação: recarga, separação entre lojas e falha de armazenamento.
- 15 testes da migração de vendas passaram novamente.
- Build Next.js e TypeScript passaram; lint dos arquivos de produção alterados passou.
- Navegador isolado: simulação de resposta perdida após gravação, navegação completa
  à mesma página, aviso de recuperação preservado e retomada. Consulta posterior ao
  PostgreSQL local mostrou 1 venda, revisão 1 e estoque 2 (inicial 3).

```powershell
node --test tests/proxy.test.mjs tests/pending-sale.test.mjs
npm run test:sales
npm run build
```

## Limites

Não houve SQL remoto, push ou publicação. O proxy foi testado com autenticação simulada;
falta homologação com Supabase Auth, PostgREST e schema real em ambiente separado.
O registro de recuperação contém os dados da operação, inclusive cliente quando preenchido,
e é removido ao confirmar. Ele pertence à sessão da aba: fechar a aba, limpar armazenamento
ou trocar de dispositivo não oferece a mesma recuperação. Não representa sincronização offline.

A demonstração temporária do telefone continuou na versão anterior, nas portas 3019/3020,
para preservar a sessão em uso. Esta etapa usou outra demonstração isolada, porta 3021.
Os itens 2–4 de `2026-09-06-homologacao-local.md` agora possuem correção e evidência local;
continuam pendentes a validação no ambiente separado e a aprovação da publicação.
