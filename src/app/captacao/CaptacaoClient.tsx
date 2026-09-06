'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState, useSyncExternalStore, useTransition } from 'react'
import {
  ArrowUpRight, ArrowRight, Check, Sparkles, Store, Calendar,
  Wrench, BarChart3, Palette, Zap, ShieldCheck, Clock, ChevronDown,
  Loader2, CheckCircle2, MessageCircle, Smartphone, AtSign,
} from 'lucide-react'
import { PLANS, MODULE_LABELS, type ModuleFlag } from '@/lib/plans'
import { submitStoreRequest, type RequestInput } from './actions'
import { ModusLogo } from '@/components/brand/ModusLogo'

const WA_LUIZ = '5519933005099'
const IG_MODUS = 'https://www.instagram.com/usemodus.ai/'
const brl = (n: number) => 'R$ ' + n.toFixed(2).replace('.', ',')

const NAV = [
  { href: '#solucao', label: 'Solução' },
  { href: '#beneficios', label: 'Benefícios' },
  { href: '#precos', label: 'Preços' },
  { href: '#faq', label: 'FAQ' },
]

const SOLUCOES = [
  {
    icon: Store,
    title: 'Vitrine com cara de marca',
    desc: 'Produtos, promos e catálogo organizados em uma vitrine que parece própria, não improvisada.',
  },
  {
    icon: Wrench,
    title: 'Operação da assistência',
    desc: 'Ordens de serviço, catálogo de reparos e status do atendimento num fluxo claro para a equipe.',
  },
  {
    icon: Calendar,
    title: 'Agendamentos e captação',
    desc: 'O cliente agenda pelo site, chama no WhatsApp e entra no seu funil sem depender de atendimento manual.',
  },
  {
    icon: BarChart3,
    title: 'Painel para decisão',
    desc: 'Estoque, vendas, conteúdo e indicadores reunidos num painel simples para o dono tocar a operação.',
  },
]

const BENEFICIOS = [
  {
    icon: Zap,
    title: 'Estrutura pronta para vender',
    desc: 'Você não começa do zero. A base já nasce com páginas, módulos e lógica comercial.',
  },
  {
    icon: Palette,
    title: 'Identidade visual adaptável',
    desc: 'Nome, cor, logo e tom de marca entram no sistema inteiro sem cara de tema engessado.',
  },
  {
    icon: ShieldCheck,
    title: 'Arquitetura separada por loja',
    desc: 'Cada cliente opera sua própria loja com isolamento de dados e administração dedicada.',
  },
  {
    icon: Clock,
    title: 'Implantação curta',
    desc: 'O projeto fica muito mais rápido porque a base já resolve o técnico pesado do MVP.',
  },
]

const PROVAS = [
  { value: '1 núcleo', label: 'para múltiplas marcas' },
  { value: 'Sem código', label: 'para começar a operar' },
  { value: 'Apoio guiado', label: 'na ativação inicial' },
]

const EXPERIENCE_POINTS = [
  'Ativação mais simples para o lojista',
  'Apresentação mais forte para a marca',
  'Operação mais organizada desde o início',
]

const PLAN_PITCH: Record<string, { badge: string; desc: string }> = {
  vitrine: {
    badge: 'entrada enxuta',
    desc: 'Para quem quer validar presença digital com mais apresentação e menos improviso.',
  },
  loja: {
    badge: 'mais recomendado',
    desc: 'Para quem quer vender, atender e organizar a operação no mesmo núcleo.',
  },
  master: {
    badge: 'estrutura completa',
    desc: 'Para operações que já querem começar com uma base mais ampla e robusta.',
  },
}

const ACTIVATION_ASSURANCES = [
  { title: 'Fluxo guiado', desc: 'Você preenche o essencial e a ativação segue com clareza.' },
  { title: 'Sem reunião longa', desc: 'A entrada começa simples, sem depender de processo pesado.' },
  { title: 'Ajuste alinhado', desc: 'Os detalhes finais são combinados com você no momento certo.' },
]

const PARTNER_LOGOS = [
  { name: 'Nikibar', src: '/references/nikibar.png' },
  { name: 'Pod King', src: '/references/podking.png' },
  { name: 'MM', src: '/references/mm.png' },
  { name: 'Nexxtarg', src: '/references/nextarg.png' },
  { name: 'Imperial Cell', src: '/references/imperial-cell.png' },
  { name: 'Transfer', src: '/references/transfer.png' },
  { name: 'Outstock Imports', src: '/references/outstock.png' },
]

