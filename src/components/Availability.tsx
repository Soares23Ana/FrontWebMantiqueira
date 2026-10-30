import { disponibilidadeLabel } from '../utils/format';
import type { Disponibilidade } from '../types';

const styles: Record<Disponibilidade, string> = {
  disponivel: 'text-green-700',
  ultimas_unidades: 'text-amber-700',
  indisponivel: 'text-accent',
};

// Visitante vê só a disponibilidade; quem está logado vê também o estoque exato.
export default function Availability({ value, estoque, className = '' }: { value: Disponibilidade; estoque?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${styles[value]} ${className}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {disponibilidadeLabel[value]}
      {estoque !== undefined && value !== 'indisponivel' && <span className="font-normal text-muted">· {estoque} em estoque</span>}
    </span>
  );
}
