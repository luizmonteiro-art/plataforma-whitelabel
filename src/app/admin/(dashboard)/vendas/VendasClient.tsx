'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, TrendingUp, X, ChevronDown, Target, CheckCircle, XCircle, Search, ArrowLeft, Edit2, Package, Percent, Tag, Download, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDateTime, paymentMethodLabel, cn } from '@/lib/utils'
import { useSales, useProducts, useAdminStore, usePlan } from '@/contexts/AdminStore'
import { saveSaleAtomic, setSalePaymentTerms, setSaleTradeIn } from '@/lib/db'
import { pendingSaleJournal, type PendingSale } from '@/lib/pending-sale'
import type { Sale, PaymentMethod } from '@/types'

interface SaleWithStatus extends Sale {
  saleStatus: 'aprovado' | 'pendente' | 'cancelado' | 'historico'
}

interface EditItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

type DateFilter = 'todos' | 'hoje' | 'semana' | 'mes'

export function VendasClient() {
  const router = useRouter()
  const { storeId, reload, _error, _loaded } = useAdminStore()
  const { hasModule } = usePlan()
  const [rawSales, setSalesRaw] = useSales()
  const [storeProducts] = useProducts()
  const sales: SaleWithStatus[] = rawSales.map(s => ({ ...s, saleStatus: s.stock_managed ? s.status ?? 'aprovado' : 'historico' }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingCancellation, setPendingCancellation] = useState<Sale | null>(null)
  const saving = useRef(false)
  const newSaleId = useRef<string | null>(null)
  const [recovery, setRecovery] = useState<PendingSale | null>(null)
  useEffect(() => {
    // Read browser-only storage after hydration; SSR cannot supply this snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setRecovery(pendingSaleJournal(sessionStorage, storeId).read()) }
    catch { setError('Não foi possível ler a recuperação de vendas deste navegador. Confira os registros antes de continuar.') }
  }, [storeId])

  const persist = async (sale: Parameters<typeof saveSaleAtomic>[1], recovering = false) => {
    if (saving.current) return false
    if (_error || !_loaded) {
      setError('Atualize a página para carregar os dados antes de registrar outra operação.')
      return false
    }
    saving.current = true
    setBusy(true)
    setError(null)
    try {
      const journal = pendingSaleJournal(sessionStorage, storeId)
      const previous = journal.read()
      if (previous && !recovering) {
        setRecovery(previous)
        setError('Confira a operação pendente antes de iniciar ou alterar outra venda.')
        return false
      }
      const pending = previous ?? journal.begin(sale)
      setRecovery(pending)
      const saved = await saveSaleAtomic(storeId, pending.sale, pending.requestId)
      setSalesRaw(prev => [saved, ...prev.filter(s => s.id !== saved.id)])
      journal.clear()
      setRecovery(null)
      await reload()
      return true
    } catch (err) {
      // A PostgreSQL exception rolls back the whole transaction. Transport
      // failures remain pending because the server may have committed.
      if (err && typeof err === 'object' && 'code' in err && err.code === 'P0001') {
        try { pendingSaleJournal(sessionStorage, storeId).clear(); setRecovery(null) } catch { /* Keep recovery visible. */ }
      } else {
        // Make the recovery action reachable instead of leaving it behind a modal.
        setShowForm(false)
        setEditSale(null)
        setPendingCancellation(null)
      }
      const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Não foi possível confirmar a operação. Tente novamente antes de iniciar outra venda.'
      setError(message)
      return false
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  // ── Novo registro ──
  const [showForm, setShowForm] = useState(false)
  const [formProduct, setFormProduct] = useState('')
  const [formQty, setFormQty] = useState('1')
  const [formPayment, setFormPayment] = useState<PaymentMethod>('pix')
  const [formCustomer, setFormCustomer] = useState('')
  // ── Venda a prazo (fiado) ──
  const [formAPrazo, setFormAPrazo] = useState(false)
  const [formEntrada, setFormEntrada] = useState('')
  const [formVencimento, setFormVencimento] = useState('')
  // ── Troca de aparelho ──
  const [formTemTroca, setFormTemTroca] = useState(false)
  const [formTrocaAparelho, setFormTrocaAparelho] = useState('')
  const [formTrocaValor, setFormTrocaValor] = useState('')

  // ── Edição de venda ──
  const [editSale, setEditSale] = useState<SaleWithStatus | null>(null)
  const [editItems, setEditItems] = useState<EditItem[]>([])
  const [editCustomer, setEditCustomer] = useState('')
  const [editPayment, setEditPayment] = useState<PaymentMethod>('pix')
  const [editStatus, setEditStatus] = useState<NonNullable<Sale['status']>>('aprovado')
  const [editDiscount, setEditDiscount] = useState('0')      // % de desconto
  const [editTotalOverride, setEditTotalOverride] = useState('') // valor manual
  const [addProductId, setAddProductId] = useState('')

  // ── Filtros ──
  const [filterStatus, setFilterStatus] = useState<'todos' | 'aprovado' | 'pendente' | 'cancelado'>('todos')
  const [filterPayment, setFilterPayment] = useState<string>('todos')
  const [filterDate, setFilterDate] = useState<DateFilter>('todos')
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(10000)
  const [editMeta, setEditMeta] = useState(false)
  const [metaInput, setMetaInput] = useState('10000')

  // ─────────────── helpers edit ───────────────
  const openEdit = (sale: SaleWithStatus) => {
    setEditSale(sale)
    setEditItems(sale.items.map(i => ({ ...i })))
    setEditCustomer(sale.customer_name || '')
    setEditPayment(sale.payment_method)
    setEditStatus(sale.status ?? 'aprovado')
    setEditDiscount('0')
    setEditTotalOverride('')
    setAddProductId('')
  }

  const editSubtotal = editItems.reduce((a, i) => a + i.unit_price * i.quantity, 0)
  const discountPct = Math.max(0, Math.min(100, Number(editDiscount) || 0))
  const discountAmt = (discountPct / 100) * editSubtotal
  const editTotal = editTotalOverride !== ''
    ? Number(editTotalOverride)
    : editSubtotal - discountAmt

  const addItemFromProduct = () => {
    const p = storeProducts.find(x => x.id === addProductId)
    if (!p) return
    setEditItems(prev => {
      const existing = prev.findIndex(i => i.product_id === p.id)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { ...next[existing], quantity: next[existing].quantity + 1 }
        return next
      }
      return [...prev, { product_id: p.id, product_name: p.name, quantity: 1, unit_price: p.promo_price ?? p.price }]
    })
    setAddProductId('')
  }

  const updateItem = (idx: number, field: keyof EditItem, value: string | number) => {
    setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: field === 'product_name' ? value : Number(value) } : item))
  }

  const removeItem = (idx: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx))
  }

  const saveEdit = async () => {
    if (!editSale || editItems.length === 0) return
    const changes = {
      id: editSale.id,
      items: editItems,
      total: editTotal,
      customer_name: editCustomer || undefined,
      payment_method: editPayment,
      status: editStatus,
      revision: editSale.revision,
    }
    if (await persist(changes)) setEditSale(null)
  }

  // ─────────────── filtros ───────────────
  const filtered = useMemo(() => {
    const now = new Date()
    return sales.filter(s => {
      if (filterStatus !== 'todos' && s.saleStatus !== filterStatus) return false
      if (filterPayment !== 'todos' && s.payment_method !== filterPayment) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!s.customer_name?.toLowerCase().includes(q) &&
            !s.items.some(i => i.product_name.toLowerCase().includes(q)) &&
            !s.id.toLowerCase().includes(q)) return false
      }
      if (filterDate !== 'todos') {
        const d = new Date(s.created_at)
        if (filterDate === 'hoje' && d.toDateString() !== now.toDateString()) return false
        if (filterDate === 'semana') { const w = new Date(now); w.setDate(w.getDate()-7); if (d < w) return false }
        if (filterDate === 'mes' && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false
      }
      return true
    })
  }, [sales, filterStatus, filterPayment, search, filterDate])

  const approved = sales.filter(s => s.saleStatus === 'aprovado')
  const totalRevenue = approved.reduce((a, s) => a + s.total, 0)
  const pendingRevenue = sales.filter(s => s.saleStatus === 'pendente').reduce((a, s) => a + s.total, 0)
  const metaPercent = Math.min(100, Math.round((totalRevenue / meta) * 100))

  // ─── Relatórios avançados (plano Master) ───
  const monthlyReport = (() => {
    if (!hasModule('RELATORIOS')) return []
    const months: { key: string; label: string; total: number; count: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), total: 0, count: 0 })
    }
    for (const s of approved) {
      const d = new Date(s.created_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const bucket = months.find(m => m.key === key)
      if (bucket) { bucket.total += s.total; bucket.count += 1 }
    }
    return months
  })()

  const exportCsv = () => {
    const header = ['ID', 'Data', 'Cliente', 'Produtos', 'Pagamento', 'Situação', 'Total']
    const rows = filtered.map(s => [
      s.id,
      formatDateTime(s.created_at),
      s.customer_name ?? '',
      s.items.map(i => `${i.product_name} (${i.quantity}x)`).join('; '),
      paymentMethodLabel[s.payment_method] ?? s.payment_method,
      s.saleStatus,
      s.total.toFixed(2).replace('.', ','),
    ])
    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendas-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRegister = async () => {
    const product = storeProducts.find(p => p.id === formProduct)
    if (!product) return
    const qty = Number(formQty)
    if (!Number.isInteger(qty) || qty < 1 || qty > product.stock_qty) {
      setError('Informe uma quantidade inteira dentro do estoque disponível.')
      return
    }
    const total = (product.promo_price ?? product.price) * qty
    const payload = {
      items: [{ product_id: product.id, product_name: product.name, quantity: qty, unit_price: product.promo_price ?? product.price }],
      total,
      payment_method: formPayment,
      customer_name: formCustomer || undefined,
    }
    newSaleId.current ??= crypto.randomUUID()
    const saleId = newSaleId.current
    if (await persist({ ...payload, id: saleId, revision: 0, status: 'aprovado' })) {
      // A condição de pagamento e a troca sao gravadas depois: save_sale_atomic
      // e dona do estoque e do total, e nao foi estendida para nao arriscar
      // suas defesas.
      if (formAPrazo) {
        try {
          const atualizada = await setSalePaymentTerms(storeId, saleId, {
            payment_type: 'aprazo',
            valor_pago: Number(formEntrada.replace(',', '.')) || 0,
            vencimento: formVencimento || null,
          })
          setSalesRaw(prev => prev.map(s => s.id === atualizada.id ? atualizada : s))
        } catch {
          setError('A venda foi registrada, mas não foi possível marcá-la como a prazo. Ajuste pela tela de Devedores.')
        }
      }
      if (formTemTroca && Number(formTrocaValor.replace(',', '.')) > 0) {
        try {
          const comTroca = await setSaleTradeIn(
            storeId, saleId, formTrocaAparelho.trim(),
            Number(formTrocaValor.replace(',', '.')),
          )
          setSalesRaw(prev => prev.map(s => s.id === comTroca.id ? comTroca : s))
        } catch (e) {
          setError(e instanceof Error
            ? `A venda foi registrada, mas a troca não: ${e.message}`
            : 'A venda foi registrada, mas não foi possível gravar a troca.')
        }
      }
      newSaleId.current = null
      setShowForm(false)
      setFormProduct(''); setFormQty('1'); setFormCustomer('')
      setFormAPrazo(false); setFormEntrada(''); setFormVencimento('')
      setFormTemTroca(false); setFormTrocaAparelho(''); setFormTrocaValor('')
    }
  }

  const changeStatus = async (id: string, status: NonNullable<Sale['status']>) => {
    const sale = rawSales.find(s => s.id === id)
    if (!sale) return
    if (status === 'cancelado') { setPendingCancellation(sale); return }
    await persist({ ...sale, status })
  }

  const statusColors = {
    historico: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    aprovado: 'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/30',
    pendente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  const paymentColors: Record<string, string> = {
    pix: 'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/30',
    dinheiro: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    cartao_debito: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    cartao_credito: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }

  const inputCls = 'w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 transition-all'

  if (!_loaded) return <p role="status" className="p-6 text-zinc-300">Carregando vendas e estoque...</p>

  return (
    <div className="space-y-6 max-w-7xl">
      {pendingCancellation && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
        <section role="dialog" aria-modal="true" aria-labelledby="cancel-sale-title" className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#141414] p-6">
          <h2 id="cancel-sale-title" className="text-lg font-semibold">Cancelar venda?</h2>
          <p className="my-4 text-sm text-zinc-300">Os itens voltarão ao estoque e o histórico será preservado.</p>
          <div className="flex gap-3">
            <button autoFocus disabled={busy} onClick={()=>setPendingCancellation(null)} className="flex-1 rounded-xl border border-white/20 px-3 py-3">Manter venda</button>
            <button disabled={busy} onClick={async()=>{if(await persist({...pendingCancellation,status:'cancelado'}))setPendingCancellation(null)}} className="flex-1 rounded-xl bg-red-600 px-3 py-3 text-white">{busy ? 'Salvando...' : 'Confirmar cancelamento'}</button>
          </div>
        </section>
      </div>}
      {_error && <p role="alert" className="text-red-300">Não foi possível atualizar os dados. Recarregue a página antes de continuar.</p>}
      {recovery && <div role="status" className="rounded-xl border border-amber-400/40 bg-amber-950 p-4 text-sm text-amber-100">
        <p>Existe uma operação sem confirmação. Verifique a mesma operação antes de registrar outra venda.</p>
        <button disabled={busy} className="mt-3 min-h-11 rounded-lg bg-amber-100 px-4 font-semibold text-amber-950 disabled:opacity-50" onClick={async () => {
          if (await persist(recovery.sale, true)) {
            newSaleId.current = null
            setShowForm(false)
            setEditSale(null)
            setPendingCancellation(null)
            setFormProduct(''); setFormQty('1'); setFormCustomer('')
          }
        }}>{busy ? 'Verificando...' : 'Verificar operação pendente'}</button>
      </div>}
      {error && <div role="alert" className="fixed bottom-4 left-4 right-4 z-[70] rounded-xl border border-red-400 bg-red-950 p-4 text-sm text-white shadow-xl">{error}<button className="ml-4 underline" onClick={() => setError(null)}>Fechar</button></div>}
      {rawSales.some(s => !s.stock_managed) && <p className="text-sm text-amber-300">Vendas antigas estão disponíveis para consulta e fora dos totais por situação. A situação e o estoque desses registros precisam de conferência antes de permitir alterações.</p>}
      <p className="text-xs text-zinc-400">Vendas pendentes reservam estoque. Cancelar devolve os itens. A situação da venda não confirma o recebimento do pagamento.</p>
      {/* Header */}
      <div className="space-y-1">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-white transition-colors group">
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Voltar
        </button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Vendas</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{filtered.length} de {sales.length} registros</p>
          </div>
          <div className="flex items-center gap-2">
            {hasModule('RELATORIOS') && (
              <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] hover:bg-white/[0.04] active:scale-95 text-zinc-200 font-semibold rounded-xl transition-all text-sm">
                <Download size={16} /> Exportar CSV
              </button>
            )}
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] active:scale-95 text-black font-semibold rounded-xl transition-all text-sm">
              <Plus size={16} /> Registrar venda
            </button>
          </div>
        </div>
      </div>

      {/* Relatório mensal (plano Master) */}
      {hasModule('RELATORIOS') && (
        <div className="p-5 rounded-2xl bg-[#141414] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-[var(--accent)]" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Relatório mensal — últimos 6 meses</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {monthlyReport.map(m => (
              <div key={m.key} className="text-center">
                <p className="text-[10px] uppercase text-zinc-600">{m.label}</p>
                <p className="text-sm font-bold text-white mt-1">{formatCurrency(m.total)}</p>
                <p className="text-[10px] text-zinc-600">{m.count} venda{m.count === 1 ? '' : 's'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-2 p-5 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--accent)]" />
              <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">Vendas aprovadas</span>
            </div>
            <span className="text-xs text-zinc-600">{approved.length} vendas</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">{formatCurrency(totalRevenue)}</p>
          {pendingRevenue > 0 && <p className="text-xs text-yellow-400/70">+ {formatCurrency(pendingRevenue)} pendente</p>}
        </div>
        <div className="p-5 rounded-2xl bg-[#141414] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-[var(--accent)]" />
              <span className="text-xs font-semibold text-zinc-400">Meta do mês</span>
            </div>
            <button onClick={() => { setEditMeta(true); setMetaInput(String(meta)) }} className="text-[10px] text-zinc-600 hover:text-[var(--accent)] transition-colors">Editar</button>
          </div>
          {editMeta ? (
            <div className="flex gap-2">
              <input type="number" value={metaInput} onChange={e => setMetaInput(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40" />
              <button onClick={() => { setMeta(Number(metaInput) || meta); setEditMeta(false) }}
                className="px-3 py-1.5 bg-[var(--accent)] active:scale-90 text-black font-semibold rounded-lg text-xs">OK</button>
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-white">{metaPercent}%</p>
              <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500', metaPercent >= 100 ? 'bg-[var(--accent)]' : metaPercent >= 70 ? 'bg-[var(--accent)]' : 'bg-yellow-400')}
                  style={{ width: `${metaPercent}%` }} />
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">{formatCurrency(totalRevenue)} / {formatCurrency(meta)}</p>
            </>
          )}
        </div>
        <div className="p-5 rounded-2xl bg-[#141414] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-zinc-400">Ticket médio</span>
          </div>
          <p className="text-xl font-bold text-white">{approved.length > 0 ? formatCurrency(totalRevenue / approved.length) : 'R$ —'}</p>
          <p className="text-[10px] text-zinc-600 mt-1">Por venda aprovada</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, produto ou ID..."
          className="w-full bg-[#141414] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"><X size={13} /></button>}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-zinc-600 font-medium">Status:</span>
        {(['todos', 'aprovado', 'pendente', 'cancelado'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95',
              filterStatus === s ? 'bg-[var(--accent)] border-[var(--accent)] text-black' : 'bg-[#141414] border-white/[0.08] text-zinc-400 hover:text-white')}>
            {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <div className="w-px h-4 bg-white/[0.08]" />
        <span className="text-xs text-zinc-600 font-medium">Período:</span>
        {(['todos', 'hoje', 'semana', 'mes'] as const).map(d => (
          <button key={d} onClick={() => setFilterDate(d)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95',
              filterDate === d ? 'bg-blue-500 border-blue-500 text-white' : 'bg-[#141414] border-white/[0.08] text-zinc-400 hover:text-white')}>
            {d === 'todos' ? 'Todos' : d === 'hoje' ? 'Hoje' : d === 'semana' ? '7 dias' : 'Este mês'}
          </button>
        ))}
        <div className="w-px h-4 bg-white/[0.08]" />
        <div className="relative">
          <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
            className="bg-[#141414] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-zinc-400 focus:outline-none appearance-none pr-7">
            <option value="todos">Pagamento: Todos</option>
            {Object.entries(paymentMethodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
        </div>
        {(search || filterStatus !== 'todos' || filterDate !== 'todos' || filterPayment !== 'todos') && (
          <button onClick={() => { setSearch(''); setFilterStatus('todos'); setFilterDate('todos'); setFilterPayment('todos') }}
            className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 transition-colors">
            <X size={11} /> Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="space-y-3 sm:hidden">
        {filtered.map(sale=><article key={sale.id} className="rounded-2xl border border-white/10 bg-[#141414] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400" title={sale.id}>#{sale.id.slice(0,8).toUpperCase()}</span>
            <span className={cn('rounded-full border px-2 py-1 text-xs',statusColors[sale.saleStatus])}>{sale.saleStatus==='historico'?'A conferir':sale.saleStatus}</span>
          </div>
          <p className="mt-3 font-medium">{sale.items.map(i=>`${i.product_name} (${i.quantity}x)`).join(', ')}</p>
          <p className="mt-1 text-sm text-zinc-400">{sale.customer_name || 'Cliente não informado'}</p>
          <div className="my-3 flex justify-between gap-3"><strong className="text-[var(--accent)]">{formatCurrency(sale.total)}</strong><span className="text-sm text-zinc-300">{paymentMethodLabel[sale.payment_method]}</span></div>
          <p className="text-xs text-zinc-400">{formatDateTime(sale.created_at)}</p>
          {sale.stock_managed && <div className="mt-4 flex flex-wrap gap-2">
            <button disabled={busy} onClick={()=>openEdit(sale)} className="min-h-11 rounded-xl border border-white/20 px-4 text-sm">Editar venda</button>
            {sale.saleStatus==='pendente' && <button disabled={busy} onClick={()=>changeStatus(sale.id,'aprovado')} className="min-h-11 rounded-xl border border-green-500/40 px-4 text-sm text-green-300">Aprovar</button>}
            {sale.saleStatus!=='cancelado' && <button disabled={busy} onClick={()=>changeStatus(sale.id,'cancelado')} className="min-h-11 rounded-xl border border-red-500/40 px-4 text-sm text-red-300">Cancelar venda</button>}
          </div>}
        </article>)}
        {filtered.length===0 && <p className="p-6 text-center text-zinc-400">Nenhuma venda encontrada.</p>}
      </div>
      <div className="hidden sm:block rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['ID', 'Produto(s)', 'Cliente', 'Pagamento', 'Status', 'Total', 'Data', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map(sale => (
                <tr key={sale.id} className={cn('transition-colors group', sale.saleStatus === 'cancelado' ? 'opacity-50' : 'hover:bg-white/[0.02]')}>
                  <td className="px-4 py-3 text-xs font-mono text-zinc-500">{sale.id}</td>
                  <td className="px-4 py-3 text-sm text-white max-w-[180px] truncate">{sale.items.map(i => `${i.product_name} (${i.quantity}x)`).join(', ')}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{sale.customer_name || <span className="text-zinc-700">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full border', paymentColors[sale.payment_method] ?? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30')}>
                      {paymentMethodLabel[sale.payment_method]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full border', statusColors[sale.saleStatus])}>
                        {sale.saleStatus === 'historico' ? 'A conferir' : sale.saleStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-[var(--accent)]">{formatCurrency(sale.total)}</td>
                  <td className="px-4 py-3 text-xs text-zinc-600 whitespace-nowrap">{formatDateTime(sale.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Editar */}
                      <button disabled={busy || !sale.stock_managed} onClick={() => openEdit(sale)} title="Editar venda"
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-blue-400 hover:bg-blue-500/10 active:scale-90 transition-all">
                        <Edit2 size={13} />
                      </button>
                      {sale.saleStatus === 'pendente' && (
                        <button disabled={busy || !sale.stock_managed} onClick={() => changeStatus(sale.id, 'aprovado')} title="Aprovar"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 active:scale-90 transition-all">
                          <CheckCircle size={13} />
                        </button>
                      )}
                      {sale.saleStatus !== 'cancelado' && (
                        <button disabled={busy || !sale.stock_managed} onClick={() => changeStatus(sale.id, 'cancelado')} title="Cancelar"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/10 active:scale-90 transition-all">
                          <XCircle size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-zinc-600 text-sm">Nenhuma venda encontrada.</div>}
        </div>
      </div>

      {/* ═══════════ MODAL REGISTRAR VENDA ═══════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Registrar venda</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Produto *</label>
                <div className="relative">
                  <select value={formProduct} onChange={e => setFormProduct(e.target.value)}
                    className={inputCls + ' appearance-none'}>
                    <option value="">Selecionar produto...</option>
                    {storeProducts.filter(p => p.is_active && p.stock_qty > 0).map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.promo_price ?? p.price)}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Quantidade</label>
                  <input type="number" min="1" value={formQty} onChange={e => setFormQty(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Pagamento</label>
                  <div className="relative">
                    <select value={formPayment} onChange={e => setFormPayment(e.target.value as PaymentMethod)}
                      className={inputCls + ' appearance-none'}>
                      {Object.entries(paymentMethodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
              </div>
              {hasModule('FINANCEIRO') && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={formTemTroca}
                      onChange={e => setFormTemTroca(e.target.checked)}
                      className="accent-[var(--accent)]" />
                    <span className="text-sm text-zinc-300">Recebeu aparelho na troca</span>
                  </label>
                  {formTemTroca && (() => {
                    const prod = storeProducts.find(p => p.id === formProduct)
                    const totalVenda = prod ? (prod.promo_price ?? prod.price) * (Number(formQty) || 1) : 0
                    const avaliacao = Number(formTrocaValor.replace(',', '.')) || 0
                    const diferenca = totalVenda - avaliacao
                    return (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Aparelho recebido</label>
                          <input value={formTrocaAparelho}
                            onChange={e => setFormTrocaAparelho(e.target.value)}
                            placeholder="Ex: iPhone 11 128GB" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Valor avaliado (R$)</label>
                          <input type="number" step="0.01" min="0" value={formTrocaValor}
                            onChange={e => setFormTrocaValor(e.target.value)}
                            placeholder="0,00" className={inputCls} />
                        </div>
                        {avaliacao > 0 && prod && (
                          <div className={cn('rounded-lg px-3 py-2 text-sm border',
                            diferenca >= 0
                              ? 'border-[var(--accent)]/30 bg-[var(--accent)]/[0.08] text-[var(--accent)]'
                              : 'border-orange-500/30 bg-orange-500/[0.08] text-orange-300')}>
                            {diferenca >= 0
                              ? <>Cliente ainda paga <strong>{formatCurrency(diferenca)}</strong></>
                              : <>Troco para o cliente: <strong>{formatCurrency(-diferenca)}</strong></>}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  <div className="pt-3 border-t border-white/[0.06]" />

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={formAPrazo}
                      onChange={e => setFormAPrazo(e.target.checked)}
                      className="accent-[var(--accent)]" />
                    <span className="text-sm text-zinc-300">Venda a prazo (fiado)</span>
                  </label>
                  {formAPrazo && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Entrada (R$)</label>
                        <input type="number" step="0.01" min="0" value={formEntrada}
                          onChange={e => setFormEntrada(e.target.value)} placeholder="0,00"
                          className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Vencimento</label>
                        <input type="date" value={formVencimento}
                          onChange={e => setFormVencimento(e.target.value)}
                          className={inputCls} />
                      </div>
                      <p className="col-span-2 text-[10px] text-zinc-600">
                        O saldo em aberto aparece na tela Devedores até ser quitado.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cliente (opcional)</label>
                <input value={formCustomer} onChange={e => setFormCustomer(e.target.value)} placeholder="Nome do cliente"
                  className={inputCls} />
              </div>
              {formProduct && (() => {
                const p = storeProducts.find(x => x.id === formProduct)
                return p ? (
                  <div className="p-3 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-sm">
                    <p className="text-zinc-400">Total: <span className="text-[var(--accent)] font-bold">
                      {formatCurrency((p.promo_price ?? p.price) * (Number(formQty) || 1))}
                    </span></p>
                  </div>
                ) : null
              })()}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] active:scale-95 transition-all">Cancelar</button>
              <button onClick={handleRegister} disabled={!formProduct || busy} className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] active:scale-95 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all">{busy ? 'Salvando...' : 'Registrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL EDITAR VENDA ═══════════ */}
      {editSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-white">Editar venda</h3>
                <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">{editSale.id} · {formatDateTime(editSale.created_at)}</p>
              </div>
              <button onClick={() => setEditSale(null)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] active:scale-90"><X size={16} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Itens da venda */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Package size={13} className="text-[var(--accent)]" /> Itens da venda
                  </label>
                  <span className="text-[10px] text-zinc-600">{editItems.length} produto{editItems.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="space-y-2">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_70px_90px_32px] gap-2 items-center bg-[#1a1a1a] border border-white/[0.06] rounded-xl px-3 py-2.5">
                      <input
                        value={item.product_name}
                        onChange={e => updateItem(idx, 'product_name', e.target.value)}
                        className="bg-transparent text-sm text-white focus:outline-none min-w-0 truncate"
                        placeholder="Produto"
                      />
                      <input
                        type="number" min="1"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                        className="bg-transparent text-sm text-zinc-300 text-center focus:outline-none w-full"
                        title="Quantidade"
                      />
                      <input
                        type="number" min="0" step="0.01"
                        value={item.unit_price}
                        onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                        className="bg-transparent text-sm text-[var(--accent)] font-bold text-right focus:outline-none w-full"
                        title="Preço unitário"
                      />
                      <button onClick={() => removeItem(idx)}
                        className="p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Legenda das colunas */}
                {editItems.length > 0 && (
                  <div className="grid grid-cols-[1fr_70px_90px_32px] gap-2 px-3 mt-1">
                    <span className="text-[9px] text-zinc-700">Produto</span>
                    <span className="text-[9px] text-zinc-700 text-center">Qtd</span>
                    <span className="text-[9px] text-zinc-700 text-right">Preço unit.</span>
                  </div>
                )}

                {/* Adicionar produto */}
                <div className="flex gap-2 mt-3">
                  <div className="relative flex-1">
                    <select value={addProductId} onChange={e => setAddProductId(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:border-[var(--accent)]/40 appearance-none">
                      <option value="">+ Adicionar produto do estoque...</option>
                      {storeProducts.filter(p => p.is_active).map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.promo_price ?? p.price)}</option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                  <button
                    onClick={addItemFromProduct}
                    disabled={!addProductId}
                    className="px-3 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-[var(--accent)] rounded-xl text-xs font-medium hover:bg-[var(--accent)]/20 disabled:opacity-40 active:scale-90 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Desconto */}
              <div className="rounded-xl bg-[#1a1a1a] border border-white/[0.06] p-4 space-y-3">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Percent size={13} className="text-yellow-400" /> Desconto / Ajuste de valor
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-600 mb-1">Desconto (%)</label>
                    <div className="relative">
                      <input
                        type="number" min="0" max="100" step="1"
                        value={editDiscount}
                        onChange={e => { setEditDiscount(e.target.value); setEditTotalOverride('') }}
                        placeholder="0"
                        className={inputCls + ' pr-7'}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-600 mb-1">Total manual (R$)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={editTotalOverride}
                      onChange={e => { setEditTotalOverride(e.target.value); setEditDiscount('0') }}
                      placeholder={String(editSubtotal - discountAmt)}
                      className={inputCls}
                    />
                  </div>
                </div>
                {/* Resumo */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <div className="text-xs text-zinc-500 space-y-0.5">
                    <p>Subtotal: <span className="text-white">{formatCurrency(editSubtotal)}</span></p>
                    {discountPct > 0 && <p className="text-yellow-400">Desconto {discountPct}%: − {formatCurrency(discountAmt)}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-600">Total final</p>
                    <p className="text-xl font-black text-[var(--accent)]">{formatCurrency(editTotal)}</p>
                  </div>
                </div>
              </div>

              {/* Cliente e Pagamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cliente</label>
                  <input value={editCustomer} onChange={e => setEditCustomer(e.target.value)} placeholder="Nome do cliente"
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Pagamento</label>
                  <div className="relative">
                    <select value={editPayment} onChange={e => setEditPayment(e.target.value as PaymentMethod)}
                      className={inputCls + ' appearance-none'}>
                      {Object.entries(paymentMethodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Tag size={12} className="text-zinc-500" /> Status da venda
                </label>
                <div className="flex gap-2">
                  {(['aprovado', 'pendente', 'cancelado'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setEditStatus(s)}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95',
                        editStatus === s ? statusColors[s] : 'bg-[#1a1a1a] border-white/[0.08] text-zinc-500 hover:text-white'
                      )}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
              <button onClick={() => setEditSale(null)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] active:scale-95 transition-all">Cancelar</button>
              <button
                onClick={saveEdit}
                disabled={editItems.length === 0 || busy}
                className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] active:scale-95 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all"
              >
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
