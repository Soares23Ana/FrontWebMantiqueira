import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Campaigns from './Campaigns';
import Cms from './Cms';
import Customers from './Customers';
import Imports from './Imports';
import Metrics from './Metrics';
import Orders from './Orders';
import Overview from './Overview';
import Products from './Products';
import SystemHealth from './SystemHealth';
import Team from './Team';

// "Equipe" só para quem tem pode_gerenciar_equipe (o back responde 403 para os demais).
function TeamGuard() {
  const { user } = useAuth();
  return user?.pode_gerenciar_equipe ? <Team /> : <Navigate to="/gestor" replace />;
}

export const managerRoutes: RouteObject[] = [
  { index: true, element: <Overview /> },
  { path: 'pedidos', element: <Orders /> },
  { path: 'produtos', element: <Products /> },
  { path: 'importacao', element: <Imports /> },
  { path: 'clientes', element: <Customers /> },
  { path: 'cms', element: <Cms /> },
  { path: 'campanhas', element: <Campaigns /> },
  { path: 'metricas', element: <Metrics /> },
  { path: 'equipe', element: <TeamGuard /> },
  { path: 'saude', element: <SystemHealth /> },
  { path: '*', element: <Navigate to="/gestor" replace /> },
];
