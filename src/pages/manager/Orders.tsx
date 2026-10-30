import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, errorMessage, fetchAllPages, imageUrl } from '../../api/client';
import Button from '../../components/Button';
import { TextAreaField } from '../../components/Field';
import Icon from '../../components/Icon';
import ChipFilter from '../../components/manager/ChipFilter';
import Modal from '../../components/manager/Modal';
import Pagination from '../../components/manager/Pagination';
import SearchBox from '../../components/manager/SearchBox';
import SectionHeader from '../../components/manager/SectionHeader';
import TableCard from '../../components/manager/TableCard';
import OrderTimeline from '../../components/OrderTimeline';
import StatusBadge from '../../components/StatusBadge';
import { ErrorState, FormError, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi, useDebounced } from '../../hooks/useApi';
import { downloadCsv } from '../../utils/csv';
import { formatDate, formatDateOnly, formatDateTime, formatPhone } from '../../utils/format';
import { TODOS_STATUS } from '../../types';
import type { Paginacao, Pedido, StatusPedido } from '../../types';
import { useManager } from './ManagerLayout';

const statusOptions = ['Todos', ...TODOS_STATUS] as const;
type StatusFilter = (typeof statusOptions)[number];

export default function Orders() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('Todos');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const busca = useDebounced(search.trim());
  const filtros = { busca, status: status === 'Todos' ? '' : status, de, ate };

  const lista = useApi(
    () => api.get<{ pedidos: Pedido[]; paginacao: Paginacao }>('/pedidos', { ...filtros, pagina: page, limite: pageSize }),
    [busca, status, de, ate, page, pageSize],
  );

  const openId = Number(params.get('pedido')) || null;
  const setOpen = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('pedido', String(id));
    else next.delete('pedido');
    setParams(next);
  };

  // Exporta todos os pedidos do filtro atual (sem valores financeiros).
  const exportCsv = async () => {
    try {
      const todos = await fetchAllPages<Pedido>('/pedidos', 'pedidos', filtros);
      downloadCsv('pedidos.csv', ['Pedido', 'Cliente', 'CNPJ', 'Data', 'Unidades', 'Itens', 'Status', 'Data desejada'],
        todos.map((o) => [o.id_pedido, o.cliente?.nome_exibicao ?? '', o.cliente?.cnpj ?? '', formatDate(o.data_pedido), o.total_itens, o.itens.length, o.status, formatDateOnly(o.data_entrega_desejada)]));
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const resetPage = () => setPage(1);

  return (
    <>
      <SectionHeader title="Pedidos" subtitle="Acompanhe, avance e cancele os pedidos dos clientes.">
        <Button variant="ghost" onClick={exportCsv}><Icon name="download" className="mr-1 inline h-5 w-5 align-text-bottom" />Exportar</Button>
      </SectionHeader>

      <div className="mb-4 grid gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <SearchBox value={search} onChange={(v) => { setSearch(v); resetPage(); }} placeholder="Nº do pedido, cliente, e-mail ou CNPJ" />
          <label className="grid gap-1 text-xs text-muted">De
            <input type="date" value={de} onChange={(e) => { setDe(e.target.value); resetPage(); }} className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-ink" />
          </label>
          <label className="grid gap-1 text-xs text-muted">Até
            <input type="date" value={ate} onChange={(e) => { setAte(e.target.value); resetPage(); }} className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-ink" />
          </label>
        </div>
        <ChipFilter label="Filtrar por status" options={statusOptions} value={status} onChange={(v) => { setStatus(v); resetPage(); }} />
      </div>

      {lista.error ? <ErrorState error={lista.error} onRetry={lista.reload} /> : (
        <TableCard headers={['Pedido', 'Cliente', 'Data', 'Unidades', 'Status', '']} isEmpty={!lista.loading && lista.data?.pedidos.length === 0}
          empty="Nenhum pedido encontrado com esses filtros."
          footer={lista.data && <Pagination page={page} pageSize={pageSize} total={lista.data.paginacao.total} onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); resetPage(); }} />}>
          {lista.loading && <tr><td colSpan={6}><Loading className="py-8" /></td></tr>}
          {!lista.loading && lista.data?.pedidos.map((o) => (
            <tr key={o.id_pedido} className="transition hover:bg-surface/60">
              <td className="px-4 py-3 font-extrabold">#{o.id_pedido}</td>
              <td className="px-4">
                <p className="font-medium">{o.cliente?.nome_exibicao ?? '—'}</p>
                <p className="text-sm text-muted">{o.cliente?.cnpj}</p>
              </td>
              <td className="px-4 text-muted">{formatDate(o.data_pedido)}</td>
              <td className="px-4">{o.total_itens}</td>
              <td className="px-4"><StatusBadge status={o.status} /></td>
              <td className="px-4 text-right">
                <Button variant="primary" className="px-4 py-1.5 text-sm" onClick={() => setOpen(o.id_pedido)}>Detalhes</Button>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {openId && <OrderDetailModal id={openId} onClose={() => setOpen(null)} onChanged={lista.reload} />}
    </>
  );
}

const CANCELAVEIS: StatusPedido[] = ['Aguardando Separação', 'Em Separação'];

function OrderDetailModal({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const { refreshCounters } = useManager();
  const { data, loading, error, reload } = useApi(() => api.get<{ pedido: Pedido }>(`/pedidos/${id}`), [id]);
  const [observacao, setObservacao] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const after = (msg: string) => {
    toast(msg);
    setObservacao('');
    setMotivo('');
    setCancelOpen(false);
    reload();
    onChanged();
    refreshCounters();
  };

  const advance = async (p: Pedido) => {
    if (!p.proximo_status) return;
    setBusy(true);
    setActionError('');
    try {
      await api.patch(`/pedidos/${p.id_pedido}/status`, { status: p.proximo_status, ...(observacao.trim() ? { observacao: observacao.trim() } : {}) });
      after(`Pedido #${p.id_pedido}: ${p.proximo_status}.`);
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (p: Pedido) => {
    if (motivo.trim().length < 3) return setActionError('O motivo do cancelamento é obrigatório (3 a 500 caracteres).');
    setBusy(true);
    setActionError('');
    try {
      await api.post(`/pedidos/${p.id_pedido}/cancelar`, { motivo: motivo.trim() });
      after(`Pedido #${p.id_pedido} cancelado. Estoque devolvido.`);
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Pedido #${id}`} onClose={onClose} wide>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (() => {
        const p = data.pedido;
        const c = p.cliente;
        return (
          <>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-extrabold">{c?.nome_exibicao ?? 'Cliente'}</p>
                {c && c.razao_social && c.nome !== c.razao_social && <p className="text-sm text-muted">Responsável: {c.nome}</p>}
                <p className="text-sm text-muted">{c?.cnpj} · {c?.email} · {formatPhone(c?.telefone)}</p>
                <p className="text-sm text-muted">Feito em {formatDateTime(p.data_pedido)}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>

            <OrderTimeline pedido={p} />

            <div className="my-4 grid gap-3 text-sm sm:grid-cols-2">
              {p.endereco_entrega && (
                <div className="rounded-2xl bg-surface p-3">
                  <p className="font-extrabold">Endereço de entrega</p>
                  <p>{p.endereco_entrega.logradouro}, {p.endereco_entrega.numero}{p.endereco_entrega.complemento ? ` – ${p.endereco_entrega.complemento}` : ''}</p>
                  <p className="text-muted">{p.endereco_entrega.bairro} · {p.endereco_entrega.cidade}/{p.endereco_entrega.estado} · {p.endereco_entrega.cep}</p>
                  {p.endereco_entrega.referencia && <p className="text-muted">Ref.: {p.endereco_entrega.referencia}</p>}
                </div>
              )}
              <div className="rounded-2xl bg-surface p-3">
                <p className="font-extrabold">Entrega</p>
                <p>Data desejada: {formatDateOnly(p.data_entrega_desejada)}</p>
                {p.data_entrega && <p>Entregue em {formatDateTime(p.data_entrega)}</p>}
                {p.observacao && <p className="text-muted">Obs. do cliente: {p.observacao}</p>}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-black/10">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="bg-surface text-muted">
                  <tr><th className="p-3 font-medium">Produto</th><th className="font-medium">SKU</th><th className="pr-3 text-right font-medium">Qtd.</th></tr>
                </thead>
                <tbody className="[&>tr]:border-t [&>tr]:border-black/10">
                  {p.itens.map((item) => (
                    <tr key={item.id_produto}>
                      <td className="flex items-center gap-3 p-3">
                        <img src={imageUrl(item.imagem_url)} alt="" className="h-10 w-10 rounded-lg object-contain" />
                        <span>{item.nome}</span>
                      </td>
                      <td className="text-muted">{item.sku}</td>
                      <td className="pr-3 text-right font-medium">{item.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-black/10 font-extrabold">
                    <td className="p-3" colSpan={2}>Total de unidades</td>
                    <td className="pr-3 text-right text-brand">{p.total_itens}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <FormError message={actionError} />
            {p.proximo_status && (
              <div className="mt-5 rounded-2xl border border-black/10 p-4">
                <TextAreaField label="Observação para o histórico (opcional)" rows={2} maxLength={500} value={observacao}
                  onChange={(e) => setObservacao(e.target.value)} />
                <Button variant="primary" className="mt-3" disabled={busy} onClick={() => advance(p)}>
                  Marcar como “{p.proximo_status}”
                </Button>
              </div>
            )}
            {CANCELAVEIS.includes(p.status) && (
              !cancelOpen ? (
                <Button variant="ghost" className="mt-3" onClick={() => setCancelOpen(true)}>Cancelar pedido</Button>
              ) : (
                <div className="mt-3 rounded-2xl bg-accent/5 p-4">
                  <TextAreaField label="Motivo do cancelamento" mandatory rows={2} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                  <p className="mt-1 text-xs text-muted">O estoque dos itens volta automaticamente.</p>
                  <div className="mt-3 flex gap-2">
                    <Button disabled={busy} onClick={() => cancel(p)}>Confirmar cancelamento</Button>
                    <Button variant="ghost" onClick={() => setCancelOpen(false)}>Voltar</Button>
                  </div>
                </div>
              )
            )}
          </>
        );
      })()}
    </Modal>
  );
}
