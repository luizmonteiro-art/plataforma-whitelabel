'use client'

/**
 * Carrinho — lista de interesse do cliente na vitrine.
 *
 * Não é checkout: nada é gravado no banco e o estoque não se mexe. O carrinho
 * só junta os itens e os dados do cliente para montar UMA mensagem organizada
 * no WhatsApp. Quem registra a venda é o lojista, no painel.
 *
 * Fica no `localStorage` por loja, para o cliente não perder o que escolheu ao
 * navegar entre as páginas ou recarregar. Toda leitura e escrita é protegida:
 * em aba anônima ou com armazenamento bloqueado, o carrinho simplesmente vive
 * só na memória em vez de quebrar a vitrine.
 */

import {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
  type ReactNode,
} from 'react'

export interface ItemCarrinho {
  id: string
  nome: string
  preco: number
  imagem?: string
  quantidade: number
}

interface CarrinhoCtx {
  itens: ItemCarrinho[]
  quantidadeTotal: number
  valorTotal: number
  adicionar: (item: Omit<ItemCarrinho, 'quantidade'>, quantidade?: number) => void
  alterarQuantidade: (id: string, quantidade: number) => void
  remover: (id: string) => void
  limpar: () => void
  aberto: boolean
  abrir: () => void
  fechar: () => void
}

const Ctx = createContext<CarrinhoCtx | null>(null)

const chave = (storeId: string) => `carrinho:${storeId}`

function ler(storeId: string): ItemCarrinho[] {
  try {
    const bruto = localStorage.getItem(chave(storeId))
    if (!bruto) return []
    const dados = JSON.parse(bruto)
    if (!Array.isArray(dados)) return []
    return dados.filter(i => i && typeof i.id === 'string' && typeof i.preco === 'number')
  } catch {
    return []
  }
}

function gravar(storeId: string, itens: ItemCarrinho[]) {
  try {
    localStorage.setItem(chave(storeId), JSON.stringify(itens))
  } catch {
    // Armazenamento indisponível: o carrinho segue valendo só nesta sessão.
  }
}

export function CarrinhoProvider({ storeId, children }: { storeId: string; children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([])
  const [aberto, setAberto] = useState(false)

  // O carregamento só acontece no cliente: o servidor não tem localStorage, e
  // ler durante o render deixaria o HTML diferente do que a hidratação produz.
  // É o caso que a regra abre exceção — sincronizar com um sistema externo no
  // momento em que ele passa a existir. Mesmo motivo do disable em VendasClient.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setItens(ler(storeId)) }, [storeId])

  const salvar = useCallback((proximos: ItemCarrinho[]) => {
    setItens(proximos)
    gravar(storeId, proximos)
  }, [storeId])

  const adicionar: CarrinhoCtx['adicionar'] = useCallback((item, quantidade = 1) => {
    setItens(atuais => {
      const existente = atuais.find(i => i.id === item.id)
      const proximos = existente
        ? atuais.map(i => i.id === item.id
            ? { ...i, quantidade: Math.min(99, i.quantidade + quantidade) }
            : i)
        : [...atuais, { ...item, quantidade: Math.max(1, quantidade) }]
      gravar(storeId, proximos)
      return proximos
    })
    setAberto(true)
  }, [storeId])

  const alterarQuantidade = useCallback((id: string, quantidade: number) => {
    setItens(atuais => {
      const proximos = quantidade <= 0
        ? atuais.filter(i => i.id !== id)
        : atuais.map(i => i.id === id ? { ...i, quantidade: Math.min(99, quantidade) } : i)
      gravar(storeId, proximos)
      return proximos
    })
  }, [storeId])

  const remover = useCallback((id: string) => alterarQuantidade(id, 0), [alterarQuantidade])
  const limpar = useCallback(() => salvar([]), [salvar])

  const valor = useMemo<CarrinhoCtx>(() => ({
    itens,
    quantidadeTotal: itens.reduce((t, i) => t + i.quantidade, 0),
    valorTotal: itens.reduce((t, i) => t + i.preco * i.quantidade, 0),
    adicionar, alterarQuantidade, remover, limpar,
    aberto, abrir: () => setAberto(true), fechar: () => setAberto(false),
  }), [itens, adicionar, alterarQuantidade, remover, limpar, aberto])

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

/** Fora do provider devolve null — a vitrine funciona sem carrinho. */
export function useCarrinho(): CarrinhoCtx | null {
  return useContext(Ctx)
}
