import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./ManagerLayout', () => ({ useManager: () => ({ refreshCounters: vi.fn() }) }));
vi.mock('./Taxonomies', () => ({ default: () => null }));

import Products from './Products';

const PRODUTO = {
  id_produto: 9, sku: 'SKU-9', nome: 'Produto Do Estoque', descricao: null, destaques: [], imagem_url: '/img/x.webp', ativo: true, estoque: 10,
  estoque_minimo: 5, multiplo_venda: 1, disponibilidade: 'disponivel', categoria: null, subcategoria: null, marca: null,
};

let patch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  patch = vi.fn();
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const u = new URL(url, 'http://localhost');
    const json = (corpo: unknown) => new Response(JSON.stringify(corpo), { status: 200 });
    if (init?.method === 'PATCH') {
      patch(u.pathname, JSON.parse(String(init.body)));
      return json({ produto: { ...PRODUTO, estoque: 12 } });
    }
    if (u.pathname.endsWith('/movimentacoes')) return json({ movimentacoes: [] });
    if (u.pathname.endsWith('/produtos')) return json({ produtos: [PRODUTO], paginacao: { total: 1, pagina: 1, limite: 10, total_paginas: 1 } });
    if (u.pathname.endsWith('/categorias')) return json({ categorias: [] });
    if (u.pathname.endsWith('/marcas')) return json({ marcas: [] });
    return json({});
  }));
});
afterEach(() => vi.unstubAllGlobals());

async function abrirModal() {
  render(<MemoryRouter><Products /></MemoryRouter>);
  await userEvent.click(await screen.findByRole('button', { name: 'Ajustar estoque de Produto Do Estoque' }));
  return screen.getByRole('dialog', { name: 'Estoque' });
}

describe('Tabela: ações de estoque por ícone', () => {
  it('o histórico só tem o ícone do relógio (sem o link de texto) e abre a janela com o histórico primeiro', async () => {
    render(<MemoryRouter><Products /></MemoryRouter>);
    const relogio = await screen.findByRole('button', { name: 'Ver histórico de estoque de Produto Do Estoque' });
    expect(relogio).toHaveAttribute('title', 'Histórico de estoque');
    expect(screen.getByRole('button', { name: 'Ajustar estoque de Produto Do Estoque' })).toHaveAttribute('title', 'Ajustar estoque');
    expect(screen.getByRole('button', { name: 'Editar Produto Do Estoque' })).toHaveAttribute('title', 'Editar produto');
    expect(screen.queryByText(/Quem mexeu no estoque/)).not.toBeInTheDocument();
    expect(screen.getByText('SKU-9')).toHaveClass('whitespace-nowrap');

    await userEvent.click(relogio);
    const janela = screen.getByRole('dialog', { name: 'Histórico de estoque' });
    expect(within(janela).getByRole('region', { name: 'Histórico de estoque' })).toBeInTheDocument();
    expect(within(janela).getByRole('button', { name: 'Salvar ajuste' })).toBeInTheDocument();
  });
});

