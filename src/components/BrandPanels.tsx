import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import ZoomImage from './ZoomImage';
import { brands } from '../data/brands';

// Cada painel sobe e cobre o anterior (position: sticky).
export default function BrandPanels() {
  return (
    <section className="relative z-10">
      {brands.map((p, i) => (
        <article key={p.name} style={{ zIndex: i + 1 }}
          className={`sticky top-0 grid min-h-[100svh] items-center rounded-t-[2rem] px-5 py-24 text-white ${p.bg}`}>
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <Reveal>
              <h2 className="text-5xl font-extrabold leading-none tracking-tight md:text-8xl">{p.name}</h2>
              <p className="mb-8 mt-5 max-w-sm text-lg opacity-90">{p.text}</p>
              <Link to={`/marca/${p.id}`}
                className="inline-block rounded-full bg-white px-7 py-3 font-extrabold text-brand-dark transition hover:-translate-y-0.5">
                Ver produtos
              </Link>
            </Reveal>
            <ZoomImage src={p.image} alt={p.name} className="mx-auto w-full max-w-xs" />
          </div>
        </article>
      ))}
    </section>
  );
}
