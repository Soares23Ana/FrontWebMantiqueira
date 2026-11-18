import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../api/client')>();
  return { ...real, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});

import { api } from '../../api/client';
import Cms from './Cms';

const banner = (id: number, titulo: string, situacao: string, extra: Record<string, unknown> = {}) => ({
  id_banner: id, titulo, link: null, imagem_url: '/img/b.webp', ordem: id, ativo: situacao !== 'inativo', inicio_em: null, fim_em: null, situacao,
  tipo_destino: 'nenhum', id_destino: null, destino: { tipo: 'nenhum', id: null, link: null }, ...extra,
});

const horas = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const popup = (extra: Record<string, unknown> = {}) => ({
  chave: 'popup', id_bloco: 1, titulo: 'Promoção da semana', conteudo: 'Aproveite os descontos.', ativo: true, imagem_url: '/img/p.webp',
  destino: { tipo: 'nenhum', id: null, link: null }, inicio_em: null, fim_em: null, atualizado_em: '2026-11-01T12:00:00.000Z', ...extra,
});

let banners: ReturnType<typeof banner>[] = [];
let blocos: ReturnType<typeof popup>[] = [];

beforeEach(() => {
  banners = [banner(1, 'Banner Natal', 'no_ar', { tipo_destino: 'categoria', destino: { tipo: 'categoria', id: 3, link: '/categoria/higiene' } }), banner(2, 'Banner Páscoa', 'agendado')];
  blocos = [];
  vi.mocked(api.get).mockReset().mockImplementation(async (path: string) => {
    if (path === '/cms/todos') return { banners };
    if (path === '/cms/blocos') return { blocos };
    if (path === '/configuracoes') return { configuracoes: [] };
    return {};
  });
  for (const m of [api.post, api.put, api.patch, api.del]) vi.mocked(m).mockReset().mockResolvedValue({});
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() }));
});
afterEach(() => vi.unstubAllGlobals());

const abrir = () => render(<MemoryRouter><Cms /></MemoryRouter>);
const irParaPopup = async () => {
  abrir();
  await userEvent.click(await screen.findByRole('tab', { name: 'Pop-up' }));
  await screen.findByText('Pop-up da página inicial');
};

function imagemDe(largura: number, altura: number) {
  vi.stubGlobal('Image', class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = largura;
    naturalHeight = altura;
    set src(_v: string) { setTimeout(() => this.onload?.(), 0); }
  });
}

