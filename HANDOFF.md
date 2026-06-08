# 📱 M CELL — Documento de Handoff Técnico
> Gerado em: junho/2026 — Para continuação por outro desenvolvedor

---

## 🔗 Links Críticos (guarde esses)

| Recurso | URL |
|---|---|
| **Vitrine pública** | https://celular-store-seven.vercel.app |
| **Admin (login)** | https://celular-store-seven.vercel.app/admin/login |
| **Vercel dashboard** | https://vercel.com/luizgamerbr98-4602/celular-store |
| **Supabase dashboard** | https://supabase.com/dashboard/project/ehapqacpykunwwczuahw |
| **GitHub repositório** | https://github.com/luizmonteiro-art/mmcell |

---

## 🏗️ Stack Técnica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.7 |
| UI Runtime | React | 19 |
| Linguagem | TypeScript | 5 |
| Estilo | Tailwind CSS | v4 |
| Banco de dados | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth + @supabase/ssr | — |
| Deploy | Vercel | — |
| Ícones | Lucide React | — |
| Forms | React Hook Form + Zod | — |

---

## 🗄️ Infraestrutura

### Supabase
- **Projeto ref:** `ehapqacpykunwwczuahw`
- **URL:** `https://ehapqacpykunwwczuahw.supabase.co`
- **Anon key:** no arquivo `.env.local` (nunca sobe ao GitHub)
- **Storage bucket:** `store-assets` (imagens de produto)
- **RLS:** desabilitado em todas as tabelas (segurança a implementar futuramente)

### Vercel
- **Projeto:** `celular-store` (conta `luizgamerbr98-4602`)
- **Branch de produção:** `main`
- **Deploy automático:** qualquer push na `main` dispara um novo deploy

### GitHub
- **Repo:** `luizmonteiro-art/mmcell`
- **Branch principal:** `main`
- **Commit atual:** `c4591eb`

---

## 📁 Estrutura de Arquivos

```
celular-store/
├── src/
│   ├── app/
│   │   ├── (public)/              # Vitrine — Server Components
│   │   │   ├── page.tsx           # Home
│   │   │   ├── produtos/          # Listagem e detalhe de produto
│   │   │   ├── servicos/          # Serviços de assistência
│   │   │   ├── agendar/           # Agendamento online
│   │   │   └── sobre/             # Página sobre a loja
│   │   ├── admin/
│   │   │   ├── login/             # Tela de login (pública)
│   │   │   └── (dashboard)/       # Área protegida por auth
│   │   │       ├── page.tsx       # Dashboard (resumo)
│   │   │       ├── estoque/       # Gestão de produtos + upload de imagens
│   │   │       ├── vendas/        # Registrar venda + decrementar estoque
│   │   │       ├── servicos/      # Ordens de serviço (kanban) + Serviços
│   │   │       ├── orcamentos/    # Orçamentos + conversão para O.S.
│   │   │       ├── agendamentos/  # Agendamentos recebidos do site
│   │   │       └── configuracoes/ # Dados da loja (WhatsApp, endereço, etc.)
│   │   ├── api/                   # Rotas de API (Next.js Route Handlers)
│   │   └── page.tsx               # Re-export da home pública (ver gotcha abaixo)
│   ├── contexts/
│   │   └── AdminStore.tsx         # ⭐ Estado global do admin
│   ├── lib/
│   │   ├── db.ts                  # ⭐ Toda a camada Supabase
│   │   └── supabase.ts            # Cliente Supabase (build-safe)
│   ├── types/
│   │   └── index.ts               # Todos os tipos TypeScript
│   └── proxy.ts                   # ⭐ Middleware de autenticação
├── supabase-schema.sql            # Schema completo do banco
├── .env.local                     # Credenciais (NÃO vai ao GitHub)
├── README.md                      # Guia de operação
└── HANDOFF.md                     # Este arquivo
```

---

## ⭐ Arquivos-Chave (leia primeiro)

### `src/lib/db.ts` — Camada de dados
Todas as operações no Supabase passam por aqui. Nunca chame `supabase` diretamente nos componentes.

**Padrão de uso:**
```typescript
// Importar função do db.ts
import { getProducts, upsertProduct, deleteProduct } from '@/lib/db'

// Ler
const products = await getProducts()

// Criar ou atualizar (upsert detecta pelo id)
const saved = await upsertProduct({ id: '...', name: 'iPhone 14', price: 3500, ... })

// Deletar
await deleteProduct(id)
```

