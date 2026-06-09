'use client'

import { useState, useTransition } from 'react'
import {
  Hexagon, ArrowUpRight, ArrowRight, Check, Sparkles, Store, Calendar,
  Wrench, BarChart3, Palette, Zap, ShieldCheck, Clock, ChevronDown,
  Loader2, CheckCircle2, MessageCircle, Smartphone, AtSign,
} from 'lucide-react'
import { PLANS, MODULE_LABELS, type ModuleFlag } from '@/lib/plans'
import { submitStoreRequest, type RequestInput } from './actions'

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
  { icon: Store, title: 'Vitrine que vende', desc: 'Catálogo de produtos com fotos, preços e botão de WhatsApp — pronto pro cliente comprar.' },
  { icon: Wrench, title: 'Gestão de serviços', desc: 'Ordens de serviço em kanban, do recebido ao entregue, com aviso automático pro cliente.' },
  { icon: Calendar, title: 'Agendamentos', desc: 'O cliente agenda pelo site; você confirma, remarca e notifica em um clique.' },
  { icon: BarChart3, title: 'Painel de controle', desc: 'Vendas, estoque e indicadores num lugar só, com a cara da sua empresa.' },
]

const BENEFICIOS = [
  { icon: Zap, title: 'No ar em minutos', desc: 'Blocos semi-prontos montados pro seu nicho. Sem esperar semanas de desenvolvimento.' },
  { icon: Palette, title: 'Sua identidade', desc: 'Cor, logo e nome da sua marca aplicados em toda a loja — não parece template.' },
  { icon: ShieldCheck, title: 'Dados isolados', desc: 'Cada loja tem seus dados protegidos e separados das demais. Segurança de verdade.' },
  { icon: Clock, title: 'Sem código, sem dor', desc: 'Você foca em vender; a gente cuida da parte técnica e das atualizações.' },
]

const FAQ = [
  { q: 'Tem fidelidade ou contrato longo?', a: 'Não. É uma mensalidade conforme o plano escolhido. Você pode subir ou descer de plano conforme a necessidade.' },
  { q: 'Como funciona a taxa de implementação?', a: 'Além da mensalidade, há uma taxa única de implementação no primeiro mês. O valor varia conforme o tamanho e a complexidade do seu projeto — alinhamos isso com você pelo WhatsApp antes de liberar a loja.' },
  { q: 'Consigo testar antes de pagar?', a: 'Sim. Toda loja começa com 7 dias de teste grátis para você ver tudo funcionando antes de decidir.' },
  { q: 'Posso usar meu próprio domínio?', a: 'No momento entregamos no formato sualoja.modus.com (subdomínio). Domínio próprio entra nos próximos passos.' },
  { q: 'Preciso saber mexer com tecnologia?', a: 'Não. O painel é simples e pensado pro dono da loja. E qualquer dúvida, a gente te ajuda.' },
]

type Step = 1 | 2 | 3 | 4

