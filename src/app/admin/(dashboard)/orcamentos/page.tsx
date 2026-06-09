'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, MessageCircle, X, FileText, Copy, CheckCircle, ArrowLeft, Wrench, ChevronDown, Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'
import { getServices, getQuotes, upsertQuote, deleteQuote, getStoreConfig, upsertServiceOrder } from '@/lib/db'
import { useServiceOrders, useAdminStore } from '@/contexts/AdminStore'
import type { Service, Quote, QuoteItem, QuoteStatus, ServiceOrder } from '@/types'

type OrcStatus = QuoteStatus
type LineItem = QuoteItem
type Orcamento = Quote

const statusColors: Record<OrcStatus, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  aprovado: 'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/30',
  recusado: 'bg-red-500/20 text-red-400 border-red-500/30',
  expirado: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

const emptyItem = (): LineItem => ({ id: String(Date.now()), descricao: '', qty: 1, unitario: 0 })

// O id é um UUID (coluna do Supabase) — exibe uma forma curta e legível.
const displayId = (id: string) => id.slice(0, 8).toUpperCase()

function formatWhatsApp(orc: Orcamento, storeName: string, storePhone: string): string {
  const total = orc.items.reduce((s, i) => s + i.qty * i.unitario, 0) - orc.desconto
  const lines = [
    `*ORÇAMENTO #${displayId(orc.id)}*`,
    `*${storeName}* — Celulares & Assistência`,
    ``,
    `*Cliente:* ${orc.customer_name}`,
    `*Aparelho:* ${orc.device}`,
    ``,
    `*Serviços / Peças:*`,
    ...orc.items.map(i => `  • ${i.descricao} (${i.qty}x) .................. ${formatCurrency(i.qty * i.unitario)}`),
    orc.desconto > 0 ? `  🏷️ Desconto ..................................... -${formatCurrency(orc.desconto)}` : '',
    ``,
    `*TOTAL: ${formatCurrency(total)}*`,
    ``,
    orc.observacoes ? `*Observações:* ${orc.observacoes}` : '',
    `*Validade:* ${new Date(orc.validade + 'T12:00:00').toLocaleDateString('pt-BR')}`,
    ``,
    `Para aprovar, responda esta mensagem ou ligue: ${storePhone}`,
  ].filter(l => l !== '')

  return lines.join('\n')
}

