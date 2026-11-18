import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const refreshCounters = vi.fn();
vi.mock('./ManagerLayout', () => ({ useManager: () => ({ refreshCounters }) }));
vi.mock('../../api/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../api/client')>();
  return { ...real, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});

import { api } from '../../api/client';
import Orders from './Orders';

function pedido(id: number, nome: string, extra: Record<string, unknown> = {}) {
  return {
    id_pedido: id, status: 'Aguardando Separação', data_pedido: '2026-11-17T12:00:00.000Z', data_entrega_desejada: null, data_entrega: null,
    observacao: null, motivo_cancelamento: null, endereco_entrega: null, itens: [], total_itens: 3, proximo_status: null,
    cliente: { nome_exibicao: nome, cnpj: '00.000.000/0001-00', nome, email: 'a@b.c', telefone: null }, ...extra,
  };
}
const pag = { total: 3, pagina: 1, limite: 10, total_paginas: 1 };

beforeEach(() => {
  refreshCounters.mockReset();
  vi.mocked(api.get).mockReset().mockImplementation(async (path: string) => {
    if (path === '/pedidos/1') return { pedido: pedido(1, 'Mercado Novo', { visto: true }) };
    return { pedidos: [pedido(1, 'Mercado Novo', { visto: false }), pedido(2, 'Padaria Vista', { visto: true }), pedido(3, 'Loja Antiga')], paginacao: pag };
  });
});

const linha = async (nome: string) => (await screen.findByText(nome)).closest('tr') as HTMLElement;
const abrir = () => render(<MemoryRouter><Orders /></MemoryRouter>);

describe('Pedidos: etiqueta "Novo"', () => {
  it('aparece só em pedido com visto=false; visto e campo ausente ficam normais', async () => {
    abrir();
    expect(within(await linha('Mercado Novo')).getByText('Novo')).toBeInTheDocument();
    expect(within(await linha('Padaria Vista')).queryByText('Novo')).not.toBeInTheDocument();
    expect(within(await linha('Loja Antiga')).queryByText('Novo')).not.toBeInTheDocument();
    expect(screen.getAllByText('Novo')).toHaveLength(1);
  });

  it('carregar a lista não marca nada nem atualiza o selo', async () => {
    abrir();
    await linha('Mercado Novo');
    expect(refreshCounters).not.toHaveBeenCalled();
    expect(vi.mocked(api.get).mock.calls.every(([p]) => p === '/pedidos')).toBe(true);
  });

  it('o chip "Só novos" pede ?visto=false à API', async () => {
    abrir();
    await linha('Mercado Novo');
    const chip = screen.getByRole('button', { name: 'Só novos' });
    await userEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await vi.waitFor(() => expect(vi.mocked(api.get)).toHaveBeenCalledWith('/pedidos', expect.objectContaining({ visto: false })));
  });

  it('abrir o detalhe com sucesso atualiza o selo (refreshCounters) e recarrega a lista', async () => {
    abrir();
    await userEvent.click(within(await linha('Mercado Novo')).getByRole('button', { name: 'Detalhes' }));
    await screen.findByRole('dialog', { name: 'Pedido #1' });
    await vi.waitFor(() => expect(refreshCounters).toHaveBeenCalledTimes(1));
    const listagens = vi.mocked(api.get).mock.calls.filter(([p]) => p === '/pedidos').length;
    expect(listagens).toBeGreaterThanOrEqual(2);
  });

  it('se o detalhe falhar, não atualiza o selo', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/pedidos/1') throw new Error('falhou');
      return { pedidos: [pedido(1, 'Mercado Novo', { visto: false })], paginacao: pag };
    });
    abrir();
    await userEvent.click(within(await linha('Mercado Novo')).getByRole('button', { name: 'Detalhes' }));
    await screen.findByRole('dialog', { name: 'Pedido #1' });
    expect(refreshCounters).not.toHaveBeenCalled();
  });
});
