import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { api, errorMessage } from '../../api/client';
import Button from '../../components/Button';
import Modal from '../../components/manager/Modal';
import Toggle from '../../components/manager/Toggle';
import { FormError } from '../../components/State';

const LIMITE_ZIP = 20 * 1024 * 1024;

interface Relatorio {
  total_arquivos: number;
  aplicadas: number;
  ignoradas_ja_tem_imagem: number;
  sem_produto: string[];
  formato_invalido: string[];
  grande_demais: string[];
  duplicadas: string[];
  falhas: string[];
  arquivos_ignorados_do_sistema: number;
  listas_cortadas: string[];
}

// Listas do relatório: [campo, texto, estilo]. Âmbar = aviso; vermelho = problema.
const LISTAS: [keyof Relatorio, string, string][] = [
  ['sem_produto', 'Nenhum produto com este SKU', 'bg-accent/10 text-accent'],
  ['formato_invalido', 'Formato não aceito ou arquivo que não é imagem', 'bg-accent/10 text-accent'],
  ['grande_demais', 'Maior que 5 MB', 'bg-accent/10 text-accent'],
  ['falhas', 'Não foi possível gravar; tente de novo', 'bg-accent/10 text-accent'],
  ['duplicadas', 'SKU repetido no ZIP; valeu a primeira foto', 'bg-amber-100 text-amber-800'],
];

// Envio de várias fotos de uma vez (POST /produtos/imagens/lote): um ZIP em que cada foto tem o SKU do produto como nome.
export default function BulkPhotosModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [substituir, setSubstituir] = useState(false);
  const [sending, setSending] = useState(false);
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setRelatorio(null);
    setFormError('');
    if (!f) { setFile(null); return; }
    if (!f.name.toLowerCase().endsWith('.zip')) { setFile(null); setFileError('Escolha um arquivo .zip.'); return; }
    if (f.size > LIMITE_ZIP) { setFile(null); setFileError('O ZIP deve ter no máximo 20 MB. Divida as fotos em mais de um ZIP.'); return; }
    setFileError('');
    setFile(f);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) { setFileError('Escolha o arquivo ZIP.'); return; }
    setSending(true);
    setFormError('');
    setRelatorio(null);
    try {
      const fd = new FormData();
      fd.append('arquivo', file);
      fd.append('substituir', substituir ? 'sim' : 'nao');
      const r = await api.post<{ mensagem: string; relatorio: Relatorio }>('/produtos/imagens/lote', fd);
      setRelatorio(r.relatorio);
      onDone(); // a lista de produtos recarrega por trás do modal
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal title="Enviar fotos em lote" onClose={onClose} wide>
      <form onSubmit={submit} noValidate>
        <p className="text-sm text-muted">
          Envie um ZIP com várias fotos. Nomeie cada foto com o SKU do produto, por exemplo <b>110606.jpg</b>.
          Aceita JPEG, PNG, WEBP e GIF de até 5 MB cada, até 200 fotos por ZIP. Pastas dentro do ZIP são aceitas.
        </p>
        <FormError message={formError} />
        <label className="mt-4 block text-sm">
          <span className="font-medium">Arquivo ZIP</span>
          <input type="file" accept=".zip,application/zip" onChange={onFile} disabled={sending} aria-invalid={Boolean(fileError)}
            className="mt-1 block w-full rounded-xl border border-black/10 bg-surface px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" />
        </label>
        {fileError && <small role="alert" className="block text-accent">{fileError}</small>}
        <div className="mt-4 flex items-start gap-3 text-sm">
          <Toggle checked={substituir} label="Substituir fotos que já existem" onChange={setSubstituir} />
          <div>
            <b>Substituir fotos que já existem</b>
            <p className="text-muted">Os produtos do catálogo inicial já têm foto. Ligue esta opção para trocar essas fotos pelas do ZIP.</p>
          </div>
        </div>
        <Button type="submit" variant="primary" disabled={sending || !file} className="mt-5 w-full disabled:opacity-50">
          {sending ? 'Enviando...' : 'Enviar'}
        </Button>
      </form>

      {relatorio && <Resultado r={relatorio} />}
    </Modal>
  );
}

function Resultado({ r }: { r: Relatorio }) {
  return (
    <div className="mt-6 grid gap-3 text-sm" role="status">
      <p className="text-muted">{r.total_arquivos} arquivo(s) analisado(s)</p>
      <p className="rounded-xl bg-green-100 p-3 font-extrabold text-green-800">{r.aplicadas} foto(s) aplicada(s)</p>
      {r.ignoradas_ja_tem_imagem > 0 && (
        <p className="rounded-xl bg-amber-100 p-3 font-medium text-amber-800">{r.ignoradas_ja_tem_imagem} foto(s) ignorada(s) porque o produto já tinha foto</p>
      )}
      {r.aplicadas === 0 && r.ignoradas_ja_tem_imagem > 0 && (
        <p className="rounded-xl bg-surface p-3">Nenhuma foto foi trocada porque os produtos já tinham foto. Envie de novo com “Substituir fotos que já existem” ligado.</p>
      )}
      {LISTAS.filter(([campo]) => (r[campo] as string[]).length > 0).map(([campo, titulo, estilo]) => (
        <details key={campo} className={`rounded-xl p-3 ${estilo}`}>
          <summary className="cursor-pointer font-medium">{titulo} ({(r[campo] as string[]).length})</summary>
          <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-5">
            {(r[campo] as string[]).map((nome, i) => <li key={`${nome}-${i}`}>{nome}</li>)}
          </ul>
          {r.listas_cortadas.includes(campo) && <p className="mt-1 text-xs">Mostrando só os primeiros 200.</p>}
        </details>
      ))}
      {r.arquivos_ignorados_do_sistema > 0 && (
        <small className="text-muted">{r.arquivos_ignorados_do_sistema} arquivo(s) de sistema foram ignorados.</small>
      )}
    </div>
  );
}
