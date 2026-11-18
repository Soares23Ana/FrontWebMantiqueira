import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../api/client')>();
  return { ...real, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { nome: 'Ana', pode_gerenciar_equipe: false }, logout: vi.fn() }) }));
vi.mock('../../components/ThemeToggle', () => ({ default: () => null }));

import { api } from '../../api/client';
import ManagerLayout from './ManagerLayout';

const abrir = () => render(
  <RouterProvider router={createMemoryRouter([{ path: '/gestor', element: <ManagerLayout /> }], { initialEntries: ['/gestor'] })} />,
);
const itemPedidos = () => screen.getByRole('link', { name: /^Pedidos/ });

beforeEach(() => vi.mocked(api.get).mockReset());

describe('Cabeçalho da área do gestor', () => {
  it('não tem mais o selo "GESTOR", mas o cabeçalho tem rótulo acessível e mantém logo, usuário, Ver loja e Sair', async () => {
    vi.mocked(api.get).mockResolvedValue({ pedidos_pendentes: 0, estoque_baixo: 0, clientes_novos_7_dias: 0 });
    abrir();
    const cabecalho = await screen.findByRole('banner', { name: 'Área do gestor' });
    expect(within(cabecalho).queryByText(/^gestor$/i)).not.toBeInTheDocument();
    expect(within(cabecalho).getByRole('link', { name: 'Painel do gestor' })).toBeInTheDocument();
    expect(within(cabecalho).getByText('Ana')).toBeInTheDocument();
    expect(within(cabecalho).getByRole('link', { name: 'Ver loja' })).toBeInTheDocument();
    expect(within(cabecalho).getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });
});

describe('Menu do gestor: selo de Pedidos', () => {
  it('usa pedidos_novos, não pedidos_pendentes', async () => {
    vi.mocked(api.get).mockResolvedValue({ pedidos_pendentes: 7, pedidos_novos: 2, estoque_baixo: 0, clientes_novos_7_dias: 0 });
    abrir();
    expect(await within(itemPedidos()).findByText('2')).toBeInTheDocument();
    expect(within(itemPedidos()).queryByText('7')).not.toBeInTheDocument();
  });

  it('sem pedidos_novos na resposta (API antiga) não mostra selo', async () => {
    vi.mocked(api.get).mockResolvedValue({ pedidos_pendentes: 7, estoque_baixo: 0, clientes_novos_7_dias: 0 });
    abrir();
    await vi.waitFor(() => expect(api.get).toHaveBeenCalled());
    expect(within(itemPedidos()).queryByText('7')).not.toBeInTheDocument();
  });
});
