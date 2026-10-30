import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import Icon from '../components/Icon';
import ProductGrid from '../components/ProductGrid';
import { ErrorState, Loading } from '../components/State';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useApi } from '../hooks/useApi';
import type { Filtros, Paginacao, Produto } from '../types';

const ORDENS = [
  { value: '', label: 'Padrão' },
  { value: 'relevancia', label: 'Mais relevantes' },
  { value: 'nome', label: 'Nome (A–Z)' },
  { value: 'nome_desc', label: 'Nome (Z–A)' },
  { value: 'recentes', label: 'Mais recentes' },
];

const DISPONIBILIDADES = [
  { value: '', label: 'Todos' },
  { value: 'em_estoque', label: 'Em estoque' },
  { value: 'disponivel', label: 'Disponível' },
  { value: 'ultimas_unidades', label: 'Últimas unidades' },
  { value: 'indisponivel', label: 'Indisponível' },
] as const;

const LIMITE = 24;

// Vitrine com busca, filtros, ordenação e paginação. Todo o estado fica na URL:
// dá para compartilhar o link e o botão "voltar" do navegador funciona.
export default function Catalog() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categorias } = useStore();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const busca = params.get('busca') ?? '';
  const marca = params.get('marca') ?? '';
  const disponibilidade = params.get('disponibilidade') ?? '';
  const ordenar = params.get('ordenar') ?? '';
  const pagina = Math.max(1, Number(params.get('pagina')) || 1);
  const categoria = slug ?? params.get('categoria') ?? '';
  const categoriaAtual = categorias.find((c) => c.slug === categoria);

  const query = { busca, categoria, marca, disponibilidade, ordenar };
  const lista = useApi(
    () => api.get<{ produtos: Produto[]; paginacao: Paginacao }>('/produtos', { ...query, pagina, limite: LIMITE }),
    [busca, categoria, marca, disponibilidade, ordenar, pagina, user?.id],
  );
  const filtros = useApi(() => api.get<Filtros>('/produtos/filtros', query), [busca, categoria, marca, disponibilidade]);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('pagina' in changes)) next.delete('pagina');
    setParams(next);
  };

  // Trocar de categoria muda a rota (/categoria/:slug) mantendo os outros filtros.
  const setCategoria = (s: string) => {
    const next = new URLSearchParams(params);
    next.delete('pagina');
    next.delete('categoria');
    const qs = next.toString();
    navigate(`${s ? `/categoria/${s}` : '/produtos'}${qs ? `?${qs}` : ''}`);
  };

  const toggleMarca = (s: string) => {
    const set = new Set(marca.split(',').filter(Boolean));
    if (set.has(s)) set.delete(s);
    else set.add(s);
    update({ marca: [...set].join(',') });
  };

  const goToPage = (p: number) => {
    update({ pagina: p > 1 ? String(p) : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const title = busca ? `Resultados para “${busca}”` : categoriaAtual?.nome ?? (categoria ? 'Categoria' : 'Todos os produtos');
  const total = lista.data?.paginacao.total;
  const hasFilters = !!(marca || disponibilidade || busca);

  const sidebar = (
    <div className="grid gap-6">
      <fieldset>
        <legend className="mb-2 font-extrabold">Categorias</legend>
        <ul className="grid gap-1">
          <li>
            <button onClick={() => setCategoria('')} className={`w-full rounded-lg px-3 py-1.5 text-left text-sm ${!categoria ? 'bg-brand text-white' : 'hover:bg-white'}`}>
              Todas
            </button>
          </li>
          {(filtros.data?.categorias ?? categorias.map((c) => ({ ...c, total: c.total_produtos ?? 0 }))).map((c) => (
            <li key={c.id_categoria}>
              <button onClick={() => setCategoria(c.slug)}
                className={`flex w-full justify-between rounded-lg px-3 py-1.5 text-left text-sm ${categoria === c.slug ? 'bg-brand text-white' : 'hover:bg-white'}`}>
                <span>{c.nome}</span><span className="opacity-70">{c.total}</span>
              </button>
            </li>
          ))}
        </ul>
      </fieldset>
      {filtros.data && filtros.data.marcas.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-extrabold">Marcas</legend>
          <ul className="grid gap-1">
            {filtros.data.marcas.map((m) => (
              <li key={m.id_marca}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-white">
                  <input type="checkbox" className="h-4 w-4 accent-brand" checked={marca.split(',').includes(m.slug)} onChange={() => toggleMarca(m.slug)} />
                  <span className="flex-1">{m.nome}</span><span className="text-muted">{m.total}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-2 font-extrabold">Disponibilidade</legend>
        <ul className="grid gap-1">
          {DISPONIBILIDADES.map((d) => (
            <li key={d.value}>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-white">
                <input type="radio" name="disponibilidade" className="h-4 w-4 accent-brand" checked={disponibilidade === d.value}
                  onChange={() => update({ disponibilidade: d.value })} />
                <span className="flex-1">{d.label}</span>
                {d.value && filtros.data && <span className="text-muted">{filtros.data.disponibilidade[d.value]}</span>}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  );

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <nav aria-label="Você está em" className="mb-3 text-sm text-muted">
        <Link to="/" className="hover:text-brand">Início</Link> / <Link to="/produtos" className="hover:text-brand">Produtos</Link>
        {categoriaAtual && <> / <span className="text-ink">{categoriaAtual.nome}</span></>}
      </nav>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
          {total !== undefined && <p className="text-muted">{total} {total === 1 ? 'produto encontrado' : 'produtos encontrados'}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium lg:hidden">
            <Icon name="menu" className="mr-1 inline h-4 w-4 align-text-bottom" />Filtros
          </button>
          <label className="flex items-center gap-2 text-sm text-muted">
            Ordenar por
            <select value={ordenar} onChange={(e) => update({ ordenar: e.target.value })}
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-ink">
              {ORDENS.filter((o) => o.value !== 'relevancia' || busca).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      {hasFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          {busca && <Chip label={`Busca: ${busca}`} onRemove={() => update({ busca: '' })} />}
          {marca.split(',').filter(Boolean).map((m) => (
            <Chip key={m} label={filtros.data?.marcas.find((x) => x.slug === m)?.nome ?? m} onRemove={() => toggleMarca(m)} />
          ))}
          {disponibilidade && <Chip label={DISPONIBILIDADES.find((d) => d.value === disponibilidade)?.label ?? disponibilidade} onRemove={() => update({ disponibilidade: '' })} />}
          <button onClick={() => setParams(new URLSearchParams())} className="font-extrabold text-brand hover:underline">Limpar filtros</button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} rounded-2xl bg-surface lg:block`}>{sidebar}</aside>
        <div>
          {lista.loading && <Loading />}
          {lista.error && <ErrorState error={lista.error} onRetry={lista.reload} />}
          {!lista.loading && lista.data && (
            <>
              <ProductGrid products={lista.data.produtos}
                emptyMessage={busca ? `Nenhum produto encontrado para “${busca}”. Tente outras palavras ou remova filtros.` : 'Nenhum produto com esses filtros.'} />
              {lista.data.paginacao.total_paginas > 1 && (
                <nav aria-label="Páginas" className="mt-10 flex items-center justify-center gap-2">
                  <button disabled={pagina <= 1} onClick={() => goToPage(pagina - 1)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white disabled:opacity-30" aria-label="Página anterior">
                    <Icon name="left" className="h-4 w-4" />
                  </button>
                  {Array.from({ length: lista.data.paginacao.total_paginas }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => goToPage(p)} aria-current={p === pagina ? 'page' : undefined}
                      className={`h-10 min-w-10 rounded-full px-3 font-medium ${p === pagina ? 'bg-brand text-white' : 'bg-white hover:bg-black/5'}`}>
                      {p}
                    </button>
                  ))}
                  <button disabled={pagina >= lista.data.paginacao.total_paginas} onClick={() => goToPage(pagina + 1)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white disabled:opacity-30" aria-label="Próxima página">
                    <Icon name="right" className="h-4 w-4" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 py-1 pl-3 pr-1 text-brand">
      {label}
      <button onClick={onRemove} aria-label={`Remover filtro ${label}`} className="grid h-6 w-6 place-items-center rounded-full hover:bg-brand/20">
        <Icon name="close" className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
