import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../api/client')>();
  return { ...real, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1, nome: 'Ana Gestora', tipo: 'equipe', pode_gerenciar_equipe: true } }) }));

import { api } from '../../api/client';
import Team from './Team';

const base = { tipo: 'equipe', pode_gerenciar_equipe: false, cargo: null, criado_em: '2026-01-01T00:00:00.000Z' };
const EU = { ...base, id_usuario: 1, nome: 'Ana Gestora', email: 'ana@x.com', telefone: '19999990001', ativo: true, pode_gerenciar_equipe: true };
const OUTRO = { ...base, id_usuario: 2, nome: 'Bruno Estoque', email: 'bruno@x.com', telefone: '19999990002', ativo: true };
const INATIVO = { ...base, id_usuario: 3, nome: 'Carla Antiga', email: 'carla@x.com', telefone: null, ativo: false };

beforeEach(() => {
  vi.mocked(api.get).mockReset().mockResolvedValue({ usuarios: [EU, OUTRO, INATIVO], paginacao: { total: 3, pagina: 1, limite: 100, total_paginas: 1 } });
  vi.mocked(api.post).mockReset();
});

const abrirEdicao = async (nome: string) => {
  render(<Team />);
  const linha = (await screen.findByText(nome)).closest('tr') as HTMLElement;
  await userEvent.click(within(linha).getByRole('button', { name: 'Editar' }));
  return screen.getByRole('dialog', { name: 'Editar usuário' });
};

describe('Equipe: redefinição de senha por link', () => {
  it('a tabela não tem mais o botão "Gerar link"', async () => {
    render(<Team />);
    await screen.findByText('Bruno Estoque');
    expect(screen.queryByRole('button', { name: /Gerar link/ })).not.toBeInTheDocument();
  });

  it('edição de outro usuário ativo mostra o cartão e o clique chama a rota; fechar o link não fecha a edição', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ token: 'tok9', expira_em: '2026-11-17T22:00:00.000Z' });
    const janela = await abrirEdicao('Bruno Estoque');
    expect(within(janela).getByText('recomendado')).toBeInTheDocument();
    await userEvent.click(within(janela).getByRole('button', { name: 'Gerar link de redefinição' }));
    expect(api.post).toHaveBeenCalledWith('/admin/usuarios/2/redefinicao-senha');
    expect(api.post).toHaveBeenCalledTimes(1); // não enviou o formulário
    expect(await screen.findByLabelText(/Link para Bruno Estoque/)).toBeInTheDocument();

    await userEvent.click(within(screen.getByRole('dialog', { name: 'Link de redefinição de senha' })).getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog', { name: 'Link de redefinição de senha' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Editar usuário' })).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('ESC com o link aberto fecha só o link', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ token: 'tok9', expira_em: '2026-11-17T22:00:00.000Z' });
    const janela = await abrirEdicao('Bruno Estoque');
    await userEvent.click(within(janela).getByRole('button', { name: 'Gerar link de redefinição' }));
    await screen.findByLabelText(/Link para Bruno Estoque/);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Link de redefinição de senha' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Editar usuário' })).toBeInTheDocument();
  });

  it('telefone digitado diferente do salvo mostra o aviso para salvar antes', async () => {
    const janela = await abrirEdicao('Bruno Estoque');
    expect(within(janela).queryByText(/Salve as alterações/)).not.toBeInTheDocument();
    const tel = within(janela).getByLabelText(/Telefone/);
    await userEvent.clear(tel);
    await userEvent.type(tel, '19988887777');
    expect(within(janela).getByText('Salve as alterações para usar o novo telefone no WhatsApp.')).toBeInTheDocument();
  });

  it('a própria conta vê o texto sobre Minha conta e não o botão', async () => {
    const janela = await abrirEdicao('Ana Gestora');
    expect(within(janela).getByText(/Para trocar a sua própria senha, use Minha conta/)).toBeInTheDocument();
    expect(within(janela).queryByRole('button', { name: /Gerar link/ })).not.toBeInTheDocument();
  });

  it('usuário inativo vê o aviso de reativar e não o botão', async () => {
    const janela = await abrirEdicao('Carla Antiga');
    expect(within(janela).getByText('Reative o usuário para gerar um link de redefinição.')).toBeInTheDocument();
    expect(within(janela).queryByRole('button', { name: /Gerar link/ })).not.toBeInTheDocument();
  });

  it('"Novo usuário" não mostra o cartão nem os avisos', async () => {
    render(<Team />);
    await userEvent.click(await screen.findByRole('button', { name: /Novo usuário/ }));
    const janela = screen.getByRole('dialog', { name: 'Novo usuário da equipe' });
    expect(within(janela).queryByText('recomendado')).not.toBeInTheDocument();
    expect(within(janela).queryByRole('button', { name: /Gerar link/ })).not.toBeInTheDocument();
    expect(within(janela).queryByText(/Minha conta|Reative/)).not.toBeInTheDocument();
  });
});