**Funções disponíveis:**
```typescript
// store_config
getStoreConfig()                            // retorna StoreConfig | null
updateStoreConfig(partial)                  // atualiza campos da loja

// products
getProducts()                               // retorna Product[]
upsertProduct(product)                      // cria ou atualiza
deleteProduct(id)

// services (tipos de serviço)
getServices()                               // retorna Service[]
upsertService(service)
deleteService(id)

// service_orders (ordens de serviço)
getServiceOrders()                          // retorna ServiceOrder[]
upsertServiceOrder(order)                   // id DEVE ser gerado antes (ver gotcha)
deleteServiceOrder(id)

// sales
getSales()                                  // retorna Sale[]
insertSale(sale)                            // apenas insert (sem update)
deleteSale(id)

// appointments
getAppointments()
upsertAppointment(appt)
deleteAppointment(id)

// quotes (orçamentos)
getQuotes()
upsertQuote(quote)
deleteQuote(id)

// banners
getBanners()
upsertBanner(banner)
deleteBanner(id)

// upload de imagens
uploadImage(file: File, folder: string)     // retorna URL pública ou base64
```

---

### `src/contexts/AdminStore.tsx` — Estado global

Contexto React que carrega todos os dados do Supabase na montagem e expõe hooks por entidade.

**Padrão de uso nos componentes do admin:**
```typescript
'use client'
import { useProducts, useSales, useServiceOrders } from '@/contexts/AdminStore'

function MeuComponente() {
  const [products, setProducts] = useProducts()
  const [sales, setSales] = useSales()

  // Após persistir no banco via db.ts, atualizar a UI sem re-fetch:
  const handleDelete = async (id: string) => {
    await deleteProduct(id)                          // persiste
    setProducts(prev => prev.filter(p => p.id !== id)) // atualiza UI
  }
}
```

**Hooks disponíveis:**
```typescript
useProducts()       // [Product[], setter]
useServices()       // [Service[], setter]
useAppointments()   // [Appointment[], setter]
useServiceOrders()  // [ServiceOrder[], setter]
useSales()          // [Sale[], setter]
useBanners()        // [Banner[], setter]
useAdminStore()     // store completo (inclui _loaded, _error, reload())
```

---

### `src/proxy.ts` — Middleware de auth

**⚠️ ATENÇÃO:** O arquivo se chama `proxy.ts` (não `middleware.ts`). Isso é intencional — este projeto usa uma convenção diferente do Next.js padrão. Não renomear.

```typescript
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: ['/admin/:path+'] }
```

Protege todas as rotas `/admin/*` exceto `/admin/login`. Se não houver sessão válida, redireciona para login.

---

### `src/lib/supabase.ts` — Cliente Supabase

Build-safe: se as env vars não existirem (ex: CI sem .env), usa um cliente placeholder em vez de quebrar.

```typescript
const isConfigured = url.startsWith('http') && key.length > 10
export const supabase = isConfigured
  ? createClient(url, key)
  : createClient('https://placeholder.supabase.co', 'placeholder-key-for-build')
```

---

## 🗃️ Schema do Banco

**8 tabelas criadas no Supabase** (arquivo completo: `supabase-schema.sql`):

| Tabela | id type | Descrição |
|---|---|---|
| `store_config` | UUID (auto) | 1 linha por loja — configurações gerais |
| `products` | UUID (auto) | Catálogo de produtos |
| `services` | UUID (auto) | Tipos de serviço (troca de tela, etc.) |
| `service_orders` | **TEXT** (manual) | Ordens de serviço — formato `OS123456` |
| `sales` | UUID (auto) | Vendas registradas |
| `appointments` | UUID (auto) | Agendamentos online |
| `banners` | UUID (auto) | Banners da vitrine |
| `quotes` | UUID (auto) | Orçamentos |

Todas têm coluna `store_id TEXT` — o sistema é multi-tenant, uma loja = um valor de `NEXT_PUBLIC_STORE_ID`.

**Para recriar o banco:** rodar `supabase-schema.sql` no SQL Editor → clicar **"Executar sem RLS"** no aviso.

---

## ⚙️ Variáveis de Ambiente

**Arquivo `.env.local`** (local, nunca sobe ao GitHub):
```env
NEXT_PUBLIC_SUPABASE_URL=https://ehapqacpykunwwczuahw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key — pegar no Supabase dashboard>
NEXT_PUBLIC_STORE_ID=mmcell
```

**No Vercel** (Settings → Environment Variables → Production):
As mesmas 3 variáveis já estão configuradas. Para uma loja diferente, criar novo projeto Vercel com `NEXT_PUBLIC_STORE_ID` diferente.

> A `anon key` é pública por design — vai pro browser, fica exposta no HTML. Nunca usar a `service_role key` no frontend.

---

## 🚨 Gotchas Críticos (armadilhas)

