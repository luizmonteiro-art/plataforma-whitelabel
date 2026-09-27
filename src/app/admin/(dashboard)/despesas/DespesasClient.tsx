'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, X, ArrowLeft, TrendingDown, Receipt, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, cn } from '@/lib/utils'
import { useExpenses, useAdminStore, useLoaded } from '@/contexts/AdminStore'
import { upsertExpense, deleteExpense } from '@/lib/db'
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types'

const CATEGORIAS: { id: ExpenseCategory; label: string }[] = [
  { id: 'aluguel', label: 'Aluguel' },
  { id: 'fornecedor', label: 'Fornecedor' },
  { id: 'peca', label: 'Peça' },
  { id: 'salario', label: 'Salário' },
  { id: 'imposto', label: 'Imposto' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'contas', label: 'Contas (luz, água, internet)' },
  { id: 'outros', label: 'Outros' },
]

const PAGAMENTOS: { id: PaymentMethod; label: string }[] = [
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'pix', label: 'Pix' },
  { id: 'cartao_debito', label: 'Cartão de débito' },
  { id: 'cartao_credito', label: 'Cartão de crédito' },
]

const hoje = () => new Date().toISOString().slice(0, 10)

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

const formVazio = {
  description: '', amount: '', category: 'outros' as ExpenseCategory,
  payment_method: 'dinheiro' as PaymentMethod, date: hoje(), notes: '', affects_cash: true,
}

