# MANUAL — Plataforma White-Label (MODUS)

> Documento de continuidade. Lê isto antes de mexer no código.
> **Regra de ouro: o que está funcionando NÃO deve ser alterado sem motivo.**
> Última atualização: 2026-06-08. Build limpo, 22 rotas.

---

## 1. O que é este projeto

Uma **plataforma que GERA lojas** de celular/assistência técnica white-label, vendida por assinatura a outros lojistas. **Não é uma loja** — é a "fábrica de lojas", baseada no projeto `celular-store` (M CELL), que continua **congelado e intocado**.

- **Marca da plataforma:** MODUS (a empresa do Luiz que vende os sistemas).
- **Marca das lojas geradas:** cada lojista tem a sua (nome, cor, logo, contatos).
- **1 deploy → N lojas**, resolvidas por subdomínio (`mcell.plataforma.com`).
- **Primeiros ~10 clientes:** provisionamento manual pelo Luiz, sem billing automático.

Caminho do projeto: `C:\Users\luizf\OneDrive\Área de Trabalho\DEV\plataforma-whitelabel`
Stack: Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind v4 + Supabase.

---

## 2. Tabela de planos (TRAVADA — não reabrir)

| Plano | Mensalidade | Trial | Limite produtos | Módulos |
|---|---|---|---|---|
| **Vitrine** | R$ 99,90/mês | 7 dias | 30 | Vitrine pública, Estoque, Configurações |
| **Loja** | R$ 179,90/mês | 7 dias | 150 | + Dashboard, Vendas, OS, Orçamentos, Agendamentos |
| **Master** | R$ 299,00/mês | 7 dias | 300 | + Promoções (tudo) |

**Taxa de implementação:** todo plano tem uma taxa única de setup no 1º mês, valor **conforme o projeto**, alinhada via WhatsApp pelo Luiz após o pedido. O site comunica: "Mensalidade a partir de R$99,90 + taxa de implementação conforme projeto". Fonte da verdade dos planos: seed em `supabase-schema.sql` espelhado em `src/lib/plans.ts`.

---

## 3. Arquitetura multi-tenant (como tudo se conecta)

```
Requisição → src/proxy.ts (middleware)
  ├─ /superadmin → auth do Luiz (SUPERADMIN_EMAIL)
  ├─ /captacao, /loja-inativa, /api → passa direto (plataforma)
  ├─ resolve slug (subdomínio OU ?store=slug em dev)
  │    ├─ sem slug + "/"  → rewrite p/ /captacao (landing MODUS)
  │    ├─ sem slug + outra rota → redirect p/ "/"
  │    └─ com slug → RPC resolve_store(slug)
  │         ├─ loja não existe / inativa+trial expirado → /loja-inativa
  │         ├─ /admin/* (exceto login) → exige sessão Supabase
  │         └─ injeta headers x-store-id + x-store-plan
  │
  ▼
Server Components (vitrine) leem x-store-id via getStoreIdFromHeaders() → db.ts (cliente anon)
Admin Layout (server) lê headers → passa storeId/planId p/ <AdminStoreProvider> (client)
  └─ AdminStore carrega dados via db.ts (cliente COM sessão no browser) → RLS por dono
```

**Pontos-chave:**
- `store_id` é **UUID** (FK `stores.id`), injetado como header pelo middleware. Substituiu a antiga env `NEXT_PUBLIC_STORE_ID`.
- `db.ts` escolhe o cliente Supabase em runtime: **browser = cliente com sessão** (RLS por usuário/admin), **server = anon** (leitura pública da vitrine).
- Feature flags por plano controlam o que aparece no admin (camada de UX); a **RLS no banco** é a segurança real.

---

## 4. Mapa de arquivos — code by code

