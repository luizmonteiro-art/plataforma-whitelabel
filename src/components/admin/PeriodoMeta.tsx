'use client'

/**
 * PeriodoMeta — cabeçalho financeiro do dashboard.
 *
 * Mostra o resultado do período aberto: receita, lucro, despesas e o progresso
 * da meta. Fechar um período só muda a janela de leitura — nenhuma venda ou
 * despesa é movida ou apagada.
 */

import { useState, useEffect } from 'react'
import { Target, TrendingUp, TrendingDown, Wallet, Check, Pencil } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { useAdminStore, usePeriods, useExpenses, usePlan } from '@/contexts/AdminStore'
import { ensureActivePeriod, setPeriodMeta, closePeriod } from '@/lib/db'
import {
  getActivePeriod, filterSalesByPeriod, filterExpensesByPeriod,
  calcPeriodMetrics, progressoMeta,
} from '@/lib/period'

function formatarData(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function PeriodoMeta() {
  const { storeId, sales, products } = useAdminStore()
  const { hasModule } = usePlan()
  const [periods, setPeriods] = usePeriods()
  const [expenses] = useExpenses()
  const [editandoMeta, setEditandoMeta] = useState(false)
  const [metaInput, setMetaInput] = useState('')
  const [salvando, setSalvando] = useState(false)

  const ativo = getActivePeriod(periods)

  // A loja pode nunca ter aberto um período; cria o primeiro sem pedir nada.
  useEffect(() => {
    if (!hasModule('FINANCEIRO') || ativo) return
    let cancelado = false
    ensureActivePeriod(storeId)
      .then(p => { if (p && !cancelado) setPeriods(prev => [p, ...prev]) })
      .catch(() => {})
    return () => { cancelado = true }
  }, [hasModule, ativo, storeId, setPeriods])

  if (!hasModule('FINANCEIRO')) return null

  const vendasDoPeriodo = filterSalesByPeriod(sales, ativo)
  const despesasDoPeriodo = filterExpensesByPeriod(expenses, ativo)
  const m = calcPeriodMetrics(vendasDoPeriodo, products, despesasDoPeriodo)
  const meta = ativo?.meta_valor ?? 0
  const progresso = progressoMeta(m.receita, meta)

  const salvarMeta = async () => {
    if (!ativo) return
    const valor = Number(metaInput.replace(',', '.'))
    if (Number.isNaN(valor) || valor < 0) { alert('Informe um valor de meta válido.'); return }
    setSalvando(true)
    try {
      const atualizado = await setPeriodMeta(storeId, ativo.id, valor)
      setPeriods(prev => prev.map(p => p.id === atualizado.id ? atualizado : p))
      setEditandoMeta(false)
    } catch {
      alert('Não foi possível salvar a meta. Verifique sua conexão e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const fechar = async () => {
    if (!ativo) return
    if (!confirm('Fechar este período e começar um novo?\n\nNenhuma venda ou despesa é apagada — muda só o intervalo que o painel mostra.')) return
    try {
      const novo = await closePeriod(storeId, ativo.id)
      setPeriods(prev => [novo, ...prev.map(p => p.id === ativo.id ? { ...p, ended_at: novo.started_at } : p)])
    } catch {
      alert('Não foi possível fechar o período. Verifique sua conexão e tente novamente.')
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">Período atual</p>
          <p className="text-sm text-white font-medium">
            {ativo ? `Desde ${formatarData(ativo.started_at)}` : 'Abrindo período...'}
          </p>
        </div>
        {ativo && (
          <button onClick={fechar} className="text-xs px-3 py-1.5 rounded-full border border-white/[0.1] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition">
            Fechar período
          </button>
        )}
      </div>

      <div className={cn('grid gap-4', m.temCusto ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3')}>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={13} className="text-[var(--accent)]" />
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">Receita</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(m.receita)}</p>
          <p className="text-[11px] text-zinc-600">{m.vendas} venda(s)</p>
        </div>

        {m.temCusto && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet size={13} className="text-emerald-400" />
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">Lucro bruto</span>
            </div>
            <p className="text-xl font-bold text-white">{formatCurrency(m.lucro)}</p>
          </div>
        )}

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={13} className="text-red-400" />
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">Despesas</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(m.despesas)}</p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Check size={13} className={m.resultado >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">Resultado</span>
          </div>
          <p className={cn('text-xl font-bold', m.resultado >= 0 ? 'text-white' : 'text-red-400')}>
            {formatCurrency(m.resultado)}
          </p>
          {!m.temCusto && (
            <p className="text-[11px] text-zinc-600">preencha o custo dos produtos</p>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <Target size={13} className="text-[var(--accent)]" />
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">Meta do período</span>
          </div>
          {!editandoMeta ? (
            <button
              onClick={() => { setMetaInput(meta ? String(meta) : ''); setEditandoMeta(true) }}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition"
            >
              <Pencil size={11} /> {meta > 0 ? 'Alterar' : 'Definir'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number" step="0.01" min="0" autoFocus
                value={metaInput}
                onChange={e => setMetaInput(e.target.value)}
                placeholder="0,00"
                className="w-32 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-[var(--accent)]"
              />
              <button onClick={salvarMeta} disabled={salvando}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-black text-xs font-semibold disabled:opacity-50">
                {salvando ? '...' : 'Salvar'}
              </button>
              <button onClick={() => setEditandoMeta(false)} className="text-xs text-zinc-500 hover:text-white">
                Cancelar
              </button>
            </div>
          )}
        </div>

        {meta > 0 ? (
          <>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${progresso * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px]">
              <span className="text-zinc-500">{Math.round(progresso * 100)}% da meta</span>
              <span className="text-zinc-500">
                {formatCurrency(m.receita)} de {formatCurrency(meta)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-zinc-600">
            Sem meta definida. Defina um valor para acompanhar o quanto falta no período.
          </p>
        )}
      </div>
    </div>
  )
}
