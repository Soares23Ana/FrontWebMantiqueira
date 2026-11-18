import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('../api/client')>();
  return { ...real, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null, login: vi.fn(), expiredMessage: null }) }));
vi.mock('../context/StoreContext', () => ({ useStore: () => ({ config: { whatsapp: '5519982224290' } }) }));
vi.mock('../components/Logo', () => ({ default: () => null }));

import { api, ApiError } from '../api/client';
import Login from './Login';

const MENSAGEM = 'Se o CNPJ estiver cadastrado, a equipe da Mantiqueira vai entrar em contato pelo WhatsApp para enviar o link.';

function abrir() {
  render(<MemoryRouter><Login /></MemoryRouter>);
}

describe('Login: campo só de CNPJ', () => {
  it('o campo se chama "CNPJ" e a validação fala só de CNPJ', async () => {
    abrir();
    expect(screen.getAllByLabelText(/^CNPJ/)[0]).toBeInTheDocument();
    expect(screen.queryByText(/CNPJ ou e-mail/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^entrar$/i }));
    expect(screen.getByText('Informe seu CNPJ.')).toBeInTheDocument();
  });
});

describe('Login: "Esqueci a senha" pede o CNPJ e avisa a equipe', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it('abre o pedido, valida o CNPJ e não chama a API com um CNPJ inválido', async () => {
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Peça uma nova senha' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pedir nova senha' }));
    expect(screen.getByText('Informe o CNPJ da sua empresa.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^CNPJ da empresa/), '11222333000182');
    await userEvent.click(screen.getByRole('button', { name: 'Pedir nova senha' }));
    expect(screen.getByText('Informe um CNPJ válido.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('com CNPJ válido envia o pedido (só dígitos) e mostra a resposta padrão com o WhatsApp como alternativa', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ mensagem: MENSAGEM });
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Peça uma nova senha' }));
    await userEvent.type(screen.getByLabelText(/^CNPJ da empresa/), '11222333000181');
    await userEvent.click(screen.getByRole('button', { name: 'Pedir nova senha' }));

    expect(await screen.findByText(MENSAGEM)).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/auth/redefinicao-senha/solicitar', { documento: '11222333000181' });
    expect(screen.getByRole('link', { name: /WhatsApp/ }).getAttribute('href')).toMatch(/^https:\/\/wa\.me\/5519982224290\?text=/);
  });

  it('mostra a mensagem da API quando há limite de pedidos', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError(429, 'Muitos pedidos de nova senha. Tente novamente mais tarde.', 'MUITAS_TENTATIVAS'));
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Peça uma nova senha' }));
    await userEvent.type(screen.getByLabelText(/^CNPJ da empresa/), '11222333000181');
    await userEvent.click(screen.getByRole('button', { name: 'Pedir nova senha' }));
    expect(await screen.findByText('Muitos pedidos de nova senha. Tente novamente mais tarde.')).toBeInTheDocument();
  });

  it('Cancelar fecha o pedido sem chamar a API', async () => {
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Peça uma nova senha' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Peça uma nova senha' })).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});
