import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../api/client')>();
  return { ...real, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { nome: 'Ana', pode_gerenciar_equipe: false }, logout: vi.fn() }) }));
vi.mock('../../components/ThemeToggle', () => ({ default: () => null }));

import { api, ApiError } from '../../api/client';
import Cms from './Cms';
import Configuracoes from './Configuracoes';
import ManagerLayout from './ManagerLayout';
import { managerRoutes } from './routes';

const cfg = (chave: string, valor: string | number | null, publica = false) => ({ chave, valor, publica, descricao: `descrição técnica de ${chave}`, atualizado_em: null });
const CONFIGS = [
  cfg('meta_reposicao', 500),
  cfg('carrinho_abandonado_dias', 7),
  cfg('estoque_faixa_alta', 50),
  cfg('whatsapp', '5519996727161', true),
  cfg('telefone_contato', '1936381010', true),
  cfg('email_contato', null, true),
  cfg('horario_atendimento', null, true),
  cfg('aviso_topo', 'Entregas normais no feriado', true),
  cfg('chave_desconhecida_xyz', 'segredo'),
];

beforeEach(() => {
  vi.mocked(api.get).mockReset().mockImplementation(async (path: string) => {
    if (path === '/configuracoes') return { configuracoes: CONFIGS };
    if (path === '/painel/contadores') return { pedidos_pendentes: 0, estoque_baixo: 0, clientes_novos_7_dias: 0 };
    return { banners: [], popup: null, blocos: [] };
  });
  vi.mocked(api.put).mockReset().mockResolvedValue({});
});

describe('Menu e rota de Configurações', () => {
  it('o menu mostra "Configurações" no grupo Sistema e a rota existe (mesma regra de acesso do CMS: sem guarda extra)', async () => {
    vi.mocked(api.get).mockResolvedValue({ pedidos_pendentes: 0, estoque_baixo: 0, clientes_novos_7_dias: 0 });
    render(<RouterProvider router={createMemoryRouter([{ path: '/gestor', element: <ManagerLayout /> }], { initialEntries: ['/gestor'] })} />);
    const menu = await screen.findByRole('navigation', { name: 'Menu do gestor' });
    const link = within(menu).getByRole('link', { name: 'Configurações' });
    expect(link).toHaveAttribute('href', '/gestor/configuracoes');
    const nomes = within(menu).getAllByRole('link').map((l) => l.textContent);
    // dentro do grupo Sistema, junto de Atividade da equipe e Saúde do sistema
    expect(nomes.indexOf('Configurações')).toBe(nomes.indexOf('Atividade da equipe') + 1);
    expect(nomes.indexOf('Saúde do sistema')).toBe(nomes.indexOf('Configurações') + 1);
    const rota = managerRoutes.find((r) => r.path === 'configuracoes');
    const cms = managerRoutes.find((r) => r.path === 'cms');
    expect(rota).toBeTruthy();
    expect((rota!.element as { type: unknown }).type).toBe(Configuracoes);
    expect((cms!.element as { type: unknown }).type).toBe(Cms); // o CMS não tem guarda: Configurações também não
  });
});

