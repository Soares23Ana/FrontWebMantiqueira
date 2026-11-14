import { useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useRequireLogin } from '../hooks/useRequireLogin';
import Button from './Button';
import Icon from './Icon';
import type { Produto } from '../types';

interface Props {
  products: Produto[];
  color: string;
}

// Carrossel editorial: um produto por vez, com cartão de destaques (inspirado no Beauty in Stem).
export default function BrandShowcase({ products, color }: Props) {
  const [index, setIndex] = useState(0);
  const { add } = useCart();
  const toast = useToast();
  const exigirLogin = useRequireLogin();
  if (products.length === 0) return null;
  const i = Math.min(index, products.length - 1);
  const p = products[i];
  const go = (d: number) => setIndex((i + d + products.length) % products.length);
  const tint = `color-mix(in srgb, ${color} 7%, white)`;

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${tint}, white)` }}
        className="relative grid min-h-[26rem] items-center gap-6 overflow-hidden rounded-sm p-6 md:grid-cols-2 md:p-12">
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed opacity-30"
          style={{ borderColor: color }} />
        <img key={p.id_produto} src={imageUrl(p.imagem_url)} alt={p.nome}
          className="relative mx-auto max-h-80 w-full object-contain mix-blend-multiply md:max-h-96" />
        <div className="relative max-w-sm bg-white/80 p-6 shadow-sm backdrop-blur md:justify-self-start">
          <p className="text-sm font-medium uppercase tracking-widest" style={{ color }}>Destaques</p>
          <h3 className="mt-2 text-lg font-medium leading-snug">{p.nome}</h3>
          {p.destaques && p.destaques.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-muted">
              {p.destaques.map((h) => <li key={h}>– {h}</li>)}
            </ul>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to={`/produto/${p.id_produto}`}
              className="border border-ink px-5 py-2 text-xs font-medium uppercase tracking-widest transition hover:bg-ink hover:text-white">
              Ver detalhes
            </Link>
            <Button className="!rounded-none !px-5 !py-2 !text-xs !font-medium uppercase tracking-widest disabled:opacity-40"
              disabled={p.disponibilidade === 'indisponivel'}
              onClick={() => { if (!exigirLogin('carrinho')) return; const r = add(p); toast(r.message, r.ok ? 'success' : 'error'); }}>
              Adicionar
            </Button>
          </div>
        </div>
      </div>
      {products.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-5">
          <button aria-label="Produto anterior" onClick={() => go(-1)} className="text-ink/60 transition hover:text-ink">
            <Icon name="left" />
          </button>
          <div className="flex gap-3">
            {products.map((q, n) => (
              <button key={q.id_produto} aria-label={`Produto ${n + 1}`} onClick={() => setIndex(n)}
                className="h-2.5 w-2.5 rounded-full transition"
                style={{ background: color, opacity: n === i ? 1 : 0.25 }} />
            ))}
          </div>
          <button aria-label="Próximo produto" onClick={() => go(1)} className="text-ink/60 transition hover:text-ink">
            <Icon name="right" />
          </button>
        </div>
      )}
    </div>
  );
}
