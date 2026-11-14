import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { api, fetchAllPages } from '../api/client';
import { track } from '../utils/events';
import { readJson, writeJson } from '../utils/storage';
import type { CarrinhoApi, CartItem, Produto } from '../types';
import { useAuth } from './AuthContext';

const CART_KEY = 'mantiqueira.carrinho';
const FAV_KEY = 'mantiqueira.favoritos';

type ProdutoBasico = Pick<Produto, 'id_produto' | 'nome' | 'imagem_url' | 'multiplo_venda'> &
  Partial<Pick<Produto, 'disponibilidade'>>;

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

const paraApi = (items: CartItem[]) => ({ itens: items.map((i) => ({ id_produto: i.id_produto, quantidade: i.quantidade })) });

// Carrinho e favoritos são do cliente logado: ficam na conta (GET/PUT /carrinho e /favoritos), valem em qualquer
// aparelho e alimentam o painel de carrinhos abandonados. O navegador guarda uma cópia só para o carrinho
// aparecer na hora ao recarregar a página. Visitante não tem carrinho nem favoritos (é levado ao login).
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isCliente = user?.tipo === 'cliente';
  const [items, setItems] = useState<CartItem[]>(() => readJson<CartItem[]>(CART_KEY, []));
  const [favIds, setFavIds] = useState<number[]>(() => readJson<number[]>(FAV_KEY, []));

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const favRef = useRef(favIds);
  favRef.current = favIds;
  const clienteRef = useRef(isCliente);
  clienteRef.current = isCliente;
  /** Id do cliente cujo carrinho e favoritos já foram carregados da API (null = nenhum). */
  const syncedFor = useRef<number | null>(null);
  // Visitante não tem carrinho nem favoritos: só quem entrou como cliente (a tela leva os outros para o login).
  const VAZIO_ITENS = useRef<CartItem[]>([]).current;
  const VAZIO_FAV = useRef<number[]>([]).current;

  // Entrou ou saiu da conta: carrega o que está salvo na conta e junta com o que o visitante já tinha escolhido.
  useEffect(() => {
    if (!isCliente || !user) {
      if (syncedFor.current !== null) {
        // Saiu da conta (ou a sessão expirou): o carrinho e os favoritos continuam salvos na conta.
        syncedFor.current = null;
        setItems([]);
        setFavIds([]);
        writeJson(CART_KEY, []);
        writeJson(FAV_KEY, []);
      }
      return;
    }
    if (syncedFor.current === user.id) return;
    let cancelled = false;
    (async () => {
      try {
        const [cart, favs] = await Promise.all([
          api.get<CarrinhoApi>('/carrinho'),
          fetchAllPages<Produto>('/favoritos', 'produtos'),
        ]);
        if (cancelled) return;
        const doServidor: CartItem[] = cart.itens.map((i) => ({
          id_produto: i.id_produto, quantidade: i.quantidade, nome: i.nome, imagem_url: i.imagem_url, multiplo_venda: i.multiplo_venda,
        }));
        syncedFor.current = user.id;
        setItems(doServidor);
        setFavIds(favs.map((p) => p.id_produto));
      } catch {
        // Sem resposta da API: segue com o que está no navegador e tenta salvar nas próximas mudanças.
        if (!cancelled) syncedFor.current = user.id;
      }
    })();
    return () => { cancelled = true; };
  }, [isCliente, user]);

  // Guarda a cópia local e, para o cliente logado, salva o carrinho na conta (com uma pequena espera, para juntar cliques).
  useEffect(() => {
    writeJson(CART_KEY, items);
    if (!isCliente || !user || syncedFor.current !== user.id) return;
    const t = setTimeout(() => {
      api.put('/carrinho', paraApi(items)).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [items, isCliente, user]);
  useEffect(() => writeJson(FAV_KEY, favIds), [favIds]);

  const add = useCallback((produto: ProdutoBasico, quantidade?: number): AddResult => {
    if (!clienteRef.current) return { ok: false, message: 'Entre com o CNPJ da sua empresa para adicionar ao carrinho.' };
    if (produto.disponibilidade === 'indisponivel') {
      return { ok: false, message: 'Produto indisponível no momento.' };
    }
    const m = Math.max(1, produto.multiplo_venda);
    const step = quantidade ?? m;
    const prev = itemsRef.current;
    const current = prev.find((i) => i.id_produto === produto.id_produto)?.quantidade ?? 0;
    // A API não informa o estoque exato; a quantidade é conferida no checkout.
    const next = toMultiple(current + step, m);
    const item: CartItem = {
      id_produto: produto.id_produto, quantidade: next, nome: produto.nome,
      imagem_url: produto.imagem_url, multiplo_venda: m,
    };
    const updated = prev.some((i) => i.id_produto === produto.id_produto)
      ? prev.map((i) => (i.id_produto === produto.id_produto ? item : i))
      : [...prev, item];
    itemsRef.current = updated;
    setItems(updated);
    track({ tipo: 'carrinho_adicionar', id_produto: produto.id_produto, quantidade: step });
    return { ok: true, message: 'Adicionado ao carrinho.' };
  }, []);

  const setQuantity = useCallback((id: number, quantidade: number) =>
    setItems((prev) => prev.map((i) => (i.id_produto === id ? { ...i, quantidade } : i)).filter((i) => i.quantidade > 0)), []);
  const remove = useCallback((id: number) => setItems((prev) => prev.filter((i) => i.id_produto !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const replaceAll = useCallback((next: CartItem[]) => setItems(next), []);

  const toggleFavorite = useCallback((id: number) => {
    if (!clienteRef.current) return;
    const tinha = favRef.current.includes(id);
    const next = tinha ? favRef.current.filter((i) => i !== id) : [...favRef.current, id];
    favRef.current = next;
    setFavIds(next);
    if (!clienteRef.current) return;
    (tinha ? api.del(`/favoritos/${id}`) : api.put(`/favoritos/${id}`)).catch(() => {
      // Não salvou na conta: desfaz na tela para não mostrar algo que não ficou guardado.
      setFavIds((prev) => (tinha ? [...prev, id] : prev.filter((i) => i !== id)));
    });
  }, []);

  const itensVisiveis = isCliente ? items : VAZIO_ITENS;
  const favoritosVisiveis = isCliente ? favIds : VAZIO_FAV;
  const count = itensVisiveis.reduce((s, i) => s + i.quantidade, 0);
  const value = useMemo(
    () => ({ items: itensVisiveis, count, add, setQuantity, remove, clear, replaceAll, favIds: favoritosVisiveis, toggleFavorite }),
    [itensVisiveis, count, add, setQuantity, remove, clear, replaceAll, favoritosVisiveis, toggleFavorite],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart fora do CartProvider');
  return ctx;
}
