'use client'

import { useState } from 'react'
import { Wallet, AlertTriangle, Users, X, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, cn } from '@/lib/utils'
import { useSales, useAdminStore, useLoaded } from '@/contexts/AdminStore'
import { registerSalePayment } from '@/lib/db'
import { calcSaldoDevedor, isVencido } from '@/lib/period'
import type { Sale } from '@/types'

function formatarData(iso?: string | null): string {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function DevedoresClient() {
  const router = useRouter()
  const { storeId } = useAdminStore()
  const loaded = useLoaded()
  const [sales, setSales] = useSales()
  const [cobrando, setCobrando] = useState<Sale | null>(null)
  const [valor, setValor] = useState('')
  const [salvando, setSalvando] = useState(false)

  // De propósito SEM filtro de período: uma dívida não desaparece quando um
  // período novo começa — só quando é paga.
  const devedores = sales
    .filter(s => s.status !== 'cancelado' && calcSaldoDevedor(s) > 0)
    .sort((a, b) => {
      if (a.vencimento && b.vencimento) return a.vencimento.localeCompare(b.vencimento)
      if (a.vencimento) return -1
      if (b.vencimento) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const totalAberto = devedores.reduce((a, s) => a + calcSaldoDevedor(s), 0)
  const vencidos = devedores.filter(isVencido)
  const totalVencido = vencidos.reduce((a, s) => a + calcSaldoDevedor(s), 0)

  const abrirCobranca = (s: Sale) => { setCobrando(s); setValor('') }

  const confirmarPagamento = async () => {
    if (!cobrando) return
    const saldo = calcSaldoDevedor(cobrando)
    const v = Math.min(saldo, Number(valor.replace(',', '.')) || 0)
    if (v <= 0) { alert('Informe um valor maior que zero.'); return }
    setSalvando(true)
    try {
      const atualizada = await registerSalePayment(storeId, cobrando.id, v)
      setSales(prev => prev.map(s => s.id === atualizada.id ? atualizada : s))
      setCobrando(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível registrar o pagamento.')
    } finally {
      setSalvando(false)
    }
  }

  if (!loaded) {
    return <div className="h-40 rounded-2xl bg-white/[0.04] animate-pulse" />
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="space-y-1">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft size={12} /> Voltar
        </button>
        <h1 className="text-2xl font-bold text-white">Devedores</h1>
        <p className="text-sm text-zinc-500">
          Vendas a prazo com saldo em aberto. Não reseta quando um período novo começa.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={15} className="text-yellow-400" />
            <span className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">Total em aberto</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalAberto)}</p>
        </div>
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-red-400" />
            <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Vencido</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalVencido)}</p>
          <p className="text-xs text-zinc-500 mt-1">{vencidos.length} venda(s)</p>
        </div>
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <div className="flex items-center gap-2 mb-2">
            <Users size={15} className="text-zinc-400" />
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Devedores</span>
          </div>
          <p className="text-2xl font-bold text-white">{devedores.length}</p>
        </div>
      </div>

      {devedores.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <Wallet size={32} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-medium">Ninguém devendo.</p>
          <p className="text-sm text-zinc-600 mt-1">Vendas marcadas como &quot;a prazo&quot; aparecem aqui até serem quitadas.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-zinc-400">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Cliente</th>
                  <th className="text-left font-medium px-4 py-3">Venda</th>
                  <th className="text-left font-medium px-4 py-3">Vencimento</th>
                  <th className="text-right font-medium px-4 py-3">Total</th>
                  <th className="text-right font-medium px-4 py-3">Pago</th>
                  <th className="text-right font-medium px-4 py-3">Saldo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {devedores.map(s => {
                  const saldo = calcSaldoDevedor(s)
                  const atrasado = isVencido(s)
                  return (
                    <tr key={s.id} className="border-t border-white/[0.06] hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white font-medium">{s.customer_name || 'Sem nome'}</td>
                      <td className="px-4 py-3 text-zinc-500">{formatarData(s.created_at)}</td>
                      <td className={cn('px-4 py-3', atrasado ? 'text-red-400 font-medium' : 'text-zinc-400')}>
                        {formatarData(s.vencimento)}
                        {atrasado && <span className="ml-2 text-[10px] uppercase tracking-wide">atrasado</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400">{formatCurrency(s.total)}</td>
                      <td className="px-4 py-3 text-right text-zinc-400">{formatCurrency(s.valor_pago ?? 0)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-white">{formatCurrency(saldo)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => abrirCobranca(s)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-black hover:opacity-90 active:scale-95 transition"
                        >
                          Receber
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cobrando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.1] bg-[#0f0f0f] p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Receber pagamento</h2>
                <p className="text-sm text-zinc-500">{cobrando.customer_name || 'Sem nome'}</p>
              </div>
              <button onClick={() => setCobrando(null)} className="text-zinc-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Saldo devedor</span>
                <span className="font-semibold text-white">{formatCurrency(calcSaldoDevedor(cobrando))}</span>
              </div>
            </div>

            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Valor recebido</label>
            <input
              type="number" step="0.01" min="0" autoFocus
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-lg focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={() => setValor(String(calcSaldoDevedor(cobrando)))}
              className="mt-2 text-xs text-[var(--accent)] hover:underline"
            >
              Quitar tudo
            </button>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setCobrando(null)} className="flex-1 py-3 rounded-xl border border-white/[0.1] text-zinc-400 hover:bg-white/[0.04]">
                Cancelar
              </button>
              <button
                onClick={confirmarPagamento}
                disabled={salvando}
                className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-black font-semibold hover:opacity-90 disabled:opacity-50 active:scale-95 transition"
              >
                {salvando ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
