import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, ApiError, errorMessage, fetchAllPages, imageUrl } from '../../api/client';
import Availability from '../../components/Availability';
import Button from '../../components/Button';
import Field, { SelectField, TextAreaField } from '../../components/Field';
import Icon from '../../components/Icon';
import ChipFilter from '../../components/manager/ChipFilter';
import IconButton from '../../components/manager/IconButton';
import Modal from '../../components/manager/Modal';
import Pagination from '../../components/manager/Pagination';
import SearchBox from '../../components/manager/SearchBox';
import SectionHeader from '../../components/manager/SectionHeader';
import TableCard from '../../components/manager/TableCard';
import Toggle from '../../components/manager/Toggle';
import { ErrorState, FormError, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi, useDebounced } from '../../hooks/useApi';
import { downloadCsv } from '../../utils/csv';
import { formatDateTime } from '../../utils/format';
import type { Categoria, Marca, Movimentacao, Paginacao, Produto } from '../../types';
import { useManager } from './ManagerLayout';
import Taxonomies from './Taxonomies';

const dispOptions = ['Todos', 'Disponível', 'Últimas unidades', 'Indisponível'] as const;
const dispValue: Record<(typeof dispOptions)[number], string> = {
  Todos: '', Disponível: 'disponivel', 'Últimas unidades': 'ultimas_unidades', Indisponível: 'indisponivel',
};

export default function Products() {
  const [tab, setTab] = useState<'Produtos' | 'Categorias e marcas'>('Produtos');
  return (
    <>
      <SectionHeader title="Produtos" subtitle="Catálogo, estoque, imagens, categorias e marcas." />
      <div className="mb-5"><ChipFilter label="Seção" options={['Produtos', 'Categorias e marcas'] as const} value={tab} onChange={setTab} /></div>
      {tab === 'Produtos' ? <ProductList /> : <Taxonomies />}
    </>
  );
}

