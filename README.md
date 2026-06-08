# M CELL — Sistema de Loja & Assistência Técnica

> Sistema SaaS multi-tenant para loja de celulares. Desenvolvido em Next.js 16 + Supabase.

---

## 🔗 Links Importantes

| Recurso | Link |
|---|---|
| **Vitrine (produção)** | https://celular-store-seven.vercel.app |
| **Admin (produção)** | https://celular-store-seven.vercel.app/admin/login |
| **Vercel (deploy)** | https://vercel.com/luizgamerbr98-4602/celular-store |
| **Supabase (banco)** | https://supabase.com/dashboard/project/ehapqacpykunwwczuahw |
| **GitHub (código)** | https://github.com/luizmonteiro-art/mmcell |

---

## ✅ Status do Projeto (junho/2026)

### Concluído
- [x] Vitrine pública (home, produtos, serviços, agendamento, sobre)
- [x] Painel admin completo (dashboard, estoque, vendas, orçamentos, serviços, configurações)
- [x] Autenticação real via Supabase Auth
- [x] Banco de dados conectado (todas as telas persistem no Supabase)
- [x] Upload de imagens via Supabase Storage (bucket `store-assets`)
- [x] Orçamentos → conversão para Ordem de Serviço
- [x] Venda decrementa estoque automaticamente
- [x] Deploy no Vercel (produção)
- [x] Tabelas criadas no Supabase
- [x] Usuário admin criado

### Pendente (melhorias futuras)
- [ ] Domínio próprio (ex: `mcell.com.br`) — ver seção abaixo
- [ ] RLS (Row Level Security) no Supabase — segurança avançada
- [ ] Notificações em tempo real (Supabase Realtime)
- [ ] Relatórios financeiros com gráficos
- [ ] App mobile (PWA ou React Native)

---

## 🚀 Como rodar localmente

```bash
# 1. Entrar na pasta
cd "C:\Users\luizf\OneDrive\Área de Trabalho\DEV\celular-store"

# 2. Instalar dependências (só na primeira vez)
npm install

# 3. Iniciar servidor de desenvolvimento
npm run dev

# 4. Abrir no navegador
# http://localhost:3000
```

> As credenciais do Supabase estão em `.env.local` (não vai pro GitHub, fica só local).

---

## 📦 Como fazer deploy (atualizar produção)

```bash
# Opção 1 — via GitHub (automático)
git add -A
git commit -m "descrição da alteração"
git push origin main
# O Vercel detecta o push e faz deploy automático

# Opção 2 — deploy direto
vercel --prod
```

---

## 🌐 Como adicionar domínio próprio

1. Comprar domínio no [Registro.br](https://registro.br) — sugestão: `mcell.com.br` (~R$40/ano)
2. No [Vercel](https://vercel.com/luizgamerbr98-4602/celular-store) → Settings → Domains → Add
3. Copiar os registros DNS que o Vercel mostrar
4. No Registro.br → painel DNS → colar os registros
5. Aguardar até 24h (geralmente < 1h)
6. HTTPS é configurado automaticamente pelo Vercel

---

## 🗄️ Banco de Dados (Supabase)

**Projeto:** `ehapqacpykunwwczuahw`  
**Tabelas criadas:** `store_config`, `products`, `services`, `sales`, `service_orders`, `quotes`, `appointments`, `categories`

Para recriar o banco do zero (ex: em outro projeto), rodar o arquivo:
```
supabase-schema.sql
```
No SQL Editor do Supabase → clicar **"Executar sem RLS"** no aviso que aparecer.

---

## 👤 Criar novo usuário admin

1. [Supabase](https://supabase.com/dashboard/project/ehapqacpykunwwczuahw) → Authentication → Users
2. Add user → Create new user
3. Email + senha → marcar **Auto Confirm User**
4. Logar em `/admin/login`

---

## 🏗️ Estrutura do Projeto

```
src/
├── app/
│   ├── (public)/          # Vitrine pública (home, produtos, serviços, etc.)
│   ├── admin/             # Painel admin (protegido por auth)
│   └── api/               # Rotas de API
├── contexts/
│   └── AdminStore.tsx     # Estado global do admin (produtos, vendas, OS, etc.)
├── lib/
│   ├── db.ts              # Todas as chamadas ao Supabase
│   └── supabase.ts        # Cliente Supabase
└── types/
    └── index.ts           # Tipos TypeScript globais
```

**Regra de ouro:** Toda operação de dados passa por `src/lib/db.ts`. Nunca chamar Supabase diretamente nos componentes.

---

## ⚙️ Variáveis de Ambiente

Arquivo `.env.local` (não vai pro GitHub):
```
NEXT_PUBLIC_SUPABASE_URL=https://ehapqacpykunwwczuahw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua anon key>
NEXT_PUBLIC_STORE_ID=mmcell
```

No Vercel, as mesmas 3 variáveis estão configuradas em:
Settings → Environment Variables → Production

---

## 📋 Limites do plano gratuito

| Serviço | Limite | Observação |
|---|---|---|
| Vercel | 100 GB banda/mês | Mais que suficiente |
| Supabase DB | 500 MB | Anos de uso para loja pequena |
| Supabase Storage | 1 GB | ~500-1000 fotos de produto |
| Supabase inatividade | Pausa após 7 dias sem acesso | Usando todo dia não pausa |

Quando precisar de mais: upgrade Supabase Pro ~$25/mês remove todos os limites.

---

## 🔑 Convenções técnicas importantes

- **Middleware de auth:** arquivo `src/proxy.ts` com `export function proxy` (NÃO `middleware.ts`)
- **`service_orders.id`** é `TEXT` gerado no cliente como `OS${timestamp}` — nunca deixar o banco gerar
- **`quotes.id`** é `UUID` gerado via `crypto.randomUUID()`
- **`force-dynamic`** deve ser declarado em `src/app/page.tsx` E em `src/app/(public)/page.tsx` (não herda via re-export)
- **Multi-tenant:** todas as tabelas têm `store_id`. O `db.ts` filtra por `NEXT_PUBLIC_STORE_ID` automaticamente