### 1. `service_orders.id` é TEXT sem default no banco
```typescript
// ❌ ERRADO — id não fornecido → insert falha silenciosamente
const order = { customer_name: '...', problem: '...' }
await upsertServiceOrder(order) // nunca persiste!

// ✅ CORRETO — gerar id ANTES do upsert
const order: ServiceOrder = {
  id: `OS${String(Date.now()).slice(-6)}`,  // ex: "OS491234"
  customer_name: '...',
  ...
}
await upsertServiceOrder(order) // persiste no banco
```

### 2. `force-dynamic` NÃO é herdado via re-export
```typescript
// src/app/page.tsx (re-exporta a home pública)
export { default } from '@/app/(public)/page'
export const dynamic = 'force-dynamic'  // PRECISA estar aqui também
// Não basta estar em (public)/page.tsx — o Next.js não herda via re-export
```

### 3. Middleware é `proxy.ts`, não `middleware.ts`
Este projeto usa `src/proxy.ts` com `export function proxy`. **Não renomear para `middleware.ts`.**

### 4. Auth usa `@supabase/ssr` nos Server Components
```typescript
// ✅ Server Components / proxy.ts
import { createServerClient } from '@supabase/ssr'

// ✅ Client Components (admin)
import { createBrowserClient } from '@supabase/ssr'

// ❌ Nunca usar no browser — usa localStorage, não cookies
import { createClient } from '@supabase/supabase-js'
```

### 5. Multi-tenant: toda query filtra por `store_id`
O `db.ts` já faz isso automaticamente. Se adicionar queries manuais, lembrar de incluir `.eq('store_id', STORE_ID)`.

---

## 📦 Tipos TypeScript (`src/types/index.ts`)

```typescript
// Enums
type ProductCondition = 'novo' | 'seminovo' | 'lacrado'
type ProductCategory  = 'iphone' | 'android' | 'capinha' | 'pelicula' | 'carregador' | 'acessorio'
type ServiceStatus    = 'recebido' | 'em_analise' | 'aguardando_peca' | 'em_reparo' | 'pronto' | 'entregue'
type AppointmentStatus = 'pendente' | 'confirmado' | 'cancelado' | 'realizado'
type PaymentMethod    = 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito'
type QuoteStatus      = 'pendente' | 'aprovado' | 'recusado' | 'expirado'

// Interfaces principais
interface Product { id, name, slug, price, promo_price?, stock_qty, category, brand, condition, images[], is_featured, is_active, specs? }
interface Service { id, name, description, price_from, duration_minutes, is_active, icon }
interface ServiceOrder { id, customer_name, customer_phone, device_brand, device_model, problem, diagnosis?, price?, status, created_at, updated_at }
interface Sale { id, items: SaleItem[], total, payment_method, customer_name?, customer_phone?, notes? }
interface Quote { id, customer_name, customer_phone, device, items: QuoteItem[], desconto, observacoes, validade, status }
interface Appointment { id, customer_name, customer_phone, service_id, service_name, device_info, problem, scheduled_at, status }
interface Banner { id, title, subtitle, image_url, badge?, cta_text, cta_href, is_active, order }
```

---

## ✅ O que está 100% funcionando

| Funcionalidade | Onde | Status |
|---|---|---|
| Vitrine pública dinâmica | `/` | ✅ Conectada ao Supabase |
| Página de produtos | `/produtos` | ✅ |
| Detalhe de produto | `/produtos/[slug]` | ✅ |
| Página de serviços | `/servicos` | ✅ |
| Agendamento online | `/agendar` | ✅ WhatsApp integrado |
| Sobre a loja | `/sobre` | ✅ |
| Login admin | `/admin/login` | ✅ Auth real Supabase |
| Dashboard (resumo) | `/admin` | ✅ |
| Gestão de estoque | `/admin/estoque` | ✅ CRUD + upload de imagens |
| Registro de vendas | `/admin/vendas` | ✅ Decrementa estoque automaticamente |
| Ordens de serviço | `/admin/servicos` | ✅ Kanban por status |
| Tipos de serviço | `/admin/servicos` | ✅ CRUD |
| Orçamentos | `/admin/orcamentos` | ✅ Persistidos no banco |
| Converter Orçamento → OS | `/admin/orcamentos` | ✅ Cria ServiceOrder + redireciona |
| WhatsApp do orçamento | `/admin/orcamentos` | ✅ Link dinâmico com dados da loja |
| Agendamentos | `/admin/agendamentos` | ✅ |
| Configurações da loja | `/admin/configuracoes` | ✅ |
| Upload de imagens | Estoque | ✅ Supabase Storage + fallback base64 |
| Proteção das rotas admin | `proxy.ts` | ✅ Redireciona para login sem sessão |
| Deploy automático | Vercel + GitHub | ✅ Push na main = novo deploy |

