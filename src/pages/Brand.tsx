import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import BrandShowcase from '../components/BrandShowcase';
import ProductGrid from '../components/ProductGrid';
import Reveal from '../components/Reveal';
import { ErrorState, Loading } from '../components/State';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { brands } from '../data/brands';
import { useApi } from '../hooks/useApi';
import type { Paginacao, Produto } from '../types';
import NotFound from './NotFound';

// Página de marca em estilo editorial: muito branco, tipografia leve, painéis suaves.
// O texto editorial fica no front (data/brands.ts); os produtos vêm da API pelo slug da marca.
export default function Brand() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { marcas } = useStore();
  const lista = useApi(
    () => api.get<{ produtos: Produto[]; paginacao: Paginacao }>('/produtos', { marca: slug, limite: 100 }),
    [slug, user?.id],
  );

  const editorial = brands.find((b) => b.id === slug);
  const apiBrand = marcas.find((m) => m.slug === slug);
  const name = editorial?.name ?? apiBrand?.nome ?? lista.data?.produtos[0]?.marca?.nome;
  const items = lista.data?.produtos ?? [];

  if (lista.error?.codigo === 'FILTRO_INVALIDO' || (!lista.loading && !name && marcas.length > 0)) {
    return <NotFound title="Marca não encontrada" text="Confira o endereço ou veja todas as marcas na página inicial." />;
  }

  const color = editorial?.color ?? '#3b3b98';
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-6xl px-5 pb-10 pt-10">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="text-xs font-medium uppercase tracking-widest underline underline-offset-4">← Voltar</button>
        <Reveal>
          <p className="mt-16 text-xs font-medium uppercase tracking-[0.3em] text-muted">Marca</p>
          <h1 className="mt-3 text-6xl font-light uppercase leading-none tracking-tight md:text-9xl" style={{ color }}>{name ?? '...'}</h1>
        </Reveal>
      </section>

      {editorial && (
        <section className="mx-auto max-w-6xl px-5 py-12">
          <Reveal>
            <p className="max-w-4xl text-2xl font-light uppercase leading-snug tracking-wide md:text-4xl" style={{ color, opacity: 0.8 }}>
              {editorial.about ?? editorial.text}
            </p>
          </Reveal>
          {editorial.facts && (
            <Reveal delay={150}>
              <dl className="mt-14 grid grid-cols-3 border-y border-black/10">
                {editorial.facts.map((f, n) => (
                  <div key={f.label} className={`py-8 text-center ${n > 0 ? 'border-l border-black/10' : ''}`}>
                    <dt className="text-2xl font-light md:text-5xl" style={{ color }}>{f.value}</dt>
                    <dd className="mt-2 text-[0.65rem] font-medium uppercase tracking-widest text-muted md:text-xs">{f.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
          {editorial.lines && (
            <Reveal delay={150}>
              <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
                {editorial.lines.map((l) => (
                  <div key={l.title} className="border-t border-black/10 pt-4">
                    <h3 className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color }}>{l.title}</h3>
                    <p className="mt-2 font-light leading-relaxed">{l.text}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </section>
      )}

      {lista.loading && <Loading />}
      {lista.error && <ErrorState error={lista.error} onRetry={lista.reload} />}
      {lista.data && (
        <>
          <section className="mx-auto max-w-6xl px-5 py-12">
            <Reveal>
              <BrandShowcase products={items.filter((p) => p.destaques && p.destaques.length > 0).concat(items.filter((p) => !p.destaques?.length)).slice(0, 8)} color={color} />
            </Reveal>
          </section>
          <section className="mx-auto max-w-6xl px-5 py-16">
            <div className="mb-10 flex justify-center">
              <Link to={`/produtos?marca=${slug}`} className="border border-ink px-8 py-3 text-xs font-medium uppercase tracking-widest hover:bg-ink hover:text-white">
                Todos os produtos ({lista.data.paginacao.total})
              </Link>
            </div>
            <ProductGrid products={items} emptyMessage="Nenhum produto desta marca no momento." />
          </section>
        </>
      )}

      {name && (
        <section className="overflow-hidden border-t border-black/10 px-5 py-20">
          <p className="mx-auto max-w-6xl text-6xl font-extrabold uppercase leading-none tracking-tighter md:text-[9rem]" style={{ color }}>
            {name}
          </p>
        </section>
      )}
    </div>
  );
}
