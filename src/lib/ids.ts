/**
 * ids.ts — geradores de identificador criados no cliente.
 *
 * `service_orders.id` é TEXT PRIMARY KEY sem default no banco: quem grava é a
 * tela do admin. O formato antigo (`OS` + os 6 últimos dígitos de `Date.now()`)
 * se repetia a cada 1.000 s, e como `upsert` grava por chave primária, uma O.S.
 * nova sobrescrevia em silêncio a O.S. de outro cliente. O sufixo aleatório
 * elimina a colisão sem tirar a legibilidade do número ditado por telefone.
 */

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem I, O, 0 e 1 (confundem ao ditar)

function sufixoAleatorio(tamanho: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(tamanho))
  return Array.from(bytes, b => ALFABETO[b % ALFABETO.length]).join('')
}

/** Ex.: "OS482913K7QM" — prefixo familiar, cauda que não colide. */
export function novoIdOrdemServico(): string {
  return `OS${String(Date.now()).slice(-6)}${sufixoAleatorio(4)}`
}
