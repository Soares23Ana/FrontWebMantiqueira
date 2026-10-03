import { useState } from 'react';
import Footer from './components/Footer';
import Header from './components/Header';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Login from './pages/Login';
import Manager from './pages/Manager';
import type { CartItem, CategoryOption, Page } from './types';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [category, setCategory] = useState<CategoryOption>('Todos');
  const [favIds, setFavIds] = useState<number[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const toggleFavorite = (id: number) =>
    setFavIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const addToCart = (id: number) =>
    setCart((prev) =>
      prev.some((i) => i.productId === id)
        ? prev.map((i) => (i.productId === id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { productId: id, quantity: 1 }],
    );

  const changeQuantity = (id: number, delta: number) =>
    setCart((prev) =>
      prev.map((i) => (i.productId === id ? { ...i, quantity: i.quantity + delta } : i)).filter((i) => i.quantity > 0),
    );

  const selectCategory = (c: CategoryOption) => {
    setCategory(c);
    setPage('home');
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-surface font-sans text-ink">
      <Header page={page} category={category} cartCount={cartCount} favCount={favIds.length}
        onNavigate={setPage} onSelectCategory={selectCategory} />
      <main className="min-h-[70vh] pt-32 md:pt-16">
        {page === 'home' && (
          <Home category={category} favIds={favIds} onSelectCategory={setCategory}
            onToggleFavorite={toggleFavorite} onAddToCart={addToCart} />
        )}
        {page === 'favoritos' && <Favorites favIds={favIds} onToggleFavorite={toggleFavorite} onAddToCart={addToCart} />}
        {page === 'carrinho' && <Cart items={cart} onChangeQuantity={changeQuantity} onGoHome={() => setPage('home')} />}
        {page === 'login' && <Login />}
        {page === 'gestor' && <Manager />}
      </main>
      <Footer />
    </div>
  );
}