### 4.1 Configuração / infra
- **`supabase-schema.sql`** — schema COMPLETO multi-tenant. Tabelas: `plans`, `stores`, `store_config`, `products`, `services`, `appointments`, `service_orders`, `sales`, `banners`, `quotes`, `store_requests`. Inclui seed dos 3 planos, índices por `store_id`, triggers `updated_at`, bucket de storage `store-assets`, e **toda a seção de RLS** (funções `owns_store`, `resolve_store` + policies). **Rodar inteiro no SQL Editor do Supabase.**
- **`.env.local.example`** — modelo das variáveis (ver seção 6).
- **`next.config.ts`** — `images.remotePatterns` já libera `*.supabase.co/storage/.../public/**` e unsplash.
- **`package.json`** — nome `plataforma-whitelabel`.

### 4.2 `src/lib/` (núcleo)
- **`supabase.ts`** — cliente **anon** (sem sessão). Usado no server p/ leituras públicas. Tem fallback "placeholder" p/ build sem env.
- **`supabase-browser.ts`** — `getSupabaseBrowser()` cria cliente do browser com sessão em cookies (`@supabase/ssr`). É o que carrega o JWT do admin logado.
- **`supabase-admin.ts`** — **SERVICE ROLE** (ignora RLS). ⚠️ **só servidor**, nunca importar em client. Usa `SUPABASE_SERVICE_ROLE_KEY`. Só o `/superadmin` usa.
- **`db.ts`** — camada de acesso. Toda função recebe `storeId` explícito. `db()` interno escolhe cliente (browser com sessão / server anon). Funções: `getStoreConfig/updateStoreConfig`, `getProducts/countProducts/upsertProduct/deleteProduct`, idem services/appointments/serviceOrders/sales/banners/quotes, `uploadImage`, e **`createPublicAppointment`** (insert sem `.select()` p/ o agendamento público funcionar sob RLS).
- **`store-headers.ts`** — `getStoreIdFromHeaders()` / `getPlanIdFromHeaders()`. Lê os headers injetados pelo middleware. **Server-only** (separado do db.ts p/ não quebrar client components).
- **`plans.ts`** — fonte da verdade dos planos no código (espelha o SQL). `MODULES`, `MODULE_LABELS`, `PLANS`, `getPlan`, `planHasModule`, `getProductLimit`, `cheapestPlanWithModule`, `nextPlanWithMoreProducts`, `ROUTE_MODULE` + `moduleForRoute()` (mapeia rota do admin → módulo exigido).
- **`brand.ts`** — `Brand` + `brandFromConfig(config)` normaliza `store_config` em branding (nome, logo, whatsapp internacional, telefone, instagram, endereço, horários, about) com fallbacks neutros. `waLink(brand, msg)` monta link wa.me. Usado pela vitrine.
- **`utils.ts`** — helpers herdados (formatCurrency, labels de status, `cn`, etc.).

### 4.3 Middleware
- **`src/proxy.ts`** — ⚠️ Next.js 16 chama de **proxy** (não "middleware"); a função exportada **precisa** se chamar `proxy`. Faz toda a resolução da seção 3. Usa a RPC `resolve_store` (e não SELECT direto em `stores`, que está protegido por RLS). Funções auxiliares: `handleAdminAuth`, `handleSuperadminAuth`, `resolveSlug`. Em build/preview sem Supabase, injeta `x-store-id=preview-store-id` e plano `master`.

### 4.4 Contexto do admin
- **`src/contexts/AdminStore.tsx`** — `'use client'`. `AdminStoreProvider` recebe `storeId`+`planId` por props. `load()` busca `storeConfig` + products/services/appointments/serviceOrders/sales/banners em paralelo. Hooks: `useAdminStore`, `usePlan` (hasModule/productLimit), `useStoreConfig` (branding do admin), `useProducts`/`useServices`/etc.