function ProductList() {
  const toast = useToast();
  const { refreshCounters } = useManager();
  const [params] = useSearchParams();
  const initialDisp = (Object.keys(dispValue) as (keyof typeof dispValue)[]).find((k) => dispValue[k] === params.get('disponibilidade')) ?? 'Todos';
  const [search, setSearch] = useState('');
  const [disp, setDisp] = useState<(typeof dispOptions)[number]>(initialDisp);
  const [categoria, setCategoria] = useState('');
  const [inativos, setInativos] = useState(true);
  const [ordenar, setOrdenar] = useState('nome');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const busca = useDebounced(search.trim());
  const categorias = useApi(() => api.get<{ categorias: Categoria[] }>('/categorias', { incluir_inativos: true }), []);
  const marcas = useApi(() => api.get<{ marcas: Marca[] }>('/marcas', { incluir_inativos: true }), []);

  const filtros = { busca, categoria, disponibilidade: dispValue[disp], incluir_inativos: inativos || undefined, ordenar };
  const lista = useApi(
    () => api.get<{ produtos: Produto[]; paginacao: Paginacao }>('/produtos', { ...filtros, pagina: page, limite: pageSize }),
    [busca, categoria, disp, inativos, ordenar, page, pageSize],
  );

  const [editing, setEditing] = useState<Produto | 'novo' | null>(null);
  const [stockOf, setStockOf] = useState<Produto | null>(null);

  const resetPage = () => setPage(1);
  const changed = () => {
    lista.reload();
    refreshCounters();
  };

  const toggleActive = async (p: Produto, ativo: boolean) => {
    try {
      await api.patch(`/produtos/${p.id_produto}`, { ativo });
      toast(ativo ? 'Produto ativado: voltou para a vitrine.' : 'Produto desativado: saiu da vitrine.');
      changed();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  // CSV do catálogo sem preço (decisão do projeto: nada financeiro no sistema).
  const exportCsv = async () => {
    try {
      const todos = await fetchAllPages<Produto>('/produtos', 'produtos', filtros);
      downloadCsv('produtos.csv', ['SKU', 'Produto', 'Categoria', 'Marca', 'Estoque', 'Estoque mínimo', 'Múltiplo de venda', 'Ativo'],
        todos.map((p) => [p.sku, p.nome, [p.categoria?.nome, p.subcategoria?.nome].filter(Boolean).join(' / '), p.marca?.nome ?? '', p.estoque ?? '', p.estoque_minimo ?? '', p.multiplo_venda, p.ativo ? 'Sim' : 'Não']));
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={exportCsv}><Icon name="download" className="mr-1 inline h-5 w-5 align-text-bottom" />Exportar</Button>
        <Button variant="accent" onClick={() => setEditing('novo')}><Icon name="plus" className="mr-1 inline h-5 w-5 align-text-bottom" />Novo produto</Button>
      </div>
      <div className="mb-4 grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={(v) => { setSearch(v); resetPage(); }} placeholder="Buscar por nome, SKU, marca..." />
          <select value={categoria} onChange={(e) => { setCategoria(e.target.value); resetPage(); }} aria-label="Categoria"
            className="rounded-full border border-black/10 bg-white px-3 py-2.5 text-sm">
            <option value="">Todas as categorias</option>
            {categorias.data?.categorias.map((c) => <option key={c.id_categoria} value={c.slug}>{c.nome}</option>)}
          </select>
          <select value={ordenar} onChange={(e) => setOrdenar(e.target.value)} aria-label="Ordenar"
            className="rounded-full border border-black/10 bg-white px-3 py-2.5 text-sm">
            <option value="nome">Nome (A–Z)</option>
            <option value="estoque">Menor estoque</option>
            <option value="estoque_desc">Maior estoque</option>
            <option value="recentes">Mais recentes</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <Toggle checked={inativos} label="Mostrar produtos inativos" onChange={(v) => { setInativos(v); resetPage(); }} />
            Mostrar inativos
          </label>
        </div>
        <ChipFilter label="Filtrar por disponibilidade" options={dispOptions} value={disp} onChange={(v) => { setDisp(v); resetPage(); }} />
      </div>

      {lista.error ? <ErrorState error={lista.error} onRetry={lista.reload} /> : (
        <TableCard headers={['Produto', 'SKU', 'Categoria / marca', 'Estoque', 'Ações', 'Ativo']}
          isEmpty={!lista.loading && lista.data?.produtos.length === 0} empty="Nenhum produto encontrado."
          footer={lista.data && <Pagination page={page} pageSize={pageSize} total={lista.data.paginacao.total} onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); resetPage(); }} />}>
          {lista.loading && <tr><td colSpan={6}><Loading className="py-8" /></td></tr>}
          {!lista.loading && lista.data?.produtos.map((p) => (
            <tr key={p.id_produto} className={p.ativo ? '' : 'opacity-60'}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <img src={imageUrl(p.imagem_url)} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-surface object-contain foto-produto" />
                  <span className="max-w-64 font-medium">{p.nome}</span>
                </div>
              </td>
              <td className="px-4 text-sm text-muted">{p.sku}</td>
              <td className="px-4 text-sm">{p.categoria?.nome ?? '—'}{p.subcategoria ? ` / ${p.subcategoria.nome}` : ''}<span className="block text-muted">{p.marca?.nome ?? '—'}</span></td>
              <td className="px-4 text-sm">
                <p className="font-extrabold">{p.estoque} <span className="font-normal text-muted">/ mín. {p.estoque_minimo}</span></p>
                <Availability value={p.disponibilidade} />
                {p.multiplo_venda > 1 && <p className="text-xs text-muted">Múltiplo {p.multiplo_venda}</p>}
              </td>
              <td className="px-4">
                <div className="flex">
                  <IconButton icon="edit" label="Editar produto" onClick={() => setEditing(p)} />
                  <IconButton icon="box" label="Ajustar estoque e ver histórico" onClick={() => setStockOf(p)} />
                </div>
              </td>
              <td className="px-4"><Toggle checked={!!p.ativo} label={`Ativar ${p.nome}`} onChange={(v) => toggleActive(p, v)} /></td>
            </tr>
          ))}
        </TableCard>
      )}

      {editing && (
        <ProductFormModal product={editing === 'novo' ? null : editing} categorias={categorias.data?.categorias ?? []} marcas={marcas.data?.marcas ?? []}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); changed(); }} />
      )}
      {stockOf && <StockModal product={stockOf} onClose={() => setStockOf(null)} onSaved={changed} />}
    </>
  );
}

