import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, ApiError, errorMessage, fetchAllPages, imageUrl } from '../../api/client';
import Availability from '../../components/Availability';
import Button from '../../components/Button';
import Field, { SelectField, TextAreaField } from '../../components/Field';
import Icon from '../../components/Icon';
import UnderlineTabs from '../../components/manager/UnderlineTabs';
import IconButton from '../../components/manager/IconButton';
import Modal from '../../components/manager/Modal';
import Pagination from '../../components/manager/Pagination';
import SearchBox from '../../components/manager/SearchBox';
import TableCard from '../../components/manager/TableCard';
import Toggle from '../../components/manager/Toggle';
import BulkPhotosModal from './BulkPhotosModal';
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

const ABAS = ['Produtos', 'Categorias e marcas'] as const;
type Aba = (typeof ABAS)[number];

export default function Products() {
  const [tab, setTab] = useState<Aba>('Produtos');
  const tabs = <UnderlineTabs tabs={ABAS} value={tab} onChange={setTab} label="Seção" panelId="painel-produtos" />;
  if (tab === 'Produtos') return <ProductList tabs={tabs} />;
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold text-ink">Produtos</h2>
      {tabs}
      <div role="tabpanel" id="painel-produtos" aria-labelledby="aba-1"><Taxonomies /></div>
    </div>
  );
}

// Regra única de "estoque baixo", a mesma do selo do menu (back: painelControlador.js, ESTOQUE_BAIXO):
// produto ativo com estoque atual menor ou igual ao estoque mínimo.
const estoqueBaixo = (p: Produto) => !!p.ativo && p.estoque !== undefined && p.estoque_minimo !== undefined && p.estoque <= p.estoque_minimo;

type Cartao = 'semFoto';

