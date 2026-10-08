# Landing MODS: pesquisa e decisões (07/10/2026)

## Escopo

Atualização da rota `/captacao` para tráfego do Instagram @usemods.br. A página usa a identidade MODS aprovada, mantém a captação existente em `store_requests` e apresenta apenas recursos e planos que constam no projeto.

## Sinais observados nos últimos 30 dias

- [RD Station, 10/09/2026](https://www.rdstation.com/blog/marketing/automacao-ia-marketing-continuo/): automação e IA com contexto compartilhado entre marketing, vendas e atendimento.
- [Zendesk, 14/09/2026](https://www.zendesk.com/newsroom/press-releases/zendesk-introduces-specialized-ai-agents-purpose-built-for-your-business/): agentes especializados ligados a fluxos concretos do negócio.
- [RD Station, 23/09/2026](https://www.rdstation.com/blog/vendas/inteligencia-artificial-para-vendas/): IA de vendas conectada ao contexto real do funil.
- [Blip ID 2026](https://www.blip.ai/blog/eventos/aprendizados-blip-id-2026/): conversas, operação e resultados comerciais aparecem juntos na narrativa.

Esses são sinais recentes de posicionamento, não um ranking verificável das ferramentas “mais virais”. A MODS não foi apresentada como produto de IA porque a plataforma atual não oferece essa função como promessa comercial comprovada.

## Referências de página

- [Fin](https://fin.ai/): promessa curta de resultado, ação visível no início e demonstração do produto.
- [RD Station](https://www.rdstation.com/produtos/): segmentação por necessidade, CTAs para teste ou demonstração e produto mostrado de forma concreta.
- [Blip](https://www.blip.ai/): narrativa centrada em conversas e resultado, com provas próprias.

## Aplicação na MODS

1. Hero com promessa única: menos abas, mais clareza; CTA para conversa visível desde a primeira tela.
2. Sequência problema → solução → funcionamento → planos → dúvidas → formulário, com leitura rápida no celular.
3. Formulário em uma etapa e plano ajustável após a conversa; a implantação é informada como custo separado.
4. Logos, métricas, depoimentos e selos de popularidade sem prova foram removidos.
5. A vitrine é descrita corretamente como caminho para contato no WhatsApp, sem checkout, frete ou pagamento integrado.

## Integração com o superadmin

- O formulário continua gravando em `store_requests`; o superadmin lista a mesma tabela e usa nome, contato, plano, cor e WhatsApp ao preparar uma loja a partir do lead.
- A cor de referência voltou ao formulário para preservar a personalização captada antes. Os módulos continuam sendo derivados do plano no servidor.
- O WhatsApp de novos leads é salvo com DDD nacional, como esperam os links da plataforma. O superadmin também aceita registros antigos com ou sem `55` ao abrir a conversa.
- As funções de leitura de leads e lojas agora verificam a sessão do superadmin internamente, além da proteção da rota.

## Limites antes de usar no Instagram

- O domínio `usemods.com.br` foi associado ao projeto Vercel, mas **ainda não está liberado para a bio**: o usuário informou que `https://usemods.com.br/captacao` não abre nem no Wi-Fi nem no 5G. Antes de divulgá-lo, confirmar abertura normal nas duas redes. A URL provisória, validada na publicação, é `https://plataforma-whitelabel.vercel.app/captacao`.
- O usuário confirmou em 2026-10-07 que o WhatsApp comercial MODS é `19 93300-5099`; a landing já usa `5519933005099` nos dois links de contato.
- Um lead sintético, identificado por `mods-qa-muyso751@example.com`, foi enviado pela landing local e localizado no superadmin autenticado. O banco confirmou telefone normalizado, plano Loja, nove módulos e estado inicial pendente. A observação interna e as mudanças para Qualificado, Proposta e Aguardando pagamento foram gravadas no histórico. O registro de teste foi removido por ID e e-mail e sua ausência foi confirmada no painel.
- A rota pública de captação aceita inserções anônimas; monitorar spam ao ampliar o tráfego. Limitação de taxa pode ser acrescentada antes de campanhas pagas.

## Superadmin MODS e validação do fluxo

- Painel, login, metadados e tela de loja inativa usam a identidade MODS. A leitura de leads e lojas também exige sessão de superadmin dentro das funções de servidor.
- O formulário de provisionamento agora gera um identificador válido e mostra a URL real por `?store=`. O rascunho de criação a partir do lead preserva plano, e-mail, WhatsApp e cor.
- O kit demonstrativo de novas lojas é criado inativo e sinalizado como exemplo. A cor de destaque é limitada a hexadecimal de seis dígitos, e números de WhatsApp inválidos são recusados.
- Build de produção, TypeScript e ESLint passaram localmente. A landing foi conferida em 390 px sem rolagem horizontal; o superadmin teve o fluxo autenticado e o modal de lead revisados no celular. Sem sessão, `GET /superadmin` devolve `307` para `/superadmin/login`; `/captacao` e os assets MODS devolveram `200` no preview local.
- O provisionamento da loja de teste exige confirmação no momento da criação, pois cria um login de administrador. Sem essa confirmação, o fluxo foi validado até o formulário pré-preenchido; nenhuma loja de teste nem login foram criados.

## Publicação e domínio em 2026-10-07

- Projeto autenticado no Vercel: `luizgamerbr98-4602s-projects/plataforma-whitelabel`, vinculado ao checkout local pelo mesmo project ID. A versão MODS deste checkout foi publicada por deploy direto em produção, ID `dpl_9uFtGqMoU8J8vqchdHgES1nWQLrV`, com build e TypeScript aprovados pela Vercel. O código desta versão também foi enviado para `main` para preservar a identidade MODS em futuros deploys automáticos.
- Vercel CLI autenticado na conta `luizgamerbr98-4602`. O dry-run de deploy encontrou 181 arquivos e confirmou que `.env.local` e `.vercel` ficaram fora do pacote.
- As variáveis necessárias de Supabase, `SUPERADMIN_EMAIL` e `NEXT_PUBLIC_PLATFORM_HOST` estão cadastradas no escopo Production (valores não inspecionados). A tentativa de `vercel build --prod` foi barrada pela revisão automática porque baixaria segredos de produção ao workspace; o deploy normal fez o build remotamente.
- `https://plataforma-whitelabel.vercel.app/captacao` e `/` exibiram a MODS após publicação. O superadmin público autenticado exibiu o novo visual. Um lead sintético (`mods-qa-prod-20261007@example.com`) foi enviado pela landing de produção, apareceu no CRM e foi removido por ID e e-mail, com ausência confirmada. O contador de idade do lead foi corrigido para não mostrar `-1d` por pequena diferença de relógio. Metadados sociais e URL canônica apontam para `https://usemods.com.br/captacao`.
- `usemods.com.br` e `www.usemods.com.br` foram associados ao projeto. O Registro.br salvou dois registros A do domínio raiz (`216.198.79.1` e `64.29.17.1`) e o CNAME de `www` (`f527f6a4216b918c.vercel-dns-017.com.`). Ao ativar o modo avançado, a delegação mudou de `a.auto.dns.br`/`b.auto.dns.br` para `a.sec.dns.br`/`b.sec.dns.br`; os servidores novos responderam corretamente. A Vercel verificou os dois domínios como `configured-correctly`. Google DNS e Cloudflare também retornaram os registros. Testes HTTPS com o IP resolvido diretamente validaram certificado e resposta `200` em `/captacao`, `/` e `www`, além de redirecionamento `307` de `/superadmin` para o login sem sessão. O HTML do domínio apresentou título MODS, headline, WhatsApp confirmado e URL canônica. O roteador local `192.168.15.1` ainda conservava resposta DNS negativa às 22h38 BRT, por isso o navegador nesta rede não abria o endereço sem forçar a resolução; isso não afeta os resolvedores públicos já testados. Uma tentativa de alterar os nameservers para Vercel foi interrompida por expiração da sessão do Registro.br antes de confirmar e não é necessária, pois a configuração atual está válida.
- Depois da publicação, o usuário relatou falha de abertura em Wi-Fi e 5G. O roteador local respondeu com a delegação antiga `a.auto.dns.br`/`b.auto.dns.br`. O servidor antigo `a.auto.dns.br` não entregou endereço A; o novo `a.sec.dns.br` entregou os dois IPs configurados. O Google DNS também retornou a delegação nova. Isso confirma divergência de DNS entre resolvedores; ainda falta identificar o erro exato no 5G e validar a abertura normal no aparelho do usuário. O domínio personalizado deve ficar fora da bio até essa confirmação. A URL provisória do Vercel foi testada novamente e respondeu HTTPS `200`.
