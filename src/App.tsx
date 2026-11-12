import { useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, ScrollRestoration, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/Footer';
import Header from './components/Header';
import { Loading } from './components/State';
import WhatsAppButton from './components/WhatsAppButton';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';
import Account from './pages/account/Account';
import Brand from './pages/Brand';
import Cart from './pages/Cart';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProductDetail from './pages/ProductDetail';
import Register from './pages/Register';
import { managerRoutes } from './pages/manager/routes';
import ManagerLayout from './pages/manager/ManagerLayout';
import { track } from './utils/events';
import type { TipoUsuario } from './types';

function StoreLayout() {
  const location = useLocation();
  // Uma visita por aba aberta (a API ainda ignora repetições da mesma sessão no mesmo dia).
  useEffect(() => {
    try {
      if (sessionStorage.getItem('mantiqueira.visita')) return;
      sessionStorage.setItem('mantiqueira.visita', '1');
    } catch { /* sem sessionStorage: registra uma vez por carregamento */ }
    track({ tipo: 'visita' });
  }, []);
  return (
    <div className="min-h-screen bg-surface font-sans text-ink">
      <Header />
      <main className="min-h-[70vh]">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <WhatsAppButton />
      <ScrollRestoration />
    </div>
  );
}

// Protege rotas por perfil. Sem login, manda para /entrar e volta depois; perfil errado vai para a home.
function RequireRole({ role }: { role: TipoUsuario }) {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <Loading label="Verificando acesso..." className="py-32" />;
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  if (user.tipo !== role) return <Navigate to={user.tipo === 'equipe' ? '/gestor' : '/'} replace />;
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/produtos', element: <Catalog /> },
      { path: '/categoria/:slug', element: <Catalog /> },
      { path: '/marca/:slug', element: <Brand /> },
      { path: '/produto/:id', element: <ProductDetail /> },
      { path: '/favoritos', element: <Favorites /> },
      { path: '/carrinho', element: <Cart /> },
      { path: '/entrar', element: <Login /> },
      { path: '/cadastro', element: <Register /> },
      {
        element: <RequireRole role="cliente" />,
        children: [
          { path: '/checkout', element: <Checkout /> },
          { path: '/minha-conta/*', element: <Account /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/gestor',
    element: <RequireRole role="equipe" />,
    children: [{ element: <ManagerLayout />, children: managerRoutes }],
  },
]);

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
