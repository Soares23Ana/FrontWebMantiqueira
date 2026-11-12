import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, errorMessage } from '../../api/client';
import Button from '../../components/Button';
import { TextAreaField } from '../../components/Field';
import ChipFilter from '../../components/manager/ChipFilter';
import { ErrorState, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { formatDateTime } from '../../utils/format';
import type { Paginacao } from '../../types';

export interface CarrinhoAtual {
  itens: { id_produto: number; sku: string; nome: string; quantidade: number }[];
  total_unidades: number;
  ultimo_movimento_em: string;
  dias_parado: number;
  abandonado: boolean;
  contatado_em: string | null;
}

interface Nota {
  id_nota: number;
  texto: string;
  autor: { id_usuario: number; nome: string } | null;
  criado_em: string;
  pode_excluir: boolean;
}

interface EntradaHistorico {
  tipo: 'cadastro' | 'pedido' | 'carrinho' | 'acesso' | 'nota';
  data: string;
  titulo: string;
  detalhe: string | null;
}

const TIPOS = ['Tudo', 'Pedidos', 'Carrinho', 'Acessos', 'Notas'] as const;
const tipoValue: Record<(typeof TIPOS)[number], string> = { Tudo: '', Pedidos: 'pedido', Carrinho: 'carrinho', Acessos: 'acesso', Notas: 'nota' };
const COR: Record<EntradaHistorico['tipo'], string> = {
  cadastro: 'bg-brand', pedido: 'bg-green-600', carrinho: 'bg-amber-500', acesso: 'bg-black/30', nota: 'bg-accent',
};

// Atendimento ao cliente no painel: carrinho atual, notas internas da equipe e linha do tempo
// (cadastro, pedidos, carrinho, acessos e notas) em GET /clientes/:id/notas e /historico.
export default function CustomerSupport({ id, carrinho, ultimoEvento }: { id: number; carrinho?: CarrinhoAtual | null; ultimoEvento?: string | null }) {
  return (
    <div className="mt-4 grid gap-4">
      <div className="rounded-2xl border border-black/10 p-4">
        <h4 className="font-extrabold">Carrinho atual</h4>
        {carrinho ? (
          <>
            <p className="text-sm text-muted">
              {carrinho.total_unidades} unidade(s) · última mudança em {formatDateTime(carrinho.ultimo_movimento_em)} ({carrinho.dias_parado} dia(s))
              {carrinho.abandonado && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-extrabold text-amber-800">Abandonado{carrinho.contatado_em ? ' · contatado' : ''}</span>}
            </p>
            <ul className="mt-2 grid gap-1 text-sm">
              {carrinho.itens.map((i) => <li key={i.id_produto} className="flex justify-between gap-2"><span className="truncate">{i.nome}</span><b>{i.quantidade} un.</b></li>)}
            </ul>
          </>
        ) : <p className="text-sm text-muted">Sem itens no carrinho.</p>}
        <p className="mt-2 text-xs text-muted">Último acesso registrado: {ultimoEvento ? formatDateTime(ultimoEvento) : 'nunca'}</p>
      </div>
      <Notes id={id} />
      <Timeline id={id} />
    </div>
  );
}

function Notes({ id }: { id: number }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => api.get<{ notas: Nota[]; paginacao: Paginacao }>(`/clientes/${id}/notas`, { limite: 20 }), [id]);
  const [texto, setTexto] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setSaving(true);
    setErro('');
    try {
      await api.post(`/clientes/${id}/notas`, { texto: texto.trim() });
      setTexto('');
      reload();
    } catch (err) {
      setErro(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (n: Nota) => {
    if (!confirm('Excluir esta nota?')) return;
    try {
      await api.del(`/clientes/${id}/notas/${n.id_nota}`);
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 p-4">
      <h4 className="font-extrabold">Notas internas</h4>
      <p className="text-sm text-muted">Anotações da equipe sobre o cliente. O cliente não vê.</p>
      <form onSubmit={add} noValidate>
        <TextAreaField label="Nova nota" maxLength={1000} placeholder="Ex.: prefere entrega pela manhã" value={texto}
          onChange={(e) => setTexto(e.target.value)} error={erro || undefined} />
        <Button type="submit" variant="primary" disabled={saving || !texto.trim()} className="mt-2 px-4 py-2 text-sm disabled:opacity-40">Salvar nota</Button>
      </form>
      {loading && <Loading className="py-4" />}
      {error && <ErrorState error={error} onRetry={reload} className="py-4" />}
      <ul className="mt-3 grid gap-2">
        {data?.notas.map((n) => (
          <li key={n.id_nota} className="rounded-xl bg-surface p-3 text-sm">
            <p className="whitespace-pre-line">{n.texto}</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-muted">
              <span className="flex-1">{n.autor?.nome ?? 'Equipe'} · {formatDateTime(n.criado_em)}</span>
              {n.pode_excluir && <button onClick={() => remove(n)} className="font-extrabold text-accent hover:underline">Excluir</button>}
            </p>
          </li>
        ))}
        {data && data.notas.length === 0 && <li className="text-sm text-muted">Nenhuma nota ainda.</li>}
      </ul>
    </div>
  );
}

function Timeline({ id }: { id: number }) {
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>('Tudo');
  const { data, loading, error, reload } = useApi(
    () => api.get<{ historico: EntradaHistorico[]; paginacao: Paginacao }>(`/clientes/${id}/historico`, { tipo: tipoValue[tipo], limite: 30 }),
    [id, tipo],
  );
  return (
    <div className="rounded-2xl border border-black/10 p-4">
      <h4 className="mb-2 font-extrabold">Histórico do cliente</h4>
      <ChipFilter label="Tipo" options={TIPOS} value={tipo} onChange={setTipo} />
      {loading && <Loading className="py-4" />}
      {error && <ErrorState error={error} onRetry={reload} className="py-4" />}
      <ol className="mt-3 grid gap-2">
        {data?.historico.map((h, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${COR[h.tipo]}`} aria-hidden="true" />
            <span className="flex-1">
              <b>{h.titulo}</b>
              {h.detalhe && <span className="block text-muted">{h.detalhe}</span>}
            </span>
            <span className="shrink-0 text-xs text-muted">{formatDateTime(h.data)}</span>
          </li>
        ))}
        {data && data.historico.length === 0 && <li className="text-sm text-muted">Nada registrado.</li>}
      </ol>
    </div>
  );
}
