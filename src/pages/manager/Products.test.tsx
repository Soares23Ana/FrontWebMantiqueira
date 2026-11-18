import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./ManagerLayout', () => ({ useManager: () => ({ refreshCounters: vi.fn() }) }));
vi.mock('../../utils/csv', () => ({ downloadCsv: vi.fn() }));

import { downloadCsv } from '../../utils/csv';
import Products from './Products';

function produto(id: number, sku: string, nome: string, imagem: string | null, ativo = true) {
  return {
    id_produto: id, sku, nome, descricao: null, destaques: [], imagem_url: imagem, ativo, estoque: 10, estoque_minimo: 5,
    multiplo_venda: 1, disponibilidade: 'disponivel', categoria: null, subcategoria: null, marca: { id_marca: 1, nome: 'Marca X' },
  };
}

const TODOS = [
  produto(1, 'SKU-A', 'Produto Com Foto A', '/img/a.webp'),
  produto(2, 'SKU-B', 'Produto Sem Foto B', null),
  produto(3, 'SKU-C', 'Produto Sem Foto C Inativo', null, false),
  produto(4, 'SKU-D', 'Produto Com Foto D', '/img/d.webp'),
];

// A API de mentira responde pelo endereço, como o back de verdade.
function falarComApi(produtos = TODOS) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(url, 'http://localhost');
    const q = u.searchParams;
    const json = (corpo: unknown) => new Response(JSON.stringify(corpo), { status: 200 });
    if (u.pathname.endsWith('/produtos')) {
      const incluirInativos = q.get('incluir_inativos') === 'true';
      const visiveis = incluirInativos ? produtos : produtos.filter((p) => p.ativo);
      const limite = Number(q.get('limite') ?? 10);
      return json({ produtos: visiveis.slice(0, limite), paginacao: { total: visiveis.length, pagina: 1, limite, total_paginas: Math.max(1, Math.ceil(visiveis.length / limite)) } });
    }
    if (u.pathname.endsWith('/categorias')) return json({ categorias: [] });
    if (u.pathname.endsWith('/marcas')) return json({ marcas: [] });
    return json({});
  }));
}

function abrir() {
  return render(<MemoryRouter><Products /></MemoryRouter>);
}

describe('Produtos: contagem e produtos sem foto', () => {
  beforeEach(() => {
    vi.mocked(downloadCsv).mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra quantos produtos estão no site e quantos há no total', async () => {
    falarComApi();
    abrir();
    expect(await screen.findByText('3 produtos no site')).toBeInTheDocument();
    expect(screen.getByText('4 cadastrados no total · 1 inativo')).toBeInTheDocument();
  });

  it('mostra o contador "sem foto" e o filtro lista só esses produtos', async () => {
    falarComApi();
    abrir();
    const botao = await screen.findByRole('button', { name: /2 sem foto/ });
    expect(screen.getByText('Produto Com Foto A')).toBeInTheDocument();

    await userEvent.click(botao);
    expect(botao).toHaveAttribute('aria-pressed', 'true');
    const tabela = screen.getByRole('table');
    expect(within(tabela).getByText('Produto Sem Foto B')).toBeInTheDocument();
    expect(within(tabela).getByText('Produto Sem Foto C Inativo')).toBeInTheDocument();
    expect(within(tabela).queryByText('Produto Com Foto A')).not.toBeInTheDocument();

    await userEvent.click(botao); // desliga o filtro
    expect(await screen.findByText('Produto Com Foto A')).toBeInTheDocument();
  });

  it('baixa a lista de SKUs sem foto com o nome de arquivo sugerido', async () => {
    falarComApi();
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Baixar lista de SKUs sem foto' }));
    expect(downloadCsv).toHaveBeenCalledTimes(1);
    const [arquivo, cabecalho, linhas] = vi.mocked(downloadCsv).mock.calls[0];
    expect(arquivo).toBe('produtos-sem-foto.csv');
    expect(cabecalho).toContain('Nome do arquivo sugerido');
    expect(linhas).toEqual([
      ['SKU-B', 'Produto Sem Foto B', 'Marca X', 'SKU-B.jpg', 'Sim'],
      ['SKU-C', 'Produto Sem Foto C Inativo', 'Marca X', 'SKU-C.jpg', 'Não'],
    ]);
  });

  it('quando todos têm foto, mostra "Todos com foto" e não oferece a lista', async () => {
    falarComApi(TODOS.filter((p) => p.imagem_url));
    abrir();
    expect(await screen.findByRole('button', { name: 'Todos com foto' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Baixar lista de SKUs/ })).not.toBeInTheDocument();
  });
});
