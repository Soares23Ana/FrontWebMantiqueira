import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../api/client')>();
  return { ...real, api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), del: vi.fn() } };
});

import { api, ApiError } from '../../api/client';
import BulkPhotosModal from './BulkPhotosModal';

const relatorioBase = {
  total_arquivos: 5, aplicadas: 3, ignoradas_ja_tem_imagem: 0, sem_produto: [], formato_invalido: [],
  grande_demais: [], duplicadas: [], falhas: [], arquivos_ignorados_do_sistema: 0, listas_cortadas: [],
};

function abrir() {
  const onDone = vi.fn();
  const onClose = vi.fn();
  render(<BulkPhotosModal onClose={onClose} onDone={onDone} />);
  const ui = userEvent.setup({ applyAccept: false }); // quem recusa o arquivo errado é a própria tela
  return { ui, onDone, onClose };
}

const zip = (nome = 'fotos.zip') => new File(['zip'], nome, { type: 'application/zip' });

describe('Fotos em lote por ZIP', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it('explica a regra do nome do arquivo e começa com "Substituir" desligado', () => {
    abrir();
    expect(screen.getByText('110606.jpg')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /substituir fotos que já existem/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  it('recusa arquivo que não é .zip', async () => {
    const { ui } = abrir();
    await ui.upload(screen.getByLabelText('Arquivo ZIP'), new File(['x'], 'leia-me.txt', { type: 'text/plain' }));
    expect(screen.getByText('Escolha um arquivo .zip.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  it('recusa ZIP com mais de 20 MB', async () => {
    const { ui } = abrir();
    const grande = zip('grande.zip');
    Object.defineProperty(grande, 'size', { value: 21 * 1024 * 1024 });
    await ui.upload(screen.getByLabelText('Arquivo ZIP'), grande);
    expect(screen.getByText('O ZIP deve ter no máximo 20 MB. Divida as fotos em mais de um ZIP.')).toBeInTheDocument();
  });

  it('envia com substituir=nao, mostra o relatório e recarrega a lista', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      mensagem: 'Envio em lote concluído.',
      relatorio: { ...relatorioBase, sem_produto: ['999999.jpg'], formato_invalido: ['leia-me.txt'], duplicadas: ['110606 copia.jpg'], arquivos_ignorados_do_sistema: 2 },
    });
    const { ui, onDone } = abrir();
    await ui.upload(screen.getByLabelText('Arquivo ZIP'), zip());
    await ui.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('3 foto(s) aplicada(s)')).toBeInTheDocument();
    const [rota, corpo] = vi.mocked(api.post).mock.calls[0] as [string, FormData];
    expect(rota).toBe('/produtos/imagens/lote');
    expect(corpo.get('substituir')).toBe('nao');
    expect((corpo.get('arquivo') as File).name).toBe('fotos.zip');
    expect(screen.getByText(/Nenhum produto com este SKU \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Formato não aceito ou arquivo que não é imagem \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/SKU repetido no ZIP; valeu a primeira foto \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('2 arquivo(s) de sistema foram ignorados.')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalled();
  });

  it('com a chave ligada envia substituir=sim', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ mensagem: 'ok', relatorio: relatorioBase });
    const { ui } = abrir();
    await ui.upload(screen.getByLabelText('Arquivo ZIP'), zip());
    await ui.click(screen.getByRole('switch', { name: /substituir/i }));
    await ui.click(screen.getByRole('button', { name: 'Enviar' }));
    await screen.findByText('3 foto(s) aplicada(s)');
    expect((vi.mocked(api.post).mock.calls[0][1] as FormData).get('substituir')).toBe('sim');
  });

  it('nenhuma aplicada e várias ignoradas: mostra a dica para ligar "Substituir"', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ mensagem: 'ok', relatorio: { ...relatorioBase, aplicadas: 0, ignoradas_ja_tem_imagem: 4 } });
    const { ui } = abrir();
    await ui.upload(screen.getByLabelText('Arquivo ZIP'), zip());
    await ui.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText(/Nenhuma foto foi trocada porque os produtos já tinham foto/)).toBeInTheDocument();
    expect(screen.getByText('4 foto(s) ignorada(s) porque o produto já tinha foto')).toBeInTheDocument();
  });

  it('mostra a mensagem da API quando o ZIP é inválido', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError(422, 'O arquivo enviado não é um ZIP válido ou está corrompido.', 'ZIP_INVALIDO'));
    const { ui } = abrir();
    await ui.upload(screen.getByLabelText('Arquivo ZIP'), zip('falso.zip'));
    await ui.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText('O arquivo enviado não é um ZIP válido ou está corrompido.')).toBeInTheDocument();
  });
});
