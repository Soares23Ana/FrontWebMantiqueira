import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, errorMessage } from '../../api/client';
import Button from '../../components/Button';
import { TextAreaField } from '../../components/Field';
import ChipFilter from '../../components/manager/ChipFilter';
import Modal from '../../components/manager/Modal';
import Pagination from '../../components/manager/Pagination';
import SearchBox from '../../components/manager/SearchBox';
import SectionHeader from '../../components/manager/SectionHeader';
import TableCard from '../../components/manager/TableCard';
import { ErrorState, FormError, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { formatDateTime, formatPhone, formatTempoParado } from '../../utils/format';
import type { Paginacao } from '../../types';
import { useManager } from './ManagerLayout';

interface CarrinhoAbandonado {
  id_carrinho: number;
  cliente: { id_usuario: number; cnpj: string | null; nome_exibicao: string; telefone: string | null; email: string };
  ultimo_movimento_em: string;
  minutos_parado: number;
  dias_parado: number;
  total_unidades: number;
  itens: { id_produto: number; sku: string; nome: string; quantidade: number }[];
  contatado_em: string | null;
  contatado_por: { id_usuario: number; nome: string } | null;
  link_whatsapp: string | null;
}

const filtros = ['Todos', 'Sem contato', 'Já contatados'] as const;
const contatadoValue: Record<(typeof filtros)[number], boolean | undefined> = { Todos: undefined, 'Sem contato': false, 'Já contatados': true };

// Carrinhos com itens parados há alguns dias (GET /carrinhos-abandonados). A equipe fala com o cliente por
// conta própria (o link do WhatsApp já vem com uma mensagem pronta) e registra o contato aqui.
export default function AbandonedCarts() {
  const toast = useToast();
  const { refreshCounters } = useManager();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<(typeof filtros)[number]>('Sem contato');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [contatando, setContatando] = useState<CarrinhoAbandonado | null>(null);
  const { data, loading, error, reload } = useApi(
    () => api.get<{ minutos: number; carrinhos: CarrinhoAbandonado[]; paginacao: Paginacao }>('/carrinhos-abandonados',
      { busca, contatado: contatadoValue[filtro], pagina: page, limite: pageSize }),
    [busca, filtro, page, pageSize],
  );

  const saved = () => {
    setContatando(null);
    toast('Contato registrado.');
    reload();
    refreshCounters();
  };

  return (
    <>
      <SectionHeader title="Carrinhos abandonados"
        subtitle={`Clientes com itens no carrinho parados há ${formatTempoParado(data?.minutos ?? 30)} ou mais e sem pedido depois disso.`} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBox value={busca} onChange={(v) => { setBusca(v); setPage(1); }} placeholder="Buscar por nome, e-mail ou CNPJ" />
        <ChipFilter label="Contato" options={filtros} value={filtro} onChange={(v) => { setFiltro(v); setPage(1); }} />
      </div>
      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <TableCard headers={['Cliente', 'Itens no carrinho', 'Parado há', 'Contato', 'Ações']}
          isEmpty={!loading && data?.carrinhos.length === 0} empty="Nenhum carrinho abandonado com esses filtros."
          footer={data && <Pagination page={page} pageSize={pageSize} total={data.paginacao.total} onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />}>
          {loading && <tr><td colSpan={5}><Loading className="py-8" /></td></tr>}
          {!loading && data?.carrinhos.map((c) => (
            <tr key={c.id_carrinho}>
              <td className="px-4 py-3 text-sm">
                <b>{c.cliente.nome_exibicao}</b>
                <span className="block text-muted">{c.cliente.cnpj ?? c.cliente.email}</span>
                {c.cliente.telefone && <span className="block text-muted">{formatPhone(c.cliente.telefone)}</span>}
              </td>
              <td className="px-4 text-sm">
                <b>{c.total_unidades} unidade(s)</b>
                <span className="block max-w-xs truncate text-muted">{c.itens.map((i) => `${i.quantidade}× ${i.nome}`).join(', ')}</span>
              </td>
              <td className="px-4 text-sm">{formatTempoParado(c.minutos_parado)}<span className="block text-muted">{formatDateTime(c.ultimo_movimento_em)}</span></td>
              <td className="px-4 text-sm">
                {c.contatado_em
                  ? <><span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">Contatado</span>
                    <span className="mt-1 block text-muted">{formatDateTime(c.contatado_em)}{c.contatado_por ? ` · ${c.contatado_por.nome}` : ''}</span></>
                  : <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">Sem contato</span>}
              </td>
              <td className="px-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  {c.link_whatsapp && (
                    <a href={c.link_whatsapp} target="_blank" rel="noopener noreferrer"
                      className="rounded-full bg-green-600 px-3 py-1.5 font-extrabold text-white hover:brightness-110">WhatsApp</a>
                  )}
                  <Button variant="ghost" className="px-3 py-1.5 text-sm" onClick={() => setContatando(c)}>Registrar contato</Button>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}
      {contatando && <ContactModal carrinho={contatando} onClose={() => setContatando(null)} onSaved={saved} />}
    </>
  );
}

function ContactModal({ carrinho, onClose, onSaved }: { carrinho: CarrinhoAbandonado; onClose: () => void; onSaved: () => void }) {
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    setError('');
    try {
      await api.patch(`/carrinhos-abandonados/${carrinho.cliente.id_usuario}/contatado`, observacao.trim() ? { observacao: observacao.trim() } : {});
      onSaved();
    } catch (err) {
      setFormError(errorMessage(err));
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Registrar contato" onClose={onClose}>
      <p className="text-sm text-muted">{carrinho.cliente.nome_exibicao} · {carrinho.total_unidades} unidade(s) no carrinho</p>
      <form onSubmit={submit} noValidate>
        <FormError message={formError} />
        <TextAreaField label="Observação (opcional)" maxLength={500} placeholder="Ex.: falei pelo WhatsApp, vai pedir na segunda"
          value={observacao} onChange={(e) => setObservacao(e.target.value)} error={error && !formError ? error : undefined} />
        <Button type="submit" variant="primary" disabled={saving} className="mt-4 w-full disabled:opacity-50">{saving ? 'Salvando...' : 'Registrar contato'}</Button>
      </form>
    </Modal>
  );
}
