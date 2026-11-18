import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('../api/client')>();
  return { ...real, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});
vi.mock('../context/StoreContext', () => ({ useStore: () => ({ config: { whatsapp: '5519999990000' } }) }));
vi.mock('../components/Logo', () => ({ default: () => null }));

import { api, ApiError } from '../api/client';
import ResetPassword from './ResetPassword';

function Endereco() {
  const l = useLocation();
  return <output data-testid="endereco">{l.pathname + l.search}</output>;
}

function abrir(url = '/redefinir-senha?token=tok-de-teste') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ResetPassword />
      <Endereco />
    </MemoryRouter>,
  );
}

describe('Redefinição de senha por link', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it('sem token na URL: mostra "link inválido" sem chamar a API', async () => {
    abrir('/redefinir-senha');
    expect(await screen.findByText(/Link inválido ou expirado/)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /Ir para o login/ })).toHaveAttribute('href', '/entrar');
  });

  it('token vencido ou usado: mostra "link inválido" com o WhatsApp da loja', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ valido: false });
    abrir();
    expect(await screen.findByText(/Link inválido ou expirado/)).toBeInTheDocument();
    const whats = screen.getByRole('link', { name: /WhatsApp/ });
    expect(whats.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/5519999990000/);
  });

  it('token válido: tira o token do endereço e mostra o formulário', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ valido: true });
    abrir();
    expect(await screen.findByLabelText(/^Nova senha/)).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/auth/redefinir-senha/validar', { token: 'tok-de-teste' });
    expect(screen.getByTestId('endereco')).toHaveTextContent('/redefinir-senha');
    expect(screen.getByTestId('endereco').textContent).not.toContain('tok-de-teste');
  });

  it('pede "no-referrer" para o token não vazar pelo cabeçalho de origem', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ valido: true });
    abrir();
    await screen.findByLabelText(/^Nova senha/);
    expect(document.head.querySelector('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
  });

  it('senha curta e senhas diferentes: erro na tela, sem chamar a API de troca', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ valido: true });
    abrir();
    await userEvent.type(await screen.findByLabelText(/^Nova senha/), 'abc12');
    await userEvent.type(screen.getByLabelText(/^Repita a nova senha/), 'abc12');
    await userEvent.click(screen.getByRole('button', { name: /salvar nova senha/i }));
    expect(screen.getByText('A senha deve ter de 8 a 72 caracteres.')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText(/^Nova senha/));
    await userEvent.type(screen.getByLabelText(/^Nova senha/), 'NovaSenha2026');
    await userEvent.click(screen.getByRole('button', { name: /salvar nova senha/i }));
    expect(screen.getByText('As senhas não são iguais.')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledTimes(1); // só a validação do link
  });

  it('senha válida: envia o token e a nova senha e mostra o sucesso (sem login automático)', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ valido: true }).mockResolvedValueOnce({ mensagem: 'ok' });
    abrir();
    await userEvent.type(await screen.findByLabelText(/^Nova senha/), 'NovaSenha2026');
    await userEvent.type(screen.getByLabelText(/^Repita a nova senha/), 'NovaSenha2026');
    await userEvent.click(screen.getByRole('button', { name: /salvar nova senha/i }));
    expect(await screen.findByText('Senha alterada. Entre com a nova senha.')).toBeInTheDocument();
    expect(api.post).toHaveBeenLastCalledWith('/auth/redefinir-senha', { token: 'tok-de-teste', nova_senha: 'NovaSenha2026' });
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar');
  });

  it('TOKEN_INVALIDO ao salvar volta ao aviso de link vencido', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ valido: true })
      .mockRejectedValueOnce(new ApiError(422, 'Link inválido ou expirado. Peça um novo link à equipe.', 'TOKEN_INVALIDO'));
    abrir();
    await userEvent.type(await screen.findByLabelText(/^Nova senha/), 'NovaSenha2026');
    await userEvent.type(screen.getByLabelText(/^Repita a nova senha/), 'NovaSenha2026');
    await userEvent.click(screen.getByRole('button', { name: /salvar nova senha/i }));
    await waitFor(() => expect(screen.getByText(/Link inválido ou expirado/)).toBeInTheDocument());
  });
});
