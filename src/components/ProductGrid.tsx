import type { Produto } from '../types';
import ProductCard from './ProductCard';
import Reveal from './Reveal';

interface Props {
  products: Produto[];
  emptyMessage: string;
}

export default function ProductGrid({ products, emptyMessage }: Props) {
  if (products.length === 0) {
    return <p className="py-12 text-center text-muted">{emptyMessage}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <Reveal key={p.id_produto} delay={(i % 4) * 80} className="h-full [&>*]:h-full">
          <ProductCard product={p} />
        </Reveal>
      ))}
    </div>
  );
}
