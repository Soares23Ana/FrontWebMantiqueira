import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { track } from '../utils/events';
import { readJson, writeJson } from '../utils/storage';
import type { CartItem, Produto } from '../types';

const CART_KEY = 'mantiqueira.carrinho';
const FAV_KEY = 'mantiqueira.favoritos';

type ProdutoBasico = Pick<Produto, 'id_produto' | 'nome' | 'imagem_url' | 'multiplo_venda'> &
  Partial<Pick<Produto, 'disponibilidade' | 'estoque'>>;

export interface AddResult {
  ok: boolean;
  message: string;
}

interface CartValue {
  items: CartItem[];
  count: number;
  add: (produto: ProdutoBasico, quantidade?: number) => AddResult;
  setQuantity: (id: number, quantidade: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  replaceAll: (items: CartItem[]) => void;
  favIds: number[];
  toggleFavorite: (id: number) => void;
}

const CartContext = createContext<CartValue | null>(null);

/** Arredonda para o múltiplo de venda mais próximo (sem passar de um teto, se houver). */
export function toMultiple(qty: number, multiplo: number, max?: number): number {
  const m = Math.max(1, multiplo);
  let q = Math.max(m, Math.round(qty / m) * m);
  if (max !== undefined) q = Math.min(q, Math.floor(max / m) * m);
  return q;
}

// Carrinho e favoritos ficam salvos no navegador e sobrevivem ao recarregar a página.
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readJson<CartItem[]>(CART_KEY, []));
  const [favIds, setFavIds] = useState<number[]>(() => readJson<number[]>(FAV_KEY, []));

  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => writeJson(CART_KEY, items), [items]);
  useEffect(() => writeJson(FAV_KEY, favIds), [favIds]);

  const add = useCallback((produto: ProdutoBasico, quantidade?: number): AddResult => {
    if (produto.disponibilidade === 'indisponivel') {
      return { ok: false, message: 'Produto indisponível no momento.' };
    }
    const m = Math.max(1, produto.multiplo_venda);
    const step = quantidade ?? m;
    const prev = itemsRef.current;
    const current = prev.find((i) => i.id_produto === produto.id_produto)?.quantidade ?? 0;
    let next = toMultiple(current + step, m);
    let result: AddResult = { ok: true, message: 'Adicionado ao carrinho.' };
    if (produto.estoque !== undefined && next > produto.estoque) {
      const max = Math.floor(produto.estoque / m) * m;
      if (max <= current) return { ok: false, message: `Só há ${produto.estoque} unidade(s) em estoque.` };
      next = max;
      result = { ok: true, message: `Ajustado para ${max} unidade(s): é o que há em estoque.` };
    }
    const item: CartItem = {
      id_produto: produto.id_produto, quantidade: next, nome: produto.nome,
      imagem_url: produto.imagem_url, multiplo_venda: m,
    };
    const updated = prev.some((i) => i.id_produto === produto.id_produto)
      ? prev.map((i) => (i.id_produto === produto.id_produto ? item : i))
      : [...prev, item];
    itemsRef.current = updated;
    setItems(updated);
    if (result.ok) track({ tipo: 'carrinho_adicionar', id_produto: produto.id_produto, quantidade: step });
    return result;
  }, []);

  const setQuantity = useCallback((id: number, quantidade: number) =>
    setItems((prev) => prev.map((i) => (i.id_produto === id ? { ...i, quantidade } : i)).filter((i) => i.quantidade > 0)), []);
  const remove = useCallback((id: number) => setItems((prev) => prev.filter((i) => i.id_produto !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const replaceAll = useCallback((next: CartItem[]) => setItems(next), []);
  const toggleFavorite = useCallback((id: number) =>
    setFavIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])), []);

  const count = items.reduce((s, i) => s + i.quantidade, 0);
  const value = useMemo(
    () => ({ items, count, add, setQuantity, remove, clear, replaceAll, favIds, toggleFavorite }),
    [items, count, add, setQuantity, remove, clear, replaceAll, favIds, toggleFavorite],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart fora do CartProvider');
  return ctx;
}
