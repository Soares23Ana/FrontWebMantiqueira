import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import SectionHeader from '../../components/manager/SectionHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { ErrorState, Loading } from '../../components/State';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../utils/format';
import type { Paginacao, Pedido } from '../../types';

interface Painel {
  pedidos_pendentes: number;
  estoque_baixo: number;
  clientes_ativos: number;
}

interface Alertas {
  meta_reposicao: number;
  alertas: { produto: { id_produto: number; sku: string; nome: string }; estoque_atual: number; estoque_minimo: number; sugestao_compra: number }[];
}

// Painel: indicadores operacionais (sem valores financeiros), pedidos a separar e alertas de reposição.
export default function Overview() {
  const painel = useApi(() => api.get<Painel>('/painel'), []);
  const contadores = useApi(() => api.get<{ clientes_novos_7_dias: number }>('/painel/contadores'), []);
  const alertas = useApi(() => api.get<Alertas>('/painel/alertas-reposicao'), []);
  const pendentes = useApi(
    () => api.get<{ pedidos: Pedido[]; paginacao: Paginacao }>('/pedidos', { status: 'Aguardando Separação,Em Separação', limite: 6 }),
    [],
  );

  return (
    <>
      <SectionHeader title="Painel de controle" subtitle="Resumo da operação da distribuidora." />
      {painel.error ? <ErrorState error={painel.error} onRetry={painel.reload} className="py-6" /> : (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Pedidos pendentes" value={painel.data?.pedidos_pendentes ?? '…'} icon="orders" hint="Aguardando + em separação" to="/gestor/pedidos" />
          <StatCard label="Estoque baixo" value={painel.data?.estoque_baixo ?? '…'} icon="alert" highlight hint="No mínimo ou abaixo dele" to="/gestor/produtos" />
          <StatCard label="Clientes ativos" value={painel.data?.clientes_ativos ?? '…'} icon="users" hint="Com acesso liberado" to="/gestor/clientes" />
          <StatCard label="Novos cadastros (7 dias)" value={contadores.data?.clientes_novos_7_dias ?? '…'} icon="users" hint="Ver quem acabou de se cadastrar" to="/gestor/clientes?novos=7" />
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-extrabold">Pedidos para separar</h3>
            <Link to="/gestor/pedidos" className="rounded-full bg-surface px-4 py-1.5 text-sm font-extrabold hover:bg-black/10">Ver todos</Link>
          </div>
          {pendentes.loading && <Loading className="py-6" />}
          {pendentes.error && <ErrorState error={pendentes.error} onRetry={pendentes.reload} className="py-6" />}
          {pendentes.data?.pedidos.length === 0 && <p className="py-4 text-center text-muted">Nenhum pedido pendente.</p>}
          <ul className="flex flex-col gap-1">
            {pendentes.data?.pedidos.map((o) => (
              <li key={o.id_pedido}>
                <Link to={`/gestor/pedidos?pedido=${o.id_pedido}`} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface">
                  <span className="font-extrabold">#{o.id_pedido}</span>
                  <span className="min-w-0 flex-1 truncate text-muted">{o.cliente?.nome_exibicao}</span>
                  <span className="hidden text-sm text-muted sm:inline">{formatDate(o.data_pedido)}</span>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold">Alertas de reposição</h3>
              {alertas.data && <p className="text-xs text-muted">Sugestão completa o estoque até {alertas.data.meta_reposicao} un. (meta configurável no CMS)</p>}
            </div>
            <Link to="/gestor/produtos?disponibilidade=ultimas_unidades" className="rounded-full bg-surface px-4 py-1.5 text-sm font-extrabold hover:bg-black/10">Gerenciar</Link>
          </div>
          {alertas.loading && <Loading className="py-6" />}
          {alertas.error && <ErrorState error={alertas.error} onRetry={alertas.reload} className="py-6" />}
          {alertas.data?.alertas.length === 0 && <p className="py-4 text-center text-muted">Tudo certo com o estoque.</p>}
          {alertas.data && alertas.data.alertas.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="text-muted"><tr><th className="py-2 font-medium">Produto</th><th className="font-medium">Atual</th><th className="font-medium">Mín.</th><th className="text-right font-medium">Comprar</th></tr></thead>
              <tbody className="[&>tr]:border-t [&>tr]:border-black/10">
                {alertas.data.alertas.slice(0, 8).map((a) => (
                  <tr key={a.produto.id_produto}>
                    <td className="max-w-56 truncate py-2 pr-2" title={a.produto.nome}>{a.produto.nome}</td>
                    <td className={a.estoque_atual === 0 ? 'font-extrabold text-accent' : 'text-amber-700'}>{a.estoque_atual}</td>
                    <td className="text-muted">{a.estoque_minimo}</td>
                    <td className="text-right font-extrabold text-brand">{a.sugestao_compra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