describe('Configurações: regras do sistema', () => {
  it('mostra rótulos em português e ajuda visível, e nenhuma chave técnica', async () => {
    render(<Configuracoes />);
    expect(await screen.findByLabelText('Meta de reposição (unidades)')).toHaveValue(500);
    expect(screen.getByLabelText('Dias para considerar um carrinho abandonado')).toHaveValue(7);
    expect(screen.getByLabelText('Limite para mostrar ‘Mais de N disponíveis’')).toHaveValue(50);
    expect(screen.getByText('Estoque-alvo usado na sugestão de compra dos alertas de reposição do painel.')).toBeVisible();
    expect(screen.getByText('Acima deste estoque, a loja mostra ‘Mais de N disponíveis’ em vez da quantidade exata.')).toBeVisible();
    const html = document.body.textContent ?? '';
    for (const tecnica of ['meta_reposicao', 'carrinho_abandonado_dias', 'estoque_faixa_alta', 'chave_desconhecida_xyz', 'segredo', 'whatsapp']) expect(html).not.toContain(tecnica);
    expect(screen.getAllByRole('spinbutton')).toHaveLength(3);
  });

  it('Salvar começa desabilitado; validação por faixa mostra o erro no campo e não chama a API', async () => {
    render(<Configuracoes />);
    const salvar = (await screen.findAllByRole('button', { name: 'Salvar' }))[0];
    expect(salvar).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Descartar alterações' })).not.toBeInTheDocument();

    const dias = screen.getByLabelText('Dias para considerar um carrinho abandonado');
    await userEvent.clear(dias);
    await userEvent.type(dias, '366');
    await userEvent.click(salvar);
    expect(screen.getByRole('alert')).toHaveTextContent('Informe um número inteiro de 1 a 365.');
    expect(api.put).not.toHaveBeenCalled();

    await userEvent.clear(dias);
    await userEvent.type(dias, '1.5');
    await userEvent.click(salvar);
    expect(screen.getByRole('alert')).toHaveTextContent('Informe um número inteiro de 1 a 365.');
    expect(api.put).not.toHaveBeenCalled();

    const meta = screen.getByLabelText('Meta de reposição (unidades)');
    await userEvent.clear(meta);
    await userEvent.type(meta, '2000000');
    await userEvent.click(salvar);
    expect(screen.getAllByRole('alert').map((a) => a.textContent)).toContain('Informe um número inteiro de 1 a 1.000.000.');
  });

  it('salvar envia PUT só dos campos alterados (valor numérico) e a base passa a ser o novo valor', async () => {
    render(<Configuracoes />);
    const meta = await screen.findByLabelText('Meta de reposição (unidades)');
    await userEvent.clear(meta);
    await userEvent.type(meta, '800');
    await userEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[0]);
    await vi.waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
    expect(api.put).toHaveBeenCalledWith('/configuracoes/meta_reposicao', { valor: 800 });
    await vi.waitFor(() => expect(screen.getAllByRole('button', { name: 'Salvar' })[0]).toBeDisabled());
    expect(screen.queryByRole('button', { name: 'Descartar alterações' })).not.toBeInTheDocument();
  });

  it('Descartar restaura os valores', async () => {
    render(<Configuracoes />);
    const meta = await screen.findByLabelText('Meta de reposição (unidades)');
    await userEvent.clear(meta);
    await userEvent.type(meta, '9');
    await userEvent.click(screen.getByRole('button', { name: 'Descartar alterações' }));
    expect(meta).toHaveValue(500);
    expect(screen.getAllByRole('button', { name: 'Salvar' })[0]).toBeDisabled();
    expect(api.put).not.toHaveBeenCalled();
  });

  it('se um falhar e outro der certo, mantém o que salvou e mostra o erro da API só no que falhou', async () => {
    vi.mocked(api.put).mockImplementation(async (path: string) => {
      if (path.endsWith('carrinho_abandonado_dias')) throw new ApiError(422, 'Valor fora do permitido pela API.', 'VALIDACAO');
      return {};
    });
    render(<Configuracoes />);
    const meta = await screen.findByLabelText('Meta de reposição (unidades)');
    const dias = screen.getByLabelText('Dias para considerar um carrinho abandonado');
    await userEvent.clear(meta);
    await userEvent.type(meta, '600');
    await userEvent.clear(dias);
    await userEvent.type(dias, '10');
    await userEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Valor fora do permitido pela API.');
    expect(api.put).toHaveBeenCalledTimes(2);
    // a meta já está salva: descartar só desfaz o campo que falhou
    await userEvent.click(screen.getByRole('button', { name: 'Descartar alterações' }));
    expect(meta).toHaveValue(600);
    expect(dias).toHaveValue(7);
  });
});

