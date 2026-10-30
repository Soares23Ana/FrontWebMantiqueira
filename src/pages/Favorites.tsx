import ProductGrid from '../components/ProductGrid';
import { ErrorState, Loading } from '../components/State';
import { useCart } from '../context/CartContext';
import { useProductsById } from '../hooks/useProductsById';
import type { Produto } from '../types';

export default function Favorites() {
  const { favIds } = useCart();
  const { data, loading, error, reload } = useProductsById(favIds);
  const favorites = favIds.map((id) => data?.get(id)).filter((p): p is Produto => !!p);
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h2 className="text-3xl font-extrabold">Favoritos</h2>
      <p className="mb-8 text-muted">Seus produtos salvos neste navegador.</p>
      {loading && favIds.length > 0 ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <ProductGrid products={favorites}
          emptyMessage="Você ainda não tem favoritos. Toque no coração de um produto para salvá-lo." />
      )}
    </section>
  );
}
