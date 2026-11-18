import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('../api/client')>();
  return { ...real, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});
vi.mock('../components/Logo', () => ({ default: () => null }));

import { api } from '../api/client';
import Register from './Register';

function abrir() {
  return render(<MemoryRouter><Register /></MemoryRouter>);
}

const enviar = () => userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

describe('Cadastro: avisos nos campos obrigatórios', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
  });

  it('formulário vazio: avisa em todos os campos obrigatórios e não chama a API', async () => {
    abrir();
    await enviar();

    for (const aviso of [
      'Informe o CNPJ.',
      'Informe o nome do responsável.',
      'Informe o e-mail.',
      'Informe o telefone com DDD.',
      'Informe a senha.',
      'Confirme a senha.',
      'Informe o CEP.',
      'Informe o logradouro.',
      'Informe o número.',
      'Informe o bairro.',
      'Informe a cidade.',
    ]) {
      expect(screen.getByText(aviso)).toBeInTheDocument();
    }
    expect(screen.getByText('Confira os campos destacados.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('marca os campos com erro como inválidos (borda vermelha) e leva o foco ao primeiro', async () => {
    abrir();
    await enviar();
    const cnpj = screen.getByLabelText(/^CNPJ/);
    expect(cnpj).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(cnpj).toHaveFocus());
  });

  it('e-mail sem formato válido recebe aviso próprio', async () => {
    abrir();
    await userEvent.type(screen.getByLabelText(/^E-mail/), 'sem-arroba');
    await enviar();
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
  });

  it('senha curta e senhas diferentes recebem aviso', async () => {
    abrir();
    await userEvent.type(screen.getByLabelText(/^Senha/), 'abc12');
    await userEvent.type(screen.getByLabelText(/^Confirmar senha/), 'outra');
    await enviar();
    expect(screen.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeInTheDocument();
    expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument();
  });

  it('telefone incompleto e CEP incompleto recebem aviso', async () => {
    abrir();
    await userEvent.type(screen.getByLabelText(/^Telefone/), '1999');
    await userEvent.type(screen.getByLabelText(/^CEP/), '1356');
    await enviar();
    expect(screen.getByText('Telefone incompleto. Informe com DDD.')).toBeInTheDocument();
    expect(screen.getByText('CEP incompleto.')).toBeInTheDocument();
  });

  it('CNPJ com número errado: "Informe um CNPJ válido."', async () => {
    abrir();
    await userEvent.type(screen.getByLabelText(/^CNPJ/), '11222333000182');
    await enviar();
    expect(screen.getByText('Informe um CNPJ válido.')).toBeInTheDocument();
  });
});
