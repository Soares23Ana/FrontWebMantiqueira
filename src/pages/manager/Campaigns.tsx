import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, ApiError, errorMessage, imageUrl } from '../../api/client';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Icon from '../../components/Icon';
import ChipFilter from '../../components/manager/ChipFilter';
import IconButton from '../../components/manager/IconButton';
import Modal from '../../components/manager/Modal';
import SectionHeader from '../../components/manager/SectionHeader';
import { ErrorState, FormError, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi, useDebounced } from '../../hooks/useApi';
import { formatDateTime, toLocalInput } from '../../utils/format';
import type { Campanha, Paginacao, Produto, SituacaoCampanha } from '../../types';

const options = ['Todas', 'Ativa', 'Agendada', 'Encerrada'] as const;
const situacaoValue: Record<(typeof options)[number], string> = { Todas: '', Ativa: 'ativa', Agendada: 'agendada', Encerrada: 'encerrada' };
const SITUACAO: Record<SituacaoCampanha, string> = {
  ativa: 'bg-green-100 text-green-800',
  agendada: 'bg-brand/10 text-brand',
  encerrada: 'bg-black/10 text-muted',
};

// Campanhas: título, selo de texto (sem desconto), período e produtos. O selo aparece nos cards da loja.
export default function Campaigns() {
  const toast = useToast();
  const [filtro, setFiltro] = useState<(typeof options)[number]>('Todas');
  const { data, loading, error, reload } = useApi(() => api.get<{ campanhas: Campanha[] }>('/campanhas', { situacao: situacaoValue[filtro] }), [filtro]);
  const [editing, setEditing] = useState<Campanha | 'nova' | null>(null);

  const remove = async (c: Campanha) => {
    if (!confirm(`Excluir a campanha “${c.titulo}”? Os produtos não são afetados.`)) return;
    try {
      await api.del(`/campanhas/${c.id_campanha}`);
      toast('Campanha excluída.');
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const endNow = async (c: Campanha) => {
    try {
      await api.patch(`/campanhas/${c.id_campanha}`, { fim_em: new Date().toISOString() });
      toast('Campanha encerrada.');
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <>
      <SectionHeader title="Campanhas" subtitle="Selos de texto (ex.: “Leve 8 pague 6”) com período e produtos. Não aplicam desconto.">
        <Button variant="accent" onClick={() => setEditing('nova')}><Icon name="plus" className="mr-1 inline h-5 w-5 align-text-bottom" />Nova campanha</Button>
      </SectionHeader>
      <div className="mb-4"><ChipFilter label="Situação" options={options} value={filtro} onChange={setFiltro} /></div>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data?.campanhas.length === 0 && <p className="rounded-2xl bg-white py-12 text-center text-muted">Nenhuma campanha.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.campanhas.map((c) => (
          <article key={c.id_campanha} className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${SITUACAO[c.situacao]}`}>{c.situacao}</span>
                <h3 className="mt-2 text-lg font-extrabold">{c.titulo}</h3>
                {c.selo && <span className="mt-1 inline-block rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-white">{c.selo}</span>}
                <p className="mt-2 text-sm text-muted">{formatDateTime(c.inicio_em)} até {formatDateTime(c.fim_em)}</p>
              </div>
              <IconButton icon="edit" label="Editar" onClick={() => setEditing(c)} />
              <IconButton icon="trash" label="Excluir" danger onClick={() => remove(c)} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {c.produtos.slice(0, 10).map((p) => (
                <img key={p.id_produto} src={imageUrl(p.imagem_url)} alt={p.nome} title={p.nome}
                  className={`h-10 w-10 rounded-lg bg-surface object-contain ${p.ativo ? '' : 'opacity-40'}`} />
              ))}
              {c.total_produtos > 10 && <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface text-xs">+{c.total_produtos - 10}</span>}
            </div>
            <p className="mt-2 text-xs text-muted">{c.total_produtos} produto(s)</p>
            {c.situacao === 'ativa' && <button onClick={() => endNow(c)} className="mt-2 text-sm font-extrabold text-accent">Encerrar agora</button>}
          </article>
        ))}
      </div>
      {editing && <CampaignModal campanha={editing === 'nova' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}

type Pick = { id_produto: number; nome: string; imagem_url: string | null };

function CampaignModal({ campanha, onClose, onSaved }: { campanha: Campanha | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [titulo, setTitulo] = useState(campanha?.titulo ?? '');
  const [selo, setSelo] = useState(campanha?.selo ?? '');
  const [inicio, setInicio] = useState(toLocalInput(campanha?.inicio_em));
  const [fim, setFim] = useState(toLocalInput(campanha?.fim_em));
  const [produtos, setProdutos] = useState<Pick[]>(campanha?.produtos.map(({ id_produto, nome, imagem_url }) => ({ id_produto, nome, imagem_url })) ?? []);
  const [search, setSearch] = useState('');
  const busca = useDebounced(search.trim());
  const resultados = useApi(
    () => api.get<{ produtos: Produto[]; paginacao: Paginacao }>('/produtos', { busca, limite: 8 }),
    [busca],
    busca.length >= 2,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const toggle = (p: Pick) =>
    setProdutos((prev) => (prev.some((x) => x.id_produto === p.id_produto) ? prev.filter((x) => x.id_produto !== p.id_produto) : [...prev, p]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError('');
    const body = { titulo: titulo.trim(), selo: selo.trim() || null, inicio_em: inicio, fim_em: fim, produtos: produtos.map((p) => p.id_produto) };
    try {
      if (campanha) await api.patch(`/campanhas/${campanha.id_campanha}`, body);
      else await api.post('/campanhas', body);
      toast('Campanha salva.');
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    }
  };

  return (
    <Modal title={campanha ? 'Editar campanha' : 'Nova campanha'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate>
        <FormError message={formError} />
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Field label="Título" value={titulo} maxLength={120} onChange={(e) => setTitulo(e.target.value)} error={errors.titulo} />
          <Field label={`Selo (${selo.length}/40)`} mandatory={false} maxLength={40} placeholder="Leve 8 pague 6" value={selo}
            onChange={(e) => setSelo(e.target.value)} error={errors.selo} />
          <Field label="Início (Brasília)" type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} error={errors.inicio_em} />
          <Field label="Fim (Brasília)" type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} error={errors.fim_em} />
        </div>

        <h4 className="mb-2 mt-5 font-extrabold">Produtos ({produtos.length})</h4>
        {errors.produtos && <small className="text-accent">{errors.produtos}</small>}
        <div className="mb-3 flex flex-wrap gap-2">
          {produtos.map((p) => (
            <span key={p.id_produto} className="inline-flex items-center gap-2 rounded-full bg-brand/10 py-1 pl-1 pr-2 text-sm text-brand">
              <img src={imageUrl(p.imagem_url)} alt="" className="h-6 w-6 rounded-full bg-white object-contain" />
              <span className="max-w-48 truncate">{p.nome}</span>
              <button type="button" onClick={() => toggle(p)} aria-label={`Remover ${p.nome}`}><Icon name="close" className="h-4 w-4" /></button>
            </span>
          ))}
        </div>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto para adicionar (nome ou SKU)"
          className="w-full rounded-full border border-black/10 px-4 py-2.5 outline-none focus:border-brand" />
        {resultados.loading && busca.length >= 2 && <Loading className="py-4" />}
        {resultados.data && busca.length >= 2 && (
          <ul className="mt-2 grid max-h-56 gap-1 overflow-y-auto">
            {resultados.data.produtos.map((p) => {
              const on = produtos.some((x) => x.id_produto === p.id_produto);
              return (
                <li key={p.id_produto}>
                  <button type="button" onClick={() => toggle(p)} className={`flex w-full items-center gap-3 rounded-xl p-2 text-left text-sm ${on ? 'bg-brand/10' : 'hover:bg-surface'}`}>
                    <img src={imageUrl(p.imagem_url)} alt="" className="h-9 w-9 rounded-lg object-contain" />
                    <span className="flex-1">{p.nome}<span className="block text-xs text-muted">{p.sku}</span></span>
                    <Icon name={on ? 'check' : 'plus'} className="h-5 w-5 text-brand" />
                  </button>
                </li>
              );
            })}
            {resultados.data.produtos.length === 0 && <li className="p-2 text-sm text-muted">Nenhum produto encontrado.</li>}
          </ul>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
