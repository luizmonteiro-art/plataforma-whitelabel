import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr))
}

export function formatDateTime(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
}

export function formatPhone(phone: string) {
  return phone.replace(/\D/g, '').replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
}

export const conditionLabel: Record<string, string> = {
  novo: 'Novo',
  seminovo: 'Seminovo',
  lacrado: 'Lacrado',
}

export const conditionColor: Record<string, string> = {
  novo: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  seminovo: 'bg-amber-500/25 text-amber-300 border-amber-400/40',
  lacrado: 'bg-green-500/20 text-green-300 border-green-500/30',
}

export const serviceStatusLabel: Record<string, string> = {
  recebido: 'Recebido',
  em_analise: 'Em análise',
  aguardando_peca: 'Aguardando peça',
  em_reparo: 'Em reparo',
  pronto: 'Pronto',
  entregue: 'Entregue',
}

export const serviceStatusColor: Record<string, string> = {
  recebido: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  em_analise: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  aguardando_peca: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  em_reparo: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pronto: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  entregue: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export const appointmentStatusLabel: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  realizado: 'Realizado',
}

export const categoryLabel: Record<string, string> = {
  iphone: 'iPhone',
  android: 'Android',
  capinha: 'Capinhas',
  pelicula: 'Películas',
  carregador: 'Carregadores',
  acessorio: 'Acessórios',
}

export const paymentMethodLabel: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_debito: 'Cartão Débito',
  cartao_credito: 'Cartão Crédito',
}
