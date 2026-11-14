import { Link } from 'react-router-dom';
import { imageUrl } from '../api/client';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useRequireLogin } from '../hooks/useRequireLogin';
import { useToast } from '../context/ToastContext';
import type { Produto } from '../types';
import Availability from './Availability';
import Button from './Button';
import HeartButton from './HeartButton';

export default function ProductCard({ product }: { product: Produto }) {
  const { add, favIds, toggleFavorite } = useCart();
  const { selos } = useStore();
  const toast = useToast();
  const exigirLogin = useRequireLogin();
  const href = `/produto/${product.id_produto}`;
  const unavailable = product.disponibilidade === 'indisponivel';
  const tags = selos.get(product.id_produto) ?? [];

  const addToCart = () => {
    if (!exigirLogin('carrinho')) return;
    const r = add(product);
    toast(r.message, r.ok ? 'success' : 'error');
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition hover:-translate-y-1 hover:shadow-xl">
      <div className="foto-produto relative flex h-52 items-center justify-center p-4">
        <Link to={href} className="h-full" tabIndex={-1}>
          <img src={imageUrl(product.imagem_url)} alt={product.nome} loading="lazy"
            className={`h-full max-w-full object-contain transition duration-500 group-hover:scale-110 ${unavailable ? 'opacity-50' : ''}`} />
        </Link>
        {tags.length > 0 && (
          <div className="absolute left-3 top-3 flex max-w-[70%] flex-col items-start gap-1">
            {tags.map((t) => (
              <span key={t.id_campanha} className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-white shadow">{t.selo}</span>
            ))}
          </div>
        )}
        <Link to={href} tabIndex={-1}
          className="absolute inset-x-6 bottom-3 border border-ink bg-white/85 py-2 text-center text-xs font-medium uppercase tracking-widest opacity-0 backdrop-blur transition duration-300 group-hover:opacity-100">
          Ver produto
        </Link>
        <HeartButton active={favIds.includes(product.id_produto)} onToggle={() => exigirLogin('favorito') && toggleFavorite(product.id_produto)}
          className="absolute right-3 top-3 h-10 w-10 rounded-full bg-white shadow" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-sm text-muted">{product.marca?.nome ?? product.categoria?.nome}</span>
        <h3 className="font-medium">
          <Link to={href} className="hover:text-brand">{product.nome}</Link>
        </h3>
        <div className="mt-auto pt-2">
          <Availability value={product.disponibilidade} faixa={product.faixa_estoque} estoque={product.estoque} />
          {product.multiplo_venda > 1 && <p className="text-xs text-muted">Vendido em múltiplos de {product.multiplo_venda}</p>}
        </div>
        <Button className="mt-2 disabled:cursor-not-allowed disabled:opacity-40" disabled={unavailable} onClick={addToCart}>
          {unavailable ? 'Indisponível' : 'Adicionar ao carrinho'}
        </Button>
      </div>
    </article>
  );
}
