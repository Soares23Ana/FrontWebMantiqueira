import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, imageUrl } from '../api/client';
import Availability from '../components/Availability';
import HeartButton from '../components/HeartButton';
import HoverZoom from '../components/HoverZoom';
import ProductGrid from '../components/ProductGrid';
import { ErrorState, Loading } from '../components/State';
import { useAuth } from '../context/AuthContext';
import { toMultiple, useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { brands } from '../data/brands';
import { useApi } from '../hooks/useApi';
import { track } from '../utils/events';
import type { Paginacao, Produto } from '../types';
import NotFound from './NotFound';

export default function ProductDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add, items, favIds, toggleFavorite } = useCart();
  const { selos } = useStore();
  const toast = useToast();
  const detalhe = useApi(() => api.get<{ produto: Produto }>(`/produtos/${encodeURIComponent(id)}`), [id, user?.id]);
  const product = detalhe.data?.produto;
  const marcaSlug = product?.marca?.slug;
  const related = useApi(
    () => api.get<{ produtos: Produto[]; paginacao: Paginacao }>('/produtos', { marca: marcaSlug, limite: 9 }),
    [marcaSlug, user?.id],
    !!marcaSlug,
  );
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!product) return;
    setQty(product.multiplo_venda);
    track({ tipo: 'produto_visto', id_produto: product.id_produto });
  }, [product?.id_produto]); // eslint-disable-line react-hooks/exhaustive-deps

  if (detalhe.loading) return <Loading className="py-32" />;
  if (detalhe.error?.status === 404) return <NotFound title="Produto não encontrado" text="Ele pode ter saído de linha." />;
  if (detalhe.error || !product) return <ErrorState error={detalhe.error ?? 'Produto não encontrado.'} onRetry={detalhe.reload} className="py-32" />;

  const brand = brands.find((b) => b.id === marcaSlug);
  const color = brand?.color ?? '#3b3b98';
  const tint = `color-mix(in srgb, ${color} 7%, white)`;
  const m = product.multiplo_venda;
  const unavailable = product.disponibilidade === 'indisponivel';
  const inCart = items.find((i) => i.id_produto === product.id_produto)?.quantidade ?? 0;
  const tags = selos.get(product.id_produto) ?? [];

  const addToCart = () => {
    const r = add(product, toMultiple(qty, m));
    toast(r.message, r.ok ? 'success' : 'error');
  };

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-6xl px-5 py-10">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/produtos'))}
          className="text-xs font-medium uppercase tracking-widest underline underline-offset-4">← Voltar</button>
        <div className="mt-10 grid gap-12 md:grid-cols-2">
          <div style={{ background: `linear-gradient(135deg, ${tint}, white)` }} className="relative grid min-h-[24rem] place-items-center p-8">
            <HoverZoom src={imageUrl(product.imagem_url)} alt={product.nome} className="w-full" />
            {tags.length > 0 && (
              <div className="absolute left-4 top-4 flex flex-col items-start gap-1">
                {tags.map((t) => <span key={t.id_campanha} className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-white">{t.selo}</span>)}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            {product.marca && (
              <Link to={`/marca/${product.marca.slug}`} className="self-start text-xs font-medium uppercase tracking-[0.3em] hover:underline" style={{ color }}>
                {product.marca.nome}
              </Link>
            )}
            <h1 className="mt-4 text-3xl font-light leading-tight md:text-5xl">{product.nome}</h1>
            <span className="mt-3 text-xs font-medium uppercase tracking-widest text-muted">
              {product.categoria && <Link to={`/categoria/${product.categoria.slug}`} className="hover:underline">{product.categoria.nome}</Link>}
              {product.categoria && product.subcategoria && (
                <> / <Link to={`/categoria/${product.categoria.slug}?subcategoria=${product.subcategoria.slug}`} className="hover:underline">{product.subcategoria.nome}</Link></>
              )}
              {' · '}SKU {product.sku}
            </span>
            {product.descricao && <p className="mt-8 text-lg font-light leading-relaxed">{product.descricao}</p>}
            {product.destaques && product.destaques.length > 0 && (
              <ul className="mt-6 space-y-1 text-muted">
                {product.destaques.map((h) => <li key={h}>– {h}</li>)}
              </ul>
            )}
            <div className="mt-10 grid gap-1">
              <Availability value={product.disponibilidade} faixa={product.faixa_estoque} estoque={product.estoque} />
              {m > 1 && <p className="text-sm text-muted">Vendido em múltiplos de {m} unidades.</p>}
              {inCart > 0 && <p className="text-sm text-brand">Você já tem {inCart} no carrinho.</p>}
              {!user && <p className="text-sm text-muted"><Link to="/entrar" className="font-extrabold text-brand">Entre</Link> com o CNPJ da sua empresa para fazer pedidos.</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center border border-ink">
                <button aria-label="Diminuir" disabled={qty <= m} onClick={() => setQty((q) => Math.max(m, q - m))} className="h-12 w-12 text-lg disabled:opacity-30">−</button>
                <input aria-label="Quantidade" inputMode="numeric" value={qty}
                  onChange={(e) => setQty(Number(e.target.value.replace(/\D/g, '')) || m)}
                  onBlur={() => setQty((q) => toMultiple(q, m))}
                  className="h-12 w-16 border-x border-ink text-center outline-none" />
                <button aria-label="Aumentar" onClick={() => setQty((q) => q + m)} className="h-12 w-12 text-lg">+</button>
              </div>
              <button onClick={addToCart} disabled={unavailable}
                className="flex-1 border border-ink px-6 py-3 text-xs font-medium uppercase tracking-widest transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                {unavailable ? 'Indisponível' : 'Adicionar ao carrinho'}
              </button>
              <HeartButton active={favIds.includes(product.id_produto)} onToggle={() => toggleFavorite(product.id_produto)}
                className="relative h-12 w-12 border border-ink" />
            </div>
          </div>
        </div>
      </section>
      {related.data && related.data.produtos.filter((p) => p.id_produto !== product.id_produto).length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-20 pt-10">
          <h2 className="mb-8 text-center text-xs font-medium uppercase tracking-[0.3em]">Mais de {product.marca?.nome ?? 'esta marca'}</h2>
          <ProductGrid products={related.data.produtos.filter((p) => p.id_produto !== product.id_produto).slice(0, 8)} emptyMessage="" />
        </section>
      )}
    </div>
  );
}
