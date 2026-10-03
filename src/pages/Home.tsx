import Benefits from '../components/Benefits';
import CategoryFilter from '../components/CategoryFilter';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';
import { categories, products } from '../data/products';
import type { CategoryOption } from '../types';

interface Props {
  category: CategoryOption;
  favIds: number[];
  onSelectCategory: (category: CategoryOption) => void;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (id: number) => void;
}

export default function Home({ category, favIds, onSelectCategory, onToggleFavorite, onAddToCart }: Props) {
  const visible = category === 'Todos' ? products : products.filter((p) => p.category === category);
  return (
    <>
      <Hero />
      <section id="produtos" className="mx-auto max-w-6xl scroll-mt-32 px-5 py-16">
        <h2 className="mb-6 text-3xl font-extrabold tracking-tight md:text-4xl">Destaques</h2>
        <CategoryFilter options={categories} active={category} onSelect={onSelectCategory} />
        <ProductGrid products={visible} favIds={favIds} emptyMessage="Nenhum produto nesta categoria."
          onToggleFavorite={onToggleFavorite} onAddToCart={onAddToCart} />
      </section>
      <Benefits />
    </>
  );
}
