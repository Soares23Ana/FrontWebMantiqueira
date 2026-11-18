import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./ManagerLayout', () => ({ useManager: () => ({ refreshCounters: vi.fn() }) }));
vi.mock('../../utils/csv', () => ({ downloadCsv: vi.fn() }));
vi.mock('./Taxonomies', () => ({ default: () => <p>Tela de categorias e marcas</p> }));

import { downloadCsv } from '../../utils/csv';
import Products from './Products';

const BEBIDAS = { id_categoria: 1, nome: 'Bebidas', slug: 'bebidas' };

// Estoque mínimo 5 e múltiplo 1 em todos: estoque 0 = indisponível; 1 a 5 = últimas unidades; mais de 5 = disponível.
function produto(id: number, sku: string, nome: string, imagem: string | null, ativo = true, estoque = 10, categoria: typeof BEBIDAS | null = null) {
  return {
    id_produto: id, sku, nome, descricao: null, destaques: [], imagem_url: imagem, ativo, estoque, estoque_minimo: 5,
    multiplo_venda: 1, disponibilidade: 'disponivel', categoria, subcategoria: null, marca: { id_marca: 1, nome: 'Marca X' },
  };
}

const TODOS = [
  produto(1, 'SKU-A', 'Produto Com Foto A', '/img/a.webp', true, 10, BEBIDAS),
  produto(2, 'SKU-B', 'Produto Sem Foto B', null),
  produto(3, 'SKU-C', 'Produto Sem Foto C Inativo', null, false),
  produto(4, 'SKU-D', 'Produto Com Foto D', '/img/d.webp', true, 10, BEBIDAS),
  produto(5, 'SKU-E', 'Produto Estoque Baixo E', '/img/e.webp', true, 5), // igual ao mínimo: conta
  produto(6, 'SKU-F', 'Produto Zerado F', '/img/f.webp', true, 0), // abaixo do mínimo: conta
  produto(7, 'SKU-G', 'Produto Inativo Baixo G', '/img/g.webp', false, 1), // inativo: NÃO conta
];
const SEM_ALERTAS = [produto(1, 'SKU-A', 'Produto Com Foto A', '/img/a.webp'), produto(4, 'SKU-D', 'Produto Com Foto D', '/img/d.webp')];

const faixa = (p: ReturnType<typeof produto>) => (p.estoque < 1 ? 'indisponivel' : p.estoque <= p.estoque_minimo ? 'ultimas_unidades' : 'disponivel');

// A API de mentira responde pelo endereço e aplica os filtros do servidor, como o back de verdade.
function falarComApi(produtos = TODOS) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(url, 'http://localhost');
    const q = u.searchParams;
    const json = (corpo: unknown) => new Response(JSON.stringify(corpo), { status: 200 });
    if (u.pathname.endsWith('/produtos')) {
      const incluirInativos = q.get('incluir_inativos') === 'true';
      const busca = (q.get('busca') ?? '').toLowerCase();
      const visiveis = produtos
        .filter((p) => incluirInativos || p.ativo)
        .filter((p) => !busca || p.nome.toLowerCase().includes(busca))
        .filter((p) => !q.get('categoria') || p.categoria?.slug === q.get('categoria'))
        .filter((p) => !q.get('disponibilidade') || faixa(p) === q.get('disponibilidade'));
      const limite = Number(q.get('limite') ?? 10);
      return json({ produtos: visiveis.slice(0, limite), paginacao: { total: visiveis.length, pagina: 1, limite, total_paginas: Math.max(1, Math.ceil(visiveis.length / limite)) } });
    }
    if (u.pathname.endsWith('/categorias')) return json({ categorias: [BEBIDAS] });
    if (u.pathname.endsWith('/marcas')) return json({ marcas: [] });
    return json({});
  }));
}

function abrir() {
  return render(<MemoryRouter><Products /></MemoryRouter>);
}

const chip = (nome: RegExp) => screen.findByRole('button', { name: nome });
const total = (texto: string) => vi.waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(texto));
const nomesNaTabela = () => within(screen.getByRole('table')).getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[0].textContent);

