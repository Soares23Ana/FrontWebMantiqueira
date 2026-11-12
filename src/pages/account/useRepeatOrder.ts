import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import type { RepetirPedido } from '../../types';

// "Repetir pedido": pede à API os itens do pedido anterior ajustados ao estoque de hoje e joga no carrinho.
export function useRepeatOrder() {
  const { items, replaceAll } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const repeat = async (idPedido: number) => {
    setLoadingId(idPedido);
    try {
      const r = await api.get<RepetirPedido>(`/pedidos/${idPedido}/repetir`);
      // Só entram no carrinho os itens que o estoque de hoje cobre por inteiro (itens_para_checkout);
      // os parciais ou indisponíveis ficam de fora e o cliente decide depois, pelo catálogo.
      const next = [...items];
      const cobertos = new Map(r.itens_para_checkout.map((c) => [c.id_produto, c.quantidade]));
      for (const it of r.itens) {
        const quantidade = cobertos.get(it.id_produto);
        if (!quantidade) continue;
        const existing = next.findIndex((i) => i.id_produto === it.id_produto);
        const item = { id_produto: it.id_produto, quantidade, nome: it.nome, imagem_url: it.imagem_url, multiplo_venda: it.multiplo_venda };
        if (existing >= 0) next[existing] = item;
        else next.push(item);
      }
      replaceAll(next);
      const fora = r.itens.filter((i) => !cobertos.has(i.id_produto)).length;
      const msg = r.itens_para_checkout.length === 0
        ? 'Nenhum item deste pedido está disponível agora.'
        : `${r.itens_para_checkout.length} item(ns) no carrinho.` +
          (r.itens_ajustados ? ` ${r.itens_ajustados} ajustado(s) ao estoque de hoje.` : '') +
          (fora ? ` ${fora} sem estoque suficiente ficaram de fora.` : '');
      toast(msg, r.itens_para_checkout.length ? 'success' : 'error');
      if (r.itens_para_checkout.length) navigate('/carrinho');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setLoadingId(null);
    }
  };

  return { repeat, loadingId };
}