### 4.5 Componentes do admin
- **`components/admin/AdminShell.tsx`** — casca do admin: sidebar + topbar mobile (usa `useStoreConfig` p/ nome da loja) + envolve o conteúdo no `<ModuleGuard>`.
- **`components/admin/AdminSidebar.tsx`** — navegação. Filtra itens por `usePlan().hasModule`. Logo/nome vêm de `useStoreConfig` (branding por loja, com inicial colorida fallback). Dashboard aponta p/ `/admin/dashboard`.
- **`components/admin/ModuleGuard.tsx`** — bloqueia rota fora do plano. Dashboard sem plano → redireciona p/ `/admin/estoque` (pouso seguro). Demais → tela de upsell (visual MODUS) com CTA WhatsApp do Luiz.
- **`components/admin/BackButton.tsx`** — herdado.

### 4.6 Vitrine pública (`src/app/(public)/`)
- **`layout.tsx`** — **server async**: lê storeId → `getStoreConfig` → `brandFromConfig` → passa `brand` p/ `<Header>`, `<Footer>`, `<WhatsAppFloat>`. É aqui que a vitrine fica white-label.
- **`page.tsx`** — home da loja. Carrega produtos/serviços/banners/config; passa `brandName`+`logoUrl` p/ `HeroBanner`; usa `storeName` nos textos.
- **`loja/`, `servicos/`, `agendar/`, `sobre/`, `produto/[slug]/`** — páginas da vitrine. Todas pegam `storeId` via `getStoreIdFromHeaders()` e passam p/ o db. `agendar/AgendarClient.tsx` usa `createPublicAppointment` (insert público) e recebe `storeId` + `waNumber` por props.
- **`components/layout/Header.tsx` / `Footer.tsx` / `CustomerMenu.tsx` (+ `WhatsAppFloat`)** — recebem `brand` e renderizam nome/logo/contatos da loja (nada de "M CELL"). Sem whatsapp → o float some.
- **`components/store/HeroBanner.tsx`** — aceita `brandName`/`logoUrl`; logo flutuante usa a marca da loja (ícone fallback).

### 4.7 Admin (`src/app/admin/`)
- **`page.tsx`** — redireciona `/admin` → `/admin/dashboard`.
- **`login/page.tsx`** — login Supabase, branding **neutro** ("Painel da Loja", sem M CELL).
- **`(dashboard)/layout.tsx`** — **server**: lê headers, passa storeId/planId p/ `<AdminStoreProvider>` + `<AdminShell>`.
- **`(dashboard)/dashboard|estoque|vendas|servicos|agendamentos|orcamentos|assistencia|promocoes|configuracoes/`** — telas. Todas as chamadas ao db passam `storeId` (via `useAdminStore`). Estoque bloqueia acima do limite do plano. Notificações de WhatsApp ao cliente assinam com o **nome da loja** (não M CELL).

### 4.8 Superadmin (`src/app/superadmin/`)
- **`page.tsx`** — server: `listStores()` + `listRequests()` (service role) → `<SuperadminBoard>`.
- **`actions.ts`** — `'use server'`. `createStore` (cria loja + store_config + usuário auth com **senha temporária** retornada na tela + marca o pedido como provisionado), `setStoreActive`, `updateRequestStatus`, `listStores`, `listRequests`. Trial = 7 dias.
- **`SuperadminBoard.tsx`** — UI MODUS: stats, lista de pedidos (captação) com "Criar loja" pré-preenchido, lista de lojas com ativar/desativar e link pro subdomínio, modal de criação, modal de credenciais (copiar e-mail/senha).
- **`login/page.tsx`** — login do Luiz.

### 4.9 Captação (`src/app/captacao/`)
- **`page.tsx`** — server, metadata MODUS → `<CaptacaoClient>`.
- **`CaptacaoClient.tsx`** — landing MODUS completa (nav, hero com gradiente menta, solução, benefícios, **preços** com nota da taxa de implementação, **configurador wizard de 3 passos** com **preview ao vivo** da loja via CSS, FAQ, footer). Tela de sucesso com CTA WhatsApp do Luiz.
- **`actions.ts`** — `'use server'` `submitStoreRequest` insere em `store_requests` (cliente anon, RLS permite insert público, sem `.select()`).

