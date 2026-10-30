import Icon from './Icon';
import { formatDateTime } from '../utils/format';
import { STATUS_FLUXO } from '../types';
import type { Pedido } from '../types';

// Linha do tempo do status + histórico de mudanças (quem, quando e observação). Usada pelo cliente e pelo gestor.
export default function OrderTimeline({ pedido }: { pedido: Pedido }) {
  const currentStep = STATUS_FLUXO.indexOf(pedido.status as (typeof STATUS_FLUXO)[number]);
  return (
    <>
      {pedido.status !== 'Cancelado' ? (
        <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Andamento do pedido">
          {STATUS_FLUXO.map((s, i) => (
            <li key={s} className="text-center text-xs">
              <div className={`mx-auto mb-1 grid h-8 w-8 place-items-center rounded-full font-extrabold ${i <= currentStep ? 'bg-brand text-white' : 'bg-surface text-muted'}`}>
                {i < currentStep || (i === currentStep && s === 'Entregue') ? <Icon name="check" className="h-4 w-4" /> : i + 1}
              </div>
              <span className={i <= currentStep ? 'font-medium text-brand' : 'text-muted'}>{s}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mb-6 rounded-xl bg-surface p-3 text-sm text-muted">
          Este pedido foi cancelado.{pedido.motivo_cancelamento && <> Motivo: <b className="text-ink">{pedido.motivo_cancelamento}</b></>}
        </p>
      )}
      {pedido.historico && pedido.historico.length > 0 && (
        <>
          <h4 className="mb-2 font-extrabold">Histórico</h4>
          <ul className="mb-2 grid gap-2 border-l-2 border-brand/20 pl-4">
            {pedido.historico.map((h, i) => (
              <li key={i} className="text-sm">
                <p><b>{h.status_novo}</b> <span className="text-muted">· {formatDateTime(h.data)}</span></p>
                {h.usuario && <p className="text-muted">por {h.usuario.nome}{h.usuario.tipo === 'equipe' ? ' (equipe)' : ''}</p>}
                {h.observacao && <p className="mt-0.5 rounded-lg bg-surface px-2 py-1">{h.observacao}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