describe('CMS: cabeçalho', () => {
  it('tem o link "Ver como fica na loja" que abre a home em nova aba', async () => {
    abrir();
    const link = await screen.findByRole('link', { name: 'Ver como fica na loja' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('href', '/');
  });
});

describe('CMS: banners', () => {
  it('mostra o aviso âmbar só quando há banners e nenhum está no ar', async () => {
    banners = [banner(1, 'Banner Natal', 'agendado'), banner(2, 'Banner Páscoa', 'expirado')];
    abrir();
    const aviso = await screen.findByText('Nenhum banner está no ar. A página inicial mostra a abertura padrão. Ative um banner e escolha para onde ele leva.');
    expect(aviso).toHaveAttribute('role', 'status');
  });

  it('o aviso some quando algum banner está no ar e não aparece sem banners', async () => {
    abrir();
    await screen.findByText('Banner Natal');
    expect(screen.queryByText(/Nenhum banner está no ar/)).not.toBeInTheDocument();
  });

  it('sem banners cadastrados não há aviso âmbar', async () => {
    banners = [];
    abrir();
    await screen.findByText('Nenhum banner cadastrado.');
    expect(screen.queryByText(/Nenhum banner está no ar/)).not.toBeInTheDocument();
  });

  it('destaca o destino, usa aria-label com o título e agrupa as setas de ordem', async () => {
    abrir();
    expect(await screen.findByText('Abre: Categoria · /categoria/higiene')).toBeInTheDocument();
    expect(screen.getByText('Sem destino (não clicável)')).toBeInTheDocument();
    for (const nome of ['Subir Banner Páscoa', 'Descer Banner Natal', 'Editar Banner Natal', 'Excluir Banner Páscoa']) {
      const b = screen.getByRole('button', { name: nome });
      expect(b).toHaveAttribute('title', nome);
    }
    const grupo = screen.getByRole('group', { name: 'Ordem de Banner Natal' });
    expect(within(grupo).getAllByRole('button')).toHaveLength(2);
  });

  it('excluir pede confirmação no próprio cartão e chama o DELETE de antes', async () => {
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Banner Páscoa' }));
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(api.del).toHaveBeenCalledWith('/cms/2');
  });

  const abrirModal = async () => {
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: /Adicionar banner/ }));
    return screen.getByRole('dialog', { name: 'Adicionar banner' });
  };

  it('Fim antes ou igual ao Início mostra o erro no campo Fim e não envia', async () => {
    const janela = await abrirModal();
    await userEvent.type(within(janela).getByLabelText(/^Título/), 'Novo');
    fireEvent.change(within(janela).getByLabelText(/^Início/), { target: { value: '2026-12-10T10:00' } });
    fireEvent.change(within(janela).getByLabelText(/^Fim/), { target: { value: '2026-12-10T10:00' } });
    await userEvent.click(within(janela).getByRole('button', { name: 'Salvar' }));
    expect(within(janela).getByRole('alert')).toHaveTextContent('O fim deve ser depois do início.');
    expect(api.post).not.toHaveBeenCalled();
    fireEvent.change(within(janela).getByLabelText(/^Fim/), { target: { value: '2026-12-09T10:00' } });
    await userEvent.click(within(janela).getByRole('button', { name: 'Salvar' }));
    expect(within(janela).getByRole('alert')).toHaveTextContent('O fim deve ser depois do início.');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('avisa (sem bloquear) quando a proporção foge de 1920 × 700, e não avisa quando está dentro', async () => {
    const janela = await abrirModal();
    const arquivo = new File(['x'], 'quadrada.png', { type: 'image/png' });
    imagemDe(1000, 1000);
    await userEvent.upload(within(janela).getByLabelText('Escolher imagem'), arquivo);
    expect(await within(janela).findByText('Esta imagem tem proporção diferente de 1920 × 700 e será recortada no site.')).toBeInTheDocument();
    expect(within(janela).getByText('quadrada.png')).toBeInTheDocument(); // nome do arquivo escolhido
    expect(within(janela).getByRole('button', { name: 'Salvar' })).toBeEnabled(); // não bloqueia

    imagemDe(1920, 700);
    await userEvent.upload(within(janela).getByLabelText('Escolher imagem'), new File(['y'], 'certa.png', { type: 'image/png' }));
    await vi.waitFor(() => expect(within(janela).queryByText(/proporção diferente/)).not.toBeInTheDocument());
  });
});

describe('CMS: pop-up', () => {
  it('sem pop-up salvo mostra "Nenhum pop-up cadastrado"', async () => {
    await irParaPopup();
    expect(screen.getByText('Nenhum pop-up cadastrado')).toBeInTheDocument();
  });

  it.each([
    ['Desligado', { ativo: false }, /desligado/],
    ['Agendado', { inicio_em: horas(48) }, /Começa em/],
    ['Expirado', { fim_em: horas(-48) }, /Encerrou em/],
    ['No ar', { fim_em: horas(48) }, /No ar até/],
  ])('situação %s ao lado do título', async (chip, extra, frase) => {
    blocos = [popup(extra)];
    await irParaPopup();
    expect(await screen.findByText(chip)).toBeInTheDocument();
    expect(screen.getByText(frase)).toBeInTheDocument();
  });

  it('mostra contadores de caracteres do título (150) e do texto (2000)', async () => {
    await irParaPopup();
    expect(screen.getByText('0/150')).toBeInTheDocument();
    expect(screen.getByText('0/2000')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^Título/), 'Oi');
    expect(screen.getByText('2/150')).toBeInTheDocument();
  });

  it('a pré-visualização acompanha os campos e usa "Título do pop-up" quando vazio', async () => {
    await irParaPopup();
    const previa = screen.getByRole('region', { name: 'Pré-visualização do pop-up' });
    expect(within(previa).getByText('Título do pop-up')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^Título/), 'Super oferta');
    await userEvent.type(screen.getByLabelText(/^Texto/), 'Só hoje');
    expect(within(previa).getByRole('heading', { name: 'Super oferta' })).toBeInTheDocument();
    expect(within(previa).getByText('Só hoje')).toBeInTheDocument();
    expect(within(previa).queryByText('Ver agora')).not.toBeInTheDocument(); // sem destino, sem botão
  });

  it('Salvar começa desabilitado, Descartar restaura os valores salvos', async () => {
    blocos = [popup()];
    await irParaPopup();
    const salvar = await screen.findByRole('button', { name: 'Salvar pop-up' });
    await vi.waitFor(() => expect(screen.getByLabelText(/^Título/)).toHaveValue('Promoção da semana'));
    expect(salvar).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Descartar alterações' })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^Título/), ' extra');
    expect(salvar).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Descartar alterações' }));
    expect(screen.getByLabelText(/^Título/)).toHaveValue('Promoção da semana');
    expect(salvar).toBeDisabled();
  });

  it('trocar a imagem habilita o Salvar; não existe botão "Remover imagem" e a ajuda explica como ficar sem imagem', async () => {
    blocos = [popup()];
    await irParaPopup();
    await vi.waitFor(() => expect(screen.getByLabelText(/^Título/)).toHaveValue('Promoção da semana'));
    expect(screen.getByText('Você pode trocar a imagem. Para ficar sem imagem, exclua o pop-up e crie de novo.')).toBeInTheDocument();
    expect(screen.getByText('Imagem (opcional, até 5 MB)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remover imagem/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar pop-up' })).toBeDisabled();
    await userEvent.upload(screen.getByLabelText('Escolher imagem do pop-up'), new File(['x'], 'nova.png', { type: 'image/png' }));
    expect(screen.getByRole('button', { name: 'Salvar pop-up' })).toBeEnabled();
    expect(screen.queryByText(/proporção/)).not.toBeInTheDocument(); // pop-up não avisa proporção
  });

  it('o controle "Ligado" fica visível mesmo sem pop-up salvo (sem o texto "Ligado ao salvar")', async () => {
    await irParaPopup();
    expect(screen.getByRole('switch', { name: 'Pop-up ligado' })).toBeChecked();
    expect(screen.queryByText(/Ligado ao salvar/)).not.toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('switch', { name: 'Pop-up ligado' }));
    expect(api.patch).not.toHaveBeenCalled(); // define o estado inicial: não chama a API
    expect(screen.getByRole('switch', { name: 'Pop-up ligado' })).not.toBeChecked();
  });

  it('com pop-up salvo, ligar/desligar faz PATCH como antes', async () => {
    blocos = [popup()];
    await irParaPopup();
    await userEvent.click(await screen.findByRole('switch', { name: 'Pop-up ligado' }));
    await vi.waitFor(() => expect(api.patch).toHaveBeenCalledWith('/cms/blocos/popup', { ativo: false }));
  });

  it('excluir pede confirmação no próprio cartão (sem window.confirm) e chama o mesmo DELETE', async () => {
    const confirmar = vi.fn();
    vi.stubGlobal('confirm', confirmar);
    blocos = [popup()];
    await irParaPopup();
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir pop-up' }));
    expect(screen.getByText('Excluir o pop-up e a imagem dele?')).toBeInTheDocument();
    expect(api.del).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Não' }));
    expect(screen.queryByText('Excluir o pop-up e a imagem dele?')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Excluir pop-up' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir' }));
    await vi.waitFor(() => expect(api.del).toHaveBeenCalledWith('/cms/blocos/popup'));
    expect(confirmar).not.toHaveBeenCalled();
  });
});