---

## 🔜 Pendências (o que falta implementar)

| Item | Prioridade | Observações |
|---|---|---|
| **Domínio próprio** | Alta | Comprar em registro.br + configurar no Vercel |
| **RLS (Row Level Security)** | Média | Hoje RLS está desabilitado — suficiente para lançamento, mas recomendado ativar depois |
| **Relatórios financeiros** | Média | Gráficos de vendas por período, ticket médio |
| **Notificações em tempo real** | Baixa | Supabase Realtime para atualizar o kanban sem F5 |
| **PWA / App Mobile** | Baixa | Manifest + service worker para instalar no celular |
| **Histórico de cliente** | Baixa | Buscar todas as OS/vendas de um cliente |
| **Impressão de OS** | Baixa | PDF ou página de impressão da ordem de serviço |

---

## 🚀 Como rodar localmente

```bash
# Pré-requisitos: Node.js 18+, npm

# 1. Clonar o repositório
git clone https://github.com/luizmonteiro-art/mmcell.git
cd mmcell

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
# Copiar o .env.local existente OU criar novo:
echo "NEXT_PUBLIC_SUPABASE_URL=https://ehapqacpykunwwczuahw.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key do Supabase>" >> .env.local
echo "NEXT_PUBLIC_STORE_ID=mmcell" >> .env.local

# 4. Iniciar servidor de desenvolvimento
npm run dev
# → http://localhost:3000
```

---

## 🚢 Como fazer deploy

```bash
# Via GitHub (recomendado — automático)
git add -A
git commit -m "descrição da alteração"
git push origin main
# O Vercel detecta o push e faz deploy em ~2 minutos

# Via CLI Vercel (direto)
vercel --prod
```

---

## 👤 Criar/gerenciar usuários admin

1. Acesse o [Supabase dashboard](https://supabase.com/dashboard/project/ehapqacpykunwwczuahw)
2. Menu lateral → **Authentication → Users**
3. Botão **Add user → Create new user**
4. Preencha email + senha
5. Marque **"Auto Confirm User"** (senão precisaria confirmar por e-mail)
6. Login em `/admin/login`

---

## 🖼️ Upload de Imagens

O helper `uploadImage` em `db.ts` tenta o Supabase Storage primeiro. Se falhar (bucket não existe, permissão negada), salva a imagem como base64 inline — o app **nunca quebra**.

```typescript
import { uploadImage } from '@/lib/db'

// Usar em qualquer componente client que precise de upload:
const url = await uploadImage(file, 'products')  // retorna URL pública ou base64
```

**Bucket:** `store-assets` (público, sem autenticação para leitura)
**Estrutura dos paths:** `{store_id}/products/{uuid}.jpg`

---

## 🏪 Multi-tenant (como escalar para outras lojas)

Para adicionar uma segunda loja:
1. Criar novo projeto Vercel apontando para o mesmo repositório
2. Configurar as env vars com `NEXT_PUBLIC_STORE_ID=novaLoja`
3. Rodar no SQL Editor: `INSERT INTO store_config (store_id, store_name, ...) VALUES ('novaLoja', 'Nova Loja', ...)`
4. Criar usuário admin no Supabase Auth

O mesmo banco Supabase serve N lojas — cada uma isolada pelo `store_id`.

---

## 📊 Limites dos Planos Gratuitos

| Serviço | Plano | Limite relevante | Observação |
|---|---|---|---|
| Vercel | Hobby (free) | 100 GB banda/mês | Mais que suficiente |
| Supabase | Free | 500 MB banco | Anos de uso para loja pequena |
| Supabase | Free | 1 GB storage (fotos) | ~500–1000 fotos |
| Supabase | Free | Pausa após 7 dias sem acesso | Usando todo dia não pausa |
| GitHub | Free | Repositórios ilimitados | ✅ |

**Upgrade recomendado quando:** loja crescer, precisar de mais fotos, ou quiser garantia de SLA. Supabase Pro: ~$25/mês.

---

## 🔐 Segurança

| Item | Status | O que fazer |
|---|---|---|
| `.env.local` no `.gitignore` | ✅ Configurado | Nunca commitar credenciais |
| `service_role key` no frontend | ✅ Nunca usada | Manter assim |
| `anon key` exposta no browser | ✅ Seguro por design | É público por natureza |
| RLS (isolamento por store) | ⚠️ Desabilitado | Ativar antes de escalar para múltiplas lojas |

---

*Documento gerado em junho/2026. Última atualização de código: commit `c4591eb`*
