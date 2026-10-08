'use client'

import Image from 'next/image'
import { useState, useTransition, type FormEvent } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Mail,
  MessageCircle,
} from 'lucide-react'
import { PLANS } from '@/lib/plans'
import { submitStoreRequest, type RequestInput } from './actions'
import styles from './captacao.module.css'

const WHATSAPP = '5519933005099'
const INSTAGRAM = 'https://www.instagram.com/usemods.br/'
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const plans = [
  {
    id: 'vitrine',
    description: 'Para apresentar seu negócio com uma vitrine própria.',
    features: ['Vitrine pública', 'Até 30 produtos', 'Estoque e promoções'],
  },
  {
    id: 'loja',
    description: 'Para conectar a vitrine à rotina da operação.',
    features: ['Até 150 produtos', 'Vendas e serviços', 'Orçamentos e agendamentos'],
  },
  {
    id: 'master',
    description: 'Para uma operação com mais controle e equipe.',
    features: ['Até 300 produtos', 'Relatórios e financeiro operacional', 'Até 2 acessos de equipe'],
  },
] as const

const questions = [
  {
    question: 'A MODS é uma loja pronta ou um sistema para o meu negócio?',
    answer:
      'É uma plataforma para criar sua vitrine digital e organizar a operação em um painel. A configuração da sua marca e dos módulos é alinhada durante a implantação.',
  },
  {
    question: 'O cliente compra e paga diretamente na vitrine?',
    answer:
      'Hoje, a vitrine ajuda o cliente a conhecer produtos e serviços e a seguir para o contato pelo WhatsApp. Checkout, pagamento e frete integrados não fazem parte da oferta atual.',
  },
  {
    question: 'Preciso escolher o plano definitivo agora?',
    answer:
      'Não. O plano indicado no formulário mostra seu ponto de partida. Antes de qualquer ativação, conversamos sobre a rotina, os módulos e a implantação.',
  },
  {
    question: 'A implantação está incluída na mensalidade?',
    answer:
      'A implantação é cobrada à parte e depende do escopo. O valor é apresentado antes de você decidir avançar.',
  },
]

const initialForm: RequestInput = {
  store_name: '',
  contact_name: '',
  email: '',
  whatsapp: '',
  plan_id: 'loja',
  accent_color: '#79E2AD',
  notes: '',
}

