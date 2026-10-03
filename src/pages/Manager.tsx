import { useState } from 'react';
import QuantityControl from '../components/QuantityControl';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import { products } from '../data/products';
import { initialOrders, initialStock, LOW_STOCK, statusFlow } from '../data/manager';

type Tab = 'pedidos' | 'estoque';

export default function Manager() {
  const [tab, setTab] = useState<Tab>('pedidos');
  const [orders, setOrders] = useState(initialOrders);
  const [stock, setStock] = useState<Record<number, number>>(
    Object.fromEntries(products.map((p) => [p.id, initialStock[p.id] ?? 25])),
  );
  const [onlyLow, setOnlyLow] = useState(false);

  const advance = (id: number) =>
    setOrders((prev) =>
      prev.map((o) => {
        const next = statusFlow[statusFlow.indexOf(o.status) + 1];
        return o.id === id && next ? { ...o, status: next } : o;
      }),
    );

  const changeStock = (id: number, delta: number) =>
    setStock((prev) => ({ ...prev, [id]: Math.max(0, prev[id] + delta) }));

  const lowCount = products.filter((p) => stock[p.id] < LOW_STOCK).length;
  const visible = onlyLow ? products.filter((p) => stock[p.id] < LOW_STOCK) : products;
  const tabStyle = (t: Tab) =>
    `rounded-full px-5 py-2 font-medium transition ${tab === t ? 'bg-brand text-white' : 'bg-white hover:bg-black/5'}`;

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h2 className="text-3xl font-extrabold">Painel do gestor</h2>
      <p className="mb-8 text-muted">Acompanhe pedidos e estoque da distribuidora.</p>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pedidos pendentes" value={orders.filter((o) => o.status === 'Pendente').length} />
        <StatCard label="Em separação" value={orders.filter((o) => o.status === 'Separando').length} />
        <StatCard label="Itens em estoque" value={Object.values(stock).reduce((a, b) => a + b, 0)} />
        <StatCard label="Estoque baixo" value={lowCount} highlight />
      </div>

      <div className="mb-6 flex gap-2">
        <button className={tabStyle('pedidos')} onClick={() => setTab('pedidos')}>Pedidos</button>
        <button className={tabStyle('estoque')} onClick={() => setTab('estoque')}>Estoque</button>
      </div>

      {tab === 'pedidos' ? (
        <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-surface text-sm text-muted">
              <tr><th className="p-4">Pedido</th><th>Cliente</th><th>Itens</th><th>Data</th><th>Status</th><th className="pr-4 text-right">Ação</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-black/10">
                  <td className="p-4 font-extrabold">#{o.id}</td>
                  <td>{o.customer}</td>
                  <td>{o.items}</td>
                  <td>{o.date}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="pr-4 text-right">
                    {o.status === 'Entregue' ? (
                      <span className="text-sm text-muted">Concluído</span>
                    ) : (
                      <Button variant="primary" className="px-4 py-2 text-sm" onClick={() => advance(o.id)}>Avançar status</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <label className="mb-4 flex items-center gap-2">
            <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="h-4 w-4 accent-brand" />
            Mostrar só estoque baixo (menos de {LOW_STOCK} un.)
          </label>
          <div className="grid gap-3">
            {visible.length === 0 && <p className="py-8 text-center text-muted">Nenhum produto com estoque baixo.</p>}
            {visible.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-black/10 bg-white p-3">
                <img src={p.image} alt={p.name} className="h-14 w-14 rounded-xl object-contain" />
                <div className="min-w-48 flex-1">
                  <p className="font-medium">{p.name}</p>
                  <small className="text-muted">{p.category}</small>
                </div>
                {stock[p.id] < LOW_STOCK && <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">Estoque baixo</span>}
                <QuantityControl value={stock[p.id]} onDecrease={() => changeStock(p.id, -1)} onIncrease={() => changeStock(p.id, 1)} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