function ProductList({ tabs }: { tabs: ReactNode }) {
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
  const [cartao, setCartao] = useState<Cartao | null>(null);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const busca = useDebounced(search.trim());
  const categorias = useApi(() => api.get<{ categorias: Categoria[] }>('/categorias', { incluir_inativos: true }), []);
  const marcas = useApi(() => api.get<{ marcas: Marca[] }>('/marcas', { incluir_inativos: true }), []);

  // "Estoque baixo" é o cartão e também o chip "Últimas unidades": os dois usam a mesma regra do selo do menu.
  const baixo = cartao === null && disp === 'Últimas unidades';
  const mostrarInativos = inativos;
  const filtros = { busca, categoria, disponibilidade: dispValue[disp], incluir_inativos: mostrarInativos || undefined, ordenar };
  // Contagem do catálogo, sem filtros: todos os cadastrados e os ativos (os que aparecem no site agora).
  const totalTodos = useApi(() => api.get<{ paginacao: Paginacao }>('/produtos', { incluir_inativos: true, pagina: 1, limite: 1 }), []);
  const totalAtivos = useApi(() => api.get<{ paginacao: Paginacao }>('/produtos', { pagina: 1, limite: 1 }), []);
  // A API não tem filtro "sem foto" nem a regra do selo de estoque baixo: esses filtros vêm da lista completa do catálogo.
  const catalogo = useApi(() => fetchAllPages<Produto>('/produtos', 'produtos', { incluir_inativos: true }), []);
  const local = cartao === 'semFoto' || baixo;
  const lista = useApi(
    () => api.get<{ produtos: Produto[]; paginacao: Paginacao }>('/produtos', { ...filtros, pagina: page, limite: pageSize }),
    [busca, categoria, disp, mostrarInativos, ordenar, page, pageSize],
    !local,
  );
  const semFoto = (catalogo.data ?? []).filter((p) => !p.imagem_url);
  const nTodos = totalTodos.data?.paginacao.total;
  const nAtivos = totalAtivos.data?.paginacao.total;
  const nInativos = nTodos !== undefined && nAtivos !== undefined ? nTodos - nAtivos : undefined;
  const nBaixo = catalogo.data ? catalogo.data.filter(estoqueBaixo).length : undefined;
  const nSemFoto = catalogo.data ? semFoto.length : undefined;

  const [editing, setEditing] = useState<Produto | 'novo' | null>(null);
  const [stockOf, setStockOf] = useState<Produto | null>(null);
  const [stockFoco, setStockFoco] = useState<'ajuste' | 'historico'>('ajuste');
  const [bulkOpen, setBulkOpen] = useState(false);

  const resetPage = () => setPage(1);
  const termo = busca.toLowerCase();
  const naBusca = (p: Produto) => !termo || [p.nome, p.sku, p.marca?.nome ?? ''].some((t) => t.toLowerCase().includes(termo));
  const naCategoria = (p: Produto) => !categoria || [p.categoria, p.subcategoria].some((c) => c && c.slug === categoria);
  const regraLocal = (p: Produto) => (cartao === 'semFoto' ? !p.imagem_url : estoqueBaixo(p));
  const ordem = (a: Produto, b: Produto) => {
    if (ordenar === 'estoque') return (a.estoque ?? 0) - (b.estoque ?? 0) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (ordenar === 'estoque_desc') return (b.estoque ?? 0) - (a.estoque ?? 0) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (ordenar === 'recentes') return b.id_produto - a.id_produto;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  };
  const filtradosLocal = local ? (catalogo.data ?? []).filter((p) => regraLocal(p) && naBusca(p) && naCategoria(p)).sort(ordem) : [];
  const linhas = local ? filtradosLocal.slice((page - 1) * pageSize, page * pageSize) : lista.data?.produtos;
  const totalLinhas = local ? filtradosLocal.length : lista.data?.paginacao.total;
  const carregando = local ? catalogo.loading && !catalogo.data : lista.loading;
  const pronto = local ? Boolean(catalogo.data) : Boolean(lista.data);
  const vazio = cartao === 'semFoto' ? 'Nenhum produto sem foto com esses filtros.'
      : baixo ? 'Nenhum produto com estoque baixo com esses filtros.' : 'Nenhum produto encontrado.';

  const clicarAlerta = (c: Cartao | 'baixo') => {
    if (c === 'baixo') { setCartao(null); setDisp(disp === 'Últimas unidades' ? 'Todos' : 'Últimas unidades'); }
    else { setCartao(cartao === c ? null : c); setDisp('Todos'); }
    resetPage();
  };

  // Lista de SKUs sem foto: a empresa nomeia cada arquivo do ZIP com o SKU (ex.: 110606.jpg).
  const baixarSemFoto = () => downloadCsv('produtos-sem-foto.csv', ['SKU', 'Produto', 'Marca', 'Nome do arquivo sugerido', 'Ativo'],
    semFoto.map((p) => [p.sku, p.nome, p.marca?.nome ?? '', `${p.sku}.jpg`, p.ativo ? 'Sim' : 'Não']));
  const changed = () => {
    lista.reload();
    catalogo.reload();
    totalTodos.reload();
    totalAtivos.reload();
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
      const todos = local ? filtradosLocal : await fetchAllPages<Produto>('/produtos', 'produtos', filtros);
      downloadCsv('produtos.csv', ['SKU', 'Produto', 'Categoria', 'Marca', 'Estoque', 'Estoque mínimo', 'Múltiplo de venda', 'Ativo'],
        todos.map((p) => [p.sku, p.nome, [p.categoria?.nome, p.subcategoria?.nome].filter(Boolean).join(' / '), p.marca?.nome ?? '', p.estoque ?? '', p.estoque_minimo ?? '', p.multiplo_venda, p.ativo ? 'Sim' : 'Não']));
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';
  const campo = `rounded-full border border-black/10 bg-white px-3 py-2.5 text-sm ${foco}`;
  const chipAlerta = (ativo: boolean) => `inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${foco} ${ativo ? 'bg-brand/10 text-brand ring-brand' : 'bg-white text-ink ring-black/10 hover:bg-black/5'}`;
  const secundario = `inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-ink/80 transition hover:bg-black/5 ${foco}`;
  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-ink">Produtos</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={secundario} onClick={exportCsv}><Icon name="download" className="h-4 w-4" />Exportar</button>
            <button type="button" className={secundario} onClick={() => setBulkOpen(true)}><Icon name="upload" className="h-4 w-4" />Fotos em lote</button>
            <Button variant="accent" className={foco} onClick={() => setEditing('novo')}><Icon name="plus" className="mr-1 inline h-5 w-5 align-text-bottom" />Novo produto</Button>
          </div>
        </div>

        {tabs}

        <div role="tabpanel" id="painel-produtos" aria-labelledby="aba-0" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <SearchBox value={search} onChange={(v) => { setSearch(v); resetPage(); }} placeholder="Buscar por nome, SKU, marca..." />
            <button type="button" aria-expanded={filtrosAbertos} onClick={() => setFiltrosAbertos((v) => !v)} className={`${campo} sm:hidden`}>Filtros</button>
            <label className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm sm:order-last">
              <Toggle checked={inativos} label="Mostrar inativos" onChange={(v) => { setInativos(v); resetPage(); }} />
              Mostrar inativos
            </label>
            <div className={filtrosAbertos ? 'grid w-full grid-cols-2 gap-2 sm:contents' : 'hidden sm:contents'}>
              <select value={categoria} onChange={(e) => { setCategoria(e.target.value); resetPage(); }} aria-label="Categoria" className={`${campo} shrink-0`}>
                <option value="">Todas as categorias</option>
                {categorias.data?.categorias.map((c) => <option key={c.id_categoria} value={c.slug}>{c.nome}</option>)}
              </select>
              <select value={cartao === null ? disp : 'Todos'} onChange={(e) => { setCartao(null); setDisp(e.target.value as (typeof dispOptions)[number]); resetPage(); }} aria-label="Estoque" className={`${campo} shrink-0`}>
                {dispOptions.map((o) => <option key={o} value={o}>{o === 'Todos' ? 'Todos os estoques' : o}</option>)}
              </select>
              <select value={ordenar} onChange={(e) => setOrdenar(e.target.value)} aria-label="Ordenar" className={`${campo} col-span-2 shrink-0 sm:col-span-1`}>
                <option value="nome">Nome (A–Z)</option>
                <option value="estoque">Menor estoque</option>
                <option value="estoque_desc">Maior estoque</option>
                <option value="recentes">Mais recentes</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {(!!nBaixo || baixo) && (
                <button type="button" aria-pressed={baixo} onClick={() => clicarAlerta('baixo')} className={chipAlerta(baixo)}>
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-500" />Repor estoque <b>{nBaixo ?? 0}</b>
                </button>
              )}
              {baixo && <span className="text-xs text-muted">Mostrando produtos com estoque no mínimo ou abaixo</span>}
              {!!nSemFoto && (
                <>
                  <button type="button" aria-pressed={cartao === 'semFoto'} onClick={() => clicarAlerta('semFoto')} className={chipAlerta(cartao === 'semFoto')}>
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-red-600" />Sem foto <b>{nSemFoto}</b>
                  </button>
                  <button type="button" onClick={baixarSemFoto} className={`text-xs font-medium text-blue-700 underline hover:text-blue-900 ${foco}`}>Baixar lista de SKUs</button>
                </>
              )}
              {cartao === 'semFoto' && <span className="text-xs text-muted">Mostrando produtos sem imagem</span>}
            </div>
            {totalLinhas !== undefined && nTodos !== undefined && (
              <p role="status" className="text-xs text-muted">
                {totalLinhas} de {nTodos} produtos{!!nInativos && ` · ${nInativos} ${nInativos === 1 ? 'inativo' : 'inativos'}`}
              </p>
            )}
          </div>

      {lista.error ? <ErrorState error={lista.error} onRetry={lista.reload} /> : (
        <TableCard headers={['Produto', 'SKU', 'Categoria / marca', 'Estoque', 'Ações', 'Ativo']}
          isEmpty={!carregando && linhas?.length === 0} empty={vazio}
          footer={pronto && totalLinhas !== undefined && <Pagination page={page} pageSize={pageSize} total={totalLinhas} onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); resetPage(); }} />}>
          {carregando && <tr><td colSpan={6}><Loading className="py-8" /></td></tr>}
          {!carregando && linhas?.map((p) => (
            <tr key={p.id_produto} className={`transition hover:bg-surface/60 ${p.ativo ? '' : 'opacity-60'}`}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <img src={imageUrl(p.imagem_url)} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-surface object-contain foto-produto" />
                  <span className="max-w-64 font-medium">{p.nome}</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 text-sm text-muted">{p.sku}</td>
              <td className="px-4 text-sm">{p.categoria?.nome ?? '—'}{p.subcategoria ? ` / ${p.subcategoria.nome}` : ''}<span className="block text-muted">{p.marca?.nome ?? '—'}</span></td>
              <td className="px-4 text-sm">
                <p className="font-extrabold">{p.estoque} <span className="font-normal text-muted">/ mín. {p.estoque_minimo}</span></p>
                <Availability value={p.disponibilidade} />
                {p.multiplo_venda > 1 && <p className="text-xs text-muted">Múltiplo {p.multiplo_venda}</p>}
              </td>
              <td className="px-4">
                <div className="flex">
                  <IconButton icon="edit" label={`Editar ${p.nome}`} title="Editar produto" onClick={() => setEditing(p)} />
                  <IconButton icon="box" label={`Ajustar estoque de ${p.nome}`} title="Ajustar estoque" onClick={() => { setStockFoco('ajuste'); setStockOf(p); }} />
                  <IconButton icon="history" label={`Ver histórico de estoque de ${p.nome}`} title="Histórico de estoque" onClick={() => { setStockFoco('historico'); setStockOf(p); }} />
                </div>
              </td>
              <td className="px-4"><Toggle checked={!!p.ativo} label={`Ativar ${p.nome}`} onChange={(v) => toggleActive(p, v)} /></td>
            </tr>
          ))}
        </TableCard>
      )}
        </div>
      </div>

      {editing && (
        <ProductFormModal product={editing === 'novo' ? null : editing} categorias={categorias.data?.categorias ?? []} marcas={marcas.data?.marcas ?? []}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); changed(); }} />
      )}
      {bulkOpen && <BulkPhotosModal onClose={() => setBulkOpen(false)} onDone={changed} />}
      {stockOf && <StockModal product={stockOf} foco={stockFoco} onClose={() => setStockOf(null)} onSaved={changed} />}
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
  const [link, setLink] = useState('');
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
    setErrors({ ...errors, imagem: '', imagem_link: '' });
    setFile(f);
    setLink(''); // vale só um: o arquivo ou o link
    setPreview(URL.createObjectURL(f));
  };

  const onLink = (e: ChangeEvent<HTMLInputElement>) => {
    setLink(e.target.value);
    setErrors({ ...errors, imagem_link: '' });
    if (e.target.value && file) { setFile(null); setPreview(imageUrl(product?.imagem_url)); }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const linkLimpo = link.trim();
    if (linkLimpo && !/^https?:\/\//i.test(linkLimpo)) {
      setErrors({ imagem_link: 'O endereço deve começar com http:// ou https://.' });
      return;
    }
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
    let id = product?.id_produto;
    try {
      if (product) {
        await api.patch(`/produtos/${id}`, body);
      } else {
        const r = await api.post<{ id_produto: number }>('/produtos', { ...body, quantidade_estoque: Number(form.quantidade_estoque) || 0 });
        id = r.id_produto;
      }
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
      setSaving(false);
      return;
    }
    // O produto já foi gravado. Se a foto falhar num produto NOVO, não dá para deixar o modal aberto:
    // um segundo "Salvar" tentaria criar o produto de novo e daria erro de SKU duplicado.
    try {
      if (file && id) {
        const fd = new FormData();
        fd.append('imagem', file);
        await api.post(`/produtos/${id}/imagem`, fd);
      } else if (linkLimpo && id) {
        await api.post(`/produtos/${id}/imagem/link`, { url: linkLimpo });
      }
      toast(product ? 'Produto atualizado.' : 'Produto cadastrado.');
      onSaved();
    } catch (err) {
      if (!product) {
        toast(`Produto cadastrado, mas a imagem não foi enviada: ${errorMessage(err)} Você pode tentar de novo editando o produto.`, 'error');
        onSaved();
      } else {
        setErrors({ imagem_link: linkLimpo ? errorMessage(err) : '', imagem: linkLimpo ? '' : errorMessage(err) });
        setFormError('Os dados foram salvos, mas a imagem não foi enviada.');
      }
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
            <img src={preview} alt="" className="foto-produto h-36 w-full rounded-xl bg-surface object-contain p-2" />
            <label className="mt-2 block cursor-pointer rounded-full bg-surface px-3 py-2 text-center text-sm font-medium hover:bg-black/10">
              Trocar imagem
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={onFile} />
            </label>
            {errors.imagem && <small className="block text-accent">{errors.imagem}</small>}
          </div>
          <div>
            {/* Largura total da coluna dos campos: o link da imagem costuma ser comprido. */}
            <Field label="Ou cole o link da imagem" mandatory={false} type="url" inputMode="url" maxLength={2048} placeholder="https://exemplo.com/foto.jpg"
              value={link} onChange={onLink} error={errors.imagem_link} />
            <small className="block text-muted">Endereço que comece com http:// ou https://. Vale só um: o arquivo ou o link.</small>
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

const MODOS = ['Somar / subtrair', 'Definir valor'] as const;
// Mesma altura (h-11), borda, raio e padding nos dois campos do ajuste de estoque.
const CAMPO_ESTOQUE = 'campo h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-ink outline-none focus:border-brand';

function StockModal({ product, foco, onClose, onSaved }: { product: Produto; foco: 'ajuste' | 'historico'; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [estoque, setEstoque] = useState(product.estoque ?? 0);
  const [modo, setModo] = useState<(typeof MODOS)[number]>(MODOS[0]);
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

  const ultima = movs.data?.movimentacoes[0];

  // Textos de apoio do formulário e resultado previsto (só conta, sem chamada à API).
  const erroValor = errors.quantidade ?? errors.ajuste;
  const ajudaValor = modo === 'Definir valor' ? 'Informe a quantidade total que existe agora.' : 'Use -2 para tirar 2 unidades ou 24 para somar 24.';
  const numero = Number(valor);
  const valido = valor.trim() !== '' && Number.isInteger(numero) && (modo === 'Definir valor' || numero !== 0);
  const resultado = modo === 'Definir valor' ? numero : estoque + numero;
  const previsto = valido ? { valor: resultado, negativo: resultado < 0 } : null;

  const ajuste = (
    <form onSubmit={submit} noValidate className="mt-4 rounded-2xl border border-black/10 p-4">
      <h4 className="mb-2 font-extrabold">Ajustar estoque</h4>
      <FormError message={formError} />
      <div role="group" aria-label="Tipo de ajuste" className="inline-flex h-11 overflow-hidden rounded-full border border-black/10 bg-white">
        {MODOS.map((m) => (
          <button key={m} type="button" aria-pressed={modo === m} onClick={() => setModo(m)}
            className={`h-full px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand ${m !== MODOS[0] ? 'border-l border-black/10' : ''} ${modo === m ? 'bg-brand text-white' : 'text-ink hover:bg-black/5'}`}>
            {m}
          </button>
        ))}
      </div>
      <div className="mt-4 grid items-start gap-x-4 gap-y-4 sm:grid-cols-[170px_minmax(0,1fr)]">
        <div>
          <label htmlFor="estoque-valor" className="mb-1 block whitespace-nowrap text-sm text-muted">{modo === 'Definir valor' ? 'Novo valor' : 'Ajuste'} <b className="text-accent">*</b></label>
          <input id="estoque-valor" type="number" value={valor} onChange={(e) => setValor(e.target.value)} aria-invalid={!!erroValor}
            aria-describedby="estoque-valor-ajuda" className={CAMPO_ESTOQUE} />
          <div id="estoque-valor-ajuda" className="mt-1 min-h-10 text-xs leading-5">
            {erroValor ? <p role="alert" className="text-accent">{erroValor}</p> : <p className="text-muted">{ajudaValor}</p>}
            {previsto && (previsto.negativo
              ? <p className="text-amber-700">O resultado ficaria negativo.</p>
              : <p className="text-muted">Ficará com {previsto.valor} {previsto.valor === 1 ? 'unidade' : 'unidades'}</p>)}
          </div>
        </div>
        <div>
          <label htmlFor="estoque-obs" className="mb-1 block whitespace-nowrap text-sm text-muted">Observação <b className="text-accent">*</b></label>
          <input id="estoque-obs" type="text" placeholder="Ex.: avaria, contagem, chegada de mercadoria" maxLength={500} value={observacao}
            onChange={(e) => setObservacao(e.target.value)} aria-invalid={!!errors.observacao} aria-describedby="estoque-obs-ajuda" className={CAMPO_ESTOQUE} />
          <div id="estoque-obs-ajuda" className="mt-1 min-h-10 text-xs leading-5">
            {errors.observacao ? <p role="alert" className="text-accent">{errors.observacao}</p> : <p className="text-muted">Obrigatória, de 3 a 500 caracteres.</p>}
          </div>
        </div>
      </div>
      <div className="mt-4 flex sm:justify-end">
        <Button type="submit" variant="primary" className="h-11 w-full py-0 sm:w-auto">Salvar ajuste</Button>
      </div>
    </form>
  );

  const historico = (
    <section className="mt-4" aria-label="Histórico de estoque">
      <h4 className="mb-1 flex items-center gap-2 text-lg font-extrabold"><Icon name="history" className="h-5 w-5" />Histórico de estoque</h4>
      {ultima && (
        <p className="mb-3 rounded-xl bg-brand/10 p-3 text-sm text-brand">
          Última alteração: <b>{formatDateTime(ultima.criado_em)}</b>{ultima.usuario ? <> por <b>{ultima.usuario.nome}</b></> : ' (automática)'} · {TIPO_MOV[ultima.tipo]}
        </p>
      )}
      {movs.loading && <Loading className="py-6" />}
      {movs.error && <ErrorState error={movs.error} onRetry={movs.reload} className="py-6" />}
      {movs.data?.movimentacoes.length === 0 && <p className="text-sm text-muted">Sem movimentações.</p>}
      <ul className="grid max-h-96 gap-2 overflow-y-auto">
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
    </section>
  );

  return (
    <Modal title={foco === 'historico' ? 'Histórico de estoque' : 'Estoque'} onClose={onClose} wide>
      <p className="font-medium">{product.nome}</p>
      <p className="text-sm text-muted">SKU {product.sku} · mínimo {product.estoque_minimo}</p>
      <p className="my-4 text-4xl font-extrabold text-brand">{estoque} <span className="text-base font-medium text-muted">unidades</span></p>
      {foco === 'historico' ? <>{historico}{ajuste}</> : <>{ajuste}{historico}</>}
    </Modal>
  );
}