export function CaptacaoClient() {
  const [form, setForm] = useState<RequestInput>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  function update<K extends keyof RequestInput>(key: K, value: RequestInput[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const params = new URLSearchParams(window.location.search)
    const source = ['utm_source', 'utm_medium', 'utm_campaign']
      .map(key => params.get(key)?.slice(0, 60))
      .filter(Boolean)
      .join(' / ')
    const notes = [form.notes?.trim(), source && 'Origem: ' + source].filter(Boolean).join('\n')

    startTransition(async () => {
      try {
        const result = await submitStoreRequest({
          ...form,
          notes,
        })
        if (result.ok) {
          setDone(true)
        } else {
          setError(result.error)
        }
      } catch {
        setError('Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp.')
      }
    })
  }

  const selectedPlan = PLANS[form.plan_id]
  const whatsappMessage = encodeURIComponent(
    'Olá! Enviei meu contato pela MODS para ' +
      form.store_name +
      ' e gostaria de entender a implantação do plano ' +
      selectedPlan.name +
      '.',
  )

  return (
    <div id="top" className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="#top" className={styles.brand} aria-label="MODS, início da página">
            <Image src="/brand/mods/wordmark-light.svg" alt="mods." width={156} height={57} priority />
          </a>
          <nav className={styles.nav} aria-label="Navegação principal">
            <a href="#solucao">A solução</a>
            <a href="#planos">Planos</a>
            <a href="#duvidas">Dúvidas</a>
          </nav>
          <a href="#contato" className={styles.headerCta}>
            Conhecer a MODS <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.heroLead}>Vitrine digital + gestão operacional</p>
              <h1 id="hero-title">Seu negócio não precisa de mais abas.</h1>
              <p className={styles.heroDescription}>
                A MODS coloca o que o cliente vê e o que você precisa gerir em uma base mais clara:
                produtos, estoque, vendas e rotina operacional.
              </p>
              <div className={styles.heroActions}>
                <a href="#contato" className={styles.buttonPrimary}>
                  Quero conhecer a MODS <ArrowRight size={19} aria-hidden="true" />
                </a>
                <a href="#solucao" className={styles.buttonSecondary}>
                  Ver como funciona
                </a>
              </div>
              <p className={styles.heroNote}>
                Primeiro entendemos seu negócio. Depois indicamos o formato que faz sentido.
              </p>
            </div>

            <div className={styles.heroArt}>
              <div className={styles.heroArtTop}>
                <span>MODS</span>
                <span>Uma base. Mais clareza.</span>
              </div>
              <Image
                src="/brand/mods/centralizacao.webp"
                alt="Módulos tridimensionais conectados ao redor de um núcleo verde menta."
                width={1122}
                height={1402}
                priority
                sizes="(max-width: 760px) 90vw, 48vw"
                className={styles.heroImage}
              />
              <div className={styles.heroArtBottom}>
                <span>Vitrine</span>
                <span>Estoque</span>
                <span>Vendas</span>
                <span>Serviços</span>
              </div>
            </div>
          </div>
        </section>

        <section id="solucao" className={styles.problem} aria-labelledby="problem-title">
          <div className={styles.sectionInner}>
            <div className={styles.problemIntro}>
              <p className={styles.kicker}>O problema</p>
              <h2 id="problem-title">O cliente pergunta. Você procura.</h2>
              <p>
                Quando catálogo, estoque e atendimento ficam espalhados, uma pergunta simples
                vira uma busca. A informação precisa acompanhar a rotina do negócio.
              </p>
            </div>
            <div className={styles.problemVisual}>
              <Image
                src="/brand/mods/informacao-presa.webp"
                alt="Cartões e fios tridimensionais cercam uma informação no centro."
                width={1122}
                height={1402}
                sizes="(max-width: 760px) 85vw, 36vw"
              />
              <div className={styles.problemCaption}>
                <span>De informação espalhada</span>
                <ArrowRight size={18} aria-hidden="true" />
                <strong>para uma rotina mais clara</strong>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.solution} aria-labelledby="solution-title">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <p className={styles.kicker}>O que a MODS reúne</p>
              <h2 id="solution-title">Uma base para apresentar. Outra visão para operar.</h2>
              <p>
                Seu cliente encontra uma vitrine com a sua marca. Você acompanha as informações
                da operação em um painel. Os módulos disponíveis dependem do plano escolhido.
              </p>
            </div>
            <div className={styles.capabilityGrid}>
              <div className={styles.capability}>
                <span className={styles.capabilityNumber}>01</span>
                <h3>Vitrine própria</h3>
                <p>Produtos, serviços e promoções organizados para quem chega até sua marca.</p>
              </div>
              <div className={styles.capability}>
                <span className={styles.capabilityNumber}>02</span>
                <h3>Estoque visível</h3>
                <p>Cadastro e disponibilidade no mesmo ambiente usado para gerir a loja.</p>
              </div>
              <div className={styles.capability}>
                <span className={styles.capabilityNumber}>03</span>
                <h3>Rotina registrada</h3>
                <p>Vendas, orçamentos, serviços e agendamentos conforme a estrutura contratada.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className={styles.process} aria-labelledby="process-title">
          <div className={styles.sectionInner}>
            <div className={styles.processHead}>
              <p className={styles.kicker}>Como começamos</p>
              <h2 id="process-title">A ferramenta entra depois de entender a rotina.</h2>
            </div>
            <ol className={styles.processList}>
              <li><span>1</span><div><h3>Você conta o cenário</h3><p>O que vende, como atende e onde a informação se perde hoje.</p></div></li>
              <li><span>2</span><div><h3>Definimos a estrutura</h3><p>Plano, módulos e identidade são alinhados com a necessidade real.</p></div></li>
              <li><span>3</span><div><h3>Combinamos a implantação</h3><p>Escopo e valor são apresentados antes de qualquer ativação.</p></div></li>
            </ol>
          </div>
        </section>

        <section id="planos" className={styles.plans} aria-labelledby="plans-title">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <p className={styles.kicker}>Planos</p>
              <h2 id="plans-title">Escolha um ponto de partida.</h2>
              <p>Você pode ajustar essa escolha depois da conversa. Cada plano tem uma mensalidade e uma implantação definida por escopo.</p>
            </div>
            <div className={styles.planGrid}>
              {plans.map(item => {
                const plan = PLANS[item.id]
                return (
                  <article key={item.id} className={item.id === 'loja' ? styles.planFeatured : styles.plan}>
                    <div className={styles.planHead}>
                      <h3>{plan.name}</h3>
                      {item.id === 'loja' && <span>Vitrine + gestão</span>}
                    </div>
                    <p className={styles.planDescription}>{item.description}</p>
                    <p className={styles.planPrice}>
                      <strong>{formatMoney(plan.priceBrl)}</strong><span>/mês</span>
                    </p>
                    <ul>
                      {item.features.map(feature => (
                        <li key={feature}><Check size={17} aria-hidden="true" />{feature}</li>
                      ))}
                    </ul>
                    <a href="#contato" onClick={() => update('plan_id', item.id)} className={styles.planLink}>
                      Conversar sobre {plan.name} <ArrowUpRight size={17} aria-hidden="true" />
                    </a>
                  </article>
                )
              })}
            </div>
            <p className={styles.planFootnote}>Implantação cobrada à parte, com valor apresentado antes da contratação. A vitrine atual direciona o contato pelo WhatsApp; não inclui checkout ou pagamento integrado.</p>
          </div>
        </section>

        <section id="duvidas" className={styles.faq} aria-labelledby="faq-title">
          <div className={styles.sectionInner}>
            <div className={styles.faqIntro}>
              <p className={styles.kicker}>Dúvidas frequentes</p>
              <h2 id="faq-title">Antes de avançar, tudo às claras.</h2>
              <p>Informações diretas para você saber o que está escolhendo.</p>
            </div>
            <div className={styles.faqList}>
              {questions.map(item => (
                <details key={item.question}>
                  <summary>{item.question}<ChevronDown size={18} aria-hidden="true" /></summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className={styles.contact} aria-labelledby="contact-title">
          <div className={styles.sectionInner}>
            <div className={styles.contactCopy}>
              <p className={styles.kicker}>Seu próximo passo</p>
              <h2 id="contact-title">Vamos entender o que seu negócio precisa?</h2>
              <p>
                Deixe seus dados para uma conversa sobre a MODS. O envio não cria uma loja,
                inicia um teste ou gera cobrança.
              </p>
              <div className={styles.contactAside}>
                <MessageCircle size={22} aria-hidden="true" />
                <span>Prefere começar por mensagem? <a href={'https://wa.me/' + WHATSAPP} target="_blank" rel="noopener noreferrer">Chame no WhatsApp.</a></span>
              </div>
            </div>

            <div className={styles.formCard}>
              {done ? (
                <div role="status" className={styles.success}>
                  <span className={styles.successIcon}><Check size={26} aria-hidden="true" /></span>
                  <h3>Contato recebido.</h3>
                  <p>Recebemos sua solicitação para <strong>{form.store_name}</strong>. Agora podemos conversar sobre a estrutura e a implantação.</p>
                  <a
                    href={'https://wa.me/' + WHATSAPP + '?text=' + whatsappMessage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.buttonPrimary}
                  >
                    Continuar no WhatsApp <ArrowUpRight size={18} aria-hidden="true" />
                  </a>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <h3>Conhecer a MODS</h3>
                  <p className={styles.formIntro}>Preencha o essencial. A escolha do plano pode ser revista depois.</p>
                  <div className={styles.fieldGrid}>
                    <label>Seu nome
                      <input value={form.contact_name} onChange={event => update('contact_name', event.target.value)} required maxLength={100} autoComplete="name" placeholder="Como podemos chamar você?" />
                    </label>
                    <label>Nome do negócio
                      <input value={form.store_name} onChange={event => update('store_name', event.target.value)} required maxLength={120} autoComplete="organization" placeholder="Nome da sua empresa" />
                    </label>
                    <label>WhatsApp
                      <input value={form.whatsapp} onChange={event => update('whatsapp', event.target.value)} required maxLength={25} type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" />
                    </label>
                    <label>E-mail
                      <input value={form.email} onChange={event => update('email', event.target.value)} required maxLength={160} type="email" autoComplete="email" placeholder="voce@empresa.com.br" />
                    </label>
                  </div>
                  <label className={styles.fullField}>Plano de interesse
                    <select value={form.plan_id} onChange={event => update('plan_id', event.target.value)}>
                      {plans.map(item => <option key={item.id} value={item.id}>{PLANS[item.id].name} — {formatMoney(PLANS[item.id].priceBrl)}/mês</option>)}
                    </select>
                  </label>
                  <label className={styles.fullField}>Cor de referência da sua marca <span>(opcional)</span>
                    <span className={styles.brandColor}>
                      <input type="color" value={form.accent_color} onChange={event => update('accent_color', event.target.value)} aria-label="Cor de referência da marca" />
                      <span>{form.accent_color} · podemos ajustar na implantação</span>
                    </span>
                  </label>
                  <label className={styles.fullField}>O que você quer organizar? <span>(opcional)</span>
                    <textarea value={form.notes} onChange={event => update('notes', event.target.value)} maxLength={800} rows={3} placeholder="Conte um pouco sobre sua rotina." />
                  </label>
                  {error && <p role="alert" className={styles.formError}>{error}</p>}
                  <button type="submit" disabled={pending} className={styles.submitButton}>
                    {pending ? 'Enviando...' : 'Solicitar conversa'}
                    {!pending && <ArrowRight size={18} aria-hidden="true" />}
                  </button>
                  <p className={styles.formPrivacy}>Usaremos seus dados para responder esta solicitação por WhatsApp ou e-mail.</p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <a href="#top" aria-label="MODS, voltar ao início">
            <Image src="/brand/mods/wordmark-light.svg" alt="mods." width={132} height={48} />
          </a>
          <p>Vitrine digital + gestão operacional.</p>
          <div className={styles.footerLinks}>
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">@</span> usemods.br</a>
            <a href="mailto:comercial.mods@gmail.com"><Mail size={18} aria-hidden="true" /> E-mail</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
