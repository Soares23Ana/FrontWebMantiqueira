import { useEffect, useState } from 'react';
import { Link, Outlet, ScrollRestoration, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../../api/client';
import ErrorBoundary from '../../components/ErrorBoundary';
import Logo from '../../components/Logo';
import ThemeToggle from '../../components/ThemeToggle';
import ManagerSidebar from '../../components/manager/ManagerSidebar';
import type { SidebarItem } from '../../components/manager/ManagerSidebar';
import { useAuth } from '../../context/AuthContext';

interface Contadores {
  pedidos_pendentes: number;
  estoque_baixo: number;
  /** Clientes cadastrados nos últimos 7 dias (só informativo: não há aprovação de cadastro). */
  clientes_novos_7_dias: number;
  /** Carrinhos abandonados que ainda não receberam contato da equipe. */
  carrinhos_abandonados?: number;
}

interface ManagerContext {
  /** Recarrega os números da barra lateral depois de uma ação (ex.: avançar pedido, ajustar estoque). */
  refreshCounters: () => void;
}

export const useManager = () => useOutletContext<ManagerContext>();

// Área do gestor: cabeçalho próprio (sem o menu da loja), barra lateral e conteúdo da rota.
export default function ManagerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [contadores, setContadores] = useState<Contadores | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    api.get<Contadores>('/painel/contadores').then(setContadores).catch(() => {});
  }, [location.pathname, tick]);

  const groups: { title: string; items: SidebarItem[] }[] = [
    {
      title: 'Operação',
      items: [
        { to: '/gestor', label: 'Painel', icon: 'dashboard' },
        { to: '/gestor/pedidos', label: 'Pedidos', icon: 'orders', badge: contadores?.pedidos_pendentes },
        { to: '/gestor/produtos', label: 'Produtos', icon: 'box', badge: contadores?.estoque_baixo },
        { to: '/gestor/importacao', label: 'Importação', icon: 'upload' },
        { to: '/gestor/clientes', label: 'Clientes', icon: 'users', badge: contadores?.clientes_novos_7_dias },
        { to: '/gestor/carrinhos', label: 'Carrinhos abandonados', icon: 'cart', badge: contadores?.carrinhos_abandonados },
      ],
    },
    {
      title: 'Vitrine',
      items: [
        { to: '/gestor/cms', label: 'Conteúdo (CMS)', icon: 'image' },
        { to: '/gestor/campanhas', label: 'Campanhas', icon: 'tag' },
        { to: '/gestor/metricas', label: 'Métricas', icon: 'chart' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        ...(user?.pode_gerenciar_equipe ? [{ to: '/gestor/equipe', label: 'Equipe', icon: 'shield' as const }] : []),
        { to: '/gestor/saude', label: 'Saúde do sistema', icon: 'pulse' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-surface font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2">
          <Link to="/gestor" aria-label="Painel do gestor"><Logo className="h-11" /></Link>
          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand">Gestor</span>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-muted sm:inline">{user?.nome}</span>
            <ThemeToggle />
            <Link to="/" className="rounded-full px-4 py-2 font-extrabold text-brand hover:bg-surface">Ver loja</Link>
            <button onClick={() => { logout(); navigate('/entrar'); }} className="rounded-full px-4 py-2 font-extrabold text-accent hover:bg-accent/5">Sair</button>
          </div>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <ManagerSidebar groups={groups} />
        <div className="min-w-0">
          <ErrorBoundary key={location.pathname}>
            <Outlet context={{ refreshCounters: () => setTick((n) => n + 1) } satisfies ManagerContext} />
          </ErrorBoundary>
        </div>
      </section>
      <ScrollRestoration />
    </div>
  );
}