export function CaptacaoClient() {
  const [pending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>(1)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<RequestInput>({
    store_name: '', contact_name: '', email: '', whatsapp: '',
    plan_id: 'loja', accent_color: '#22c55e', notes: '',
  })

  const set = <K extends keyof RequestInput>(k: K, v: RequestInput[K]) => setForm(f => ({ ...f, [k]: v }))
  const plan = PLANS[form.plan_id]

  const goConfig = () => {
    document.getElementById('configurador')?.scrollIntoView({ behavior: 'smooth' })
  }

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await submitStoreRequest({ ...form, modules_wanted: plan.modules })
      if (res.ok) setDone(true)
      else setError(res.error)
    })
  }

  return (
    <div className="relative min-h-screen bg-[#0a0d0a] text-zinc-200 overflow-x-hidden">
      {/* textura de pontos (MODUS) */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />
      {/* glow superior */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[40rem] w-[60rem] rounded-full bg-green-500/[0.07] blur-[120px]" />

      {/* ───────── NAV ───────── */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-400/30 to-emerald-600/20 border border-green-500/30">
            <Hexagon size={18} className="text-green-400 fill-green-400/20" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">MODUS</span>
        </a>
        <nav className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 md:flex">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className="rounded-full px-4 py-1.5 text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-all">
              {n.label}
            </a>
          ))}
        </nav>
        <button onClick={goConfig} className="flex items-center gap-1.5 rounded-full bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-black transition-all duration-200 ease-out will-change-transform hover:bg-white hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-white/10 active:scale-95">
          Testar grátis <ArrowUpRight size={15} />
        </button>
      </header>

      {/* ───────── HERO ───────── */}
      <section id="top" className="relative z-10 mx-auto max-w-4xl px-4 pt-12 pb-20 text-center sm:px-6 sm:pt-20">
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-1.5 text-sm text-zinc-400">
          <span className="flex h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          Blocos semi-prontos por nicho · <span className="text-zinc-300">sem código</span>
        </div>
        <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-zinc-50 sm:text-7xl">
          Sistema completo<br />pra sua empresa,<br />
          <span className="bg-gradient-to-r from-green-300 to-emerald-500 bg-clip-text text-transparent">no ar em minutos.</span>
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          A MODUS entrega sistemas digitais completos — vitrine, gestão, agendamentos e muito mais —
          personalizados com a identidade da sua empresa. Montados por blocos semi-prontos e prontos
          pra usar em menos de um dia.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={goConfig} className="flex w-full items-center justify-center gap-2 rounded-full bg-green-500 px-7 py-3.5 text-sm font-bold text-black transition-all duration-200 ease-out will-change-transform hover:bg-green-400 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-xl hover:shadow-green-500/30 active:scale-95 sm:w-auto">
            Montar minha loja <ArrowRight size={16} />
          </button>
          <a href="#precos" className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] px-7 py-3.5 text-sm font-semibold text-zinc-200 transition-all duration-200 ease-out will-change-transform hover:border-green-500/40 hover:bg-white/[0.05] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 sm:w-auto">
            Ver planos
          </a>
        </div>
        <p className="mt-5 text-xs text-zinc-600">7 dias de teste grátis · sem fidelidade</p>
      </section>

      {/* ───────── SOLUÇÃO ───────── */}
      <Section id="solucao" eyebrow="Solução" title="Tudo que sua loja precisa, num sistema só">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SOLUCOES.map(s => (
            <div key={s.title} className="group rounded-2xl border border-white/[0.07] bg-[#0f120f] p-5 transition-all hover:-translate-y-1 hover:border-green-500/20">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10">
                <s.icon size={20} className="text-green-400" />
              </div>
              <h3 className="text-sm font-bold text-white">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ───────── BENEFÍCIOS ───────── */}
      <Section id="beneficios" eyebrow="Benefícios" title="Por que escolher a MODUS">
        <div className="grid gap-4 sm:grid-cols-2">
          {BENEFICIOS.map(b => (
            <div key={b.title} className="flex gap-4 rounded-2xl border border-white/[0.07] bg-[#0f120f] p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10">
                <b.icon size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{b.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ───────── PREÇOS ───────── */}
      <Section id="precos" eyebrow="Preços" title="Escolha o plano do tamanho da sua loja">
        <div className="grid gap-4 lg:grid-cols-3">
          {Object.values(PLANS).map(p => {
            const popular = p.id === 'loja'
            return (
              <div
                key={p.id}
                className={`group relative rounded-3xl border p-6 transition-all duration-300 ease-out will-change-transform hover:-translate-y-2 ${popular ? 'border-green-500/40 bg-green-500/[0.04] lg:scale-[1.04] hover:shadow-2xl hover:shadow-green-500/20' : 'border-white/[0.08] bg-[#0f120f] hover:border-green-500/30 hover:shadow-2xl hover:shadow-green-500/10'}`}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-1 text-[11px] font-bold text-black">
                    Mais escolhido
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-black text-white">{brl(p.priceBrl)}</span>
                  <span className="mb-1 text-sm text-zinc-500">/mês</span>
                </div>
                <p className="mt-1 text-xs text-zinc-600">até {p.productLimit} produtos</p>
                <ul className="mt-5 space-y-2.5">
                  {p.modules.map(m => (
                    <li key={m} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check size={15} className="mt-0.5 shrink-0 text-green-400" />
                      {MODULE_LABELS[m as ModuleFlag]}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => { set('plan_id', p.id); goConfig() }}
                  className={`mt-6 w-full rounded-full py-3 text-sm font-semibold transition-all duration-200 ease-out will-change-transform hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 ${
                    popular
                      ? 'bg-green-500 text-black hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/30'
                      : 'border border-white/[0.12] text-zinc-200 hover:border-green-500/40 hover:bg-white/[0.05]'
                  }`}
                >
                  Começar com {p.name}
                </button>
              </div>
            )
          })}
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-green-400" />
          <p className="text-sm leading-relaxed text-zinc-400">
            <span className="font-semibold text-zinc-200">Mensalidade a partir de {brl(PLANS.vitrine.priceBrl)}</span> + uma
            taxa única de implementação no primeiro mês. O valor da implementação varia conforme o
            tamanho e a complexidade do projeto e é alinhado com você pelo WhatsApp antes da loja entrar no ar.
          </p>
        </div>
      </Section>

      {/* ───────── CONFIGURADOR ───────── */}
      <section id="configurador" className="relative z-10 mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-400">Monte a sua</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Configure sua loja em 3 passos</h2>
        </div>

        {done ? (
          <SuccessCard form={form} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* ── Form / passos ── */}
            <div className="rounded-3xl border border-white/[0.08] bg-[#0f120f] p-6 sm:p-8">
              <Steps step={step} />

              {step === 1 && (
                <div className="mt-7 space-y-5">
                  <Field label="Nome da sua loja">
                    <input value={form.store_name} onChange={e => set('store_name', e.target.value)} placeholder="Ex: TechCell Assistência" className={inputCls} />
                  </Field>
                  <Field label="Cor da marca">
                    <div className="flex items-center gap-3 flex-wrap">
                      <input type="color" value={form.accent_color} onChange={e => set('accent_color', e.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border border-white/[0.08] bg-transparent p-1" />
                      <span className="font-mono text-sm text-zinc-400">{form.accent_color}</span>
                      <div className="ml-auto flex gap-1.5">
                        {['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4'].map(c => (
                          <button key={c} onClick={() => set('accent_color', c)} className="h-7 w-7 rounded-lg border-2 transition-all hover:scale-110" style={{ backgroundColor: c, borderColor: form.accent_color === c ? '#fff' : 'transparent' }} />
                        ))}
                      </div>
                    </div>
                  </Field>
                  <div className="flex justify-end pt-2">
                    <NextBtn onClick={() => setStep(2)} disabled={!form.store_name.trim()} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-7 space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Object.values(PLANS).map(p => (
                      <button
                        key={p.id}
                        onClick={() => set('plan_id', p.id)}
                        className={`rounded-2xl border p-4 text-left transition-all ${form.plan_id === p.id ? 'border-green-500/50 bg-green-500/[0.06]' : 'border-white/[0.08] hover:border-white/20'}`}
                      >
                        <p className="text-sm font-bold text-white">{p.name}</p>
                        <p className="mt-1 text-lg font-black text-green-400">{brl(p.priceBrl)}</p>
                        <p className="text-[11px] text-zinc-600">até {p.productLimit} produtos</p>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <p className="mb-2 text-xs font-semibold text-zinc-400">Inclui no plano {plan.name}:</p>
                    <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                      {plan.modules.map(m => (
                        <span key={m} className="flex items-center gap-2 text-sm text-zinc-300">
                          <Check size={14} className="shrink-0 text-green-400" /> {MODULE_LABELS[m as ModuleFlag]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between pt-2">
                    <BackBtn onClick={() => setStep(1)} />
                    <NextBtn onClick={() => setStep(3)} />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="mt-7 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Seu nome"><input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="João Silva" className={inputCls} /></Field>
                    <Field label="WhatsApp"><input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(11) 99999-9999" className={inputCls} /></Field>
                  </div>
                  <Field label="E-mail (será seu login)"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="voce@email.com" className={inputCls} /></Field>
                  <Field label="Algo que devemos saber? (opcional)"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Conte um pouco sobre sua loja..." className={inputCls + ' resize-none'} /></Field>

                  {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-zinc-500">
                    Ao enviar, criamos seu pedido e entramos em contato pelo WhatsApp para alinhar a
                    <span className="text-zinc-300"> taxa de implementação</span> antes de liberar a loja. A mensalidade do plano {plan.name} é {brl(plan.priceBrl)}/mês.
                  </div>

                  <div className="flex justify-between pt-1">
                    <BackBtn onClick={() => setStep(2)} />
                    <button
                      onClick={submit}
                      disabled={pending}
                      className="flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-black transition-all hover:bg-green-400 disabled:opacity-60 active:scale-95"
                    >
                      {pending ? <><Loader2 size={15} className="animate-spin" /> Enviando...</> : <>Enviar pedido <ArrowRight size={15} /></>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Preview ao vivo ── */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <p className="mb-2 text-center text-xs text-zinc-600">Prévia da sua loja</p>
              <StorePreview name={form.store_name || 'Sua Loja'} accent={form.accent_color} />
            </div>
          </div>
        )}
      </section>

      {/* ───────── FAQ ───────── */}
      <Section id="faq" eyebrow="FAQ" title="Perguntas frequentes">
        <div className="mx-auto max-w-2xl space-y-3">
          {FAQ.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </Section>

      {/* ───────── FOOTER ───────── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-400/30 to-emerald-600/20 border border-green-500/30">
              <Hexagon size={15} className="text-green-400 fill-green-400/20" />
            </div>
            <span className="font-black tracking-tight text-white">MODUS</span>
          </div>
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} MODUS · Sistemas digitais completos</p>
          <div className="flex items-center gap-4">
            <a href={`https://wa.me/${WA_LUIZ}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-green-400 transition-colors">
              <MessageCircle size={15} /> WhatsApp
            </a>
            <a href={IG_MODUS} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-green-400 transition-colors">
              <AtSign size={15} /> @usemodus.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Subcomponentes ─────────────────────────────────────────────────

const inputCls = 'w-full rounded-xl border border-white/[0.08] bg-[#161a16] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-green-500/40 focus:outline-none transition-all'

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-9 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-400">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  )
}

function Steps({ step }: { step: number }) {
  const labels = ['Identidade', 'Plano', 'Seus dados']
  return (
    <div className="flex items-center gap-2">
      {labels.map((l, i) => {
        const n = i + 1
        const active = step === n
        const doneStep = step > n
        return (
          <div key={l} className="flex flex-1 items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
              active ? 'bg-green-500 text-black' : doneStep ? 'bg-green-500/20 text-green-400' : 'bg-white/[0.06] text-zinc-500'
            }`}>
              {doneStep ? <Check size={13} /> : n}
            </div>
            <span className={`hidden text-xs sm:block ${active ? 'text-white' : 'text-zinc-600'}`}>{l}</span>
            {n < labels.length && <div className="h-px flex-1 bg-white/[0.08]" />}
          </div>
        )
      })}
    </div>
  )
}

function NextBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-green-400 disabled:opacity-50 active:scale-95">
      Continuar <ArrowRight size={15} />
    </button>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-full border border-white/[0.1] px-5 py-2.5 text-sm text-zinc-400 transition-all hover:bg-white/[0.05]">
      Voltar
    </button>
  )
}

function StorePreview({ name, accent }: { name: string; accent: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0d0d0d] shadow-2xl">
      {/* barra do navegador */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-[#161616] px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        <span className="ml-2 truncate rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] text-zinc-500">
          {name.toLowerCase().replace(/\s+/g, '')}.modus.com
        </span>
      </div>
      {/* conteúdo mock */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-white">{name}</span>
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-black" style={{ backgroundColor: accent }}>Agendar</span>
        </div>
        <div className="mt-3 rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${accent}22, transparent)` }}>
          <p className="text-xs font-bold text-white">Os melhores aparelhos</p>
          <p className="mt-0.5 text-[10px] text-zinc-400">com a qualidade que você confia</p>
          <span className="mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold text-black" style={{ backgroundColor: accent }}>Ver ofertas</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-lg border border-white/[0.06] bg-[#141414] p-2">
              <div className="mb-1.5 flex h-10 items-center justify-center rounded-md bg-white/[0.04]">
                <Smartphone size={16} className="text-zinc-600" />
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.08]" />
              <div className="mt-1 h-1.5 w-2/3 rounded-full" style={{ backgroundColor: accent }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0f120f]">
      <button onClick={() => setOpen(v => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="text-sm font-semibold text-white">{q}</span>
        <ChevronDown size={16} className={`shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-400">{a}</p>}
    </div>
  )
}

function SuccessCard({ form }: { form: RequestInput }) {
  const plan = PLANS[form.plan_id]
  const msg = encodeURIComponent(`Olá! Acabei de enviar um pedido na MODUS para a loja "${form.store_name}" no plano ${plan.name}. Quero alinhar a implementação.`)
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-green-500/20 bg-[#0f120f] p-8 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10">
        <CheckCircle2 size={30} className="text-green-400" />
      </div>
      <h3 className="text-2xl font-black text-white">Pedido recebido! 🎉</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
        Recebemos o pedido da loja <span className="font-semibold text-white">{form.store_name}</span> no
        plano <span className="font-semibold text-green-400">{plan.name}</span>. O próximo passo é alinhar a
        <span className="text-zinc-200"> taxa de implementação</span> pelo WhatsApp — aí liberamos seus 7 dias de teste.
      </p>
      <a
        href={`https://wa.me/${WA_LUIZ}?text=${msg}`}
        target="_blank" rel="noopener noreferrer"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-green-500 px-7 py-3.5 text-sm font-bold text-black transition-all hover:bg-green-400 active:scale-95"
      >
        <MessageCircle size={17} /> Fechar os detalhes no WhatsApp
      </a>
    </div>
  )
}
