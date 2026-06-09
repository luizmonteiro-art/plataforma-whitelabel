# 🚀 Começar aqui — próxima sessão

**Arquivo principal de continuidade:** [`MANUAL.md`](MANUAL.md)
**Diagrama da arquitetura:** [`docs/arquitetura.svg`](docs/arquitetura.svg)

Copie o prompt abaixo e cole no início da próxima sessão do Claude Code (já estando dentro da pasta do projeto):

---

## 📋 PROMPT PARA COLAR

```
Estou retomando a "Plataforma White-Label (MODUS)" — uma plataforma que GERA
lojas de celular/assistência white-label, baseada no celular-store (que está
CONGELADO e não deve ser alterado).

Antes de qualquer coisa:
1. Leia C:\Users\luizf\OneDrive\Área de Trabalho\DEV\plataforma-whitelabel\MANUAL.md
   por completo — é o documento de continuidade (arquitetura, mapa de arquivos
   code-by-code, estado atual, armadilhas).
2. Abra docs/arquitetura.svg para o mapa visual.

Contexto travado (NÃO reabrir):
- App único + subdomínio ({slug}.plataforma.com); em dev usa ?store=slug.
- 3 planos: Vitrine R$99,90/30 produtos · Loja R$179,90/150 · Master R$299/300,
  trial 7 dias, taxa de implementação alinhada via WhatsApp pelo Luiz.
- As 5 etapas JÁ ESTÃO implementadas e o build está limpo (22 rotas):
  multi-tenancy, planos/flags, RLS, /superadmin, /captacao. Vitrine e admin
  já são white-label (sem vazar "M CELL").

REGRA DE OURO: não altere o que está funcionando. Não toque no celular-store.
Atenção em modificações e revisões. Sempre que mexer no código, rode
`npm run build` para validar (se der EPERM do OneDrive, rode `rm -rf .next` antes).

O que falta é CONFIGURAÇÃO, não código (ver seção 6 do MANUAL):
- criar projeto Supabase novo da plataforma e rodar supabase-schema.sql inteiro;
- criar .env.local (base em .env.local.example): URL, ANON_KEY, PLATFORM_HOST,
  SUPERADMIN_EMAIL, SUPABASE_SERVICE_ROLE_KEY;
- criar o usuário do superadmin no Supabase Auth;
- provisionar a 1ª loja pelo /superadmin e testar com ?store=slug.

Comece confirmando em poucas linhas que entendeu o estado atual (a partir do
MANUAL) e me proponha o passo a passo para colocar a plataforma rodando de ponta
a ponta com a primeira loja real. NÃO comece a codar até eu aprovar.
```

---

## ✅ Estado ao parar (2026-06-08)
- Código das 5 etapas completo, `npm run build` limpo (22 rotas).
- White-label aplicado (vitrine, admin, mensagens ao cliente).
- Nada commitado ainda — quando for, criar **branch** (não tocar no celular-store).

## 🎯 Próximo objetivo
Colocar a plataforma rodando de ponta a ponta: Supabase + `.env.local` +
provisionar a 1ª loja real pelo `/superadmin` e validar o fluxo completo.