export default function OrcamentosPage() {
  const router = useRouter()
  const { storeId } = useAdminStore()
  const [, setServiceOrders] = useServiceOrders()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState<Orcamento | null>(null)
  const [copied, setCopied] = useState(false)
  const [services, setServices] = useState<Service[]>([])

  // Config da loja (multi-tenant) — carregada do Supabase
  const [storeWA, setStoreWA] = useState('')
  const [storeName, setStoreName] = useState('Minha Loja')
  const [storePhone, setStorePhone] = useState('')

  useEffect(() => {
    if (!storeId) return
    getServices(storeId).then(setServices).catch(console.error)
    getQuotes(storeId).then(setOrcamentos).catch(console.error)
    getStoreConfig(storeId).then(cfg => {
      if (!cfg) return
      if (cfg.whatsapp) setStoreWA(`55${cfg.whatsapp.replace(/\D/g, '')}`)
      if (cfg.store_name) setStoreName(cfg.store_name)
      if (cfg.phone) setStorePhone(cfg.phone)
    }).catch(console.error)
  }, [storeId])

  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [device, setDevice] = useState('')
  const [items, setItems] = useState<LineItem[]>([emptyItem()])
  const [desconto, setDesconto] = useState(0)
  const [obs, setObs] = useState('')
  const [validade, setValidade] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]
  })

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitario, 0)
  const total = subtotal - desconto

  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))
  const updateItem = (id: string, field: keyof LineItem, value: string | number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))

  const addServiceItem = (serviceName: string, price: number) => {
    setItems(prev => [...prev, { id: String(Date.now()), descricao: serviceName, qty: 1, unitario: price }])
  }

  const resetForm = () => { setName(''); setPhone(''); setDevice(''); setItems([emptyItem()]); setDesconto(0); setObs(''); }

  const createOrcamento = async () => {
    if (!name || !device || items.some(i => !i.descricao)) return
    const orc: Orcamento = {
      id: crypto.randomUUID(),
      customer_name: name, customer_phone: phone, device,
      items, desconto, observacoes: obs, validade,
      status: 'pendente',
      created_at: new Date().toISOString(),
    }
    const saved = await upsertQuote(storeId, orc).catch(() => orc)
    setOrcamentos(prev => [saved, ...prev])
    setShowForm(false)
    resetForm()
    setViewing(saved)
  }

  const updateStatus = (id: string, status: OrcStatus) => {
    upsertQuote(storeId, { id, status }).catch(console.error)
    setOrcamentos(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    if (viewing?.id === id) setViewing(prev => prev ? { ...prev, status } : null)
  }

  const removeOrcamento = async (id: string) => {
    if (!confirm('Excluir este orçamento?')) return
    await deleteQuote(storeId, id).catch(console.error)
    setOrcamentos(prev => prev.filter(o => o.id !== id))
    setViewing(null)
  }

  const convertToOS = async (orc: Orcamento) => {
    const total = orc.items.reduce((s, i) => s + i.qty * i.unitario, 0) - orc.desconto
    const problem = orc.items.map(i => i.descricao).filter(Boolean).join(', ') || 'Convertido de orçamento'
    // id gerado no client — service_orders.id é TEXT PRIMARY KEY (formato OS……)
    const order: ServiceOrder = {
      id: `OS${String(Date.now()).slice(-6)}`,
      customer_name: orc.customer_name,
      customer_phone: orc.customer_phone,
      device_brand: orc.device,
      device_model: '',
      problem,
      diagnosis: orc.observacoes || undefined,
      price: total,
      status: 'recebido',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const saved = await upsertServiceOrder(storeId, order).catch(() => order)
    setServiceOrders(prev => [saved, ...prev])
    // Marca o orçamento como aprovado ao virar O.S.
    updateStatus(orc.id, 'aprovado')
    setViewing(null)
    router.push('/admin/servicos')
  }

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="space-y-1">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-white transition-colors group">
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Voltar
        </button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Orçamentos</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{orcamentos.length} orçamento{orcamentos.length !== 1 ? 's' : ''} · Gere, compartilhe e converta em O.S.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] active:scale-95 text-black font-semibold rounded-xl transition-all text-sm">
            <Plus size={16} /> Novo orçamento
          </button>
        </div>
      </div>

      {/* Empty state */}
      {orcamentos.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl bg-[#141414] border border-white/[0.06] text-center">
          <FileText size={48} className="text-zinc-700 mb-4" />
          <p className="text-lg font-semibold text-white mb-1">Nenhum orçamento ainda</p>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm">Crie orçamentos profissionais e compartilhe com seus clientes pelo WhatsApp.</p>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] text-black font-semibold rounded-xl transition-all text-sm">
            <Plus size={15} /> Criar primeiro orçamento
          </button>
        </div>
      )}

      {/* Lista de orçamentos */}
      {orcamentos.length > 0 && (
        <div className="space-y-3">
          {orcamentos.map(orc => {
            const t = orc.items.reduce((s, i) => s + i.qty * i.unitario, 0) - orc.desconto
            return (
              <div key={orc.id} className="flex items-center gap-4 p-4 rounded-2xl bg-[#141414] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer" onClick={() => setViewing(orc)}>
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{orc.customer_name}</p>
                    <span className="text-xs font-mono text-zinc-600">{displayId(orc.id)}</span>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', statusColors[orc.status])}>
                      {orc.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{orc.device} · {orc.items.length} item{orc.items.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[var(--accent)]">{formatCurrency(t)}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{formatDateTime(orc.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal — Criar orçamento */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Novo orçamento</h3>
              <button onClick={() => { setShowForm(false); resetForm() }} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Cliente */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome do cliente *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="João Silva"
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">WhatsApp / Telefone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(19) 98149-9229"
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]/40" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Aparelho *</label>
                  <input value={device} onChange={e => setDevice(e.target.value)} placeholder="iPhone 14 Pro, Samsung S23..."
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]/40" />
                </div>
              </div>

              {/* Atalhos de serviços */}
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2">Adicionar serviço rápido:</p>
                <div className="flex flex-wrap gap-1.5">
                  {services.filter(s => s.is_active).map(s => (
                    <button key={s.id} onClick={() => addServiceItem(s.name, s.price_from)}
                      className="px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-zinc-400 hover:text-[var(--accent)] hover:border-[var(--accent)]/25 transition-all active:scale-95 flex items-center gap-1.5">
                      <Wrench size={10} /> {s.name} — {formatCurrency(s.price_from)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Itens */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-zinc-400">Itens do orçamento *</label>
                  <button onClick={addItem} className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                    <Plus size={12} /> Adicionar linha
                  </button>
                </div>
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr_60px_100px_32px] gap-2 px-1">
                    <span className="text-[10px] text-zinc-600 font-semibold uppercase">Descrição</span>
                    <span className="text-[10px] text-zinc-600 font-semibold uppercase text-center">Qtd</span>
                    <span className="text-[10px] text-zinc-600 font-semibold uppercase text-right">Unitário</span>
                    <span />
                  </div>
                  {items.map(item => (
                    <div key={item.id} className="grid grid-cols-[1fr_60px_100px_32px] gap-2 items-center">
                      <input value={item.descricao} onChange={e => updateItem(item.id, 'descricao', e.target.value)} placeholder="Troca de tela, bateria..."
                        className="bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]/40" />
                      <input type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))}
                        className="bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-[var(--accent)]/40" />
                      <input type="number" min="0" step="0.01" value={item.unitario} onChange={e => updateItem(item.id, 'unitario', Number(e.target.value))} placeholder="0"
                        className="bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white text-right focus:outline-none focus:border-[var(--accent)]/40" />
                      <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                        className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-all active:scale-90">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal + desconto */}
              <div className="rounded-xl bg-[#111] border border-white/[0.06] p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-500">Desconto (R$)</span>
                  <input type="number" min="0" value={desconto} onChange={e => setDesconto(Number(e.target.value))}
                    className="w-28 bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:border-[var(--accent)]/40" />
                </div>
                <div className="flex justify-between text-base pt-1 border-t border-white/[0.06]">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-black text-[var(--accent)]">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Observações + validade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Observações</label>
                  <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} placeholder="Garantia, condições, tempo estimado..."
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]/40 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Validade do orçamento</label>
                  <input type="date" value={validade} onChange={e => setValidade(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => { setShowForm(false); resetForm() }} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] active:scale-95 transition-all">Cancelar</button>
              <button onClick={createOrcamento} disabled={!name || !device} className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] disabled:opacity-50 active:scale-95 text-black font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                <FileText size={14} /> Gerar orçamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Visualizar orçamento */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Orçamento {displayId(viewing.id)}</h3>
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', statusColors[viewing.status])}>
                  {viewing.status}
                </span>
              </div>
              <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Preview do orçamento */}
              <div className="rounded-xl bg-[#111] border border-white/[0.06] p-5 font-mono text-xs space-y-1">
                <p className="font-bold text-white text-sm">ORÇAMENTO #{displayId(viewing.id)}</p>
                <p className="text-[var(--accent)] font-bold">{storeName} — Celulares & Assistência</p>
                <div className="border-t border-white/[0.06] my-2" />
                <p className="text-zinc-400">Cliente: <span className="text-white">{viewing.customer_name}</span></p>
                <p className="text-zinc-400">Aparelho: <span className="text-white">{viewing.device}</span></p>
                <div className="border-t border-white/[0.06] my-2" />
                {viewing.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-zinc-300">{item.qty}x {item.descricao}</span>
                    <span className="text-white">{formatCurrency(item.qty * item.unitario)}</span>
                  </div>
                ))}
                {viewing.desconto > 0 && (
                  <div className="flex justify-between text-yellow-400">
                    <span>Desconto</span>
                    <span>-{formatCurrency(viewing.desconto)}</span>
                  </div>
                )}
                <div className="border-t border-white/[0.06] my-2" />
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-white">TOTAL</span>
                  <span className="text-[var(--accent)]">{formatCurrency(viewing.items.reduce((s, i) => s + i.qty * i.unitario, 0) - viewing.desconto)}</span>
                </div>
                {viewing.observacoes && <p className="text-zinc-500 pt-1">Obs: {viewing.observacoes}</p>}
                <p className="text-zinc-600 pt-1">Validade: {new Date(viewing.validade + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Atualizar status</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['pendente', 'aprovado', 'recusado', 'expirado'] as OrcStatus[]).map(s => (
                    <button key={s} onClick={() => updateStatus(viewing.id, s)}
                      className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95',
                        viewing.status === s ? statusColors[s] + ' bg-white/[0.05]' : 'border-white/[0.06] text-zinc-500 hover:text-white hover:bg-white/[0.04]')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/${storeWA}?text=${encodeURIComponent(formatWhatsApp(viewing, storeName, storePhone))}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 bg-[var(--accent)] hover:bg-[var(--accent)] active:scale-95 text-white font-semibold rounded-xl text-sm transition-all">
                  <MessageCircle size={15} /> Enviar pelo WhatsApp
                </a>
                <button onClick={() => copyText(formatWhatsApp(viewing, storeName, storePhone))}
                  className={cn('flex items-center justify-center gap-2 py-3 border rounded-xl text-sm font-medium transition-all active:scale-95',
                    copied ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]' : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white')}>
                  {copied ? <><CheckCircle size={15} /> Copiado!</> : <><Copy size={15} /> Copiar texto</>}
                </button>
                <button onClick={() => convertToOS(viewing)}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20 active:scale-95 rounded-xl text-sm font-medium transition-all">
                  <Wrench size={15} /> Converter em O.S.
                </button>
                <button onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 py-3 bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white active:scale-95 rounded-xl text-sm font-medium transition-all">
                  <Printer size={15} /> Imprimir
                </button>
                <button onClick={() => removeOrcamento(viewing.id)}
                  className="col-span-2 flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 active:scale-95 rounded-xl text-sm font-medium transition-all">
                  <Trash2 size={15} /> Excluir orçamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
