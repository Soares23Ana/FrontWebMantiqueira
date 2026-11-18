/**
 * Devolve `destino` só se for um caminho interno seguro do próprio site: começa com uma única "/" (nunca "//"),
 * não tem barra invertida (o navegador a trata como "/"), nem protocolo ("https:", "javascript:") nem caracteres de
 * controle. Caso contrário devolve `padrao`. Usado no retorno do login para não permitir redirecionamento aberto.
 */
export function caminhoInternoSeguro(destino: unknown, padrao: string): string;
export function caminhoInternoSeguro(destino: unknown, padrao?: undefined): string | undefined;
export function caminhoInternoSeguro(destino: unknown, padrao?: string): string | undefined {
  if (typeof destino !== 'string') return padrao;
  if (!destino.startsWith('/') || destino.startsWith('//')) return padrao;
  // eslint-disable-next-line no-control-regex
  if (/[\\\x00-\x1f\x7f]/.test(destino)) return padrao;
  return destino;
}
