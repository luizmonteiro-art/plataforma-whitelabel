'use client'

import { useState } from 'react'
import { Plus, TrendingUp, X, ChevronDown } from 'lucide-react'
import { formatCurrency, formatDateTime, paymentMethodLabel, cn } from '@/lib/utils'
import type { Sale, PaymentMethod } from '@/types'
import { mockProducts } from '@/data/mock'

interface Props { initialSales: Sale[] }

export function VendasClient({ initialSales }: Props) {
  const [sales, setSales] = useState(initialSales)
  const [showForm, setShowForm] = useState(false)
  const [formProduct, setFormProduct] = useState('')
  const [formQty, setFormQty] = useState('1')
  const [formPayment, setFormPayment] = useState<PaymentMethod>('pix')
  const [formCustomer, setFormCustomer] = useState('')

  const totalRevenue = sales.reduce((a, s) => a + s.total, 0)

  const handleRegister = () => {
    const product = mockProducts.find(p => p.id === formProduct)
    if (!product) return
    const qty = Number(formQty) || 1
    const total = (product.promo_price ?? product.price) * qty
    const newSale: Sale = {
      id: `VD${String(Date.now()).slice(-4)}`,
      items: [{ product_id: product.id, product_name: product.name, quantity: qty, unit_price: product.promo_price ?? product.price }],
      total,
      payment_method: formPayment,
      customer_name: formCustomer || undefined,
      created_at: new Date().toISOString(),
    }
    setSales(prev => [newSale, ...prev])
    setShowForm(false)
    setFormProduct(''); setFormQty('1'); setFormCustomer('')
  }

  const paymentColors: Record<string, string> = {
    pix: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    dinheiro: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    cartao_debito: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    cartao_credito: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendas</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{sales.length} venda{sales.length !== 1 ? 's' : ''} registrada{sales.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-all text-sm"
        >
          <Plus size={16} /> Registrar venda
        </button>
      </div>

      {/* Revenue card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp size={18} className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Receita total</span>
        </div>
        <p className="text-3xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{sales.length} transações registradas</p>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#141414] border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['ID', 'Produto(s)', 'Cliente', 'Pagamento', 'Total', 'Data'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-zinc-500">{sale.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{sale.items.map(i => `${i.product_name} (${i.quantity}x)`).join(', ')}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{sale.customer_name || <span className="text-zinc-700">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full border', paymentColors[sale.payment_method] ?? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30')}>
                      {paymentMethodLabel[sale.payment_method]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-400">{formatCurrency(sale.total)}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{formatDateTime(sale.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && <div className="text-center py-12 text-zinc-600 text-sm">Nenhuma venda registrada.</div>}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#161616] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Registrar venda</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Produto *</label>
                <div className="relative">
                  <select value={formProduct} onChange={e => setFormProduct(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none">
                    <option value="">Selecionar produto...</option>
                    {mockProducts.filter(p => p.is_active && p.stock_qty > 0).map(p => (
                      <option key={p.id} value={p.id} className="bg-[#1a1a1a]">{p.name} — {formatCurrency(p.promo_price ?? p.price)}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Quantidade</label>
                  <input type="number" min="1" value={formQty} onChange={e => setFormQty(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Pagamento</label>
                  <div className="relative">
                    <select value={formPayment} onChange={e => setFormPayment(e.target.value as PaymentMethod)} className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none">
                      {Object.entries(paymentMethodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cliente (opcional)</label>
                <input value={formCustomer} onChange={e => setFormCustomer(e.target.value)} placeholder="Nome do cliente" className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500/40" />
              </div>
              {formProduct && (
                <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20 text-sm">
                  <p className="text-zinc-400">Total: <span className="text-green-400 font-bold">
                    {formatCurrency((mockProducts.find(p => p.id === formProduct)?.promo_price ?? mockProducts.find(p => p.id === formProduct)?.price ?? 0) * (Number(formQty) || 1))}
                  </span></p>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-white/[0.08] text-zinc-400 rounded-xl text-sm hover:bg-white/[0.04] transition-all">Cancelar</button>
              <button onClick={handleRegister} disabled={!formProduct} className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-all">Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
