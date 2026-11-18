import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../api/client')>();
  return { ...real, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});

import { api } from '../../api/client';
import Taxonomies from './Taxonomies';

const cat = (id: number, nome: string, slug: string, id_pai: number | null, total = 0, ativo = true) => ({ id_categoria: id, nome, slug, id_pai, total_produtos: total, ativo });
const CATEGORIAS = [
  cat(1, 'Bem-estar e saúde', 'bem-estar-e-saude', null, 12),
  cat(2, 'Vitaminas', 'vitaminas', 1, 5),
  cat(3, 'Chás', 'chas', 1, 1),
  cat(4, 'Limpeza', 'limpeza', null, 0),
  cat(5, 'Sabão em pó', 'sabao-em-po', 4, 0),
  cat(6, 'Bebidas', 'bebidas', null, 0),
];
const MARCAS = [
  { id_marca: 1, nome: 'Marca Alfa', slug: 'marca-alfa', ativo: true, total_produtos: 3 },
  { id_marca: 2, nome: 'Marca Beta', slug: 'marca-beta', ativo: true, total_produtos: 0 },
];

beforeEach(() => {
  vi.mocked(api.get).mockReset().mockImplementation(async (path: string) => (path === '/categorias' ? { categorias: CATEGORIAS } : { marcas: MARCAS }));
  vi.mocked(api.post).mockReset().mockResolvedValue({ mensagem: 'Criado.' });
  vi.mocked(api.del).mockReset().mockResolvedValue({ mensagem: 'Excluído.' });
  vi.unstubAllGlobals();
});

const cartaoCategorias = async () => {
  await screen.findByText('Bem-estar e saúde');
  return screen.getByRole('heading', { name: 'Categorias' }).parentElement as HTMLElement;
};
const linha = (nome: RegExp) => screen.getAllByRole('button', { name: nome }).find((b) => b.hasAttribute('aria-expanded')) as HTMLElement;