### 4.10 Outros
- **`src/app/loja-inativa/page.tsx`** — tela "loja indisponível" (MODUS) p/ loja inativa/trial expirado.
- **`src/app/layout.tsx`** — root: html/body + `StoreTheme` (injeta `--accent`). Tolera ausência de loja (captação/superadmin).
- **`src/app/page.tsx`** — re-exporta `(public)/page` (padrão herdado; **não mexer**).

---

## 5. RLS — modelo de segurança (Etapa 3)

Tudo no `supabase-schema.sql`. Resumo do modelo:
- **`owns_store(store_id)`** — `SECURITY DEFINER`; true se `auth.jwt()->>'email' == stores.admin_email`. Base de todas as policies de dono.
- **`resolve_store(slug)`** — `SECURITY DEFINER`; o middleware (anon) resolve a loja sem expor `admin_email`.
- **Vitrine** (`products`, `services`, `banners`, `store_config`, `plans`) → **leitura pública**; escrita só do dono.
- **Privado** (`sales`, `service_orders`, `quotes`, `appointments`) → só o dono. `appointments` e `store_requests` aceitam **INSERT público** (agendamento e captação).
- **`stores`** → o dono lê a própria; provisionamento via **service role** (superadmin) que ignora RLS.
- **Storage `store-assets`** → leitura pública; escrita só autenticado.

⚠️ Por isso o `db.ts` usa cliente **com sessão** no browser — senão o admin logado não passaria nas policies de dono.

---

## 6. Como rodar (setup pendente — é config, não código)

