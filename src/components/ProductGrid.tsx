import type { Product } from '../types';
import ProductCard from './ProductCard';

interface Props {
  products: Product[];
  favIds: number[];
  emptyMessage: string;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (id: number) => void;
}

export default function ProductGrid({ products, favIds, emptyMessage, onToggleFavorite, onAddToCart }: Props) {
  if (products.length === 0) {
    return <p className="py-12 text-center text-muted">{emptyMessage}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} isFavorite={favIds.includes(p.id)}
          onToggleFavorite={onToggleFavorite} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
