import type { Metadata } from 'next'
import { CaptacaoClient } from './CaptacaoClient'

export const metadata: Metadata = {
  title: 'MODUS — Sistema completo pra sua empresa, no ar em minutos',
  description:
    'A MODUS entrega sistemas digitais completos — vitrine, gestão, agendamentos e mais — personalizados com a identidade da sua empresa. Prontos em menos de um dia.',
}

export default function CaptacaoPage() {
  return <CaptacaoClient />
}
