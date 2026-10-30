import { api } from '../../api/client';
import { ErrorState, Loading } from '../../components/State';
import { useApi } from '../../hooks/useApi';
import { formatDateOnly } from '../../utils/format';

interface Funil {
  etapas: { etapa: string; sessoes: number; taxa_da_anterior: number | null }[];
}
interface PorDia {
  dias: { data: string; total: number; cancelados: number }[];
}
interface Ciclo {
  etapas: { de: string; para: string; pedidos: number; media_minutos: number | null }[];
}
interface Vistos {
  produtos: { id_produto: number; sku: string | null; nome: string | null; visualizacoes: number; sessoes: number }[];
}
interface Cliques {
  banners: { id_banner: number; titulo: string | null; cliques: number; sessoes: number }[];
  campanhas: { id_campanha: number; titulo: string | null; cliques: number; sessoes: number }[];
}

const ETAPA: Record<string, string> = {
  produto_visto: 'Viu um produto',
  carrinho_adicionar: 'Adicionou ao carrinho',
  checkout_iniciado: 'Abriu o checkout',
  pedido_concluido: 'Concluiu o pedido',
};

const card = 'rounded-2xl border border-black/10 bg-white p-5';
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

function duracao(min: number | null) {
  if (min === null) return '—';
  if (min < 60) return `${Math.round(min)} min`;
  const h = min / 60;
  if (h < 48) return `${h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`;
  return `${(h / 24).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`;
}

