import { useState } from 'react';
import { api } from '../../api/client';
import Pagination from '../../components/manager/Pagination';
import SectionHeader from '../../components/manager/SectionHeader';
import StatCard from '../../components/StatCard';
import { ErrorState, Loading } from '../../components/State';
import { useApi } from '../../hooks/useApi';
import { dateFromToday, formatDate, formatDateTime, formatPhone } from '../../utils/format';
import type { Paginacao, StatusPedido } from '../../types';
import MetricsExtra from './MetricsExtra';

interface Resumo {
  periodo: { de: string; ate: string };
  pedidos: { total: number; por_status: Record<StatusPedido, number> };
  unidades_pedidas: number;
  clientes_que_compraram: number;
  /** Sessões únicas no período (evento "visita"). */
  visitantes?: { total_sessoes: number; media_diaria: number };
  eventos: Record<string, number>;
}
interface Buscas {
  mais_buscadas: { termo: string; total: number; sem_resultado: number }[];
  sem_resultado: { termo: string; total: number; ultima_vez: string }[];
}
interface MaisPedidos {
  produtos: { id_produto: number; sku: string; nome: string; unidades: number; pedidos: number }[];
}
interface Inativos {
  dias: number;
  clientes: { id_usuario: number; nome_exibicao: string; cnpj: string | null; email: string; telefone: string | null; ultimo_pedido_em: string | null; total_pedidos: number }[];
  paginacao: Paginacao;
}

const EVENTOS: Record<string, string> = {
  visita: 'Visitas', busca: 'Buscas', busca_sem_resultado: 'Buscas sem resultado', produto_visto: 'Produtos vistos', carrinho_adicionar: 'Adições ao carrinho',
  checkout_iniciado: 'Checkouts iniciados', pedido_concluido: 'Pedidos concluídos', banner_clique: 'Cliques em banner', campanha_clique: 'Cliques em campanha',
};