describe('Categorias e marcas: categorias recolhíveis', () => {
  it('começa recolhida, mostra o número de subcategorias e produtos, e clicar abre e fecha', async () => {
    render(<Taxonomies />);
    const cartao = await cartaoCategorias();
    const botao = within(cartao).getByRole('button', { name: /Bem-estar e saúde 2 subcategorias · 18 produtos/ });
    expect(botao).toHaveAttribute('aria-expanded');
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Vitaminas')).not.toBeInTheDocument();

    await userEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(botao).toHaveAttribute('aria-controls', 'sub-1');
    expect(screen.getByText('Vitaminas')).toBeInTheDocument();
    expect(screen.getByText('5 produtos')).toBeInTheDocument();
    expect(screen.getByText('1 produto')).toBeInTheDocument(); // singular

    await userEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Vitaminas')).not.toBeInTheDocument();
  });

  it('a principal mostra o total (diretos + subcategorias), a subcategoria só os próprios, em elemento separado abaixo do nome', async () => {
    render(<Taxonomies />);
    const cartao = await cartaoCategorias();
    // Bem-estar: 12 diretos + 5 + 1 das subcategorias = 18. Limpeza: 0 + 0 = 0 e 1 subcategoria no singular.
    const bem = linha(/Bem-estar e saúde/);
    expect(within(bem).getByText('2 subcategorias ·')).toBeInTheDocument();
    const info = within(bem).getByText('18 produtos');
    const nome = within(bem).getByText('Bem-estar e saúde');
    expect(info.parentElement).not.toBe(nome.parentElement); // a informação não está dentro do nome
    expect(info.parentElement).toHaveClass('block'); // vai para a 2ª linha
    expect(info).toHaveClass('whitespace-nowrap');
    expect(within(linha(/Limpeza/)).getByText('1 subcategoria ·')).toBeInTheDocument();

    await userEvent.click(bem);
    expect(screen.getByText('5 produtos')).toBeInTheDocument(); // subcategoria: só os próprios
    expect(screen.getByText('1 produto')).toBeInTheDocument();
  });

  it('com a busca ativa o total da principal continua o real, não só o das subcategorias que casam', async () => {
    render(<Taxonomies />);
    await cartaoCategorias();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar categoria' }), 'chas');
    expect(within(linha(/Bem-estar e saúde/)).getByText('18 produtos')).toBeInTheDocument();
  });

  it('Expandir tudo e Recolher tudo', async () => {
    render(<Taxonomies />);
    await cartaoCategorias();
    await userEvent.click(screen.getByRole('button', { name: 'Expandir tudo' }));
    expect(screen.getByText('Vitaminas')).toBeInTheDocument();
    expect(screen.getByText('Sabão em pó')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Recolher tudo' }));
    expect(screen.queryByText('Vitaminas')).not.toBeInTheDocument();
    expect(screen.queryByText('Sabão em pó')).not.toBeInTheDocument();
  });

  it('a busca ignora acento e maiúsculas, abre a categoria do resultado e mostra só o que casa; limpar volta ao estado anterior', async () => {
    render(<Taxonomies />);
    await cartaoCategorias();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar categoria' }), 'CHAS');
    expect(screen.getByText('Chás')).toBeInTheDocument();
    expect(screen.queryByText('Vitaminas')).not.toBeInTheDocument(); // não casa
    expect(screen.queryByText('Limpeza')).not.toBeInTheDocument();
    expect(linha(/Bem-estar e saúde/)).toHaveAttribute('aria-expanded', 'true');

    await userEvent.clear(screen.getByRole('searchbox', { name: 'Buscar categoria' }));
    expect(screen.getByText('Limpeza')).toBeInTheDocument();
    expect(linha(/Bem-estar e saúde/)).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Chás')).not.toBeInTheDocument();
  });

  it('sem resultado mostra "Nenhuma categoria encontrada"', async () => {
    render(<Taxonomies />);
    await cartaoCategorias();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar categoria' }), 'zzz');
    expect(screen.getByText('Nenhuma categoria encontrada')).toBeInTheDocument();
  });

  it('a busca de marcas filtra a lista de marcas', async () => {
    render(<Taxonomies />);
    await screen.findByText('Marca Alfa');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar marca' }), 'beta');
    expect(screen.queryByText('Marca Alfa')).not.toBeInTheDocument();
    expect(screen.getByText('Marca Beta')).toBeInTheDocument();
  });

  it('as linhas não mostram o endereço "/slug" nem a palavra "Subcategoria"', async () => {
    render(<Taxonomies />);
    await cartaoCategorias();
    await userEvent.click(screen.getByRole('button', { name: 'Expandir tudo' }));
    expect(screen.queryByText(/\/bem-estar-e-saude|\/vitaminas|\/marca-alfa/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Subcategoria ·/)).not.toBeInTheDocument();
  });

  it('o aviso de desativar fica visível logo abaixo do título de cada cartão', async () => {
    render(<Taxonomies />);
    await cartaoCategorias();
    expect(screen.getAllByText(/Desativar esconde do menu da loja/)).toHaveLength(2);
    expect(document.querySelector('[title*="Desativar esconde"]')).toBeNull();
  });
});

describe('Categorias e marcas: ações', () => {
  it('ícones com aria-label e title com o nome do item; a lixeira é discreta (vermelha só no hover/foco)', async () => {
    render(<Taxonomies />);
    await screen.findByText('Marca Alfa');
    const lixeira = screen.getByRole('button', { name: 'Excluir Marca Alfa' });
    expect(lixeira).toHaveAttribute('title', 'Excluir Marca Alfa');
    expect(lixeira.className).not.toMatch(/(^|\s)text-accent/);
    expect(lixeira.className).toContain('hover:text-accent');
    expect(screen.getByRole('button', { name: 'Editar Marca Alfa' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Desativar Marca Alfa' })).toBeInTheDocument();
  });

  it('as travas de exclusão não usam o total novo: categoria sem produtos diretos mas com subcategorias continua sem poder ser excluída', async () => {
    const confirmar = vi.fn().mockReturnValue(true);
    vi.stubGlobal('confirm', confirmar);
    render(<Taxonomies />);
    await screen.findByText('Limpeza');
    await userEvent.click(screen.getByRole('button', { name: 'Excluir Limpeza' })); // 0 produtos diretos, mas tem subcategoria
    await userEvent.click(screen.getByRole('button', { name: 'Excluir Bem-estar e saúde' })); // 12 produtos diretos
    expect(confirmar).not.toHaveBeenCalled();
    expect(api.del).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Excluir Bebidas' })); // vazia e sem subcategorias: exclui
    expect(confirmar).toHaveBeenCalledWith('Excluir “Bebidas”?');
    expect(api.del).toHaveBeenCalledWith('/categorias/6');
  });

  it('excluir pede confirmação e só chama a API se confirmar', async () => {
    const confirmar = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.stubGlobal('confirm', confirmar);
    render(<Taxonomies />);
    await screen.findByText('Marca Beta');
    await userEvent.click(screen.getByRole('button', { name: 'Excluir Marca Beta' }));
    expect(confirmar).toHaveBeenCalledWith('Excluir “Marca Beta”?');
    expect(api.del).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Excluir Marca Beta' }));
    expect(api.del).toHaveBeenCalledWith('/marcas/2');
  });

  it('adicionar categoria e marca chamam as mesmas APIs de antes', async () => {
    render(<Taxonomies />);
    const cartao = await cartaoCategorias();
    await userEvent.type(within(cartao).getByPlaceholderText('Nova categoria'), 'Mercearia');
    await userEvent.click(within(cartao).getByRole('button', { name: 'Adicionar' }));
    expect(api.post).toHaveBeenCalledWith('/categorias', { nome: 'Mercearia', id_pai: null });

    await userEvent.selectOptions(within(cartao).getByRole('combobox'), 'em Limpeza');
    await userEvent.type(within(cartao).getByPlaceholderText('Nova subcategoria'), 'Amaciante');
    await userEvent.click(within(cartao).getByRole('button', { name: 'Adicionar' }));
    expect(api.post).toHaveBeenLastCalledWith('/categorias', { nome: 'Amaciante', id_pai: 4 });
    // a categoria da subcategoria nova fica aberta
    await vi.waitFor(() => expect(linha(/Limpeza/)).toHaveAttribute('aria-expanded', 'true'));

    const marcas = screen.getByRole('heading', { name: 'Marcas' }).parentElement as HTMLElement;
    await userEvent.type(within(marcas).getByPlaceholderText('Nova marca'), 'Marca Gama');
    await userEvent.click(within(marcas).getByRole('button', { name: 'Adicionar' }));
    expect(api.post).toHaveBeenLastCalledWith('/marcas', { nome: 'Marca Gama' });
  });
});
