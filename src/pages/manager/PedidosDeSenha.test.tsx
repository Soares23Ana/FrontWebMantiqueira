import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refreshCounters = vi.fn();
vi.mock('./ManagerLayout', () => ({ useManager: () => ({ refreshCounters }) }));
vi.mock('./CustomerSupport', () => ({ default: () => null }));

import { PedidosDeSenha } from './Customers';

const PEDIDO = {
  id_solicitacao: 1,
  solicitado_em: '2026-11-17T21:10:00.000Z',
  cliente: { id_usuario: 7, nome_exibicao: 'Mercadinho LTDA', cnpj: '11.222.333/0001-81', telefone: '11999999999', email: 'c@m.com', ativo: true },
};

let pendentes: unknown[] = [];
const chamadas: string[] = [];

beforeEach(() => {
  pendentes = [PEDIDO];
  chamadas.length = 0;
  refreshCounters.mockReset();
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const u = new URL(url, 'http://localhost');
    chamadas.push(`${init?.method ?? 'GET'} ${u.pathname}`);
    const json = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status });
    if (u.pathname.endsWith('/clientes/redefinicoes-pendentes')) return json({ solicitacoes: pendentes, total: pendentes.length });
    if (u.pathname.endsWith('/clientes/7/redefinicao-senha')) {
      pendentes = []; // o back dá o pedido como atendido
      return json({ mensagem: 'ok', token: 'tok-teste', expira_em: '2026-11-17T22:10:00.000Z' }, 201);
    }
    return json({});
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Pedidos de nova senha (tela de Clientes)', () => {
  it('lista quem pediu, com CNPJ, telefone e hora', async () => {
    render(<PedidosDeSenha onAbrir={vi.fn()} />);
    expect(await screen.findByText('Pedidos de nova senha (1)')).toBeInTheDocument();
    expect(screen.getByText('Mercadinho LTDA')).toBeInTheDocument();
    expect(screen.getByText('11.222.333/0001-81')).toBeInTheDocument();
    expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
    expect(screen.getByText(/Pediu em/)).toBeInTheDocument();
  });

  it('sem pedidos pendentes não mostra nada', async () => {
    pendentes = [];
    const { container } = render(<PedidosDeSenha onAbrir={vi.fn()} />);
    await waitFor(() => expect(chamadas).toContain('GET /api/v1/clientes/redefinicoes-pendentes'));
    expect(container).toBeEmptyDOMElement();
  });

  it('"Enviar link": gera o link, abre o WhatsApp do cliente com a mensagem e atualiza o selo do menu', async () => {
    const abrir = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<PedidosDeSenha onAbrir={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar link' }));

    await waitFor(() => expect(abrir).toHaveBeenCalledTimes(1));
    const [url] = abrir.mock.calls[0] as [string];
    expect(url).toMatch(/^https:\/\/wa\.me\/5511999999999\?text=/);
    expect(decodeURIComponent(url)).toContain('Mercadinho LTDA');
    expect(decodeURIComponent(url)).toContain('/redefinir-senha?token=tok-teste');
    expect(chamadas).toContain('POST /api/v1/clientes/7/redefinicao-senha');
    expect(refreshCounters).toHaveBeenCalled();
    // o modal de reserva (copiar link) continua na tela, e a lista só atualiza ao fechá-lo
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(screen.queryByText('Pedidos de nova senha (1)')).not.toBeInTheDocument());
    abrir.mockRestore();
  });

  it('clicar no nome abre o cliente', async () => {
    const onAbrir = vi.fn();
    render(<PedidosDeSenha onAbrir={onAbrir} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Mercadinho LTDA' }));
    expect(onAbrir).toHaveBeenCalledWith(7);
  });
});
