import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import OrdersChart from './OrdersChart';

const dias = [
  { data: '2026-11-01', total: 0, cancelados: 0 },
  { data: '2026-11-02', total: 9, cancelados: 1 },
  { data: '2026-11-03', total: 4, cancelados: 0 },
];

describe('Gráfico de pedidos por dia', () => {
  it('sem pedidos no período mostra o aviso', () => {
    render(<OrdersChart dias={[{ data: '2026-11-01', total: 0, cancelados: 0 }]} />);
    expect(screen.getByText('Nenhum pedido no período.')).toBeInTheDocument();
  });

  it('mostra o resumo: total, feitos, cancelados e o maior dia', () => {
    render(<OrdersChart dias={dias} />);
    expect(screen.getByText(/pedido\(s\)$/, { selector: 'span' })).toHaveTextContent('13 pedido(s)'); // total
    expect(screen.getByText(/^feitos$/)).toHaveTextContent('12 feitos');           // 13 - 1 cancelado
    expect(screen.getByText(/^cancelados$/)).toHaveTextContent('1 cancelados');
    expect(screen.getByText(/Maior dia:/)).toHaveTextContent('02/11/2026');
    expect(screen.getByRole('img')).toHaveAccessibleName('Pedidos por dia: 13 no período, 1 cancelado(s)');
  });

  it('o eixo termina num número redondo (múltiplo de 4)', () => {
    render(<OrdersChart dias={dias} />);
    // maior dia = 9 → topo 12; marcas 0, 3, 6, 9, 12
    for (const marca of ['0', '3', '6', '9', '12']) {
      expect(screen.getAllByText(marca).length).toBeGreaterThan(0);
    }
  });
});
