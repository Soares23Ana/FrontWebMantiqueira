import Button from '../components/Button';
import QuantityControl from '../components/QuantityControl';
import { products } from '../data/products';
import type { CartItem } from '../types';

interface Props {
  items: CartItem[];
  onChangeQuantity: (id: number, delta: number) => void;
  onGoHome: () => void;
}

export default function Cart({ items, onChangeQuantity, onGoHome }: Props) {
  const total = items.reduce((sum, i) => sum + i.quantity, 0);
  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <h2 className="text-3xl font-extrabold">Carrinho</h2>
      <p className="mb-8 text-muted">Revise seus itens antes de finalizar.</p>
      {items.length === 0 ? (
        <div className="py-12 text-center text-muted">
          <p className="mb-4">Seu carrinho está vazio.</p>
          <Button variant="primary" onClick={onGoHome}>Ver produtos</Button>
        </div>
      ) : (
        <>
          {items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) return null;
            return (
              <div key={item.productId} className="mb-3 flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-3">
                <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-contain" />
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <small className="text-muted">{product.category}</small>
                </div>
                <QuantityControl value={item.quantity} onDecrease={() => onChangeQuantity(item.productId, -1)} onIncrease={() => onChangeQuantity(item.productId, 1)} />
              </div>
            );
          })}
          <div className="my-6 flex justify-between text-xl font-extrabold">
            <span>Itens</span>
            <span>{total}</span>
          </div>
          <Button onClick={() => alert('Checkout será conectado à API em uma próxima etapa.')}>Finalizar compra</Button>
        </>
      )}
    </section>
  );
}
