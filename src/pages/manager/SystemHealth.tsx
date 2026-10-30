import { request } from '../../api/client';
import Button from '../../components/Button';
import SectionHeader from '../../components/manager/SectionHeader';
import { ErrorState, Loading } from '../../components/State';
import { useApi } from '../../hooks/useApi';
import { formatDateTime } from '../../utils/format';

interface Job {
  nome: string;
  descricao: string;
  expressao: string;
  ativo: boolean;
  proxima_execucao: string | null;
  ultima_execucao: string | null;
  ultimo_resultado: string | null;
  ultimo_erro: string | null;
}

interface Sincronizacao {
  id_sincronizacao: number;
  tipo: string;
  status: string;
  iniciado_em: string;
  com_erro: number;
}

interface Saude {
  status: string;
  versao: string;
  banco: { status: string; latencia_ms: number; migracoes_pendentes: string[] };
  processo: { iniciado_em: string; uptime_segundos: number; node: string; memoria_mb: number };
  jobs: Job[];
  sincronizacoes: Record<'ultima' | 'ultima_carga_completa' | 'ultima_estoque' | 'ultima_importacao_manual', Sincronizacao | null>;
}

const SYNC_LABEL = {
  ultima: 'Última sincronização',
  ultima_carga_completa: 'Última carga completa',
  ultima_estoque: 'Último estoque',
  ultima_importacao_manual: 'Último upload manual',
} as const;

function uptime(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}min` : `${m} min`;
}

// Saúde do sistema: banco, processo, jobs agendados e últimas sincronizações (GET /saude/detalhado).
export default function SystemHealth() {
  const { data, loading, error, reload } = useApi(() => request<Saude>('/saude/detalhado', { raw: true }), []);
  const card = 'rounded-2xl border border-black/10 bg-white p-5';
  const ok = data?.status === 'ok';

  return (
    <>
      <SectionHeader title="Saúde do sistema" subtitle="Estado da API, do banco e dos jobs automáticos.">
        <Button variant="ghost" onClick={reload}>Atualizar</Button>
      </SectionHeader>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <>
          <div className={`mb-6 rounded-2xl p-5 font-extrabold ${ok ? 'bg-green-100 text-green-800' : 'bg-accent/10 text-accent'}`}>
            {ok ? 'Tudo funcionando' : `Atenção: ${data.status}`} <span className="font-medium">· API v{data.versao}</span>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <div className={card}>
              <h3 className="mb-3 font-extrabold">Banco e processo</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-surface p-3"><dt className="text-muted">Banco</dt><dd className="font-extrabold">{data.banco.status} · {data.banco.latencia_ms} ms</dd></div>
                <div className="rounded-xl bg-surface p-3"><dt className="text-muted">Migrations pendentes</dt><dd className="font-extrabold">{data.banco.migracoes_pendentes.length || 'nenhuma'}</dd></div>
                <div className="rounded-xl bg-surface p-3"><dt className="text-muted">No ar há</dt><dd className="font-extrabold">{uptime(data.processo.uptime_segundos)}</dd></div>
                <div className="rounded-xl bg-surface p-3"><dt className="text-muted">Memória</dt><dd className="font-extrabold">{data.processo.memoria_mb} MB · Node {data.processo.node}</dd></div>
              </dl>
            </div>
            <div className={card}>
              <h3 className="mb-3 font-extrabold">Sincronizações</h3>
              <ul className="grid gap-2 text-sm">
                {(Object.keys(SYNC_LABEL) as (keyof typeof SYNC_LABEL)[]).map((k) => {
                  const s = data.sincronizacoes[k];
                  return (
                    <li key={k} className="flex justify-between gap-2 rounded-xl bg-surface p-3">
                      <span className="text-muted">{SYNC_LABEL[k]}</span>
                      <span className="text-right font-medium">{s ? `${formatDateTime(s.iniciado_em)} · ${s.status}${s.com_erro ? ` · ${s.com_erro} erro(s)` : ''}` : 'nunca'}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div className={`${card} mt-6`}>
            <h3 className="mb-3 font-extrabold">Jobs automáticos</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-muted"><tr><th className="py-2 font-medium">Job</th><th className="font-medium">Próxima</th><th className="font-medium">Última</th><th className="font-medium">Resultado</th></tr></thead>
                <tbody className="[&>tr]:border-t [&>tr]:border-black/10">
                  {data.jobs.map((j) => (
                    <tr key={j.nome}>
                      <td className="py-2 pr-3"><b>{j.nome}</b>{!j.ativo && <span className="ml-1 text-xs text-muted">(desligado)</span>}<span className="block text-xs text-muted">{j.descricao}</span></td>
                      <td>{formatDateTime(j.proxima_execucao)}</td>
                      <td>{formatDateTime(j.ultima_execucao)}</td>
                      <td className={j.ultimo_erro ? 'text-accent' : ''}>{j.ultimo_erro ?? j.ultimo_resultado ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