describe('Produtos: cabeçalho, abas e barra de ferramentas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra Exportar, Fotos em lote e Novo produto, e não tem mais o subtítulo', async () => {
    falarComApi();
    abrir();
    expect(await screen.findByRole('button', { name: 'Novo produto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fotos em lote' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Produtos' })).toBeInTheDocument();
    expect(screen.queryByText(/Catálogo, estoque, imagens/)).not.toBeInTheDocument();
  });

  it('as abas são sublinhadas (tablist) e a ativa tem aria-selected; setas e clique trocam de aba', async () => {
    falarComApi();
    abrir();
    const produtos = await screen.findByRole('tab', { name: 'Produtos' });
    const taxonomias = screen.getByRole('tab', { name: 'Categorias e marcas' });
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(produtos).toHaveAttribute('aria-selected', 'true');
    expect(taxonomias).toHaveAttribute('aria-selected', 'false');

    produtos.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(await screen.findByText('Tela de categorias e marcas')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Categorias e marcas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Produtos' })).toHaveAttribute('aria-selected', 'false');

    await userEvent.click(screen.getByRole('tab', { name: 'Produtos' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('o seletor Estoque substitui os chips e filtra como antes (Disponível, Últimas unidades, Indisponível)', async () => {
    falarComApi();
    abrir();
    const seletor = await screen.findByRole('combobox', { name: 'Estoque' });
    expect(within(seletor).getAllByRole('option').map((o) => o.textContent)).toEqual(['Todos os estoques', 'Disponível', 'Últimas unidades', 'Indisponível']);
    expect(screen.queryByRole('button', { name: 'Indisponível' })).not.toBeInTheDocument(); // sem chips

    await userEvent.selectOptions(seletor, 'Disponível');
    await total('4 de 7 produtos');
    expect(nomesNaTabela().join()).not.toContain('Zerado');

    await userEvent.selectOptions(seletor, 'Indisponível');
    await total('1 de 7 produtos');
    expect(nomesNaTabela()[0]).toContain('Produto Zerado F');

    await userEvent.selectOptions(seletor, 'Últimas unidades');
    await total('2 de 7 produtos'); // regra do selo do menu: ativo e estoque <= mínimo (inclui o zerado, exclui o inativo)
    expect(nomesNaTabela().join()).toContain('Produto Estoque Baixo E');
    expect(nomesNaTabela().join()).not.toContain('Inativo Baixo G');

    await userEvent.selectOptions(seletor, 'Todos os estoques');
    await total('7 de 7 produtos');
  });

  it('a chave "Mostrar inativos" tem o mesmo texto na tela e no aria-label, não quebra linha e esconde os inativos ao desligar', async () => {
    falarComApi();
    abrir();
    const chave = await screen.findByRole('switch', { name: 'Mostrar inativos' });
    const rotulo = screen.getByText('Mostrar inativos', { selector: 'label' });
    expect(rotulo).toHaveClass('whitespace-nowrap', 'shrink-0');
    expect(chave).toBeChecked();
    expect(screen.queryByRole('switch', { name: 'Inativos' })).not.toBeInTheDocument();
    await total('7 de 7 produtos · 2 inativos');

    await userEvent.click(chave);
    await total('5 de 7 produtos · 2 inativos'); // o texto "X inativos" do total continua
    expect(nomesNaTabela().join()).not.toContain('Inativo');
  });

  it('a busca e a categoria continuam filtrando', async () => {
    falarComApi();
    abrir();
    await total('7 de 7 produtos');
    await userEvent.type(screen.getByRole('searchbox'), 'Zerado');
    await total('1 de 7 produtos');
    expect(nomesNaTabela()[0]).toContain('Produto Zerado F');

    await userEvent.clear(screen.getByRole('searchbox'));
    await total('7 de 7 produtos');
    await screen.findByRole('option', { name: 'Bebidas' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Categoria' }), 'Bebidas');
    await total('2 de 7 produtos');
    expect(nomesNaTabela().join()).toContain('Produto Com Foto A');
  });

  it('o total mostra "N de M produtos" e os inativos, e muda com os filtros', async () => {
    falarComApi();
    abrir();
    await total('7 de 7 produtos · 2 inativos');
    await userEvent.click(await chip(/^Repor estoque/));
    await total('2 de 7 produtos · 2 inativos');
    await userEvent.click(screen.getByRole('button', { name: /^Repor estoque/ }));
    await total('7 de 7 produtos');
  });
});

describe('Produtos: chips de atenção', () => {
  beforeEach(() => {
    vi.mocked(downloadCsv).mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('"Repor estoque" usa a regra do selo, filtra e mostra o texto de ajuda sem depender de hover; clicar de novo remove', async () => {
    falarComApi();
    abrir();
    const botao = await chip(/^Repor estoque/);
    await vi.waitFor(() => expect(botao).toHaveTextContent('2')); // E (5 <= 5) e F (0); o G é inativo
    expect(botao).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('Mostrando produtos com estoque no mínimo ou abaixo')).not.toBeInTheDocument();

    await userEvent.click(botao);
    expect(botao).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Mostrando produtos com estoque no mínimo ou abaixo')).toBeVisible();
    expect(nomesNaTabela()).toHaveLength(2);
    expect(nomesNaTabela().join()).toContain('Produto Zerado F');
    expect(nomesNaTabela().join()).not.toContain('Inativo Baixo G');
    expect(screen.getByRole('combobox', { name: 'Estoque' })).toHaveValue('Últimas unidades'); // mesmo filtro do seletor

    await userEvent.click(botao);
    expect(botao).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('Mostrando produtos com estoque no mínimo ou abaixo')).not.toBeInTheDocument();
    expect(await screen.findByText('Produto Com Foto A')).toBeInTheDocument();
  });

  it('sem produtos com estoque baixo nem sem foto, os dois chips somem por completo', async () => {
    falarComApi(SEM_ALERTAS);
    abrir();
    await total('2 de 2 produtos');
    expect(screen.queryByRole('button', { name: /^Repor estoque/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Sem foto/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Baixar lista de SKUs/ })).not.toBeInTheDocument();
  });

  it('"Sem foto" filtra a lista, mostra o texto de ajuda e clicar de novo remove o filtro', async () => {
    falarComApi();
    abrir();
    const botao = await chip(/^Sem foto/);
    await vi.waitFor(() => expect(botao).toHaveTextContent('2'));
    expect(await screen.findByText('Produto Com Foto A')).toBeInTheDocument();

    await userEvent.click(botao);
    expect(botao).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Mostrando produtos sem imagem')).toBeVisible();
    const tabela = screen.getByRole('table');
    expect(within(tabela).getByText('Produto Sem Foto B')).toBeInTheDocument();
    expect(within(tabela).getByText('Produto Sem Foto C Inativo')).toBeInTheDocument();
    expect(within(tabela).queryByText('Produto Com Foto A')).not.toBeInTheDocument();

    await userEvent.click(botao);
    expect(botao).toHaveAttribute('aria-pressed', 'false');
    expect(await screen.findByText('Produto Com Foto A')).toBeInTheDocument();
  });

  it('com "Sem foto" > 0 o link de SKUs baixa a lista com o nome de arquivo sugerido e não ativa o filtro', async () => {
    falarComApi();
    abrir();
    const filtro = await chip(/^Sem foto/);
    await userEvent.click(await screen.findByRole('button', { name: 'Baixar lista de SKUs' }));
    expect(filtro).toHaveAttribute('aria-pressed', 'false');
    expect(await screen.findByText('Produto Com Foto A')).toBeInTheDocument();
    expect(downloadCsv).toHaveBeenCalledTimes(1);
    const [arquivo, cabecalho, linhas] = vi.mocked(downloadCsv).mock.calls[0];
    expect(arquivo).toBe('produtos-sem-foto.csv');
    expect(cabecalho).toContain('Nome do arquivo sugerido');
    expect(linhas).toEqual([
      ['SKU-B', 'Produto Sem Foto B', 'Marca X', 'SKU-B.jpg', 'Sim'],
      ['SKU-C', 'Produto Sem Foto C Inativo', 'Marca X', 'SKU-C.jpg', 'Não'],
    ]);
  });
});
