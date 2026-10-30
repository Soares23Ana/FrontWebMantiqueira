import type { StatusPedido } from '../types';

// Mesmos status do back-end: Aguardando Separação → Em Separação → Saiu para Entrega → Entregue (ou Cancelado).
const styles: Record<StatusPedido, string> = {
  'Aguardando Separação': 'bg-accent/10 text-accent',
  'Em Separação': 'bg-amber-100 text-amber-800',
  'Saiu para Entrega': 'bg-brand/10 text-brand',
  Entregue: 'bg-green-100 text-green-800',
  Cancelado: 'bg-black/10 text-muted',
};

export default function StatusBadge({ status }: { status: StatusPedido }) {
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${styles[status] ?? 'bg-surface'}`}>{status}</span>;
}
