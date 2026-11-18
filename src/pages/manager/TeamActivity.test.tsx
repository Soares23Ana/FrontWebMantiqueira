import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TeamActivity from './TeamActivity';

const PAG = (total: number) => ({ total, pagina: 1, limite: 20, total_paginas: 1 });
const REGISTROS = [
  { id_auditoria: 3, usuario: { id_usuario: 1, nome: 'Ana Gestora' }, acao: 'produto.editar', entidade: 'produto', id_entidade: 12,
    resumo: { alteracoes: { preco: { antes: 10, depois: 12.5 }, nome: { depois: 'Café' } } }, criado_em: '2026-11-17T21:10:00.000Z' },
  { id_auditoria: 2, usuario: null, acao: 'pedido_senha.criado', entidade: 'cliente', id_entidade: 7, resumo: { alteracoes: {} }, criado_em: '2026-11-17T20:00:00.000Z' },
  { id_auditoria: 1, usuario: null, acao: 'usuario.redefinicao_senha_gerada_por_terminal', entidade: 'usuario', id_entidade: 2,
    resumo: { alteracoes: { obs: { antes: 'x'.repeat(300) } } }, criado_em: '2026-11-17T19:00:00.000Z' },
  { id_auditoria: 4, usuario: { id_usuario: 1, nome: 'Ana Gestora' }, acao: 'acao.nova_desconhecida', entidade: 'coisa', id_entidade: 9,
    resumo: { alteracoes: { html: { antes: '', depois: '<img src=x onerror=alert(1)>' } } }, criado_em: '2026-11-17T18:00:00.000Z' },
];

let resposta: () => Response;
const chamadas: string[] = [];

beforeEach(() => {
  chamadas.length = 0;
  resposta = () => new Response(JSON.stringify({ registros: REGISTROS, paginacao: PAG(4) }), { status: 200 });
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(url, 'http://localhost');
    chamadas.push(`${u.pathname}${u.search}`);
    return resposta();
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('Atividade da equipe', () => {
  it('renderiza as linhas com ação traduzida, item e resumo "campo: antes → depois"', async () => {
    render(<TeamActivity />);
    expect(await screen.findByText('Produto editado')).toBeInTheDocument();
    expect(screen.getAllByText('Ana Gestora').length).toBeGreaterThan(0);
    expect(screen.getByText('preco: 10 → 12.5')).toBeInTheDocument();
    expect(screen.getByText('nome: — → Café')).toBeInTheDocument();
    expect(screen.getByText('#12')).toBeInTheDocument();
    expect(chamadas[0]).toContain('/api/v1/auditoria?');
    expect(chamadas[0]).toContain('limite=20');
  });

  it('usuário null: cliente pelo site no pedido de senha, servidor nos outros casos', async () => {
    render(<TeamActivity />);
    expect(await screen.findByText('Cliente (pelo site)')).toBeInTheDocument();
    expect(screen.getByText('Servidor (terminal)')).toBeInTheDocument();
  });

  it('ação desconhecida mostra o código cru; HTML vira texto; textos longos são cortados com "..."', async () => {
    const { container } = render(<TeamActivity />);
    expect(await screen.findByText('acao.nova_desconhecida')).toBeInTheDocument();
    expect(screen.getByText('html: — → <img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText(`obs: ${'x'.repeat(80)}... → —`)).toBeInTheDocument();
  });

  it('estado vazio', async () => {
    resposta = () => new Response(JSON.stringify({ registros: [], paginacao: PAG(0) }), { status: 200 });
    render(<TeamActivity />);
    expect(await screen.findByText('Nenhuma atividade encontrada.')).toBeInTheDocument();
  });

  it('filtro de tipo chama a API com `entidade`, e "Limpar" volta ao normal', async () => {
    render(<TeamActivity />);
    await screen.findByText('Produto editado');
    await userEvent.selectOptions(screen.getByLabelText('Tipo de item'), 'Pop-up');
    await waitFor(() => expect(chamadas.some((c) => c.includes('entidade=popup'))).toBe(true));
    await userEvent.click(await screen.findByRole('button', { name: 'Limpar' }));
    await waitFor(() => expect(chamadas[chamadas.length - 1]).not.toContain('entidade='));
    expect(screen.getByLabelText('Tipo de item')).toHaveValue('');
  });

  it('os nove valores do filtro são os que o back grava em `entidade`', async () => {
    render(<TeamActivity />);
    await screen.findByText('Produto editado');
    const valores = within(screen.getByLabelText('Tipo de item')).getAllByRole('option').map((o) => (o as HTMLOptionElement).value).filter(Boolean);
    expect(valores).toEqual(['produto', 'cliente', 'pedido', 'banner', 'popup', 'bloco_cms', 'campanha', 'configuracao', 'usuario']);
    expect([...valores].sort()).toEqual(['banner', 'bloco_cms', 'campanha', 'cliente', 'configuracao', 'pedido', 'popup', 'produto', 'usuario']);
  });

  it('"Equipe" envia entidade=usuario e "Bloco de conteúdo" envia entidade=bloco_cms', async () => {
    render(<TeamActivity />);
    await screen.findByText('Produto editado');
    await userEvent.selectOptions(screen.getByLabelText('Tipo de item'), 'Equipe');
    await waitFor(() => expect(chamadas.some((c) => c.startsWith('/api/v1/auditoria') && c.includes('entidade=usuario'))).toBe(true));
    await userEvent.selectOptions(screen.getByLabelText('Tipo de item'), 'Bloco de conteúdo');
    await waitFor(() => expect(chamadas.some((c) => c.includes('entidade=bloco_cms'))).toBe(true));
  });

  it('coluna Item: usuario aparece como "Equipe"; valor desconhecido, cru', async () => {
    render(<TeamActivity />);
    await screen.findByText('Produto editado');
    const linhas = screen.getAllByRole('row');
    expect(linhas.some((l) => within(l).queryByText('Equipe') && l.textContent?.includes('#2'))).toBe(true);
    expect(linhas.some((l) => l.textContent?.includes('coisa'))).toBe(true);
  });

  it('filtro de data vai como `de`', async () => {
    render(<TeamActivity />);
    await screen.findByText('Produto editado');
    await userEvent.type(screen.getByLabelText('De'), '2026-11-01');
    await waitFor(() => expect(chamadas.some((c) => c.includes('de=2026-11-01'))).toBe(true));
  });

  it('erro da API mostra a mensagem e o botão de tentar de novo', async () => {
    resposta = () => new Response(JSON.stringify({ sucesso: false, mensagem: 'Filtro inválido.', codigo: 'FILTRO_INVALIDO' }), { status: 400 });
    render(<TeamActivity />);
    const alerta = await screen.findByRole('alert');
    expect(within(alerta).getByText('Filtro inválido.')).toBeInTheDocument();
    expect(within(alerta).getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});
