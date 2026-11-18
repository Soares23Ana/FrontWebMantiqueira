import { useState } from 'react';
import { api, errorMessage } from '../../api/client';
import Button from '../Button';
import Modal from './Modal';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, minutosDeValidade, textoValidade } from '../../utils/format';

interface Props {
  rota: string;            // ex.: /clientes/12/redefinicao-senha
  nome: string;            // para a mensagem de WhatsApp e o título
  telefone?: string | null;
  className?: string;
  /** Texto do botão (padrão: "Gerar link de redefinição"). */
  rotulo?: string;
  /** Abre o WhatsApp do cliente, com a mensagem pronta, assim que o link é gerado. O modal continua como reserva. */
  abrirWhatsApp?: boolean;
  /** Chamado depois que o link foi gerado (ex.: recarregar uma lista). */
  aoGerar?: () => void;
  /** Chamado quando o modal com o link é fechado (ex.: atualizar uma lista só depois, para o modal não sumir antes). */
  aoFechar?: () => void;
}

/** Telefone só com dígitos e com o 55 na frente (sem duplicar). */
function telefoneWhats(tel: string | null | undefined): string | null {
  const d = (tel ?? '').replace(/\D/g, '');
  if (d.length < 10) return null;
  return d.startsWith('55') && d.length >= 12 ? d : `55${d}`;
}

function urlWhatsApp(fone: string, nome: string, link: string, minutos: number): string {
  const mensagem = `Olá, ${nome}! Segue o link para você criar uma nova senha na Mantiqueira (vale por ${textoValidade(minutos)} e só pode ser usado uma vez): ${link}`;
  return `https://wa.me/${fone}?text=${encodeURIComponent(mensagem)}`;
}

// Gera o link de redefinição de senha (uso único; a validade é configurada no back e vem em `expira_em`) e mostra num
// modal, com copiar e WhatsApp. Os minutos de validade são calculados uma vez, ao gerar, para o texto não mudar com a
// janela aberta. A API devolve só o token; o endereço é montado aqui. O token não é guardado em lugar nenhum além deste estado.
export default function ResetLinkButton({ rota, nome, telefone, className = '', rotulo = 'Gerar link de redefinição', abrirWhatsApp = false, aoGerar, aoFechar }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<{ link: string; expira_em: string; minutos: number } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const fone = telefoneWhats(telefone);

  const gerar = async () => {
    setLoading(true);
    try {
      const r = await api.post<{ token: string; expira_em: string }>(rota);
      setCopiado(false);
      const link = `${window.location.origin}/redefinir-senha?token=${encodeURIComponent(r.token)}`;
      const minutos = minutosDeValidade(r.expira_em);
      setDados({ link, expira_em: r.expira_em, minutos });
      if (abrirWhatsApp && fone) window.open(urlWhatsApp(fone, nome, link, minutos), '_blank', 'noopener');
      aoGerar?.();
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


  return (
    <>
      <Button type="button" variant="ghost" disabled={loading} onClick={gerar} className={`px-4 py-2 text-sm disabled:opacity-50 ${className}`}>
        {loading ? 'Gerando...' : rotulo}
      </Button>
      {dados && (
        <Modal title="Link de redefinição de senha" onClose={() => { setDados(null); aoFechar?.(); }}>
          <p className="rounded-xl bg-amber-100 p-3 text-sm font-medium text-amber-800">
            O link aparece só agora e vale {textoValidade(dados.minutos)}. Se perder, gere outro: o anterior deixa de valer.
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
              <a href={urlWhatsApp(fone, nome, dados.link, dados.minutos)} target="_blank" rel="noopener noreferrer"
                className="rounded-full bg-green-600 px-4 py-2 text-sm font-extrabold text-white hover:brightness-110">Enviar pelo WhatsApp</a>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