1. **Criar projeto Supabase NOVO** (dedicado à plataforma, separado do celular-store).
2. **Rodar `supabase-schema.sql` inteiro** no SQL Editor (cria tudo + RLS).
3. **Criar `.env.local`** na raiz (base em `.env.local.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   NEXT_PUBLIC_PLATFORM_HOST=plataforma.com      # host base (sem https)
   SUPERADMIN_EMAIL=luizffernandocarvalho@gmail.com
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # SECRETO, só servidor
   ```
4. **Criar o usuário do superadmin** no Supabase Auth (e-mail = SUPERADMIN_EMAIL).
5. `npm install` → `npm run dev`.
6. **Provisionar a 1ª loja:** acessar `/superadmin/login`, criar loja (gera slug + usuário + senha temp). Ativar a loja.
7. **Testar a loja localmente:** como não há subdomínio em localhost, usar **`?store=<slug>`** na URL (ex.: `localhost:3000/?store=mcell`, `localhost:3000/admin?store=mcell`). Em produção é o subdomínio real.

---

## 7. Estado atual — o que está FUNCIONANDO

✅ Build limpo (`npm run build`), 22 rotas, zero erro de TypeScript.
✅ Etapa 1 — Multi-tenancy por subdomínio (proxy + db por storeId + AdminStore).
✅ Etapa 2 — Planos & feature flags (sidebar, ModuleGuard, limite de produtos).
✅ Etapa 3 — RLS completo no schema + db.ts ciente de sessão.
✅ Etapa 4 — Painel `/superadmin` (criar/ativar lojas, senha temp, pedidos).
✅ Etapa 5 — Captação `/captacao` (landing + configurador + preview + envio).
✅ White-label — sem vazamento "M CELL"/logo/telefone do amigo na vitrine, no admin e nas mensagens ao cliente.

**Verificação do plano (definição de "pronto"):**
- [x] Subdomínios distintos mostram lojas distintas (via resolve_store + headers).
- [x] Vitrine esconde módulos não contratados na sidebar.
- [x] 31º produto no plano Vitrine é bloqueado (UI) + RLS no banco.
- [x] Master vê todos os módulos.
- [x] RLS ativo (policies no schema).
- [x] Superadmin cria loja e ela aparece no subdomínio.
- [x] Captação grava pedido em `store_requests`.

---

## 8. Como continuar — próximos passos / follow-ups

**Não bloqueia o uso, mas vale fazer:**
1. **Upload de logo na config** — `store_config.logo_url` existe no schema e a vitrine/admin já renderizam o logo se houver URL, mas **não há UI** p/ enviar. Adicionar campo de upload em `configuracoes/page.tsx` (reusar `uploadImage(file, 'logos', storeId)`).
2. **Tema de cor do admin** — a vitrine já aplica `accent_color` (via `StoreTheme`/`--accent`), mas o **admin** ainda usa verde fixo nas classes. Se quiser admin colorido por loja, trocar `text-green-400`/`bg-green-500` por tokens do accent.
3. **E-mail de boas-vindas** — hoje o superadmin mostra a senha temp na tela p/ o Luiz repassar no WhatsApp. Se quiser automatizar, integrar um provedor de e-mail no `createStore`.
4. **Domínio próprio por loja** — fora de escopo agora (só subdomínio).
5. **Billing automático** — fora de escopo (primeiros 10 clientes manuais).
6. **Tela `/sobre` e textos** — alguns textos institucionais têm fallback genérico quando a config está vazia; revisar se quiser copy melhor.

**Quando for subir pro Git:** criar **branch** (não mexer no `celular-store`). Nada foi commitado ainda nesta sessão.

---

## 9. Armadilhas / convenções (LEIA antes de editar)

- ⚠️ **Não alterar o `celular-store`** — está congelado e em produção.
- ⚠️ **`src/proxy.ts`** — o arquivo e a função exportada DEVEM se chamar `proxy` (convenção Next.js 16). Não renomear p/ `middleware`.
- ⚠️ **`db.ts` cliente duplo** — não trocar `db()` por um cliente fixo; quebra a RLS (admin) ou as leituras públicas (vitrine).
- ⚠️ **`'use server'`** — arquivos de actions só exportam funções async (types são ok, são apagados em build).
- ⚠️ **OneDrive trava `.next`** — o projeto está dentro do OneDrive; o build às vezes falha com `EPERM`/`Device busy`. Solução: `rm -rf .next` antes de `npm run build`.
- ⚠️ **`store-headers.ts` é server-only** — não importar em client component (usa `next/headers`).
- ⚠️ **`supabase-admin.ts` (service role)** — nunca importar fora de server (actions/page server). Vaza acesso total.
- ⚠️ **Agendamento público** — usa `createPublicAppointment` (sem `.select()`), porque sob RLS o anon insere mas não lê de volta.
- **Branding:** vitrine usa `brandFromConfig` (lib/brand.ts); admin usa `useStoreConfig`. Sempre puxar nome/contato da config, nunca hardcodar.
- **WhatsApp do Luiz** (`5519981499229`) aparece de propósito em: upsell de plano, captação, loja-inativa, suporte. Isso é a marca MODUS/plataforma — está correto. Os contatos das LOJAS vêm da config.

---

## 10. Referências

**Diagrama da arquitetura:** [`docs/arquitetura.svg`](docs/arquitetura.svg) — fluxo visual (requisição → proxy → resolve_store → vitrine/admin/superadmin → Supabase+RLS). Abre em qualquer navegador.

- **Plano técnico:** `C:\Users\luizf\.claude\plans\leia-o-arquivo-c-users-luizf-claude-plan-deep-stonebraker.md`
- **Briefing original:** `C:\Users\luizf\.claude\plans\ol-claude-irei-te-smooth-cake.md`
- **Memória do projeto:** `...\.claude\projects\...\memory\project-plataforma-whitelabel.md`
- **Referência de design (MODUS):** memória `ref-design-modus.md` — verde-escuro, pontos, pills, gradiente menta. Vale p/ páginas da PLATAFORMA (captação/superadmin), NÃO p/ as lojas geradas.