const FAQ = [
  {
    q: 'Tem fidelidade ou contrato longo?',
    a: 'Não. A operação funciona por mensalidade conforme o plano escolhido, com possibilidade de ajuste conforme a fase da loja.',
  },
  {
    q: 'Como funciona a taxa de implementação?',
    a: 'Existe uma taxa única no primeiro mês. O valor depende da complexidade do projeto e é alinhado com você antes da liberação da loja.',
  },
  {
    q: 'Consigo testar antes de fechar?',
    a: 'Sim. A loja entra em teste por 7 dias para você validar operação, visual e fluxo antes da decisão final.',
  },
  {
    q: 'Posso usar meu domínio próprio?',
    a: 'Hoje o fluxo principal usa subdomínio da plataforma. Domínio próprio pode entrar como evolução comercial depois do MVP.',
  },
  {
    q: 'Preciso entender de tecnologia?',
    a: 'Não. O painel foi desenhado para o dono do negócio operar com clareza, e a parte técnica fica centralizada.',
  },
]

type Step = 1 | 2 | 3

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const subscribeReducedMotion = (notify: () => void) => {
  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
const readReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches
const readServerReducedMotion = () => false

export function CaptacaoClient() {
  const [pending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>(1)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<RequestInput>({
    store_name: '',
    contact_name: '',
    email: '',
    whatsapp: '',
    plan_id: 'loja',
    accent_color: '#79e2ad',
    notes: '',
  })

  const set = <K extends keyof RequestInput>(key: K, value: RequestInput[K]) => {
    setForm(current => ({ ...current, [key]: value }))
  }

  const plan = PLANS[form.plan_id]

  const goConfig = () => {
    document.getElementById('configurador')?.scrollIntoView({ behavior: 'smooth' })
  }

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await submitStoreRequest({ ...form, modules_wanted: plan.modules })
      if (res.ok) {
        setDone(true)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-[#07130f] text-zinc-100"
      style={{
        backgroundImage: `
          radial-gradient(circle_at_top_left, rgba(121,226,173,0.16), transparent 30%),
          radial-gradient(circle_at_top_right, rgba(49,94,77,0.22), transparent 28%),
          linear-gradient(180deg, #081513 0%, #07130f 42%, #081614 100%)
        `,
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(201,247,223,0.08)_1px, transparent_1px), linear-gradient(90deg, rgba(201,247,223,0.08)_1px, transparent_1px)', backgroundSize: '72px 72px' }} />
      <div className="pointer-events-none absolute left-[-10rem] top-24 h-[28rem] w-[28rem] rounded-full bg-[#315e4d]/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-8rem] top-0 h-[26rem] w-[26rem] rounded-full bg-[#79e2ad]/14 blur-[140px]" />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <a href="#top" className="flex items-center">
          <ModusLogo descriptor="OPERAÇÃO DIGITAL" />
        </a>

        <nav className="hidden items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 backdrop-blur md:flex">
          {NAV.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-1.5 text-sm text-zinc-300 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          onClick={goConfig}
          className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[#79e2ad]/30 bg-[#c9f7df] px-5 py-2.5 text-sm font-semibold text-[#0b1b16] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#79e2ad]/15 active:scale-95 sm:flex"
        >
          <span>Começar agora</span>
          <ArrowUpRight size={15} />
        </button>
      </header>

      <section id="top" className="relative z-10 mx-auto grid max-w-6xl gap-12 overflow-hidden px-4 pb-18 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-18">
        <HeroBackgroundPaths />

        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 backdrop-blur">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#79e2ad] shadow-[0_0_12px_rgba(121,226,173,0.85)]" />
            Estrutura white-label fácil de ativar, sem burocracia técnica
          </div>

          <h1 className="font-display text-5xl font-bold leading-[0.92] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            Sua operação digital
            <span className="block text-[#c9f7df]">com experiência premium,</span>
            <span className="block bg-gradient-to-r from-[#79e2ad] via-[#c9f7df] to-[#79e2ad] bg-clip-text text-transparent">
              fácil de ativar.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
            A MODUS junta vitrine, painel administrativo, catálogo de serviços, agendamento e identidade visual
            em uma base white-label pensada para colocar sua operação no ar com fluidez, clareza e menos atrito.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={goConfig}
              className="flex items-center justify-center gap-2 rounded-full bg-[#c9f7df] px-7 py-3.5 text-sm font-bold text-[#0b1b16] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#79e2ad]/15 active:scale-95"
            >
              Montar minha operação <ArrowRight size={16} />
            </button>
            <a
              href="#precos"
              className="flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.02] px-7 py-3.5 text-sm font-semibold text-zinc-100 transition-all duration-200 hover:border-[#79e2ad]/35 hover:bg-white/[0.05] active:scale-95"
            >
              Ver planos
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {PROVAS.map(item => (
              <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur">
                <p className="font-display text-xl font-bold text-white">{item.value}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {EXPERIENCE_POINTS.map(item => (
              <div key={item} className="rounded-[20px] border border-white/[0.06] bg-black/12 px-4 py-3 text-sm text-zinc-300">
                <span className="flex items-start gap-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#79e2ad]" />
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <HeroShowcase onPrimary={goConfig} storeName={form.store_name || 'Sua Marca'} accent={form.accent_color} />
      </section>

      <section className="relative z-10 overflow-hidden border-y border-white/[0.05] bg-[linear-gradient(180deg,rgba(0,0,0,0.16),rgba(255,255,255,0.01))] py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#79e2ad]/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-[16%] top-8 h-14 rounded-full bg-[#79e2ad]/8 blur-[90px]" />

        <div className="mx-auto mb-5 flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#79e2ad]">Parceiros</p>
            <p className="mt-1 text-sm text-zinc-400">Empresas que confiam na MODUS para operar com mais apresentação, fluidez e menos burocracia.</p>
          </div>
          <span className="hidden rounded-full border border-[#79e2ad]/18 bg-[#79e2ad]/8 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#c9f7df] sm:inline-flex">
            marcas em operação
          </span>
        </div>
        <ReferenceMarquee />
      </section>

      <Section id="solucao" eyebrow="Solução" title="Uma estrutura pensada para vender melhor e operar com menos atrito">
        <div className="mb-5 rounded-[32px] border border-white/[0.06] bg-[linear-gradient(135deg,rgba(201,247,223,0.08),rgba(255,255,255,0.02)_55%,rgba(255,255,255,0.015))] p-6">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#79e2ad]">Experiência de ponta a ponta</p>
              <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Você não está contratando páginas soltas.
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
                A MODUS organiza a experiência comercial, o visual da marca e a rotina da operação dentro do mesmo núcleo.
                Isso reduz retrabalho, simplifica a ativação e passa mais confiança para quem compra de você.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: 'Captação', value: 'mais clara desde o primeiro contato' },
                { label: 'Apresentação', value: 'mais premium sem virar projeto pesado' },
                { label: 'Operação', value: 'mais organizada para crescer com controle' },
              ].map(item => (
                <div key={item.label} className="rounded-[24px] border border-white/[0.06] bg-black/15 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-200">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SOLUCOES.map((item, index) => (
            <div
              key={item.title}
              className="group rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#79e2ad]/24 hover:shadow-[0_20px_50px_rgba(7,19,15,0.18)]"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#79e2ad]/20 bg-[#79e2ad]/10 text-[#c9f7df]">
                  <item.icon size={20} />
                </div>
                <span className="font-display text-sm text-[#79e2ad]/70">0{index + 1}</span>
              </div>
              <h3 className="font-display text-xl font-bold tracking-tight text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="beneficios" eyebrow="Benefícios" title="Mais controle, mais clareza e uma experiência que parece maior">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-white/[0.06] bg-[linear-gradient(160deg,rgba(201,247,223,0.08),rgba(255,255,255,0.02)_55%,rgba(255,255,255,0.02))] p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#79e2ad]/20 bg-[#79e2ad]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#c9f7df]">
              <Sparkles size={13} />
              Direção de produto
            </div>
            <h3 className="mt-5 font-display text-4xl font-bold tracking-tight text-white">
              O ganho aqui não é só sistema.
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300">
              É percepção, organização e segurança para vender melhor. A experiência fica mais simples para quem opera
              e mais convincente para quem chega na sua marca pela primeira vez.
            </p>

            <div className="mt-8 space-y-3">
              {[
                'Landing de captação com narrativa mais profissional',
                'Loja white-label com identidade mais consistente',
                'Painel com rotina comercial e operacional no mesmo núcleo',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-black/15 px-4 py-3">
                  <Check size={15} className="shrink-0 text-[#79e2ad]" />
                  <span className="text-sm text-zinc-200">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {BENEFICIOS.map(item => (
              <div key={item.title} className="rounded-[28px] border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#79e2ad]/20 bg-[#79e2ad]/10">
                  <item.icon size={20} className="text-[#c9f7df]" />
                </div>
                <h3 className="font-display text-xl font-bold tracking-tight text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="precos" eyebrow="Planos" title="Escolha a estrutura que melhor acompanha o momento da sua operação">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 hidden justify-center lg:flex">
            <span className="font-display text-[8rem] font-bold uppercase tracking-[-0.08em] text-white/[0.03]">
              Planos
            </span>
          </div>

          <div className="relative grid gap-4 pt-3 lg:grid-cols-3">
            {Object.values(PLANS).map(planItem => {
              const popular = planItem.id === 'loja'
              return (
                <div
                  key={planItem.id}
                  className={`relative rounded-[30px] border p-6 backdrop-blur ${popular
                    ? 'border-[#79e2ad]/35 bg-[linear-gradient(180deg,rgba(201,247,223,0.10),rgba(255,255,255,0.04))] shadow-[0_30px_80px_rgba(7,19,15,0.24)]'
                    : 'border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))]'}`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-6 rounded-full border border-[#79e2ad]/35 bg-[#c9f7df] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0b1b16]">
                      Mais equilibrado
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#79e2ad]/80">{PLAN_PITCH[planItem.id]?.badge ?? 'plano'}</p>
                      <h3 className="mt-2 font-display text-2xl font-bold text-white">{planItem.name}</h3>
                      <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-400">
                        {PLAN_PITCH[planItem.id]?.desc}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] bg-black/15 px-3 py-2 text-right">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Capacidade</p>
                      <p className="font-display text-lg font-bold text-white">{planItem.productLimit}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-end gap-1">
                    <span className="font-display text-4xl font-bold tracking-tight text-white">{brl(planItem.priceBrl)}</span>
                    <span className="mb-1 text-sm text-zinc-500">/mês</span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
                    ativação guiada + evolução por plano
                  </p>

                  <ul className="mt-6 space-y-3">
                    {planItem.modules.map(module => (
                      <li key={module} className="flex items-start gap-2 text-sm text-zinc-300">
                        <Check size={15} className="mt-0.5 shrink-0 text-[#79e2ad]" />
                        {MODULE_LABELS[module as ModuleFlag]}
                      </li>
                    ))}
                    {planItem.staffLimit > 0 && (
                      <li className="flex items-start gap-2 text-sm text-zinc-300">
                        <Check size={15} className="mt-0.5 shrink-0 text-[#79e2ad]" />
                        Até {planItem.staffLimit} logins de equipe
                      </li>
                    )}
                  </ul>

                  <button
                    onClick={() => {
                      set('plan_id', planItem.id)
                      goConfig()
                    }}
                    className={`mt-7 w-full rounded-full py-3 text-sm font-semibold transition-all duration-200 active:scale-95 ${popular
                      ? 'bg-[#c9f7df] text-[#0b1b16] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#79e2ad]/18'
                      : 'border border-white/[0.12] text-zinc-100 hover:border-[#79e2ad]/35 hover:bg-white/[0.04]'}`}
                  >
                    Escolher {planItem.name}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/[0.07] bg-white/[0.03] px-5 py-4">
          <div className="flex items-start gap-3">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-[#79e2ad]" />
            <p className="text-sm leading-7 text-zinc-300">
              Além da mensalidade, existe uma taxa única de implementação no primeiro mês. O valor depende
              do nível de personalização e é alinhado com você antes da ativação.
            </p>
          </div>
        </div>
      </Section>

      <section id="configurador" className="relative z-10 mx-auto max-w-6xl px-4 py-18 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#79e2ad]">Configuração</p>
          <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Monte sua operação em poucos passos
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
            Você define a identidade, escolhe a estrutura e deixa seus dados para a ativação.
            O fluxo foi pensado para ser direto, guiado e sem burocracia desnecessária.
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {ACTIVATION_ASSURANCES.map(item => (
            <div key={item.title} className="rounded-[24px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#79e2ad]">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{item.desc}</p>
            </div>
          ))}
        </div>

        {done ? (
          <SuccessCard form={form} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="rounded-[34px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-6 sm:p-8">
              <Steps step={step} />

              {step === 1 && (
                <div className="mt-8 space-y-6">
                  <Field label="Nome da sua operação">
                    <input
                      value={form.store_name}
                      onChange={e => set('store_name', e.target.value)}
                      placeholder="Ex: TechCell Assistência"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Cor principal da marca">
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="color"
                        value={form.accent_color}
                        onChange={e => set('accent_color', e.target.value)}
                        className="h-12 w-14 cursor-pointer rounded-2xl border border-white/[0.08] bg-transparent p-1"
                      />
                      <span className="rounded-full border border-white/[0.08] bg-black/15 px-3 py-2 font-mono text-sm text-zinc-300">
                        {form.accent_color}
                      </span>
                      <div className="ml-auto flex gap-2">
                        {['#79e2ad', '#c9f7df', '#315e4d', '#3d6b5f', '#0f766e', '#d4a373'].map(color => (
                          <button
                            key={color}
                            onClick={() => set('accent_color', color)}
                            className="h-8 w-8 rounded-full border-2 transition-all hover:scale-110"
                            style={{ backgroundColor: color, borderColor: form.accent_color === color ? '#fff' : 'transparent' }}
                          />
                        ))}
                      </div>
                    </div>
                  </Field>

                  <div className="flex justify-end">
                    <NextBtn onClick={() => setStep(2)} disabled={!form.store_name.trim()} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-8 space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Object.values(PLANS).map(planItem => (
                      <button
                        key={planItem.id}
                        onClick={() => set('plan_id', planItem.id)}
                        className={`rounded-[24px] border p-4 text-left transition-all ${form.plan_id === planItem.id
                          ? 'border-[#79e2ad]/45 bg-[#79e2ad]/10'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'}`}
                      >
                        <p className="font-display text-lg font-bold text-white">{planItem.name}</p>
                        <p className="mt-1 text-sm text-[#79e2ad]">{brl(planItem.priceBrl)}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                          até {planItem.productLimit} produtos
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-[24px] border border-white/[0.07] bg-black/12 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      Inclui no plano {plan.name}
                    </p>
                    <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                      {plan.modules.map(module => (
                        <span key={module} className="flex items-center gap-2 text-sm text-zinc-300">
                          <Check size={14} className="shrink-0 text-[#79e2ad]" />
                          {MODULE_LABELS[module as ModuleFlag]}
                        </span>
                      ))}
                      {plan.staffLimit > 0 && (
                        <span className="flex items-center gap-2 text-sm text-zinc-300">
                          <Check size={14} className="shrink-0 text-[#79e2ad]" />
                          Até {plan.staffLimit} logins de equipe
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <BackBtn onClick={() => setStep(1)} />
                    <NextBtn onClick={() => setStep(3)} />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="mt-8 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Seu nome">
                      <input
                        value={form.contact_name}
                        onChange={e => set('contact_name', e.target.value)}
                        placeholder="João Silva"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="WhatsApp">
                      <input
                        value={form.whatsapp}
                        onChange={e => set('whatsapp', e.target.value)}
                        placeholder="(11) 99999-9999"
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <Field label="E-mail do acesso principal">
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="voce@email.com"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Observações do projeto">
                    <textarea
                      value={form.notes}
                      onChange={e => set('notes', e.target.value)}
                      rows={3}
                      placeholder="Conte o estágio da loja, produtos principais ou necessidades específicas."
                      className={inputCls + ' resize-none'}
                    />
                  </Field>

                  {error && (
                    <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {error}
                    </p>
                  )}

                  <div className="rounded-[24px] border border-white/[0.07] bg-black/12 px-4 py-3 text-sm leading-7 text-zinc-400">
                    Ao enviar, criamos seu pedido e alinhamos pelo WhatsApp a taxa de implementação antes da ativação.
                    A mensalidade do plano <span className="font-semibold text-white">{plan.name}</span> é{' '}
                    <span className="font-semibold text-[#79e2ad]">{brl(plan.priceBrl)}/mês</span>.
                  </div>

                  <div className="flex justify-between pt-1">
                    <BackBtn onClick={() => setStep(2)} />
                    <button
                      onClick={submit}
                      disabled={pending}
                      className="flex items-center gap-2 rounded-full bg-[#c9f7df] px-6 py-3 text-sm font-bold text-[#0b1b16] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#79e2ad]/16 disabled:opacity-60 active:scale-95"
                    >
                      {pending
                        ? <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                        : <>Enviar pedido <ArrowRight size={15} /></>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
                    <p className="mb-3 text-center text-xs uppercase tracking-[0.18em] text-zinc-500">Simulação da sua marca</p>
              <StorePreview name={form.store_name || 'Sua Loja'} accent={form.accent_color} />
            </div>
          </div>
        )}
      </section>

      <Section id="faq" eyebrow="FAQ" title="O que normalmente precisa ficar claro antes de avançar">
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQ.map(item => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </Section>

      <footer className="relative z-10 border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <ModusLogo size={38} descriptor="OPERAÇÃO DIGITAL" />

          <p className="text-xs uppercase tracking-[0.16em] text-zinc-600">
            {new Date().getFullYear()} · Plataforma white-label para lojas e assistência
          </p>

          <div className="flex items-center gap-4">
            <a
              href={`https://wa.me/${WA_LUIZ}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-[#79e2ad]"
            >
              <MessageCircle size={15} /> WhatsApp
            </a>
            <a
              href={IG_MODUS}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-[#79e2ad]"
            >
              <AtSign size={15} /> @usemodus.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

const inputCls = 'w-full rounded-2xl border border-white/[0.08] bg-[#101b18] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#79e2ad]/40 focus:outline-none transition-all'

function HeroShowcase({ onPrimary, storeName, accent }: { onPrimary: () => void; storeName: string; accent: string }) {
  return (
    <div className="relative z-10">
      <div className="pointer-events-none absolute inset-0 rounded-[36px] bg-gradient-to-br from-[#79e2ad]/12 via-transparent to-transparent blur-2xl" />

      <div className="relative overflow-hidden rounded-[36px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] p-5 shadow-[0_40px_120px_rgba(7,19,15,0.28)]">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[#c9f7df]/[0.03] blur-3xl" />

        <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#79e2ad]/75">Estrutura visual</p>
            <h3 className="font-display mt-2 text-2xl font-bold text-white">MODUS stack</h3>
          </div>
          <span className="rounded-full border border-[#79e2ad]/20 bg-[#79e2ad]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c9f7df]">
            MVP pronto
          </span>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[28px] border border-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" style={{ background: `linear-gradient(145deg, ${accent}24, rgba(255,255,255,0.03))` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Landing e captação</p>
                <h4 className="font-display mt-2 text-2xl font-bold text-white">{storeName}</h4>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/15">
                <Store size={20} className="text-white" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={onPrimary}
                className="rounded-full px-4 py-2 text-sm font-semibold text-[#0b1b16]"
                style={{ backgroundColor: accent }}
              >
                Ativar estrutura
              </button>
              <div className="rounded-full border border-white/[0.08] px-4 py-2 text-sm text-zinc-300">
                White-label
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Deploy base', value: '1 núcleo' },
                { label: 'Identidade', value: 'por loja' },
                { label: 'Operação', value: 'centralizada' },
              ].map(item => (
                <div key={item.label} className="rounded-[20px] border border-white/[0.06] bg-black/14 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
                  <p className="mt-2 font-display text-lg font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[28px] border border-white/[0.06] bg-black/18 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Fluxo operacional</p>
              <div className="mt-4 space-y-3">
                {[
                  { icon: Smartphone, label: 'Vitrine ativa', value: 'Produtos e promoções' },
                  { icon: Calendar, label: 'Agenda organizada', value: 'Entradas do cliente' },
                  { icon: Wrench, label: 'Serviços mapeados', value: 'Catálogo técnico' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.03] px-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02]">
                      <item.icon size={16} className="text-[#79e2ad]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="text-xs text-zinc-500">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.06] bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Camada white-label</p>
              <div className="mt-5 grid gap-3">
                {[
                  { label: 'Nome e logo', value: 'Aplicados por loja sem refazer a base' },
                  { label: 'Tom visual', value: 'Ajustado na interface inteira com consistencia' },
                  { label: 'Operacao central', value: 'Mesmo nucleo tecnico, apresentacao propria' },
                ].map(item => (
                  <div key={item.label} className="rounded-[22px] border border-white/[0.06] bg-black/18 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-200">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Vitrine', value: 'Conversão' },
              { label: 'Painel', value: 'Operação' },
              { label: 'Marca', value: 'Percepção' },
            ].map(item => (
              <div key={item.label} className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
                <p className="font-display mt-2 text-2xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HeroBackgroundPaths() {
  // Server snapshot keeps hydration deterministic; browser preference is read
  // immediately after hydration and updates if the OS setting changes.
  const reduceMotion = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, readServerReducedMotion)

  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-[-6%] top-[6%] h-[78%] rounded-[44px] border border-[#c9f7df]/8 bg-[radial-gradient(circle_at_18%_18%,rgba(201,247,223,0.14),transparent_26%),radial-gradient(circle_at_78%_20%,rgba(121,226,173,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.005))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" />
        <div className="absolute left-[-4%] top-[10%] h-44 w-44 rounded-full bg-[#c9f7df]/16 blur-[95px] md:left-[6%] md:top-[8%] md:h-64 md:w-64 md:blur-[120px]" />
        <div className="absolute right-[0%] top-[14%] h-36 w-36 rounded-full bg-[#79e2ad]/16 blur-[85px] md:right-[8%] md:top-[10%] md:h-56 md:w-56 md:blur-[110px]" />
        <div className="absolute left-[18%] bottom-[14%] h-28 w-40 rounded-full bg-[#315e4d]/26 blur-[70px] md:left-[28%] md:h-36 md:w-56 md:blur-[90px]" />
        <div className="absolute inset-x-[8%] top-[8%] hidden h-[72%] rounded-[48px] border border-[#c9f7df]/10 bg-[linear-gradient(135deg,rgba(201,247,223,0.05),rgba(255,255,255,0.01)_35%,rgba(121,226,173,0.04)_70%,rgba(7,19,15,0.02))] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_40px_120px_rgba(6,22,20,0.18),inset_0_1px_0_rgba(255,255,255,0.04)] md:block" />
        <div className="absolute left-[16%] top-[16%] hidden h-px w-[34%] bg-gradient-to-r from-transparent via-[#c9f7df]/55 to-transparent md:block" />
        <div className="absolute right-[14%] top-[24%] hidden h-px w-[28%] bg-gradient-to-r from-transparent via-[#79e2ad]/45 to-transparent md:block" />
      </div>

      <div className="pointer-events-none absolute inset-x-[-10%] bottom-[-10rem] top-[16%] opacity-100 md:hidden [mask-image:linear-gradient(180deg,transparent,black_10%,black_90%,transparent)]">
        <FloatingPaths position={1} count={28} animated={!reduceMotion} />
      </div>
      <div className="pointer-events-none absolute inset-x-[-12%] bottom-[-12rem] top-[4%] hidden opacity-100 md:block [mask-image:linear-gradient(180deg,transparent,black_6%,black_94%,transparent)]">
        <FloatingPaths position={1} count={52} animated={!reduceMotion} />
        <FloatingPaths position={-1} count={52} animated={!reduceMotion} />
      </div>
      <div className="pointer-events-none absolute inset-x-[8%] bottom-1 h-40 rounded-full bg-[#79e2ad]/14 blur-[88px] md:inset-x-[12%] md:bottom-8 md:h-56 md:blur-[120px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-b from-transparent via-[#07130f]/8 to-[#07130f]" />
    </>
  )
}

function FloatingPaths({ position, count, animated }: { position: number; count: number; animated: boolean }) {
  const paths = Array.from({ length: count }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 1 + i * 0.042,
    opacity: 0.22 + i * 0.017,
    duration: 16 + i * 0.42,
  }))

  return (
    <svg
      aria-hidden="true"
      data-hero-paths="true"
      className="absolute inset-0 h-full w-full text-[#c9f7df] mix-blend-screen drop-shadow-[0_0_22px_rgba(121,226,173,0.32)]"
      viewBox="0 0 696 316"
      fill="none"
      preserveAspectRatio="none"
    >
      {paths.map(path => (
        <motion.path
          key={`${position}-${path.id}`}
          d={path.d}
          stroke="currentColor"
          strokeWidth={path.width}
          strokeOpacity={path.opacity}
          strokeLinecap="round"
          initial={animated ? { pathLength: 0.25, opacity: path.opacity * 0.7 } : false}
          animate={animated
            ? {
              pathLength: 1,
              opacity: [path.opacity * 0.75, path.opacity, path.opacity * 0.75],
              pathOffset: [0, 1, 0],
            }
            : undefined}
          transition={animated
            ? {
              duration: path.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }
            : undefined}
        />
      ))}
    </svg>
  )
}

function ReferenceMarquee() {
  const items = [...PARTNER_LOGOS, ...PARTNER_LOGOS]

  return (
    <div className="overflow-hidden">
      <div className="marquee-track flex items-stretch gap-4 whitespace-nowrap px-4 sm:px-6">
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex w-[156px] shrink-0 flex-col items-center sm:w-[176px]"
            aria-label={item.name}
            title={item.name}
          >
            <div className="group relative w-full">
              <div className="absolute inset-x-6 top-2 h-10 rounded-full bg-[#c9f7df]/8 opacity-80 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
              <div
                className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.018))] px-4 py-4 shadow-[0_18px_46px_rgba(0,0,0,0.16)]"
              >
                <div className="absolute inset-[1px] rounded-[29px] bg-[linear-gradient(180deg,rgba(7,19,15,0.94),rgba(10,26,23,0.9))]" />
                <div className="absolute inset-x-6 top-0 h-16 rounded-full bg-[#c9f7df]/8 blur-3xl" />
                <div className="relative flex h-[132px] items-center justify-center rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(241,247,243,0.78))] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_16px_34px_rgba(0,0,0,0.12)] sm:h-[142px]">
                  <div className="absolute inset-x-8 top-3 h-5 rounded-full bg-white/60 blur-xl" />
                  <Image
                    src={item.src}
                    alt={item.name}
                    fill
                    className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.04]"
                    sizes="142px"
                  />
                </div>
                <div className="relative mt-3 px-1 pb-1">
                  <p className="text-center text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                    {item.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-9 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#79e2ad]">{eyebrow}</p>
        <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">{label}</label>
      {children}
    </div>
  )
}

function Steps({ step }: { step: number }) {
  const labels = ['Identidade', 'Plano', 'Contato']
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, index) => {
        const position = index + 1
        const active = step === position
        const done = step > position

        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                active
                  ? 'bg-[#c9f7df] text-[#0b1b16]'
                  : done
                    ? 'bg-[#79e2ad]/18 text-[#79e2ad]'
                    : 'bg-white/[0.06] text-zinc-500'
              }`}
            >
              {done ? <Check size={13} /> : position}
            </div>
            <span className={`hidden text-xs uppercase tracking-[0.16em] sm:block ${active ? 'text-white' : 'text-zinc-600'}`}>
              {label}
            </span>
            {position < labels.length && <div className="h-px flex-1 bg-white/[0.08]" />}
          </div>
        )
      })}
    </div>
  )
}

function NextBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-full bg-[#c9f7df] px-5 py-2.5 text-sm font-semibold text-[#0b1b16] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#79e2ad]/16 disabled:opacity-50 active:scale-95"
    >
      Continuar <ArrowRight size={15} />
    </button>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-white/[0.1] px-5 py-2.5 text-sm text-zinc-400 transition-all hover:bg-white/[0.05]"
    >
      Voltar
    </button>
  )
}

function StorePreview({ name, accent }: { name: string; accent: string }) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] shadow-[0_30px_100px_rgba(7,19,15,0.25)]">
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-black/16 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-2 truncate rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          {name.toLowerCase().replace(/\s+/g, '')}.modus.app
        </span>
      </div>

      <div className="p-4">
        <div className="rounded-[24px] p-5" style={{ background: `linear-gradient(145deg, ${accent}24, rgba(255,255,255,0.03))` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Hero principal</p>
              <p className="font-display mt-2 text-2xl font-bold text-white">{name}</p>
            </div>
            <span className="rounded-full px-3 py-1 text-[11px] font-bold text-[#0b1b16]" style={{ backgroundColor: accent }}>
              Agendar
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[0, 1, 2].map(index => (
              <div key={index} className="rounded-2xl border border-white/[0.08] bg-black/16 p-3">
                <div className="mb-3 flex h-10 items-center justify-center rounded-xl bg-white/[0.04]">
                  <Smartphone size={15} className="text-zinc-500" />
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.08]" />
                <div className="mt-2 h-1.5 w-2/3 rounded-full" style={{ backgroundColor: accent }} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Painel admin</p>
                <p className="mt-2 text-sm font-semibold text-white">Estoque, conteúdo e agenda</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04]">
                <BarChart3 size={16} className="text-[#79e2ad]" />
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/[0.06] bg-black/16 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Paleta ativa</p>
            <div className="mt-3 flex items-center gap-2">
              {['#0b1b16', '#0b2b26', '#315e4d', accent, '#c9f7df'].map(color => (
                <span key={color} className="h-8 flex-1 rounded-full border border-white/[0.06]" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.03] backdrop-blur">
      <button onClick={() => setOpen(value => !value)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="text-sm font-semibold text-white">{q}</span>
        <ChevronDown size={16} className={`shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-5 pb-4 text-sm leading-7 text-zinc-400">{a}</p>}
    </div>
  )
}

function SuccessCard({ form }: { form: RequestInput }) {
  const plan = PLANS[form.plan_id]
  const msg = encodeURIComponent(`Olá! Acabei de enviar um pedido na MODUS para a loja "${form.store_name}" no plano ${plan.name}. Quero alinhar a implementação.`)

  return (
    <div className="mx-auto max-w-xl rounded-[34px] border border-[#79e2ad]/20 bg-[linear-gradient(180deg,rgba(201,247,223,0.08),rgba(255,255,255,0.02))] p-8 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#79e2ad]/20 bg-[#79e2ad]/10">
        <CheckCircle2 size={30} className="text-[#c9f7df]" />
      </div>
      <h3 className="font-display text-3xl font-bold text-white">Pedido recebido</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-zinc-300">
        Recebemos o pedido da loja <span className="font-semibold text-white">{form.store_name}</span> no plano{' '}
        <span className="font-semibold text-[#79e2ad]">{plan.name}</span>. O próximo passo é alinhar a
        implementação e liberar o período de teste.
      </p>
      <a
        href={`https://wa.me/${WA_LUIZ}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#c9f7df] px-7 py-3.5 text-sm font-bold text-[#0b1b16] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#79e2ad]/16 active:scale-95"
      >
        <MessageCircle size={17} /> Continuar no WhatsApp
      </a>
    </div>
  )
}
