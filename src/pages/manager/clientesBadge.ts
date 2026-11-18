/** Selo do item "Clientes" do menu: soma dos pedidos de nova senha pendentes e dos clientes novos dos últimos 7 dias. */
export function seloClientes(redefinicoesPendentes?: number, clientesNovos7Dias?: number): { total: number; texto: string } {
  const senhas = Math.max(0, redefinicoesPendentes ?? 0);
  const novos = Math.max(0, clientesNovos7Dias ?? 0);
  const partes: string[] = [];
  if (senhas > 0) partes.push(`${senhas} ${senhas === 1 ? 'pedido de nova senha' : 'pedidos de nova senha'}`);
  if (novos > 0) partes.push(`${novos} ${novos === 1 ? 'cliente novo' : 'clientes novos'} nos últimos 7 dias`);
  return { total: senhas + novos, texto: partes.join(' e ') };
}
