import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refreshCounters = vi.fn();
vi.mock('./ManagerLayout', () => ({ useManager: () => ({ refreshCounters }) }));

import { PedidosDeSenha } from './PedidosDeSenha';

const PEDIDO = {
  id_pedido: 1,
  status: 'pendente',
  criado_em: '2026-11-17T21:10:00.000Z',
  cliente: { id_usuario: 7, nome_exibicao: 'Mercadinho LTDA', cnpj: '11.222.333/0001-81', telefone: '11999999999', ativo: true },
};
const LINK = 'https://site.exemplo/redefinir-senha?token=tok-teste';
const MENSAGEM = `Olá, Mercadinho! Segue o link para criar uma nova senha: ${LINK}`;

let pendentes: unknown[] = [];
let respostaEnvio: Record<string, unknown> = {};
let statusEnvio = 201;
const chamadas: string[] = [];

beforeEach(() => {
  pendentes = [PEDIDO];
  respostaEnvio = { link: LINK, expira_em: '2026-11-17T22:10:00.000Z', telefone_whatsapp: '5511999999999', mensagem: MENSAGEM };
  statusEnvio = 201;
  chamadas.length = 0;
  refreshCounters.mockReset();
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const u = new URL(url, 'http://localhost');
    chamadas.push(`${init?.method ?? 'GET'} ${u.pathname}${u.search}`);
    const json = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status });
    if (u.pathname.endsWith('/redefinicoes-senha/pedidos') && (init?.method ?? 'GET') === 'GET') {
      return json({ pedidos: pendentes, paginacao: { total: pendentes.length, pagina: 1, limite: 100, total_paginas: 1 } });
    }
    if (u.pathname.endsWith('/pedidos/1/enviar-link')) {
      if (statusEnvio === 201) pendentes = [];
      return json(statusEnvio === 201 ? respostaEnvio : { mensagem: 'Este pedido já foi atendido, dispensado ou expirou.', codigo: 'PEDIDO_NAO_PENDENTE' }, statusEnvio);
    }
    if (u.pathname.endsWith('/pedidos/1/dispensar')) {
      pendentes = [];
      return json({ mensagem: 'Pedido dispensado.', id_pedido: 1, status: 'dispensado' });
    }
    return json({});
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Pedidos de nova senha (tela de Clientes)', () => {
  it('lista os pendentes, com CNPJ, telefone e hora', async () => {
    render(<PedidosDeSenha onAbrir={vi.fn()} />);
    expect(await screen.findByText('Pedidos de nova senha (1)')).toBeInTheDocument();
    expect(screen.getByText('Mercadinho LTDA')).toBeInTheDocument();
    expect(screen.getByText('11.222.333/0001-81')).toBeInTheDocument();
    expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
    expect(screen.getByText(/Pediu em/)).toBeInTheDocument();
    expect(chamadas[0]).toContain('GET /api/v1/redefinicoes-senha/pedidos?status=pendente');
  });

  it('sem pedidos pendentes não mostra nada', async () => {
    pendentes = [];
    const { container } = render(<PedidosDeSenha onAbrir={vi.fn()} />);
    await waitFor(() => expect(chamadas.length).toBeGreaterThan(0));
    expect(container).toBeEmptyDOMElement();
  });

  it('"Enviar link": chama a API, abre o WhatsApp com o telefone e a mensagem da resposta e atualiza o selo', async () => {
    const abrir = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<PedidosDeSenha onAbrir={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar link' }));

    await waitFor(() => expect(abrir).toHaveBeenCalledTimes(1));
    const [url] = abrir.mock.calls[0] as [string];
    expect(url).toBe(`https://wa.me/5511999999999?text=${encodeURIComponent(MENSAGEM)}`);
    expect(chamadas).toContain('POST /api/v1/redefinicoes-senha/pedidos/1/enviar-link');
    expect(refreshCounters).toHaveBeenCalled();
    // o modal de reserva (copiar link) continua na tela, e a lista só atualiza ao fechá-lo
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Link para Mercadinho LTDA/)).toHaveValue(LINK);
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(screen.queryByText('Pedidos de nova senha (1)')).not.toBeInTheDocument());
  });

  it('telefone que a API não conseguiu normalizar: não abre o WhatsApp e mostra o aviso com o link', async () => {
    respostaEnvio = { link: LINK, expira_em: '2026-11-17T22:10:00.000Z', telefone_whatsapp: null, mensagem: MENSAGEM, aviso: 'O telefone cadastrado não parece válido para o WhatsApp. Entre em contato com o cliente de outro jeito e envie o link.' };
    const abrir = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<PedidosDeSenha onAbrir={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar link' }));
    expect(await screen.findByText(/não parece válido para o WhatsApp/)).toBeInTheDocument();
    expect(abrir).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'Enviar pelo WhatsApp' })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Link para Mercadinho LTDA/)).toHaveValue(LINK);
  });

  it('pedido já atendido por outra pessoa (409): mostra o erro e atualiza a lista', async () => {
    statusEnvio = 409;
    const abrir = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<PedidosDeSenha onAbrir={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar link' }));
    await waitFor(() => expect(chamadas.filter((c) => c.startsWith('GET')).length).toBeGreaterThan(1));
    expect(abrir).not.toHaveBeenCalled();
  });

  it('"Dispensar" pede confirmação, chama a API e atualiza a lista e o selo', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<PedidosDeSenha onAbrir={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Dispensar' }));
    await waitFor(() => expect(chamadas).toContain('POST /api/v1/redefinicoes-senha/pedidos/1/dispensar'));
    expect(refreshCounters).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Pedidos de nova senha (1)')).not.toBeInTheDocument());
  });

  it('"Dispensar" cancelado na confirmação não chama a API', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<PedidosDeSenha onAbrir={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Dispensar' }));
    expect(chamadas.some((c) => c.includes('/dispensar'))).toBe(false);
  });

  it('clicar no nome abre o cliente', async () => {
    const onAbrir = vi.fn();
    render(<PedidosDeSenha onAbrir={onAbrir} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Mercadinho LTDA' }));
    expect(onAbrir).toHaveBeenCalledWith(7);
  });
});