function ProductFormModal({ product, categorias, marcas, onClose, onSaved }: {
  product: Produto | null; categorias: Categoria[]; marcas: Marca[]; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    sku: product?.sku ?? '',
    nome: product?.nome ?? '',
    descricao: product?.descricao ?? '',
    destaques: (product?.destaques ?? []).join('\n'),
    // O produto aponta para a subcategoria quando houver, senão para a categoria principal.
    id_categoria: String(product?.subcategoria?.id_categoria ?? product?.categoria?.id_categoria ?? ''),
    id_marca: product?.marca?.id_marca ? String(product.marca.id_marca) : '',
    estoque_minimo: String(product?.estoque_minimo ?? 10),
    multiplo_venda: String(product?.multiplo_venda ?? 1),
    ativo: product?.ativo ?? true,
    quantidade_estoque: '0',
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(imageUrl(product?.imagem_url));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)) return setErrors({ ...errors, imagem: 'Use JPEG, PNG, WEBP ou GIF.' });
    if (f.size > 5 * 1024 * 1024) return setErrors({ ...errors, imagem: 'A imagem deve ter até 5 MB.' });
    setErrors({ ...errors, imagem: '' });
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError('');
    const body: Record<string, unknown> = {
      sku: form.sku.trim(),
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      destaques: form.destaques.split('\n').map((d) => d.trim()).filter(Boolean),
      id_categoria: form.id_categoria ? Number(form.id_categoria) : null,
      id_marca: form.id_marca ? Number(form.id_marca) : null,
      estoque_minimo: Number(form.estoque_minimo),
      multiplo_venda: Number(form.multiplo_venda),
      ativo: form.ativo,
    };
    try {
      let id = product?.id_produto;
      if (product) {
        await api.patch(`/produtos/${id}`, body);
      } else {
        const r = await api.post<{ id_produto: number }>('/produtos', { ...body, quantidade_estoque: Number(form.quantidade_estoque) || 0 });
        id = r.id_produto;
      }
      if (file && id) {
        const fd = new FormData();
        fd.append('imagem', file);
        await api.post(`/produtos/${id}/imagem`, fd);
      }
      toast(product ? 'Produto atualizado.' : 'Produto cadastrado.');
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={product ? 'Editar produto' : 'Novo produto'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate>
        <FormError message={formError} />
        <div className="grid gap-x-4 sm:grid-cols-[160px_minmax(0,1fr)]">
          <div className="mt-3">
            <img src={preview} alt="" className="h-36 w-full rounded-xl bg-surface object-contain" />
            <label className="mt-2 block cursor-pointer rounded-full bg-surface px-3 py-2 text-center text-sm font-medium hover:bg-black/10">
              Trocar imagem
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={onFile} />
            </label>
            {errors.imagem && <small className="text-accent">{errors.imagem}</small>}
          </div>
          <div>
            <div className="grid gap-x-4 sm:grid-cols-[140px_minmax(0,1fr)]">
              <Field label="SKU" value={form.sku} onChange={set('sku')} error={errors.sku} />
              <Field label="Nome" value={form.nome} onChange={set('nome')} error={errors.nome} />
            </div>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <SelectField label="Categoria" mandatory={false} value={form.id_categoria} onChange={set('id_categoria')} error={errors.id_categoria}>
                <option value="">Sem categoria</option>
                {categorias.map((c) => c.subcategorias && c.subcategorias.length > 0 ? (
                  <optgroup key={c.id_categoria} label={`${c.nome}${c.ativo === false ? ' (inativa)' : ''}`}>
                    <option value={c.id_categoria}>{c.nome} (sem subcategoria)</option>
                    {c.subcategorias.map((s) => <option key={s.id_categoria} value={s.id_categoria}>{s.nome}{s.ativo === false ? ' (inativa)' : ''}</option>)}
                  </optgroup>
                ) : (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nome}{c.ativo === false ? ' (inativa)' : ''}</option>
                ))}
              </SelectField>
              <SelectField label="Marca" mandatory={false} value={form.id_marca} onChange={set('id_marca')} error={errors.id_marca}>
                <option value="">Sem marca</option>
                {marcas.map((m) => <option key={m.id_marca} value={m.id_marca}>{m.nome}{m.ativo === false ? ' (inativa)' : ''}</option>)}
              </SelectField>
            </div>
          </div>
        </div>
        <TextAreaField label="Descrição" value={form.descricao} onChange={set('descricao')} error={errors.descricao} />
        <TextAreaField label="Destaques (um por linha, até 10)" value={form.destaques} onChange={set('destaques')} error={errors.destaques} />
        <div className="grid gap-x-4 sm:grid-cols-3">
          <Field label="Estoque mínimo" type="number" min={0} value={form.estoque_minimo} onChange={set('estoque_minimo')} error={errors.estoque_minimo} />
          <Field label="Múltiplo de venda" type="number" min={1} value={form.multiplo_venda} onChange={set('multiplo_venda')} error={errors.multiplo_venda} />
          {!product && <Field label="Estoque inicial" type="number" min={0} value={form.quantidade_estoque} onChange={set('quantidade_estoque')} error={errors.quantidade_estoque} />}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <Toggle checked={form.ativo} label="Produto ativo" onChange={(v) => setForm({ ...form, ativo: v })} /> Ativo (aparece na vitrine)
        </label>
        {product && <p className="mt-3 text-sm text-muted">O estoque é alterado pelo botão de estoque, sempre com observação.</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

const TIPO_MOV: Record<Movimentacao['tipo'], string> = { ajuste: 'Ajuste', pedido: 'Pedido', cancelamento: 'Cancelamento', importacao: 'Importação' };

function StockModal({ product, onClose, onSaved }: { product: Produto; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [estoque, setEstoque] = useState(product.estoque ?? 0);
  const [modo, setModo] = useState<'Somar / subtrair' | 'Definir valor'>('Somar / subtrair');
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const movs = useApi(() => api.get<{ movimentacoes: Movimentacao[] }>(`/produtos/${product.id_produto}/movimentacoes`, { limite: 30 }), [product.id_produto]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = Number(valor);
    const local: Record<string, string> = {};
    if (!valor || !Number.isInteger(n) || (modo === 'Somar / subtrair' && n === 0)) local[modo === 'Definir valor' ? 'quantidade' : 'ajuste'] = 'Informe um número inteiro.';
    if (observacao.trim().length < 3) local.observacao = 'A observação é obrigatória (3 a 500 caracteres).';
    setErrors(local);
    setFormError('');
    if (Object.keys(local).length) return;
    try {
      const r = await api.patch<{ produto: Produto }>(`/produtos/${product.id_produto}/estoque`,
        { ...(modo === 'Definir valor' ? { quantidade: n } : { ajuste: n }), observacao: observacao.trim() });
      setEstoque(r.produto.estoque ?? 0);
      setValor('');
      setObservacao('');
      toast('Estoque atualizado.');
      movs.reload();
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    }
  };

  return (
    <Modal title="Estoque" onClose={onClose} wide>
      <p className="font-medium">{product.nome}</p>
      <p className="text-sm text-muted">SKU {product.sku} · mínimo {product.estoque_minimo}</p>
      <p className="my-4 text-4xl font-extrabold text-brand">{estoque} <span className="text-base font-medium text-muted">unidades</span></p>
      <form onSubmit={submit} noValidate className="rounded-2xl border border-black/10 p-4">
        <FormError message={formError} />
        <ChipFilter label="Tipo de ajuste" options={['Somar / subtrair', 'Definir valor'] as const} value={modo} onChange={setModo} />
        <div className="grid gap-x-4 sm:grid-cols-[160px_minmax(0,1fr)]">
          <Field label={modo === 'Definir valor' ? 'Novo estoque' : 'Ajuste (ex.: -2 ou 24)'} type="number" value={valor}
            onChange={(e) => setValor(e.target.value)} error={errors.quantidade ?? errors.ajuste} />
          <Field label="Observação" placeholder="Ex.: avaria, contagem, chegada de mercadoria" maxLength={500} value={observacao}
            onChange={(e) => setObservacao(e.target.value)} error={errors.observacao} />
        </div>
        <Button type="submit" variant="primary" className="mt-4">Salvar ajuste</Button>
      </form>

      <h4 className="mb-2 mt-6 flex items-center gap-2 font-extrabold"><Icon name="history" className="h-5 w-5" />Histórico de estoque</h4>
      {movs.loading && <Loading className="py-6" />}
      {movs.error && <ErrorState error={movs.error} onRetry={movs.reload} className="py-6" />}
      {movs.data?.movimentacoes.length === 0 && <p className="text-sm text-muted">Sem movimentações.</p>}
      <ul className="grid max-h-72 gap-2 overflow-y-auto">
        {movs.data?.movimentacoes.map((m) => (
          <li key={m.id_movimentacao} className="flex flex-wrap items-center gap-x-3 rounded-xl bg-surface p-3 text-sm">
            <span className={`w-14 font-extrabold ${m.quantidade < 0 ? 'text-accent' : 'text-green-700'}`}>{m.quantidade > 0 ? '+' : ''}{m.quantidade}</span>
            <span className="flex-1">
              <b>{TIPO_MOV[m.tipo]}</b>{m.id_pedido ? ` · pedido #${m.id_pedido}` : ''} · {m.estoque_anterior} → {m.estoque_novo}
              {m.observacao && <span className="block text-muted">{m.observacao}</span>}
            </span>
            <span className="text-xs text-muted">{formatDateTime(m.criado_em)}{m.usuario ? ` · ${m.usuario.nome}` : ''}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
