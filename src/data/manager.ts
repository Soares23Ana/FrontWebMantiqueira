import type { Order, OrderStatus } from '../types';

// Dados simulados: no futuro virão da API.
export const statusFlow: OrderStatus[] = ['Pendente', 'Separando', 'Enviado', 'Entregue'];
export const LOW_STOCK = 10;

export const initialStock: Record<number, number> = { 1: 120, 2: 45, 3: 8, 4: 60, 5: 32, 6: 15, 7: 6, 8: 90, 9: 4 };

export const initialOrders: Order[] = [
  { id: 1041, customer: 'Mercadinho Boa Vista', items: 48, date: '02/10/2026', status: 'Pendente' },
  { id: 1040, customer: 'Farmácia Central', items: 120, date: '02/10/2026', status: 'Separando' },
  { id: 1039, customer: 'Empório do Bairro', items: 36, date: '01/10/2026', status: 'Enviado' },
  { id: 1038, customer: 'Drogaria Nova Era', items: 85, date: '30/09/2026', status: 'Entregue' },
  { id: 1037, customer: 'Mercado São José', items: 60, date: '30/09/2026', status: 'Pendente' },
];
