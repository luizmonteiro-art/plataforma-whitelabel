'use client'

/**
 * CarrinhoDrawer — revisão do pedido e envio pelo WhatsApp.
 *
 * O pedido NÃO é gravado: o destino é uma mensagem organizada no WhatsApp da
 * loja. Os campos existem para o lojista não precisar perguntar o básico
 * (quem é, como paga, entrega ou retira) numa ida e volta de mensagens.
 */

import { useState } from 'react'
import Image from 'next/image'
import { X, ShoppingBag, Plus, Minus, Trash2, MessageCircle } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { useCarrinho } from '@/contexts/Carrinho'
import type { Brand } from '@/lib/brand'

type Entrega = 'retirada' | 'entrega'
const PAGAMENTOS = ['Pix', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro', 'A combinar'] as const

export function CarrinhoDrawer({ brand }: { brand: Brand }) {
  const carrinho = useCarrinho()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [entrega, setEntrega] = useState<Entrega>('retirada')
  const [endereco, setEndereco] = useState('')
  const [pagamento, setPagamento] = useState<string>(PAGAMENTOS[0])
  const [observacoes, setObservacoes] = useState('')

  if (!carrinho || !carrinho.aberto) return null
  const { itens, valorTotal, alterarQuantidade, remover, fechar, limpar } = carrinho

  const montarMensagem = () => {
    const linhas: string[] = []
    linhas.push(`*Novo pedido — ${brand.name}*`, '')
    itens.forEach((i, idx) => {
      linhas.push(`${idx + 1}. ${i.nome}`)
      linhas.push(`   ${i.quantidade}x ${formatCurrency(i.preco)} = ${formatCurrency(i.preco * i.quantidade)}`)
    })
    linhas.push('', `*Total: ${formatCurrency(valorTotal)}*`, '')
    linhas.push(`*Cliente:* ${nome.trim()}`)
    if (telefone.trim()) linhas.push(`*Telefone:* ${telefone.trim()}`)
    linhas.push(`*Forma de pagamento:* ${pagamento}`)
    linhas.push(`*Entrega:* ${entrega === 'entrega' ? 'Entregar no endereço' : 'Retirar na loja'}`)
    if (entrega === 'entrega' && endereco.trim()) linhas.push(`*Endereço:* ${endereco.trim()}`)
    if (observacoes.trim()) linhas.push('', `*Observações:* ${observacoes.trim()}`)
    return linhas.join('\n')
  }

  const enviar = () => {
    if (!nome.trim()) { alert('Informe seu nome para o lojista saber com quem falar.'); return }
    if (entrega === 'entrega' && !endereco.trim()) {
      alert('Informe o endereço de entrega.'); return
    }
    if (!brand.whatsapp) { alert('Esta loja ainda não cadastrou um WhatsApp para receber pedidos.'); return }
    window.open(`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(montarMensagem())}`, '_blank')
  }

  const campo = 'w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent)]'

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button aria-label="Fechar carrinho" onClick={fechar} className="absolute inset-0 bg-black/70" />

      <aside className="relative w-full max-w-md h-full bg-[#0d0d0d] border-l border-white/[0.08] flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[var(--accent)]" />
            <h2 className="font-semibold text-white">Meu pedido</h2>
          </div>
          <button onClick={fechar} className="text-zinc-500 hover:text-white p-1" aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        {itens.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag size={36} className="text-zinc-700" />
            <p className="text-zinc-400 font-medium">Seu pedido está vazio.</p>
            <p className="text-sm text-zinc-600">Escolha os produtos e eles aparecem aqui.</p>
            <button onClick={fechar} className="mt-2 px-5 py-2.5 rounded-full bg-[var(--accent)] text-black text-sm font-semibold">
              Ver produtos
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {itens.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-[#161616]">
                    {item.imagem
                      ? <Image src={item.imagem} alt={item.nome} fill sizes="64px" className="object-cover" />
                      : <div className="w-full h-full grid place-items-center text-zinc-700"><ShoppingBag size={18} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-snug line-clamp-2">{item.nome}</p>
                    <p className="text-sm font-semibold text-[var(--accent)] mt-0.5">{formatCurrency(item.preco)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                        className="w-7 h-7 grid place-items-center rounded-lg border border-white/[0.12] text-zinc-300 hover:bg-white/[0.06]"
                        aria-label="Diminuir"><Minus size={13} /></button>
                      <span className="w-7 text-center text-sm text-white">{item.quantidade}</span>
                      <button onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                        className="w-7 h-7 grid place-items-center rounded-lg border border-white/[0.12] text-zinc-300 hover:bg-white/[0.06]"
                        aria-label="Aumentar"><Plus size={13} /></button>
                      <button onClick={() => remover(item.id)}
                        className="ml-auto text-zinc-600 hover:text-red-400" aria-label="Remover">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">Seus dados</p>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome *" className={campo} />
                <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Seu telefone" inputMode="tel" className={campo} />

                <div className="grid grid-cols-2 gap-2">
                  {(['retirada', 'entrega'] as Entrega[]).map(op => (
                    <button key={op} onClick={() => setEntrega(op)}
                      className={cn('py-2.5 rounded-xl text-sm border transition',
                        entrega === op
                          ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]'
                          : 'border-white/[0.1] text-zinc-400 hover:text-white')}>
                      {op === 'retirada' ? 'Retirar na loja' : 'Entrega'}
                    </button>
                  ))}
                </div>
                {entrega === 'entrega' && (
                  <input value={endereco} onChange={e => setEndereco(e.target.value)}
                    placeholder="Endereço de entrega *" className={campo} />
                )}

                <select value={pagamento} onChange={e => setPagamento(e.target.value)} className={campo}>
                  {PAGAMENTOS.map(p => <option key={p} value={p} className="bg-[#0d0d0d]">{p}</option>)}
                </select>

                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2}
                  placeholder="Observações (cor, detalhe, dúvida…)" className={cn(campo, 'resize-none')} />
              </div>
            </div>

            <footer className="px-5 py-4 border-t border-white/[0.08] space-y-3 bg-[#0d0d0d]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Total</span>
                <span className="text-xl font-bold text-white">{formatCurrency(valorTotal)}</span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                O pedido é enviado pelo WhatsApp da loja. O pagamento e a entrega são combinados direto com o lojista.
              </p>
              <button onClick={enviar}
                className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-black font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition">
                <MessageCircle size={17} /> Enviar pedido no WhatsApp
              </button>
              <button onClick={() => { if (confirm('Esvaziar o pedido?')) limpar() }}
                className="w-full text-xs text-zinc-600 hover:text-zinc-400">
                Esvaziar pedido
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
