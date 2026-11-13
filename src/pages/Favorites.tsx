import { useEffect } from 'react';
import ProductGrid from '../components/ProductGrid';
import { ErrorState, Loading } from '../components/State';
import { useCart } from '../context/CartContext';
import { useProductsById } from '../hooks/useProductsById';
import type { Produto } from '../types';

export default function Favorites() {
  const { favIds, toggleFavorite } = useCart();
  const { data, loading, error, reload } = useProductsById(favIds);
  const favorites = favIds.map((id) => data?.get(id)).filter((p): p is Produto => !!p);
  // Favorito de um produto que não existe mais (por exemplo, depois de trocar o catálogo) é removido da lista e do contador.
  useEffect(() => {
    if (!data) return;
    for (const id of favIds) if (data.get(id) === null) toggleFavorite(id);
  }, [data, favIds, toggleFavorite]);
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h2 className="text-3xl font-extrabold">Favoritos</h2>
      <p className="mb-8 text-muted">Seus produtos salvos. Quando você está logado, eles ficam na sua conta.</p>
      {loading && favIds.length > 0 ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <ProductGrid products={favorites}
          emptyMessage="Você ainda não tem favoritos. Toque no coração de um produto para salvá-lo." />
      )}
    </section>
  );
}
