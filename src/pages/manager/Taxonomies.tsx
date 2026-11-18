import { Fragment, useState } from 'react';
import type { FormEvent } from 'react';
import { api, errorMessage } from '../../api/client';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
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
  /** Só nas categorias: id da principal (nulo nas principais). */
  id_pai: number | null;
}

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';
// Busca sem acento e sem diferenciar maiúsculas (só no front).
const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const produtos = (n: number) => `${n} ${n === 1 ? 'produto' : 'produtos'}`;
const subcategorias = (n: number) => `${n} ${n === 1 ? 'subcategoria' : 'subcategorias'}`;

// Informação auxiliar sempre numa 2ª linha, abaixo do nome. Cada trecho não quebra no meio; o "·" fica colado ao fim do 1º trecho.
function Info({ trechos }: { trechos: string[] }) {
  return (
    <span className="block text-xs text-muted">
      {trechos.map((t, i) => (
        <Fragment key={t}>
          <span className="whitespace-nowrap">{t}{i < trechos.length - 1 ? ' ·' : ''}</span>
          {i < trechos.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </span>
  );
}

export default function Taxonomies() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <TaxonomyCard title="Categorias" path="/categorias" listKey="categorias" idKey="id_categoria" hierarquica />
      <TaxonomyCard title="Marcas" path="/marcas" listKey="marcas" idKey="id_marca" />
    </div>
  );
}

// Lista editável de categorias ou marcas: criar, renomear, ativar/desativar e excluir (só sem produtos).
// As categorias têm 2 níveis: principal e subcategoria (o produto aponta para a subcategoria, quando houver).
function TaxonomyCard({ title, path, listKey, idKey, hierarquica = false }: { title: string; path: string; listKey: string; idKey: string; hierarquica?: boolean }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(async () => {
    // plano=true: lista plana (principais e subcategorias, com id_pai), para montar a árvore aqui.
    const d = await api.get<Record<string, Record<string, unknown>[]>>(path, { incluir_inativos: true, plano: hierarquica || undefined });
    const itens: Item[] = d[listKey].map((r) => ({
      id: r[idKey] as number, nome: r.nome as string, slug: r.slug as string, ativo: r.ativo as boolean,
      total_produtos: (r.total_produtos as number) ?? 0, id_pai: (r.id_pai as number | null | undefined) ?? null,
    }));
    if (!hierarquica) return itens;
    const principais = itens.filter((i) => i.id_pai === null);
    return principais.flatMap((p) => [p, ...itens.filter((i) => i.id_pai === p.id)]);
  }, [path]);
  const principais = data?.filter((i) => i.id_pai === null) ?? [];
  const [idPai, setIdPai] = useState('');
  const [novo, setNovo] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState('');
  const [busca, setBusca] = useState('');
  const [abertas, setAbertas] = useState<Set<number>>(new Set()); // categorias principais abertas (começam todas recolhidas)

  const abrir = (id: number | null | undefined) => id && setAbertas((s) => new Set(s).add(id));
  const alternar = (id: number) => setAbertas((s) => { const n = new Set(s); if (!n.delete(id)) n.add(id); return n; });

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
    const pai = hierarquica && idPai ? Number(idPai) : null;
    if (await run(() => api.post(path, { nome: novo.trim(), ...(hierarquica ? { id_pai: pai } : {}) }))) {
      setNovo('');
      abrir(pai); // a subcategoria nova fica visível dentro da categoria dela
    }
  };

  const saveName = async (it: Item) => {
    if (await run(() => api.patch(`${path}/${it.id}`, { nome: editNome.trim() }))) {
      setEditId(null);
      abrir(it.id_pai);
    }
  };

  const remove = (it: Item) => {
    if (it.total_produtos > 0) return toast(`Não dá para excluir: ${it.total_produtos} produto(s) usam “${it.nome}”. Desative em vez de excluir.`, 'error');
    if (hierarquica && it.id_pai === null && data?.some((x) => x.id_pai === it.id)) return toast(`Não dá para excluir: “${it.nome}” tem subcategorias. Remova ou mova as subcategorias antes.`, 'error');
    if (confirm(`Excluir “${it.nome}”?`)) run(() => api.del(`${path}/${it.id}`));
  };

  const q = norm(busca.trim());
  const casa = (it: Item) => norm(it.nome).includes(q);
  const filhas = (p: Item) => data?.filter((x) => x.id_pai === p.id) ?? [];
  // Total da principal: os produtos diretos dela + os das subcategorias (só para mostrar; as travas de exclusão usam o total de antes).
  const totalPrincipal = (p: Item) => p.total_produtos + filhas(p).reduce((soma, f) => soma + f.total_produtos, 0);
  // Grupos visíveis: com busca, só o que casa (e as categorias com subcategorias que casam abrem sozinhas).
  const grupos = hierarquica
    ? principais.flatMap((p) => {
      const todas = filhas(p);
      if (!q) return [{ p, subs: todas, aberta: abertas.has(p.id) }];
      const subsQueCasam = todas.filter(casa);
      if (subsQueCasam.length) return [{ p, subs: subsQueCasam, aberta: true }];
      return casa(p) ? [{ p, subs: todas, aberta: abertas.has(p.id) }] : [];
    })
    : [];
  const planos = !hierarquica ? (data ?? []).filter((it) => !q || casa(it)) : [];
  const vazioBusca = !!q && !loading && !error && (hierarquica ? grupos.length === 0 : planos.length === 0);
  const comFilhas = principais.filter((p) => filhas(p).length > 0).map((p) => p.id);

  const botoesItem = (it: Item) => (
    <>
      <IconButton icon="edit" label={`Editar ${it.nome}`} onClick={() => { setEditId(it.id); setEditNome(it.nome); }} />
      <IconButton icon="trash" label={`Excluir ${it.nome}`} danger="hover" onClick={() => remove(it)} />
      <Toggle checked={it.ativo} label={`${it.ativo ? 'Desativar' : 'Ativar'} ${it.nome}`} onChange={(v) => run(() => api.patch(`${path}/${it.id}`, { ativo: v }))} />
    </>
  );

  const formEdicao = (it: Item) => (
    <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); saveName(it); }}>
      <input autoFocus value={editNome} onChange={(e) => setEditNome(e.target.value)} aria-label={`Novo nome de ${it.nome}`}
        className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-1.5 outline-none focus:border-brand" />
      <Button type="submit" variant="primary" className="px-3 py-1 text-sm">Salvar</Button>
      <Button type="button" variant="ghost" className="px-3 py-1 text-sm" onClick={() => setEditId(null)}>Cancelar</Button>
    </form>
  );

  const linhaSimples = (it: Item, className = '') => (
    <li key={it.id} className={`flex min-h-11 items-center gap-3 py-2 ${className} ${it.ativo ? '' : 'opacity-60'}`}>
      {editId === it.id ? formEdicao(it) : (
        <>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{it.nome}</span>{' '}
            <Info trechos={[produtos(it.total_produtos)]} />
          </span>
          {botoesItem(it)}
        </>
      )}
    </li>
  );

  return (
    <div className="flex flex-col rounded-2xl border border-black/10 bg-white p-5">
      <h3 className="font-extrabold">{title}</h3>
      <p className="mb-4 mt-1 text-xs text-muted">Desativar esconde do menu da loja, mas não tira os produtos da vitrine. Para isso, desative os produtos.</p>
      <form onSubmit={create} className="mb-3 flex gap-2">
        <input value={novo} onChange={(e) => setNovo(e.target.value)} aria-label={`Nova ${title === 'Marcas' ? 'marca' : idPai ? 'subcategoria' : 'categoria'}`}
          placeholder={`Nova ${title === 'Marcas' ? 'marca' : idPai ? 'subcategoria' : 'categoria'}`}
          className={`min-w-0 flex-1 rounded-full border border-black/10 px-4 py-2 outline-none focus:border-brand ${foco}`} />
        {hierarquica && (
          <select value={idPai} onChange={(e) => setIdPai(e.target.value)} aria-label="Dentro de qual categoria principal"
            className={`max-w-40 rounded-full border border-black/10 bg-white px-3 py-2 text-sm ${foco}`}>
            <option value="">Principal</option>
            {principais.map((p) => <option key={p.id} value={p.id}>em {p.nome}</option>)}
          </select>
        )}
        <Button type="submit" variant="primary" className={`px-4 py-2 text-sm ${foco}`}>Adicionar</Button>
      </form>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label={hierarquica ? 'Buscar categoria' : 'Buscar marca'}
          placeholder={hierarquica ? 'Buscar categoria' : 'Buscar marca'}
          className={`min-w-0 flex-1 rounded-full border border-black/10 px-4 py-1.5 text-sm outline-none focus:border-brand ${foco}`} />
        {hierarquica && comFilhas.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-medium text-brand">
            <button type="button" onClick={() => setAbertas(new Set(comFilhas))} className={`hover:underline ${foco}`}>Expandir tudo</button>
            <span aria-hidden="true" className="text-muted">/</span>
            <button type="button" onClick={() => setAbertas(new Set())} className={`hover:underline ${foco}`}>Recolher tudo</button>
          </div>
        )}
      </div>

      {/* Só a lista rola: o título, o formulário e a busca ficam fixos no topo do cartão. */}
      <div className="max-h-[50vh] overflow-y-auto sm:max-h-[65vh]">
        {loading && <Loading className="py-6" />}
        {error && <ErrorState error={error} onRetry={reload} className="py-6" />}
        {vazioBusca && <p className="py-6 text-center text-sm text-muted">{hierarquica ? 'Nenhuma categoria encontrada' : 'Nenhuma marca encontrada'}</p>}
        <ul className="divide-y divide-black/10">
          {hierarquica ? grupos.map(({ p, subs, aberta }) => {
            const tem = filhas(p).length > 0;
            return (
              <li key={p.id} className={p.ativo ? '' : 'opacity-60'}>
                <div className="flex min-h-11 items-center gap-3 py-2">
                  {editId === p.id ? formEdicao(p) : (
                    <>
                      {tem ? (
                        <button type="button" aria-expanded={aberta} aria-controls={`sub-${p.id}`} onClick={() => alternar(p.id)}
                          className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left ${foco}`}>
                          <Icon name={aberta ? 'down' : 'right'} className="h-5 w-5 shrink-0 text-muted" />
                          <span className="min-w-0">
                            <span className="block font-medium">{p.nome}</span>{' '}
                            <Info trechos={[subcategorias(filhas(p).length), produtos(totalPrincipal(p))]} />
                          </span>
                        </button>
                      ) : (
                        <span className="min-w-0 flex-1 pl-7">
                          <span className="block font-medium">{p.nome}</span>{' '}
                          <Info trechos={[produtos(totalPrincipal(p))]} />
                        </span>
                      )}
                      {botoesItem(p)}
                    </>
                  )}
                </div>
                {tem && aberta && (
                  <ul id={`sub-${p.id}`} className="mb-2 ml-6 divide-y divide-black/5 border-l-2 border-brand/20 pl-3">
                    {subs.map((s) => linhaSimples(s))}
                  </ul>
                )}
              </li>
            );
          }) : planos.map((it) => linhaSimples(it))}
        </ul>
      </div>
    </div>
  );
}
