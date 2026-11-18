import { useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../api/client';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
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
  const { escuro } = useTheme();
  if (products.length === 0) return null;
  const i = Math.min(index, products.length - 1);
  const p = products[i];
  const go = (d: number) => setIndex((i + d + products.length) % products.length);
  // Modo claro: fundo com mais cor da marca (para se destacar do branco da página) e rótulo mais escuro que a cor da marca.
  const tint = `color-mix(in srgb, ${color} 16%, white)`;
  const tintFim = `color-mix(in srgb, ${color} 5%, white)`;
  const rotulo = escuro ? color : `color-mix(in srgb, ${color} 80%, black)`;
  // No modo noturno o fundo é escuro, com um toque da cor da marca, e a foto fica em um quadro branco (sem o efeito multiply).
  const fundo = escuro
    ? `linear-gradient(135deg, color-mix(in srgb, ${color} 22%, #141a3f), #141a3f)`
    : `linear-gradient(135deg, ${tint}, ${tintFim})`;

  return (
    <div>
      <div style={{ background: fundo, ...(escuro ? {} : { borderColor: `color-mix(in srgb, ${color} 30%, white)` }) }}
        className={`relative grid min-h-[26rem] items-center gap-6 overflow-hidden rounded-3xl p-6 md:grid-cols-2 md:p-12 ${escuro ? '' : 'border'}`}>
        <img key={p.id_produto} src={imageUrl(p.imagem_url)} alt={p.nome}
          className={`relative mx-auto max-h-80 w-full object-contain md:max-h-96 ${escuro ? 'rounded-2xl bg-[#fff] p-4' : 'mix-blend-multiply drop-shadow-xl'}`} />
        <div className={`relative max-w-sm rounded-2xl p-6 backdrop-blur md:justify-self-start ${escuro ? 'bg-white/80 shadow-sm' : 'border border-black/10 bg-white shadow-xl'}`}>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: rotulo }}>Destaques</p>
          <h3 className="mt-2 text-lg font-semibold leading-snug">{p.nome}</h3>
          {p.destaques && p.destaques.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-ink/85">
              {p.destaques.map((h) => <li key={h}>– {h}</li>)}
            </ul>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to={`/produto/${p.id_produto}`}
              className="border-2 border-ink px-5 py-2 text-xs font-semibold uppercase tracking-widest transition hover:bg-ink hover:text-white">
              Ver detalhes
            </Link>
            <Button className="!rounded-none !px-5 !py-2 !text-xs !font-semibold uppercase tracking-widest disabled:opacity-40"
              disabled={p.disponibilidade === 'indisponivel'}
              onClick={() => { if (!exigirLogin('carrinho')) return; const r = add(p); toast(r.message, r.ok ? 'success' : 'error'); }}>
              Adicionar
            </Button>
          </div>
        </div>
      </div>
      {products.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-5">
          <button aria-label="Produto anterior" onClick={() => go(-1)} className="text-ink/80 transition hover:text-ink">
            <Icon name="left" />
          </button>
          <div className="flex gap-3">
            {products.map((q, n) => (
              <button key={q.id_produto} aria-label={`Produto ${n + 1}`} onClick={() => setIndex(n)}
                className="h-2.5 w-2.5 rounded-full transition"
                style={{ background: color, opacity: n === i ? 1 : 0.4 }} />
            ))}
          </div>
          <button aria-label="Próximo produto" onClick={() => go(1)} className="text-ink/80 transition hover:text-ink">
            <Icon name="right" />
          </button>
        </div>
      )}
    </div>
  );
}
