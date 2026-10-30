import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, errorMessage } from '../../api/client';
import Button from '../../components/Button';
import IconButton from '../../components/manager/IconButton';
import Toggle from '../../components/manager/Toggle';
import { ErrorState, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';

interface Item {
  id: number;
  nome: string;
  slug: string;
  ativo: boolean;
  total_produtos: number;
}

export default function Taxonomies() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <TaxonomyCard title="Categorias" path="/categorias" listKey="categorias" idKey="id_categoria" />
      <TaxonomyCard title="Marcas" path="/marcas" listKey="marcas" idKey="id_marca" />
    </div>
  );
}

// Lista editável de categorias ou marcas: criar, renomear, ativar/desativar e excluir (só sem produtos).
function TaxonomyCard({ title, path, listKey, idKey }: { title: string; path: string; listKey: string; idKey: string }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(async () => {
    const d = await api.get<Record<string, Record<string, unknown>[]>>(path, { incluir_inativos: true });
    return d[listKey].map((r) => ({ id: r[idKey] as number, nome: r.nome as string, slug: r.slug as string, ativo: r.ativo as boolean, total_produtos: (r.total_produtos as number) ?? 0 }));
  }, [path]);
  const [novo, setNovo] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState('');

  const run = async (fn: () => Promise<{ mensagem?: string }>) => {
    try {
      const r = await fn();
      toast(r?.mensagem ?? 'Salvo.');
      reload();
      return true;
    } catch (e) {
      toast(errorMessage(e), 'error');
      return false;
    }
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!novo.trim()) return;
    if (await run(() => api.post(path, { nome: novo.trim() }))) setNovo('');
  };

  const saveName = async (it: Item) => {
    if (await run(() => api.patch(`${path}/${it.id}`, { nome: editNome.trim() }))) setEditId(null);
  };

  const remove = (it: Item) => {
    if (it.total_produtos > 0) return toast(`Não dá para excluir: ${it.total_produtos} produto(s) usam “${it.nome}”. Desative em vez de excluir.`, 'error');
    if (confirm(`Excluir “${it.nome}”?`)) run(() => api.del(`${path}/${it.id}`));
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <h3 className="mb-3 font-extrabold">{title}</h3>
      <form onSubmit={create} className="mb-4 flex gap-2">
        <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder={`Nova ${title === 'Marcas' ? 'marca' : 'categoria'}`}
          className="min-w-0 flex-1 rounded-full border border-black/10 px-4 py-2 outline-none focus:border-brand" />
        <Button type="submit" variant="primary" className="px-4 py-2 text-sm">Adicionar</Button>
      </form>
      {loading && <Loading className="py-6" />}
      {error && <ErrorState error={error} onRetry={reload} className="py-6" />}
      <ul className="divide-y divide-black/10">
        {data?.map((it: Item) => (
          <li key={it.id} className={`flex items-center gap-3 py-2 ${it.ativo ? '' : 'opacity-60'}`}>
            {editId === it.id ? (
              <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); saveName(it); }}>
                <input autoFocus value={editNome} onChange={(e) => setEditNome(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-1.5 outline-none focus:border-brand" />
                <Button type="submit" variant="primary" className="px-3 py-1 text-sm">Salvar</Button>
                <Button type="button" variant="ghost" className="px-3 py-1 text-sm" onClick={() => setEditId(null)}>Cancelar</Button>
              </form>
            ) : (
              <>
                <span className="flex-1">
                  <span className="font-medium">{it.nome}</span>
                  <span className="block text-xs text-muted">/{it.slug} · {it.total_produtos} produto(s)</span>
                </span>
                <IconButton icon="edit" label={`Renomear ${it.nome}`} onClick={() => { setEditId(it.id); setEditNome(it.nome); }} />
                <IconButton icon="trash" label={`Excluir ${it.nome}`} danger onClick={() => remove(it)} />
                <Toggle checked={it.ativo} label={`Ativar ${it.nome}`} onChange={(v) => run(() => api.patch(`${path}/${it.id}`, { ativo: v }))} />
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Desativar esconde do menu da loja, mas não tira os produtos da vitrine. Para isso, desative os produtos.</p>
    </div>
  );
}
