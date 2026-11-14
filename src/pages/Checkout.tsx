import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError, errorMessage, imageUrl, request } from '../api/client';
import Button from '../components/Button';
import Field, { TextAreaField } from '../components/Field';
import { ErrorState, FormError, Loading } from '../components/State';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { track } from '../utils/events';
import { dateFromToday, disponibilidadeLabel } from '../utils/format';
import { novoUuid } from '../utils/uuid';
import type { Endereco, ItemIndisponivel, Pedido } from '../types';

const MOTIVOS: Record<ItemIndisponivel['motivo'], string> = {
  produto_inexistente: 'Produto não existe mais.',
  produto_inativo: 'Produto saiu de linha.',
  multiplo_de_venda: 'Quantidade fora do múltiplo de venda.',
  estoque_insuficiente: 'Estoque insuficiente.',
};

// Checkout: endereço, observação e data desejada. Se algum item tiver problema, a API devolve
// todos de uma vez (409 ITENS_INDISPONIVEIS) e nada é gravado; mostramos a lista para ajustar.
export default function Checkout() {
  const navigate = useNavigate();
  const toast = useToast();
  const { items, setQuantity, remove, clear } = useCart();
  const enderecos = useApi(() => api.get<{ enderecos: Endereco[] }>('/minha-conta/enderecos'), []);
  const [idEndereco, setIdEndereco] = useState<number | null>(null);
  const [observacao, setObservacao] = useState('');
  const [data, setData] = useState('');
  const [problemas, setProblemas] = useState<ItemIndisponivel[]>([]);
  // Quantidade nova digitada para cada item sem estoque suficiente (a API não diz quanto há, então o cliente tenta um valor menor).
  const [novasQuantidades, setNovasQuantidades] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  // Uma chave por checkout: se o envio for repetido (duplo clique, queda de rede), a API devolve o mesmo pedido.
  const [idempotencyKey] = useState(() => novoUuid());

  useEffect(() => track({ tipo: 'checkout_iniciado' }), []);
  useEffect(() => {
    const lista = enderecos.data?.enderecos;
    if (lista?.length && idEndereco === null) setIdEndereco((lista.find((e) => e.principal) ?? lista[0]).id_endereco);
  }, [enderecos.data, idEndereco]);

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center">
        <h2 className="text-3xl font-extrabold">Seu carrinho está vazio</h2>
        <Link to="/produtos" className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-extrabold text-white">Ver produtos</Link>
      </section>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFormError('');
    setErrors({});
    setProblemas([]);
    try {
      const res = await request<{ mensagem: string; pedido: Pedido }>('/pedidos', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: {
          itens: items.map((i) => ({ id_produto: i.id_produto, quantidade: i.quantidade })),
          ...(idEndereco ? { id_endereco: idEndereco } : {}),
          ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
          ...(data ? { data_entrega_desejada: data } : {}),
        },
      });
      clear();
      toast('Pedido enviado com sucesso!');
      navigate(`/minha-conta/pedidos/${res.pedido.id_pedido}`, { replace: true, state: { novo: true } });
    } catch (err) {
      if (err instanceof ApiError && err.codigo === 'ITENS_INDISPONIVEIS' && Array.isArray(err.detalhes)) {
        setProblemas(err.detalhes as ItemIndisponivel[]);
      } else if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
      }
      setFormError(errorMessage(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSending(false);
    }
  };

  const quantidadeNoCarrinho = (id: number) => items.find((i) => i.id_produto === id)?.quantidade ?? 0;

  // Itens que só podem ser removidos (saíram de linha ou estão indisponíveis) e itens em que o cliente escolhe outra quantidade.
  const soRemover = (p: ItemIndisponivel) =>
    p.motivo === 'produto_inexistente' || p.motivo === 'produto_inativo' || p.disponibilidade === 'indisponivel';

  // Sugestão de partida: o múltiplo de venda mais próximo (multiplo_de_venda) ou a metade da quantidade pedida (estoque_insuficiente).
  const sugestao = (p: ItemIndisponivel) => {
    const m = Math.max(1, p.multiplo_venda);
    const atual = quantidadeNoCarrinho(p.id_produto) || p.solicitado;
    if (p.motivo === 'multiplo_de_venda') return Math.max(m, Math.round(atual / m) * m);
    return Math.max(m, Math.floor(atual / 2 / m) * m);
  };

  const quantidadeEscolhida = (p: ItemIndisponivel) => {
    const n = Number(novasQuantidades[p.id_produto] ?? sugestao(p));
    const m = Math.max(1, p.multiplo_venda);
    return Number.isFinite(n) && n >= m ? Math.round(n / m) * m : 0;
  };

  const fix = (p: ItemIndisponivel) => {
    const q = quantidadeEscolhida(p);
    if (q > 0) setQuantity(p.id_produto, q);
    else remove(p.id_produto);
    setProblemas((prev) => prev.filter((x) => x.id_produto !== p.id_produto));
  };

  const removeItem = (p: ItemIndisponivel) => {
    remove(p.id_produto);
    setProblemas((prev) => prev.filter((x) => x.id_produto !== p.id_produto));
  };

  const totalUnits = items.reduce((s, i) => s + i.quantidade, 0);

  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <h2 className="text-3xl font-extrabold">Finalizar pedido</h2>
      <p className="mb-8 text-muted">Confira o endereço e envie. A Mantiqueira confirma valores e prazo com você.</p>
      <FormError message={formError} />
      {problemas.length > 0 && (
        <div className="mb-6 rounded-2xl border border-accent/40 bg-white p-4">
          <p className="mb-3 font-extrabold text-accent">Ajuste estes itens para continuar:</p>
          <ul className="grid gap-2">
            {problemas.map((p) => (
              <li key={p.id_produto} className="flex flex-wrap items-center gap-3 rounded-xl bg-accent/5 p-3 text-sm">
                <span className="min-w-40 flex-1">
                  <b>{p.nome ?? `Produto ${p.id_produto}`}</b>
                  <span className="block text-muted">
                    {MOTIVOS[p.motivo]} Pedido: {p.solicitado}.
                    {p.disponibilidade && ` Situação agora: ${disponibilidadeLabel[p.disponibilidade].toLowerCase()}.`}
                    {p.multiplo_venda > 1 ? ` Vendido em múltiplos de ${p.multiplo_venda}.` : ''}
                  </span>
                </span>
                {soRemover(p) ? (
                  <button type="button" onClick={() => removeItem(p)} className="rounded-full bg-accent px-4 py-1.5 font-extrabold text-white">Remover do carrinho</button>
                ) : (
                  <span className="flex flex-wrap items-center gap-2">
                    <input type="number" min={Math.max(1, p.multiplo_venda)} step={Math.max(1, p.multiplo_venda)} aria-label={`Nova quantidade de ${p.nome ?? 'produto'}`}
                      value={novasQuantidades[p.id_produto] ?? String(sugestao(p))}
                      onChange={(e) => setNovasQuantidades((prev) => ({ ...prev, [p.id_produto]: e.target.value }))}
                      className="w-24 rounded-full border border-black/10 bg-white px-3 py-1.5 text-center outline-none focus:border-brand" />
                    <button type="button" onClick={() => fix(p)} className="rounded-full bg-accent px-4 py-1.5 font-extrabold text-white">Usar esta quantidade</button>
                    <button type="button" onClick={() => removeItem(p)} className="text-muted underline hover:text-accent">Remover</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-3xl bg-white p-6">
          <h3 className="font-extrabold">Endereço de entrega</h3>
          {enderecos.loading && <Loading className="py-6" />}
          {enderecos.error && <ErrorState error={enderecos.error} onRetry={enderecos.reload} className="py-6" />}
          {enderecos.data && enderecos.data.enderecos.length === 0 && (
            <p className="mt-3 text-muted">Você ainda não tem endereço. <Link to="/minha-conta/enderecos" className="font-extrabold text-brand">Cadastrar endereço</Link></p>
          )}
          <div className="mt-3 grid gap-2">
            {enderecos.data?.enderecos.map((e) => (
              <label key={e.id_endereco} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 ${idEndereco === e.id_endereco ? 'border-brand bg-brand/5' : 'border-black/10'}`}>
                <input type="radio" name="endereco" className="mt-1 h-4 w-4 accent-brand" checked={idEndereco === e.id_endereco} onChange={() => setIdEndereco(e.id_endereco)} />
                <span className="text-sm">
                  <b>{e.logradouro}, {e.numero}{e.complemento ? ` – ${e.complemento}` : ''}</b>
                  <span className="block text-muted">{e.bairro} · {e.cidade}/{e.estado} · CEP {e.cep}</span>
                  {e.principal && <span className="text-xs font-extrabold text-brand">Principal</span>}
                </span>
              </label>
            ))}
          </div>
          {errors.id_endereco && <small className="text-accent">{errors.id_endereco}</small>}
          <Link to="/minha-conta/enderecos" className="mt-2 inline-block text-sm font-extrabold text-brand">Gerenciar endereços</Link>

          <h3 className="mt-8 font-extrabold">Entrega</h3>
          <Field label="Data de entrega desejada" mandatory={false} type="date" min={dateFromToday(1)} max={dateFromToday(90)}
            value={data} onChange={(e) => setData(e.target.value)} error={errors.data_entrega_desejada} />
          <TextAreaField label="Observação" maxLength={500} placeholder="Ex.: entregar pela manhã, falar com a Maria"
            value={observacao} onChange={(e) => setObservacao(e.target.value)} error={errors.observacao} />
        </div>

        <aside className="self-start rounded-3xl bg-white p-6">
          <h3 className="mb-3 font-extrabold">Resumo</h3>
          <ul className="grid max-h-80 gap-2 overflow-y-auto">
            {items.map((i) => (
              <li key={i.id_produto} className={`flex items-center gap-3 text-sm ${problemas.some((p) => p.id_produto === i.id_produto) ? 'text-accent' : ''}`}>
                <img src={imageUrl(i.imagem_url)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain foto-produto" />
                <span className="min-w-0 flex-1 truncate">{i.nome}</span>
                <b>{i.quantidade}</b>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t border-black/10 pt-4 font-extrabold"><span>Total</span><span>{totalUnits} unidades</span></p>
          <Button type="submit" disabled={sending || problemas.length > 0 || !enderecos.data?.enderecos.length} className="mt-4 w-full disabled:opacity-50">
            {sending ? 'Enviando...' : 'Enviar pedido'}
          </Button>
          <Link to="/carrinho" className="mt-3 block text-center text-sm text-muted underline">Voltar ao carrinho</Link>
        </aside>
      </form>
    </section>
  );
}
