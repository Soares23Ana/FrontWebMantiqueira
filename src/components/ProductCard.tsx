import type { Product } from '../types';
import Button from './Button';
import Icon from './Icon';

interface Props {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (id: number) => void;
}

export default function ProductCard({ product, isFavorite, onToggleFavorite, onAddToCart }: Props) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative flex h-52 items-center justify-center p-4">
        <img src={product.image} alt={product.name} loading="lazy"
          className="h-full max-w-full object-contain transition duration-500 group-hover:scale-110" />
        <button onClick={() => onToggleFavorite(product.id)}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white shadow ${isFavorite ? 'text-accent' : 'text-ink'}`}>
          <Icon name="heart" filled={isFavorite} className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-sm text-muted">{product.category}</span>
        <h3 className="font-medium">{product.name}</h3>
        <span className="mt-auto pt-2 font-extrabold text-brand">Consulte o preço</span>
        <Button className="mt-2" onClick={() => onAddToCart(product.id)}>Adicionar ao carrinho</Button>
      </div>
    </article>
  );
}
