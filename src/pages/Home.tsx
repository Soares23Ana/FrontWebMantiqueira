import { Link } from 'react-router-dom';
import { api } from '../api/client';
import BannerCarousel from '../components/BannerCarousel';
import Benefits from '../components/Benefits';
import BrandPanels from '../components/BrandPanels';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';
import Reveal from '../components/Reveal';
import { ErrorState, Loading } from '../components/State';
import ZoomBanner from '../components/ZoomBanner';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useApi } from '../hooks/useApi';
import { formatDate } from '../utils/format';
import { track } from '../utils/events';
import type { BannerPublico, Paginacao, Produto } from '../types';

// A abertura (Hero) fica sempre no topo. Logo abaixo, o conteúdo vem do CMS: banners, campanhas ativas e aviso do topo.
export default function Home() {
  const { user } = useAuth();
  const { categorias, campanhas } = useStore();
  const banners = useApi(() => api.get<{ banners: BannerPublico[] }>('/cms'), []);
  const destaques = useApi(
    () => api.get<{ produtos: Produto[]; paginacao: Paginacao }>('/produtos', { disponibilidade: 'em_estoque', ordenar: 'recentes', limite: 8 }),
    [user?.id],
  );
  const hasBanners = (banners.data?.banners.length ?? 0) > 0;

  return (
    <>
      <Hero />
      {/* Esta seção sobe e cobre o Hero (efeito "uma seção engole a outra"); os banners do CMS abrem a seção. */}
      <div className="relative z-10 -mt-10 rounded-t-[2.5rem] bg-surface pt-4">
        {hasBanners && <BannerCarousel banners={banners.data!.banners} />}
        {campanhas.map((c) => (
          <section key={c.id_campanha} className="mx-auto max-w-6xl px-5 pt-16">
            <Reveal>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  {c.selo && <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">{c.selo}</span>}
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">{c.titulo}</h2>
                  <p className="text-muted">Até {formatDate(c.fim_em)}</p>
                </div>
              </div>
            </Reveal>
            <div onClickCapture={() => track({ tipo: 'campanha_clique', id_campanha: c.id_campanha })}>
              <ProductGrid products={c.produtos.slice(0, 8)} emptyMessage="" />
            </div>
          </section>
        ))}

        <section id="produtos" className="mx-auto max-w-6xl scroll-mt-32 px-5 py-20">
          <Reveal>
            <h2 className="mb-2 text-3xl font-extrabold tracking-tight md:text-5xl">Destaques</h2>
            <p className="mb-8 text-muted">Escolha uma categoria ou adicione ao carrinho.</p>
          </Reveal>
          <div className="mb-8 flex flex-wrap gap-2">
            <Link to="/produtos" className="rounded-full border border-brand bg-brand px-5 py-2 font-medium text-white">Todos</Link>
            {categorias.map((c) => (
              <Link key={c.id_categoria} to={`/categoria/${c.slug}`}
                className="rounded-full border border-black/10 bg-white px-5 py-2 font-medium transition hover:border-brand">
                {c.nome}
              </Link>
            ))}
          </div>
          {destaques.loading && <Loading />}
          {destaques.error && <ErrorState error={destaques.error} onRetry={destaques.reload} />}
          {destaques.data && <ProductGrid products={destaques.data.produtos} emptyMessage="Nenhum produto disponível no momento." />}
          {destaques.data && destaques.data.paginacao.total > destaques.data.produtos.length && (
            <div className="mt-10 text-center">
              <Link to="/produtos" className="inline-block rounded-full bg-brand px-8 py-3 font-extrabold text-white hover:bg-brand-dark">
                Ver todos os {destaques.data.paginacao.total} produtos
              </Link>
            </div>
          )}
        </section>
      </div>
      <ZoomBanner />
      <BrandPanels />
      <Benefits />
    </>
  );
}
