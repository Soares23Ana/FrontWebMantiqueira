import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, imageUrl } from '../../api/client';
import ChipFilter from '../../components/manager/ChipFilter';
import Pagination from '../../components/manager/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { Empty, ErrorState, Loading } from '../../components/State';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../utils/format';
import { TODOS_STATUS } from '../../types';
import type { Paginacao, Pedido, StatusPedido } from '../../types';
import { useRepeatOrder } from './useRepeatOrder';

const options = ['Todos', ...TODOS_STATUS] as const;

export default function MyOrders() {
  const [status, setStatus] = useState<'Todos' | StatusPedido>('Todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, loading, error, reload } = useApi(
    () => api.get<{ pedidos: Pedido[]; paginacao: Paginacao }>('/pedidos/meus', { status: status === 'Todos' ? '' : status, pagina: page, limite: pageSize }),
    [status, page, pageSize],
  );
  const { repeat, loadingId } = useRepeatOrder();

  return (
    <>
      <div className="mb-4"><ChipFilter label="Filtrar por status" options={options} value={status} onChange={(v) => { setStatus(v); setPage(1); }} /></div>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.pedidos.length === 0 && (
        <Empty>Nenhum pedido{status !== 'Todos' ? ' com esse status' : ''}. <Link to="/produtos" className="font-extrabold text-brand">Ver produtos</Link></Empty>
      )}
      {data && data.pedidos.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white">
          <ul className="divide-y divide-black/10">
            {data.pedidos.map((p) => (
              <li key={p.id_pedido} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-40 flex-1">
                  <p className="font-extrabold">Pedido #{p.id_pedido}</p>
                  <p className="text-sm text-muted">{formatDate(p.data_pedido)} · {p.total_itens} unidades</p>
                  <div className="mt-2 flex -space-x-2">
                    {p.itens.slice(0, 5).map((i) => (
                      <img key={i.id_produto} src={imageUrl(i.imagem_url)} alt={i.nome} title={i.nome} className="h-9 w-9 rounded-full bg-white object-contain ring-2 ring-white" />
                    ))}
                    {p.itens.length > 5 && <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-xs ring-2 ring-white">+{p.itens.length - 5}</span>}
                  </div>
                </div>
                <StatusBadge status={p.status} />
                <div className="flex gap-2">
                  <button onClick={() => repeat(p.id_pedido)} disabled={loadingId === p.id_pedido}
                    className="rounded-full bg-surface px-4 py-2 text-sm font-extrabold text-brand hover:bg-black/10 disabled:opacity-50">
                    {loadingId === p.id_pedido ? 'Carregando...' : 'Repetir pedido'}
                  </button>
                  <Link to={String(p.id_pedido)} className="rounded-full bg-brand px-4 py-2 text-sm font-extrabold text-white hover:bg-brand-dark">Detalhes</Link>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageSize={pageSize} total={data.paginacao.total} onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </div>
      )}
    </>
  );
}
