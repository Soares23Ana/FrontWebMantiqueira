import { formatDateOnly } from '../../utils/format';

interface Dia {
  data: string;
  total: number;
  cancelados: number;
}

const INTERVALOS = 4; // linhas de grade: 0, 1/4, 2/4, 3/4 e o topo

// Gráfico de pedidos por dia: barras empilhadas (feitos em azul, cancelados em vermelho), eixo com números,
// linhas de grade, dias sem pedido marcados e um balão com os detalhes ao passar o mouse.
export default function OrdersChart({ dias }: { dias: Dia[] }) {
  const total = dias.reduce((s, d) => s + d.total, 0);
  const cancelados = dias.reduce((s, d) => s + d.cancelados, 0);
  const pico = dias.reduce<Dia | null>((m, d) => (d.total > (m?.total ?? 0) ? d : m), null);
  const maximo = Math.max(1, ...dias.map((d) => d.total));
  const topo = Math.ceil(maximo / INTERVALOS) * INTERVALOS; // o eixo termina num número redondo
  const marcas = Array.from({ length: INTERVALOS + 1 }, (_, i) => (topo / INTERVALOS) * i);
  const meio = dias[Math.floor(dias.length / 2)];

  if (total === 0) {
    return <p className="py-10 text-center text-muted">Nenhum pedido no período.</p>;
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-surface px-3 py-1"><b>{total}</b> pedido(s)</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#5b6cff]" /> <b>{total - cancelados}</b> feitos
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" /> <b>{cancelados}</b> cancelados
        </span>
        {pico && <span className="rounded-full bg-surface px-3 py-1">Maior dia: <b>{formatDateOnly(pico.data)}</b> ({pico.total})</span>}
      </div>

      <div className="flex gap-3" role="img" aria-label={`Pedidos por dia: ${total} no período, ${cancelados} cancelado(s)`}>
        <div className="relative h-52 w-7 shrink-0 text-right text-xs text-muted" aria-hidden="true">
          {marcas.map((m) => (
            <span key={m} className="absolute right-0 translate-y-1/2 leading-none" style={{ bottom: `${(m / topo) * 100}%` }}>{m}</span>
          ))}
        </div>
        <div className="relative h-52 flex-1">
          {marcas.map((m) => (
            <div key={m} aria-hidden="true" className={`absolute inset-x-0 border-t ${m === 0 ? 'border-black/10' : 'border-dashed border-black/10'}`} style={{ bottom: `${(m / topo) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[3px]">
            {dias.map((d) => {
              const feitos = d.total - d.cancelados;
              return (
                <div key={d.data} className="group relative flex h-full min-w-[3px] flex-1 flex-col justify-end">
                  {d.total === 0 ? (
                    <div className="h-[3px] rounded-full bg-[#8b93b8]/40" />
                  ) : (
                    <div className="relative" style={{ height: `${(d.total / topo) * 100}%` }}>
                      <div className="flex h-full flex-col overflow-hidden rounded-t-md transition group-hover:brightness-125">
                        {feitos > 0 && <div className="bg-gradient-to-b from-[#7a88ff] to-[#4452e6]" style={{ flexGrow: feitos }} />}
                        {d.cancelados > 0 && <div className="bg-accent" style={{ flexGrow: d.cancelados }} />}
                      </div>
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-xs text-surface shadow-lg group-hover:block">
                        <b className="block">{formatDateOnly(d.data)}</b>
                        {d.total} pedido(s){d.cancelados > 0 ? ` · ${d.cancelados} cancelado(s)` : ''}
                      </div>
                    </div>
                  )}
                  {d.total === 0 && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-xs text-surface shadow-lg group-hover:block">
                      <b className="block">{formatDateOnly(d.data)}</b>
                      Nenhum pedido
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-between pl-10 text-xs text-muted">
        <span>{formatDateOnly(dias[0].data)}</span>
        {dias.length > 2 && meio && <span>{formatDateOnly(meio.data)}</span>}
        <span>{formatDateOnly(dias[dias.length - 1].data)}</span>
      </div>
    </div>
  );
}
