import { disponibilidadeLabel } from '../utils/format';
import type { Disponibilidade, FaixaEstoque } from '../types';

const styles: Record<Disponibilidade, string> = {
  disponivel: 'text-green-700',
  ultimas_unidades: 'text-amber-700',
  indisponivel: 'text-accent',
};

// Visitantes e clientes veem só a faixa de estoque ("Disponível", "Últimas unidades", "Mais de 50 disponíveis").
// A quantidade exata (`estoque`) só chega para a equipe e, quando vier, é mostrada junto.
export default function Availability({ value, faixa, estoque, className = '' }: {
  value: Disponibilidade; faixa?: FaixaEstoque; estoque?: number; className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${styles[value]} ${className}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {faixa?.rotulo ?? disponibilidadeLabel[value]}
      {estoque !== undefined && value !== 'indisponivel' && <span className="font-normal text-muted">· {estoque} em estoque</span>}
    </span>
  );
}
