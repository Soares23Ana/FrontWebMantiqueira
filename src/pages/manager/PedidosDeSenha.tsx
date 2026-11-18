import { useState } from 'react';
import { api, ApiError, errorMessage } from '../../api/client';
import Button from '../../components/Button';
import Modal from '../../components/manager/Modal';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { formatDateTime, formatPhone } from '../../utils/format';
import { useManager } from './ManagerLayout';

interface PedidoSenha {
  id_pedido: number;
  status: string;
  criado_em: string;
  cliente: { id_usuario: number; nome_exibicao: string; cnpj: string | null; telefone: string | null; ativo: boolean } | null;
}

// Resposta de POST /redefinicoes-senha/pedidos/:id/enviar-link. O link aparece só nesta resposta.
interface EnvioDoLink {
  link: string;
  expira_em: string;
  telefone_whatsapp: string | null;
  mensagem: string;
  aviso?: string;
}

const urlWhatsApp = (telefone: string, mensagem: string) => `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;

function PedidoItem({ pedido, onAbrir, onAtualizar }: { pedido: PedidoSenha; onAbrir: (id: number) => void; onAtualizar: () => void }) {
  const toast = useToast();
  const { refreshCounters } = useManager();
  const [enviando, setEnviando] = useState(false);
  const [envio, setEnvio] = useState<EnvioDoLink | null>(null);
  const [copiado, setCopiado] = useState(false);
  const c = pedido.cliente!;

  const enviarLink = async () => {
    setEnviando(true);
    try {
      const r = await api.post<EnvioDoLink>(`/redefinicoes-senha/pedidos/${pedido.id_pedido}/enviar-link`);
      setCopiado(false);
      setEnvio(r);
      refreshCounters();
      // Abre a conversa no telefone do cliente com a mensagem pronta; a pessoa só aperta enviar.
      if (r.telefone_whatsapp) window.open(urlWhatsApp(r.telefone_whatsapp, r.mensagem), '_blank', 'noopener');
    } catch (err) {
      toast(errorMessage(err), 'error');
      if (err instanceof ApiError && err.codigo === 'PEDIDO_NAO_PENDENTE') onAtualizar(); // outra pessoa da equipe já atendeu
    } finally {
      setEnviando(false);
    }
  };

  const dispensar = async () => {
    if (!confirm(`Dispensar o pedido de ${c.nome_exibicao}? Use quando você não reconhece o pedido.`)) return;
    try {
      await api.post(`/redefinicoes-senha/pedidos/${pedido.id_pedido}/dispensar`);
      toast('Pedido dispensado.');
      refreshCounters();
      onAtualizar();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const copiar = async () => {
    if (!envio) return;
    try {
      await navigator.clipboard.writeText(envio.link);
      setCopiado(true);
    } catch {
      toast('Não foi possível copiar. Selecione o link e copie manualmente.', 'error');
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-white p-3 text-sm">
      <div className="min-w-48 flex-1">
        <button type="button" onClick={() => onAbrir(c.id_usuario)} className="text-left font-extrabold hover:underline">{c.nome_exibicao}</button>
        <span className="block text-muted">{c.cnpj ?? 'CNPJ não informado'}</span>
      </div>
      <div className="text-muted">
        <span className="block">{c.telefone ? formatPhone(c.telefone) : 'Sem telefone cadastrado'}</span>
        <span className="block">Pediu em {formatDateTime(pedido.criado_em)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" disabled={enviando} onClick={enviarLink} className="px-4 py-2 text-sm !bg-green-600 !text-white hover:brightness-110 disabled:opacity-50">
          {enviando ? 'Gerando...' : 'Enviar link'}
        </Button>
        <Button type="button" variant="ghost" onClick={dispensar} className="px-4 py-2 text-sm">Dispensar</Button>
      </div>

      {envio && (
        <Modal title="Link de redefinição de senha" onClose={() => { setEnvio(null); onAtualizar(); }}>
          {envio.aviso && <p role="alert" className="mb-3 rounded-xl bg-amber-100 p-3 text-sm font-medium text-amber-800">{envio.aviso}</p>}
          <p className="rounded-xl bg-amber-100 p-3 text-sm font-medium text-amber-800">
            O link aparece só agora e vale até {formatDateTime(envio.expira_em)}. Se perder, gere outro: o anterior deixa de valer.
          </p>
          {envio.telefone_whatsapp && <p className="mt-3 text-sm text-muted">O WhatsApp foi aberto com a mensagem pronta. Se a janela não abriu, use o botão abaixo.</p>}
          <label className="mt-4 block text-sm">
            <span className="font-medium">Link para {c.nome_exibicao}</span>
            <input readOnly value={envio.link} onFocus={(e) => e.currentTarget.select()}
              className="mt-1 w-full rounded-xl border border-black/10 bg-surface px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="primary" className="px-4 py-2 text-sm" onClick={copiar}>{copiado ? 'Link copiado' : 'Copiar link'}</Button>
            {envio.telefone_whatsapp && (
              <a href={urlWhatsApp(envio.telefone_whatsapp, envio.mensagem)} target="_blank" rel="noopener noreferrer"
                className="rounded-full bg-green-600 px-4 py-2 text-sm font-extrabold text-white hover:brightness-110">Enviar pelo WhatsApp</a>
            )}
          </div>
        </Modal>
      )}
    </li>
  );
}

// Clientes que pediram nova senha no login (POST /auth/redefinicao-senha/solicitar). "Enviar link" gera o link de uso
// único, abre o WhatsApp no telefone do cliente com a mensagem pronta e dá o pedido como atendido.
export function PedidosDeSenha({ onAbrir }: { onAbrir: (id: number) => void }) {
  const { data, reload } = useApi(() => api.get<{ pedidos: PedidoSenha[] }>('/redefinicoes-senha/pedidos', { status: 'pendente', limite: 100 }), []);
  const pedidos = (data?.pedidos ?? []).filter((p) => p.cliente);
  if (pedidos.length === 0) return null;
  return (
    <section aria-label="Pedidos de nova senha" className="mb-5 rounded-2xl border border-accent/40 bg-accent/10 p-4">
      <h3 className="font-extrabold text-accent">Pedidos de nova senha ({pedidos.length})</h3>
      <p className="mb-3 text-sm text-muted">Estes clientes pediram uma nova senha no login. Clique em “Enviar link”: o link é gerado na hora e o WhatsApp abre no telefone do cliente, com a mensagem pronta. Se você não reconhece o pedido, use “Dispensar”.</p>
      <ul className="grid gap-2">
        {pedidos.map((p) => <PedidoItem key={p.id_pedido} pedido={p} onAbrir={onAbrir} onAtualizar={reload} />)}
      </ul>
    </section>
  );
}