describe('Configurações: contatos públicos e aviso do topo', () => {
  const abrirContatos = async () => {
    render(<Configuracoes />);
    await screen.findByText('Contato público');
  };

  it('o CMS ficou só com Banners e Pop-up e o subtítulo mudou', async () => {
    render(<Cms />);
    expect(await screen.findByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((x) => x.textContent)).toEqual(['Banners', 'Pop-up']);
    expect(screen.queryByRole('tab', { name: 'Contatos e avisos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Blocos de texto' })).not.toBeInTheDocument();
    expect(screen.getByText('Banners e pop-up da página inicial')).toBeInTheDocument();
    expect(screen.queryByText(/contatos públicos/)).not.toBeInTheDocument();
    screen.getByRole('tab', { name: 'Banners' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Pop-up' })).toHaveAttribute('aria-selected', 'true');
  });

  it('a tela tem os 3 campos de regra e os 5 públicos em 2 cartões, com um Salvar em cada (3 no total)', async () => {
    await abrirContatos();
    expect(screen.getByRole('heading', { name: 'Regras do sistema' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aviso do topo' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Salvar' })).toHaveLength(3);
    for (const rotulo of ['WhatsApp', 'Telefone de contato', 'E-mail de contato', 'Horário de atendimento', 'Texto do aviso']) expect(screen.getByLabelText(rotulo)).toBeInTheDocument();
    expect(screen.getByText('As informações abaixo aparecem no rodapé, no botão de WhatsApp e na faixa do topo da loja.')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('chave_desconhecida_xyz');
  });

  it('cada campo de contato explica o padrão da empresa (vindo da constante compartilhada)', async () => {
    await abrirContatos();
    expect(screen.getByText(/Deixe vazio para usar o padrão da empresa: \(19\) 3638-1010/)).toBeVisible();
    expect(screen.getByText(/Deixe vazio para usar o padrão da empresa: \(19\) 99672-7161/)).toBeVisible();
    expect(screen.getByText(/Deixe vazio para usar o padrão da empresa: ecommerce@dmantiqueira\.com\.br/)).toBeVisible();
    expect(screen.getByText(/Deixe vazio para usar o padrão da empresa: Seg a sex, das 7h45 às 18h00/)).toBeVisible();
  });

  it('"Testar no WhatsApp" só aparece com número salvo válido (12 a 13 dígitos) e abre em nova aba', async () => {
    await abrirContatos();
    const link = screen.getByRole('link', { name: 'Testar no WhatsApp' });
    expect(link).toHaveAttribute('href', 'https://wa.me/5519996727161');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('sem número válido salvo, o link de teste não aparece', async () => {
    vi.mocked(api.get).mockImplementation(async () => ({ configuracoes: CONFIGS.map((c) => (c.chave === 'whatsapp' ? { ...c, valor: '5519' } : c)) }));
    await abrirContatos();
    expect(screen.queryByRole('link', { name: 'Testar no WhatsApp' })).not.toBeInTheDocument();
  });

  it('valida no front: WhatsApp 12 a 13 dígitos, telefone 10 a 11, e-mail e horário até 200; nada é enviado com erro', async () => {
    await abrirContatos();
    const zap = screen.getByLabelText('WhatsApp');
    await userEvent.clear(zap);
    await userEvent.type(zap, '1234');
    const tel = screen.getByLabelText('Telefone de contato');
    await userEvent.clear(tel);
    await userEvent.type(tel, '9');
    await userEvent.type(screen.getByLabelText('E-mail de contato'), 'sem-arroba');
    fireEvent.change(screen.getByLabelText('Horário de atendimento'), { target: { value: 'x'.repeat(201) } });
    await userEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[1]);
    const erros = screen.getAllByRole('alert').map((a) => a.textContent ?? '');
    expect(erros.some((e) => /WhatsApp deve ter de 12 a 13 dígitos/.test(e))).toBe(true);
    expect(erros.some((e) => /telefone deve ter de 10 a 11 dígitos/.test(e))).toBe(true);
    expect(erros.some((e) => /e-mail válido/.test(e))).toBe(true);
    expect(erros.some((e) => /até 200 caracteres/.test(e))).toBe(true);
    expect(api.put).not.toHaveBeenCalled();
  });

  it('o Salvar do contato envia PUT só dos campos alterados; Descartar restaura', async () => {
    await abrirContatos();
    const email = screen.getByLabelText('E-mail de contato');
    await userEvent.type(email, 'vendas@x.com');
    await userEvent.click(screen.getAllByRole('button', { name: 'Descartar alterações' })[0]);
    expect(email).toHaveValue('');
    await userEvent.type(email, 'vendas@x.com');
    await userEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[1]);
    await vi.waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
    expect(api.put).toHaveBeenCalledWith('/configuracoes/email_contato', { valor: 'vendas@x.com' });
  });

  it('pré-visualização do aviso acompanha o texto e, vazio, explica que a faixa fica escondida; limite de 200', async () => {
    await abrirContatos();
    expect(screen.getByTestId('previa-aviso')).toHaveTextContent('Entregas normais no feriado');
    const campo = screen.getByLabelText('Texto do aviso');
    expect(campo).toHaveAttribute('maxlength', '200');
    expect(screen.getByText('27/200')).toBeInTheDocument();
    await userEvent.clear(campo);
    expect(screen.queryByTestId('previa-aviso')).not.toBeInTheDocument();
    expect(screen.getByText('Sem aviso: a faixa fica escondida.')).toBeVisible();
    await userEvent.type(campo, 'Novo aviso');
    expect(screen.getByTestId('previa-aviso')).toHaveTextContent('Novo aviso');
    await userEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[2]);
    await vi.waitFor(() => expect(api.put).toHaveBeenCalledWith('/configuracoes/aviso_topo', { valor: 'Novo aviso' }));
  });
});
