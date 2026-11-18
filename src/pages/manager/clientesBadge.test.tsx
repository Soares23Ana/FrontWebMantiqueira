import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ManagerSidebar from '../../components/manager/ManagerSidebar';
import { seloClientes } from './clientesBadge';

describe('selo de Clientes no menu', () => {
  it('soma os pedidos de nova senha e os clientes novos', () => {
    expect(seloClientes(2, 1)).toEqual({ total: 3, texto: '2 pedidos de nova senha e 1 cliente novo nos últimos 7 dias' });
  });

  it('só um dos dois', () => {
    expect(seloClientes(1, 0)).toEqual({ total: 1, texto: '1 pedido de nova senha' });
    expect(seloClientes(undefined, 4)).toEqual({ total: 4, texto: '4 clientes novos nos últimos 7 dias' });
  });

  it('nenhum (ou ausente): total 0, sem texto', () => {
    expect(seloClientes(0, 0)).toEqual({ total: 0, texto: '' });
    expect(seloClientes(undefined, undefined)).toEqual({ total: 0, texto: '' });
  });

  it('o menu mostra o número somado com texto acessível, e nada quando é 0', () => {
    const { total, texto } = seloClientes(2, 1);
    const { rerender } = render(
      <MemoryRouter><ManagerSidebar groups={[{ title: 'Operação', items: [{ to: '/gestor/clientes', label: 'Clientes', icon: 'users', badge: total, badgeLabel: texto }] }]} /></MemoryRouter>,
    );
    const selo = screen.getByLabelText('2 pedidos de nova senha e 1 cliente novo nos últimos 7 dias');
    expect(selo).toHaveTextContent('3');
    expect(selo).toHaveAttribute('title', texto);
    rerender(<MemoryRouter><ManagerSidebar groups={[{ title: 'Operação', items: [{ to: '/gestor/clientes', label: 'Clientes', icon: 'users', badge: 0, badgeLabel: '' }] }]} /></MemoryRouter>);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