export function DespesasClient() {
  const router = useRouter()
  const { storeId } = useAdminStore()
  const loaded = useLoaded()
  const [expenses, setExpenses] = useExpenses()
  const [form, setForm] = useState(formVazio)
  const [editando, setEditando] = useState<Expense | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<ExpenseCategory | 'todas'>('todas')

  const filtradas = useMemo(
    () => filtroCategoria === 'todas' ? expenses : expenses.filter(e => e.category === filtroCategoria),
    [expenses, filtroCategoria],
  )

  const totalMes = useMemo(() => {
    const prefixo = hoje().slice(0, 7)
    return expenses
      .filter(e => e.date.startsWith(prefixo) && e.affects_cash)
      .reduce((a, e) => a + e.amount, 0)
  }, [expenses])

  const totalFiltrado = filtradas.reduce((a, e) => a + e.amount, 0)

  const abrirNova = () => { setEditando(null); setForm(formVazio); setMostrarForm(true) }

  const abrirEdicao = (e: Expense) => {
    setEditando(e)
    setForm({
      description: e.description, amount: String(e.amount), category: e.category,
      payment_method: e.payment_method, date: e.date.slice(0, 10),
      notes: e.notes ?? '', affects_cash: e.affects_cash,
    })
    setMostrarForm(true)
  }

  const salvar = async () => {
    const valor = Number(form.amount.replace(',', '.'))
    if (!form.description.trim()) { alert('Descreva a despesa.'); return }
    if (!valor || valor <= 0) { alert('Informe um valor maior que zero.'); return }
    setSalvando(true)
    try {
      const salva = await upsertExpense(storeId, {
        ...(editando ? { id: editando.id } : {}),
        description: form.description.trim(),
        amount: Number(valor.toFixed(2)),
        category: form.category,
        payment_method: form.payment_method,
        date: form.date,
        notes: form.notes.trim(),
        affects_cash: form.affects_cash,
      })
      setExpenses(prev => editando
        ? prev.map(e => e.id === salva.id ? salva : e)
        : [salva, ...prev])
      setMostrarForm(false)
      setForm(formVazio)
      setEditando(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível salvar a despesa.')
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (e: Expense) => {
    if (!confirm(`Excluir a despesa "${e.description}"?`)) return
    try {
      await deleteExpense(storeId, e.id)
      setExpenses(prev => prev.filter(x => x.id !== e.id))
    } catch {
      alert('Não foi possível excluir. Verifique sua conexão e tente novamente.')
    }
  }

  if (!loaded) {
    return <div className="h-40 rounded-2xl bg-white/[0.04] animate-pulse" />
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={12} /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">Despesas</h1>
          <p className="text-sm text-zinc-500">Tudo que sai do caixa da loja.</p>
        </div>
        <button
          onClick={abrirNova}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--accent)] text-black font-semibold text-sm hover:opacity-90 active:scale-95 transition"
        >
          <Plus size={16} /> Nova despesa
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={15} className="text-red-400" />
            <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Saiu do caixa este mês</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalMes)}</p>
        </div>
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={15} className="text-zinc-400" />
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              {filtroCategoria === 'todas' ? 'Total lançado' : 'Total do filtro'}
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalFiltrado)}</p>
          <p className="text-xs text-zinc-500 mt-1">{filtradas.length} lançamento(s)</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-zinc-600" />
        <button
          onClick={() => setFiltroCategoria('todas')}
          className={cn('px-3 py-1.5 rounded-full text-xs border transition',
            filtroCategoria === 'todas'
              ? 'bg-[var(--accent)]/15 border-[var(--accent)]/40 text-[var(--accent)]'
              : 'border-white/[0.1] text-zinc-500 hover:text-white')}
        >
          Todas
        </button>
        {CATEGORIAS.map(c => (
          <button
            key={c.id}
            onClick={() => setFiltroCategoria(c.id)}
            className={cn('px-3 py-1.5 rounded-full text-xs border transition',
              filtroCategoria === c.id
                ? 'bg-[var(--accent)]/15 border-[var(--accent)]/40 text-[var(--accent)]'
                : 'border-white/[0.1] text-zinc-500 hover:text-white')}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <Receipt size={32} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-medium">Nenhuma despesa lançada.</p>
          <p className="text-sm text-zinc-600 mt-1">Registre aluguel, peças e contas para saber o lucro real da loja.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-zinc-400">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Data</th>
                  <th className="text-left font-medium px-4 py-3">Descrição</th>
                  <th className="text-left font-medium px-4 py-3">Categoria</th>
                  <th className="text-left font-medium px-4 py-3">Pagamento</th>
                  <th className="text-right font-medium px-4 py-3">Valor</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(e => (
                  <tr key={e.id} className="border-t border-white/[0.06] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{formatarData(e.date)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => abrirEdicao(e)} className="text-white font-medium hover:text-[var(--accent)] text-left">
                        {e.description}
                      </button>
                      {!e.affects_cash && (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-zinc-600 border border-white/[0.1] rounded px-1.5 py-0.5">
                          não sai do caixa
                        </span>
                      )}
                      {e.notes && <p className="text-xs text-zinc-600 mt-0.5">{e.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {CATEGORIAS.find(c => c.id === e.category)?.label ?? e.category}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {PAGAMENTOS.find(p => p.id === e.payment_method)?.label ?? e.payment_method}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white whitespace-nowrap">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => excluir(e)} className="text-zinc-600 hover:text-red-400 transition">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.1] bg-[#0f0f0f] p-6 my-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                {editando ? 'Editar despesa' : 'Nova despesa'}
              </h2>
              <button onClick={() => setMostrarForm(false)} className="text-zinc-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Descrição</label>
                <input
                  autoFocus value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Aluguel de setembro"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Valor</label>
                  <input
                    type="number" step="0.01" min="0" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0,00"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Data</label>
                  <input
                    type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Categoria</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:border-[var(--accent)]"
                  >
                    {CATEGORIAS.map(c => <option key={c.id} value={c.id} className="bg-[#0f0f0f]">{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Pagamento</label>
                  <select
                    value={form.payment_method}
                    onChange={e => setForm(f => ({ ...f, payment_method: e.target.value as PaymentMethod }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white focus:outline-none focus:border-[var(--accent)]"
                  >
                    {PAGAMENTOS.map(p => <option key={p.id} value={p.id} className="bg-[#0f0f0f]">{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Observação (opcional)</label>
                <textarea
                  rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white resize-none focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] cursor-pointer">
                <input
                  type="checkbox" checked={form.affects_cash}
                  onChange={e => setForm(f => ({ ...f, affects_cash: e.target.checked }))}
                  className="mt-0.5 accent-[var(--accent)]"
                />
                <span className="text-sm text-zinc-300">
                  Sai do caixa
                  <span className="block text-xs text-zinc-600 mt-0.5">
                    Desmarque se for só registro e o dinheiro não saiu de fato — assim o lucro do período não é afetado.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setMostrarForm(false)} className="flex-1 py-3 rounded-xl border border-white/[0.1] text-zinc-400 hover:bg-white/[0.04]">
                Cancelar
              </button>
              <button
                onClick={salvar} disabled={salvando}
                className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-black font-semibold hover:opacity-90 disabled:opacity-50 active:scale-95 transition"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