// Métricas de comportamento e operação adicionadas no back: funil, pedidos por dia, ciclo, produtos vistos e cliques.
export default function MetricsExtra({ de, ate }: { de: string; ate: string }) {
  const periodo = { de, ate };
  const funil = useApi(() => api.get<Funil>('/metricas/funil', periodo), [de, ate]);
  const porDia = useApi(() => api.get<PorDia>('/metricas/pedidos-por-dia', periodo), [de, ate]);
  const ciclo = useApi(() => api.get<Ciclo>('/metricas/ciclo-pedido', periodo), [de, ate]);
  const vistos = useApi(() => api.get<Vistos>('/metricas/produtos-vistos', { ...periodo, limite: 10 }), [de, ate]);
  const cliques = useApi(() => api.get<Cliques>('/metricas/banners-campanhas', periodo), [de, ate]);

  const maxFunil = Math.max(1, ...(funil.data?.etapas.map((e) => e.sessoes) ?? [1]));
  const maxDia = Math.max(1, ...(porDia.data?.dias.map((d) => d.total) ?? [1]));
  const totalDias = porDia.data?.dias.reduce((s, d) => s + d.total, 0) ?? 0;

  return (
    <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
      <div className={card}>
        <h3 className="font-extrabold">Funil de compra</h3>
        <p className="mb-3 text-xs text-muted">Sessões distintas em cada etapa e a taxa em relação à etapa anterior.</p>
        {funil.loading && <Loading className="py-6" />}
        {funil.error && <ErrorState error={funil.error} onRetry={funil.reload} className="py-6" />}
        <ol className="grid gap-3 text-sm">
          {funil.data?.etapas.map((e) => (
            <li key={e.etapa}>
              <div className="flex justify-between gap-2">
                <span>{ETAPA[e.etapa] ?? e.etapa}</span>
                <span><b>{e.sessoes}</b>{e.taxa_da_anterior !== null && <span className="ml-2 text-muted">{pct(e.taxa_da_anterior)}</span>}</span>
              </div>
              <div className="mt-1 h-3 rounded-full bg-surface"><div className="h-3 rounded-full bg-brand" style={{ width: `${(e.sessoes / maxFunil) * 100}%` }} /></div>
            </li>
          ))}
        </ol>
      </div>

      <div className={card}>
        <h3 className="font-extrabold">Tempo do pedido em cada etapa</h3>
        <p className="mb-3 text-xs text-muted">Média para os pedidos feitos no período (cancelados não entram).</p>
        {ciclo.loading && <Loading className="py-6" />}
        {ciclo.error && <ErrorState error={ciclo.error} onRetry={ciclo.reload} className="py-6" />}
        <ul className="grid gap-2 text-sm">
          {ciclo.data?.etapas.map((e) => (
            <li key={e.de} className="flex items-center gap-3 rounded-xl bg-surface p-3">
              <span className="flex-1">{e.de} → <b>{e.para}</b><span className="block text-xs text-muted">{e.pedidos} pedido(s)</span></span>
              <span className="text-lg font-extrabold text-brand">{duracao(e.media_minutos)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${card} xl:col-span-2`}>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-extrabold">Pedidos por dia</h3>
          {porDia.data && <span className="text-sm text-muted">{totalDias} pedido(s) no período · <span className="inline-block h-2 w-2 rounded-full bg-brand" /> feitos <span className="ml-1 inline-block h-2 w-2 rounded-full bg-accent" /> cancelados</span>}
        </div>
        {porDia.loading && <Loading className="py-6" />}
        {porDia.error && <ErrorState error={porDia.error} onRetry={porDia.reload} className="py-6" />}
        {porDia.data && (
          <div className="flex h-40 items-end gap-[2px] overflow-x-auto" role="img" aria-label={`Pedidos por dia: ${totalDias} no período`}>
            {porDia.data.dias.map((d) => (
              <div key={d.data} title={`${formatDateOnly(d.data)}: ${d.total} pedido(s)${d.cancelados ? `, ${d.cancelados} cancelado(s)` : ''}`}
                className="flex h-full min-w-2 flex-1 flex-col justify-end">
                <div className="rounded-t-sm bg-brand" style={{ height: `${((d.total - d.cancelados) / maxDia) * 100}%` }} />
                {d.cancelados > 0 && <div className="bg-accent" style={{ height: `${(d.cancelados / maxDia) * 100}%` }} />}
              </div>
            ))}
          </div>
        )}
        {porDia.data && porDia.data.dias.length > 0 && (
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>{formatDateOnly(porDia.data.dias[0].data)}</span>
            <span>{formatDateOnly(porDia.data.dias[porDia.data.dias.length - 1].data)}</span>
          </div>
        )}
      </div>

      <div className={card}>
        <h3 className="mb-3 font-extrabold">Produtos mais vistos</h3>
        {vistos.loading && <Loading className="py-6" />}
        {vistos.error && <ErrorState error={vistos.error} onRetry={vistos.reload} className="py-6" />}
        {vistos.data?.produtos.length === 0 && <p className="text-sm text-muted">Nenhuma visualização no período.</p>}
        <ol className="grid gap-1 text-sm">
          {vistos.data?.produtos.map((p, i) => (
            <li key={p.id_produto} className="flex items-center gap-2 rounded-lg px-2 py-1.5 odd:bg-surface">
              <span className="w-5 text-muted">{i + 1}.</span>
              <span className="flex-1 truncate">{p.nome ?? `Produto removido (#${p.id_produto})`}</span>
              <span className="text-xs text-muted">{p.sessoes} sessão(ões)</span>
              <b>{p.visualizacoes}</b>
            </li>
          ))}
        </ol>
      </div>

      <div className={card}>
        <h3 className="mb-3 font-extrabold">Cliques em banners e campanhas</h3>
        {cliques.loading && <Loading className="py-6" />}
        {cliques.error && <ErrorState error={cliques.error} onRetry={cliques.reload} className="py-6" />}
        {cliques.data && cliques.data.banners.length + cliques.data.campanhas.length === 0 && <p className="text-sm text-muted">Nenhum clique no período.</p>}
        <ul className="grid gap-1 text-sm">
          {cliques.data?.banners.map((b) => (
            <li key={`b${b.id_banner}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 odd:bg-surface">
              <span className="rounded-full bg-brand/10 px-2 text-xs text-brand">Banner</span>
              <span className="flex-1 truncate">{b.titulo ?? 'Banner excluído'}</span>
              <span className="text-xs text-muted">{b.sessoes} sessão(ões)</span>
              <b>{b.cliques}</b>
            </li>
          ))}
          {cliques.data?.campanhas.map((c) => (
            <li key={`c${c.id_campanha}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 odd:bg-surface">
              <span className="rounded-full bg-accent/10 px-2 text-xs text-accent">Campanha</span>
              <span className="flex-1 truncate">{c.titulo ?? 'Campanha excluída'}</span>
              <span className="text-xs text-muted">{c.sessoes} sessão(ões)</span>
              <b>{c.cliques}</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
