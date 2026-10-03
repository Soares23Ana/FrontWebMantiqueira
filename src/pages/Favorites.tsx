import ProductGrid from '../components/ProductGrid';
import { products } from '../data/products';

interface Props {
  favIds: number[];
  onToggleFavorite: (id: number) => void;
  onAddToCart: (id: number) => void;
}

export default function Favorites({ favIds, onToggleFavorite, onAddToCart }: Props) {
  const favorites = products.filter((p) => favIds.includes(p.id));
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h2 className="text-3xl font-extrabold">Favoritos</h2>
      <p className="mb-8 text-muted">Seus produtos salvos.</p>
      <ProductGrid products={favorites} favIds={favIds}
        emptyMessage="Você ainda não tem favoritos. Toque no coração de um produto para salvá-lo."
        onToggleFavorite={onToggleFavorite} onAddToCart={onAddToCart} />
    </section>
  );
}
