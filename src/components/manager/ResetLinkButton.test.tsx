import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../api/client')>();
  return { ...real, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});

import { api, ApiError } from '../../api/client';
import ResetLinkButton from './ResetLinkButton';

describe('Gerar link de redefinição', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it('chama a rota, monta o link com o endereço do site e mostra a validade e o aviso', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ mensagem: 'ok', token: 'tok123', expira_em: '2026-11-17T22:00:00.000Z' });
    render(<ResetLinkButton rota="/clientes/4/redefinicao-senha" nome="Mercadinho" telefone="(19) 99999-0000" />);
    await userEvent.click(screen.getByRole('button', { name: 'Gerar link de redefinição' }));

    expect(api.post).toHaveBeenCalledWith('/clientes/4/redefinicao-senha');
    const campo = await screen.findByLabelText(/Link para Mercadinho/);
    expect(campo).toHaveValue(`${window.location.origin}/redefinir-senha?token=tok123`);
    expect(campo).toHaveAttribute('readonly');
    expect(screen.getByText(/aparece só agora e vale 60 minutos/)).toBeInTheDocument();
  });

  it('WhatsApp usa o telefone só com dígitos, com 55, sem duplicar', async () => {
    vi.mocked(api.post).mockResolvedValue({ mensagem: 'ok', token: 'tok123', expira_em: '2026-11-17T22:00:00.000Z' });
    const { unmount } = render(<ResetLinkButton rota="/x" nome="A" telefone="(19) 99999-0000" />);
    await userEvent.click(screen.getByRole('button', { name: /gerar link/i }));
    expect((await screen.findByRole('link', { name: /WhatsApp/ })).getAttribute('href')).toMatch(/^https:\/\/wa\.me\/5519999990000\?text=/);
    unmount();

    render(<ResetLinkButton rota="/x" nome="B" telefone="5519999990000" />);
    await userEvent.click(screen.getByRole('button', { name: /gerar link/i }));
    expect((await screen.findByRole('link', { name: /WhatsApp/ })).getAttribute('href')).toMatch(/^https:\/\/wa\.me\/5519999990000\?text=/);
  });

  it('sem telefone não mostra o botão do WhatsApp', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ mensagem: 'ok', token: 't', expira_em: '2026-11-17T22:00:00.000Z' });
    render(<ResetLinkButton rota="/x" nome="Sem fone" telefone={null} />);
    await userEvent.click(screen.getByRole('button', { name: /gerar link/i }));
    await screen.findByLabelText(/Link para Sem fone/);
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).not.toBeInTheDocument();
  });

  it('copia o link para a área de transferência', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ mensagem: 'ok', token: 'tok123', expira_em: '2026-11-17T22:00:00.000Z' });
    const ui = userEvent.setup();
    const copiar = vi.spyOn(navigator.clipboard, 'writeText');
    render(<ResetLinkButton rota="/x" nome="A" telefone={null} />);
    await ui.click(screen.getByRole('button', { name: /gerar link/i }));
    await ui.click(await screen.findByRole('button', { name: 'Copiar link' }));
    expect(copiar).toHaveBeenCalledWith(expect.stringContaining('/redefinir-senha?token=tok123'));
    expect(await screen.findByRole('button', { name: 'Link copiado' })).toBeInTheDocument();
  });

  it('se a API recusar, não abre o modal', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError(409, 'Usuário inativo.', 'USUARIO_INATIVO'));
    render(<ResetLinkButton rota="/x" nome="A" />);
    await userEvent.click(screen.getByRole('button', { name: /gerar link/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