describe('Janela de estoque: formulário de ajuste', () => {
  it('usa rótulos curtos e o texto de ajuda muda com o modo', async () => {
    const janela = await abrirModal();
    expect(within(janela).getByLabelText(/^Ajuste/)).toBeInTheDocument();
    expect(within(janela).getByLabelText(/^Observação/)).toBeInTheDocument();
    expect(within(janela).getByText('Use -2 para tirar 2 unidades ou 24 para somar 24.')).toBeVisible();
    expect(janela.querySelector('[title]')).toBeNull();

    await userEvent.click(within(janela).getByRole('button', { name: 'Definir valor' }));
    expect(within(janela).getByLabelText(/^Novo valor/)).toBeInTheDocument();
    expect(within(janela).getByText('Informe a quantidade total que existe agora.')).toBeVisible();
    expect(within(janela).queryByText(/Use -2/)).not.toBeInTheDocument();
  });

  it('o controle segmentado marca o modo ativo com aria-pressed', async () => {
    const janela = await abrirModal();
    const somar = within(janela).getByRole('button', { name: 'Somar / subtrair' });
    const definir = within(janela).getByRole('button', { name: 'Definir valor' });
    expect(somar).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(definir);
    expect(definir).toHaveAttribute('aria-pressed', 'true');
    expect(somar).toHaveAttribute('aria-pressed', 'false');
  });

  it('Ajuste e Observação têm a mesma classe de altura', async () => {
    const janela = await abrirModal();
    const a = within(janela).getByLabelText(/^Ajuste/);
    const o = within(janela).getByLabelText(/^Observação/);
    expect(a.className).toContain('h-11');
    expect(o.className).toBe(a.className);
  });

  it('mostra o resultado previsto só com número válido e avisa quando ficaria negativo', async () => {
    const janela = await abrirModal();
    const campo = within(janela).getByLabelText(/^Ajuste/);
    expect(within(janela).queryByText(/Ficará com/)).not.toBeInTheDocument();
    await userEvent.type(campo, '-2');
    expect(within(janela).getByText('Ficará com 8 unidades')).toBeVisible();
    await userEvent.clear(campo);
    await userEvent.type(campo, '-11');
    expect(within(janela).queryByText(/Ficará com/)).not.toBeInTheDocument();
    expect(within(janela).getByText('O resultado ficaria negativo.')).toBeVisible();
    await userEvent.clear(campo);
    await userEvent.type(campo, '1.5');
    expect(within(janela).queryByText(/Ficará com|negativo/)).not.toBeInTheDocument();

    await userEvent.click(within(janela).getByRole('button', { name: 'Definir valor' }));
    await userEvent.clear(within(janela).getByLabelText(/^Novo valor/));
    await userEvent.type(within(janela).getByLabelText(/^Novo valor/), '24');
    expect(within(janela).getByText('Ficará com 24 unidades')).toBeVisible();
  });

  it('Salvar ajuste chama a mesma API com os mesmos dados (ajuste e definir valor)', async () => {
    const janela = await abrirModal();
    await userEvent.type(within(janela).getByLabelText(/^Ajuste/), '2');
    await userEvent.type(within(janela).getByLabelText(/^Observação/), 'chegada de mercadoria');
    await userEvent.click(within(janela).getByRole('button', { name: 'Salvar ajuste' }));
    await vi.waitFor(() => expect(patch).toHaveBeenCalledWith('/api/v1/produtos/9/estoque', { ajuste: 2, observacao: 'chegada de mercadoria' }));
    await vi.waitFor(() => expect(within(janela).getByLabelText(/^Observação/)).toHaveValue('')); // o formulário limpou: salvou
    expect(within(janela).getByText('unidades').parentElement).toHaveTextContent('12');

    await userEvent.click(within(janela).getByRole('button', { name: 'Definir valor' }));
    await userEvent.type(within(janela).getByLabelText(/^Novo valor/), '30');
    await userEvent.type(within(janela).getByLabelText(/^Observação/), 'contagem');
    await userEvent.click(within(janela).getByRole('button', { name: 'Salvar ajuste' }));
    await vi.waitFor(() => expect(patch).toHaveBeenLastCalledWith('/api/v1/produtos/9/estoque', { quantidade: 30, observacao: 'contagem' }));
  });

  it('erros de validação aparecem no espaço de ajuda, sem chamar a API', async () => {
    const janela = await abrirModal();
    await userEvent.click(within(janela).getByRole('button', { name: 'Salvar ajuste' }));
    expect(within(janela).getAllByRole('alert').map((a) => a.textContent)).toEqual(['Informe um número inteiro.', 'A observação é obrigatória (3 a 500 caracteres).']);
    expect(patch).not.toHaveBeenCalled();
  });
});
