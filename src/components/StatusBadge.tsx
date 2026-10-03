import type { OrderStatus } from '../types';

const styles: Record<OrderStatus, string> = {
  Pendente: 'bg-accent/10 text-accent',
  Separando: 'bg-amber-100 text-amber-800',
  Enviado: 'bg-brand/10 text-brand',
  Entregue: 'bg-green-100 text-green-800',
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-3 py-1 text-sm font-medium ${styles[status]}`}>{status}</span>;
}