// Métricas de uso (sem dinheiro): buscas, produtos mais pedidos e clientes sem comprar.
export default function Metrics() {
  const [de, setDe] = useState(dateFromToday(-29));
  const [ate, setAte] = useState(dateFromToday(0));
  const periodo = { de, ate };
  const resumo = useApi(() => api.get<Resumo>('/metricas/resumo', periodo), [de, ate]);
  const buscas = useApi(() => api.get<Buscas>('/metricas/buscas', { ...periodo, limite: 10 }), [de, ate]);
  const top = useApi(() => api.get<MaisPedidos>('/metricas/produtos-mais-pedidos', { ...periodo, limite: 10 }), [de, ate]);

  const card = 'rounded-2xl border border-black/10 bg-white p-5';
  const max = Math.max(1, ...(top.data?.produtos.map((p) => p.unidades) ?? [1]));

  return (
    <>
      <SectionHeader title="Métricas" subtitle="Como os clientes usam a loja. Nada aqui envolve valores financeiros.">
        <label className="grid gap-1 text-xs text-muted">De
          <input type="date" value={de} max={ate} onChange={(e) => setDe(e.target.value)} className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-ink" />
        </label>
        <label className="grid gap-1 text-xs text-muted">Até
          <input type="date" value={ate} min={de} onChange={(e) => setAte(e.target.value)} className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-ink" />
        </label>
      </SectionHeader>

      {resumo.error ? <ErrorState error={resumo.error} onRetry={resumo.reload} className="py-6" /> : (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Visitantes (sessões)" value={resumo.data?.visitantes?.total_sessoes ?? '…'} icon="users"
            hint={resumo.data?.visitantes ? `média de ${resumo.data.visitantes.media_diaria} por dia` : undefined} />
          <StatCard label="Pedidos no período" value={resumo.data?.pedidos.total ?? '…'} icon="orders" hint={resumo.data ? `${resumo.data.pedidos.por_status.Cancelado} cancelado(s)` : undefined} />
          <StatCard label="Unidades pedidas" value={resumo.data?.unidades_pedidas ?? '…'} icon="box" hint="Sem cancelados" />
          <StatCard label="Clientes que compraram" value={resumo.data?.clientes_que_compraram ?? '…'} icon="users" />
          <StatCard label="Buscas sem resultado" value={resumo.data?.eventos.busca_sem_resultado ?? '…'} icon="search" highlight
            hint={resumo.data ? `de ${resumo.data.eventos.busca ?? 0} buscas` : undefined} />
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
        <div className={card}>
          <h3 className="mb-3 font-extrabold">Termos mais buscados</h3>
          {buscas.loading && <Loading className="py-6" />}
          {buscas.error && <ErrorState error={buscas.error} onRetry={buscas.reload} className="py-6" />}
          {buscas.data?.mais_buscadas.length === 0 && <p className="text-sm text-muted">Nenhuma busca no período.</p>}
          <ol className="grid gap-1 text-sm">
            {buscas.data?.mais_buscadas.map((b, i) => (
              <li key={b.termo} className="flex items-center gap-2 rounded-lg px-2 py-1.5 odd:bg-surface">
                <span className="w-5 text-muted">{i + 1}.</span>
                <span className="flex-1 font-medium">{b.termo}</span>
                {b.sem_resultado > 0 && <span className="rounded-full bg-accent/10 px-2 text-xs text-accent">{b.sem_resultado} sem resultado</span>}
                <b>{b.total}</b>
              </li>
            ))}
          </ol>
        </div>

        <div className={card}>
          <h3 className="font-extrabold">Buscas sem resultado</h3>
          <p className="mb-3 text-xs text-muted">O que os clientes procuram e não encontram: oportunidades de catálogo ou de sinônimos.</p>
          {buscas.data?.sem_resultado.length === 0 && <p className="text-sm text-muted">Todas as buscas encontraram produtos.</p>}
          <ul className="grid gap-1 text-sm">
            {buscas.data?.sem_resultado.map((b) => (
              <li key={b.termo} className="flex items-center gap-2 rounded-lg px-2 py-1.5 odd:bg-surface">
                <span className="flex-1 font-medium">{b.termo}</span>
                <span className="text-xs text-muted">{formatDateTime(b.ultima_vez)}</span>
                <b>{b.total}</b>
              </li>
            ))}
          </ul>
        </div>

        <div className={card}>
          <h3 className="mb-3 font-extrabold">Produtos mais pedidos (unidades)</h3>
          {top.loading && <Loading className="py-6" />}
          {top.error && <ErrorState error={top.error} onRetry={top.reload} className="py-6" />}
          {top.data?.produtos.length === 0 && <p className="text-sm text-muted">Nenhum pedido no período.</p>}
          <ul className="grid gap-2 text-sm">
            {top.data?.produtos.map((p) => (
              <li key={p.id_produto}>
                <div className="flex justify-between gap-2"><span className="truncate">{p.nome}</span><b>{p.unidades}</b></div>
                <div className="mt-1 h-2 rounded-full bg-surface"><div className="h-2 rounded-full bg-brand" style={{ width: `${(p.unidades / max) * 100}%` }} /></div>
                <p className="text-xs text-muted">{p.pedidos} pedido(s)</p>
              </li>
            ))}
          </ul>
        </div>

        <div className={card}>
          <h3 className="mb-3 font-extrabold">Navegação na loja</h3>
          {resumo.data && (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(EVENTOS).map(([k, label]) => (
                <div key={k} className="rounded-xl bg-surface p-3">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="text-xl font-extrabold text-brand">{resumo.data!.eventos[k] ?? 0}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <MetricsExtra de={de} ate={ate} />

      <InactiveCustomers />
    </>
  );
}

function InactiveCustomers() {
  const [dias, setDias] = useState(60);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, loading, error, reload } = useApi(
    () => api.get<Inativos>('/metricas/clientes-inativos', { dias, pagina: page, limite: pageSize }),
    [dias, page, pageSize],
  );
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h3 className="font-extrabold">Clientes sem comprar</h3>
          <p className="text-xs text-muted">Clientes ativos sem pedido (não cancelado) no período, incluindo quem nunca comprou.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">Há mais de
          <select value={dias} onChange={(e) => { setDias(Number(e.target.value)); setPage(1); }} className="rounded-full border border-black/10 px-3 py-1.5">
            {[15, 30, 60, 90, 180, 365].map((d) => <option key={d} value={d}>{d} dias</option>)}
          </select>
        </label>
      </div>
      {loading && <Loading className="py-6" />}
      {error && <ErrorState error={error} onRetry={reload} className="py-6" />}
      {data && (
        <>
          {data.clientes.length === 0 ? <p className="p-6 text-center text-muted">Todos os clientes compraram no período.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-surface text-muted"><tr><th className="px-4 py-2 font-medium">Cliente</th><th className="font-medium">Contato</th><th className="font-medium">Último pedido</th><th className="px-4 text-right font-medium">Pedidos</th></tr></thead>
                <tbody className="[&>tr]:border-t [&>tr]:border-black/10">
                  {data.clientes.map((c) => (
                    <tr key={c.id_usuario}>
                      <td className="px-4 py-2"><b>{c.nome_exibicao}</b><span className="block text-muted">{c.cnpj}</span></td>
                      <td>{c.email}<span className="block text-muted">{formatPhone(c.telefone)}</span></td>
                      <td>{c.ultimo_pedido_em ? formatDate(c.ultimo_pedido_em) : <span className="text-muted">Nunca comprou</span>}</td>
                      <td className="px-4 text-right">{c.total_pedidos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} pageSize={pageSize} total={data.paginacao.total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}
    </div>
  );
}
