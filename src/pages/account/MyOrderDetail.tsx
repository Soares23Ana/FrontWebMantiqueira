import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api, errorMessage, imageUrl } from '../../api/client';
import Button from '../../components/Button';
import { TextAreaField } from '../../components/Field';
import OrderTimeline from '../../components/OrderTimeline';
import StatusBadge from '../../components/StatusBadge';
import { ErrorState, FormError, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { formatDateOnly, formatDateTime } from '../../utils/format';
import type { Pedido } from '../../types';
import { useRepeatOrder } from './useRepeatOrder';

export default function MyOrderDetail() {
  const { id = '' } = useParams();
  const location = useLocation();
  const toast = useToast();
  const isNew = (location.state as { novo?: boolean } | null)?.novo;
  const { data, loading, error, reload } = useApi(() => api.get<{ pedido: Pedido }>(`/pedidos/${id}`), [id]);
  const { repeat, loadingId } = useRepeatOrder();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [cancelError, setCancelError] = useState('');

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} />;
  const p = data!.pedido;

  const cancel = async () => {
    if (motivo.trim().length < 3) return setCancelError('Conte o motivo (pelo menos 3 letras).');
    try {
      await api.post(`/pedidos/${p.id_pedido}/cancelar`, { motivo: motivo.trim() });
      toast('Pedido cancelado.');
      setCancelOpen(false);
      reload();
    } catch (e) {
      setCancelError(errorMessage(e));
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6">
      {isNew && <p role="status" className="mb-5 rounded-xl bg-green-50 p-4 font-medium text-green-800">Pedido recebido! Acompanhe o andamento por aqui.</p>}
      <Link to="/minha-conta/pedidos" className="text-sm text-muted underline">← Meus pedidos</Link>
      <div className="mb-5 mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-2xl font-extrabold">Pedido #{p.id_pedido}</h3>
          <p className="text-sm text-muted">Feito em {formatDateTime(p.data_pedido)}</p>
        </div>
        <StatusBadge status={p.status} />
      </div>
      <OrderTimeline pedido={p} />

      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        {p.endereco_entrega && (
          <div className="rounded-2xl bg-surface p-4">
            <p className="font-extrabold">Entrega</p>
            <p>{p.endereco_entrega.logradouro}, {p.endereco_entrega.numero}{p.endereco_entrega.complemento ? ` – ${p.endereco_entrega.complemento}` : ''}</p>
            <p className="text-muted">{p.endereco_entrega.bairro} · {p.endereco_entrega.cidade}/{p.endereco_entrega.estado} · {p.endereco_entrega.cep}</p>
          </div>
        )}
        <div className="rounded-2xl bg-surface p-4">
          <p className="font-extrabold">Detalhes</p>
          <p>Data desejada: {formatDateOnly(p.data_entrega_desejada)}</p>
          {p.data_entrega && <p>Entregue em: {formatDateTime(p.data_entrega)}</p>}
          {p.observacao && <p className="text-muted">Observação: {p.observacao}</p>}
        </div>
      </div>

      <h4 className="mb-2 mt-6 font-extrabold">Itens ({p.total_itens} unidades)</h4>
      <ul className="divide-y divide-black/10 rounded-2xl border border-black/10">
        {p.itens.map((i) => (
          <li key={i.id_produto} className="flex items-center gap-3 p-3">
            <img src={imageUrl(i.imagem_url)} alt="" className="h-12 w-12 rounded-lg object-contain" />
            <Link to={`/produto/${i.id_produto}`} className="flex-1 hover:text-brand">{i.nome}</Link>
            <b>{i.quantidade}</b>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => repeat(p.id_pedido)} disabled={loadingId === p.id_pedido}>Repetir pedido</Button>
        {p.pode_cancelar && !cancelOpen && <Button variant="ghost" onClick={() => setCancelOpen(true)}>Cancelar pedido</Button>}
      </div>
      {cancelOpen && (
        <div className="mt-4 rounded-2xl bg-accent/5 p-4">
          <FormError message={cancelError} />
          <TextAreaField label="Motivo do cancelamento" mandatory value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} />
          <div className="mt-3 flex gap-2">
            <Button onClick={cancel}>Confirmar cancelamento</Button>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>Voltar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
