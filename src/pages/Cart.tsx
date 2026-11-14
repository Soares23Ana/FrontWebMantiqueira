import { Link } from 'react-router-dom';
import { imageUrl } from '../api/client';
import Availability from '../components/Availability';
import { ErrorState } from '../components/State';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProductsById } from '../hooks/useProductsById';
import type { CartItem, Produto } from '../types';

export interface CartIssue {
  text: string;
  fix?: { label: string; quantidade: number };
  blocking: boolean;
}

/** Confere um item do carrinho contra os dados atuais do produto (disponibilidade, múltiplo, ativo). */
export function cartIssue(item: CartItem, p: Produto | null | undefined): CartIssue | null {
  if (p === undefined) return null;
  if (p === null) return { text: 'Este produto saiu de linha.', blocking: true, fix: { label: 'Remover', quantidade: 0 } };
  if (p.disponibilidade === 'indisponivel') return { text: 'Indisponível no momento.', blocking: true, fix: { label: 'Remover', quantidade: 0 } };
  const m = Math.max(1, p.multiplo_venda);
  // A API não informa o estoque exato: quem confere a quantidade é o checkout (ITENS_INDISPONIVEIS).
  if (item.quantidade % m !== 0) {
    const q = Math.max(m, Math.round(item.quantidade / m) * m);
    return { text: `Vendido em múltiplos de ${m}.`, blocking: true, fix: { label: `Ajustar para ${q}`, quantidade: q } };
  }
  if (p.disponibilidade === 'ultimas_unidades') return { text: 'Últimas unidades: garanta logo o seu pedido.', blocking: false };
  return null;
}

export default function Cart() {
  const { user } = useAuth();
  const { items, setQuantity, remove } = useCart();
  const current = useProductsById(items.map((i) => i.id_produto));
  const totalUnits = items.reduce((sum, i) => sum + i.quantidade, 0);
  const issues = items.map((i) => cartIssue(i, current.data?.get(i.id_produto)));
  const blocked = issues.some((i) => i?.blocking);

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <h2 className="text-3xl font-extrabold">Carrinho</h2>
      <p className="mb-8 text-muted">Revise seus itens antes de finalizar. {user?.tipo === 'cliente' ? 'O carrinho fica salvo na sua conta.' : 'O carrinho fica salvo neste navegador.'}</p>
      {items.length === 0 ? (
        <div className="py-12 text-center text-muted">
          <p className="mb-4">Seu carrinho está vazio.</p>
          <Link to="/produtos" className="inline-block rounded-full bg-brand px-5 py-3 font-extrabold text-white hover:bg-brand-dark">Ver produtos</Link>
        </div>
      ) : (
        <>
          {current.error && <ErrorState error={current.error} onRetry={current.reload} className="mb-6" />}
          {items.map((item, idx) => {
            const p = current.data?.get(item.id_produto);
            const m = Math.max(1, p?.multiplo_venda ?? item.multiplo_venda);
            const issue = issues[idx];
            return (
              <div key={item.id_produto} className={`mb-3 rounded-2xl border bg-white p-3 ${issue?.blocking ? 'border-accent/40' : 'border-black/10'}`}>
                <div className="flex flex-wrap items-center gap-4">
                  <img src={imageUrl(p?.imagem_url ?? item.imagem_url)} alt="" className="h-16 w-16 rounded-xl object-contain foto-produto" />
                  <div className="min-w-40 flex-1">
                    <Link to={`/produto/${item.id_produto}`} className="font-medium hover:text-brand">{p?.nome ?? item.nome}</Link>
                    <div className="flex flex-wrap gap-x-3 text-sm text-muted">
                      {p && <Availability value={p.disponibilidade} faixa={p.faixa_estoque} estoque={p.estoque} />}
                      {m > 1 && <span>Múltiplos de {m}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button aria-label="Diminuir" onClick={() => setQuantity(item.id_produto, item.quantidade - m)} className="h-8 w-8 rounded-full bg-surface font-extrabold">−</button>
                    <span className="w-10 text-center">{item.quantidade}</span>
                    <button aria-label="Aumentar" onClick={() => setQuantity(item.id_produto, item.quantidade + m)}
                      className="h-8 w-8 rounded-full bg-surface font-extrabold">+</button>
                    <button onClick={() => remove(item.id_produto)} className="ml-2 text-sm text-muted underline hover:text-accent">Remover</button>
                  </div>
                </div>
                {issue && (
                  <p className={`mt-2 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-sm ${issue.blocking ? 'bg-accent/10 text-accent' : 'bg-amber-50 text-amber-800'}`}>
                    {issue.text}
                    {issue.fix && (
                      <button onClick={() => setQuantity(item.id_produto, issue.fix!.quantidade)} className="font-extrabold underline">{issue.fix.label}</button>
                    )}
                  </p>
                )}
              </div>
            );
          })}
          <div className="my-6 flex justify-between text-xl font-extrabold">
            <span>Itens</span>
            <span>{totalUnits} unidades</span>
          </div>
          {user?.tipo === 'equipe' ? (
            <p className="rounded-xl bg-white p-4 text-center text-muted">Pedidos são feitos com a conta do cliente (CNPJ). Usuários da equipe não fazem checkout.</p>
          ) : !user ? (
            <Link to="/entrar" state={{ from: '/checkout' }} className="block rounded-full bg-accent px-5 py-3 text-center font-extrabold text-white hover:brightness-110">
              Entrar com CNPJ para finalizar
            </Link>
          ) : (
            <>
              {blocked && <p className="mb-3 text-center text-sm text-accent">Ajuste os itens destacados para continuar.</p>}
              <Link to="/checkout" aria-disabled={blocked} onClick={(e) => blocked && e.preventDefault()}
                className={`block rounded-full bg-accent px-5 py-3 text-center font-extrabold text-white hover:brightness-110 ${blocked ? 'cursor-not-allowed opacity-40' : ''}`}>
                Finalizar pedido
              </Link>
            </>
          )}
        </>
      )}
    </section>
  );
}
