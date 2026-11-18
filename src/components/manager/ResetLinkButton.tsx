import { useState } from 'react';
import { api, errorMessage } from '../../api/client';
import Button from '../Button';
import Modal from './Modal';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/format';

interface Props {
  rota: string;            // ex.: /clientes/12/redefinicao-senha
  nome: string;            // para a mensagem de WhatsApp e o título
  telefone?: string | null;
  className?: string;
}

/** Telefone só com dígitos e com o 55 na frente (sem duplicar). */
function telefoneWhats(tel: string | null | undefined): string | null {
  const d = (tel ?? '').replace(/\D/g, '');
  if (d.length < 10) return null;
  return d.startsWith('55') && d.length >= 12 ? d : `55${d}`;
}

// Gera o link de redefinição de senha (uso único, vale 60 min) e mostra num modal, com copiar e WhatsApp.
// A API devolve só o token; o endereço é montado aqui. O token não é guardado em lugar nenhum além deste estado.
export default function ResetLinkButton({ rota, nome, telefone, className = '' }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<{ link: string; expira_em: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const gerar = async () => {
    setLoading(true);
    try {
      const r = await api.post<{ token: string; expira_em: string }>(rota);
      setCopiado(false);
      setDados({ link: `${window.location.origin}/redefinir-senha?token=${encodeURIComponent(r.token)}`, expira_em: r.expira_em });
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const copiar = async () => {
    if (!dados) return;
    try {
      await navigator.clipboard.writeText(dados.link);
      setCopiado(true);
    } catch {
      toast('Não foi possível copiar. Selecione o link e copie manualmente.', 'error');
    }
  };

  const fone = telefoneWhats(telefone);
  const mensagem = dados ? `Olá, ${nome}! Segue o link para você criar uma nova senha na Mantiqueira (vale por 60 minutos e só pode ser usado uma vez): ${dados.link}` : '';

  return (
    <>
      <Button type="button" variant="ghost" disabled={loading} onClick={gerar} className={`px-4 py-2 text-sm disabled:opacity-50 ${className}`}>
        {loading ? 'Gerando...' : 'Gerar link de redefinição'}
      </Button>
      {dados && (
        <Modal title="Link de redefinição de senha" onClose={() => setDados(null)}>
          <p className="rounded-xl bg-amber-100 p-3 text-sm font-medium text-amber-800">
            O link aparece só agora e vale 60 minutos. Se perder, gere outro: o anterior deixa de valer.
          </p>
          <label className="mt-4 block text-sm">
            <span className="font-medium">Link para {nome}</span>
            <input readOnly value={dados.link} onFocus={(e) => e.currentTarget.select()}
              className="mt-1 w-full rounded-xl border border-black/10 bg-surface px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" />
          </label>
          <p className="mt-2 text-sm text-muted">Válido até {formatDateTime(dados.expira_em)}.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="primary" className="px-4 py-2 text-sm" onClick={copiar}>{copiado ? 'Link copiado' : 'Copiar link'}</Button>
            {fone && (
              <a href={`https://wa.me/${fone}?text=${encodeURIComponent(mensagem)}`} target="_blank" rel="noopener noreferrer"
                className="rounded-full bg-green-600 px-4 py-2 text-sm font-extrabold text-white hover:brightness-110">Enviar pelo WhatsApp</a>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
