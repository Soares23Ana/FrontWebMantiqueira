import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import TextRoll from './TextRoll';
import ZoomImage from './ZoomImage';
import { brands } from '../data/brands';

// No modo noturno, cada cor de painel (azul escuro, azul ou vermelho) vira um gradiente com um brilho atrás da foto; ver "painel-*" no index.css.
const TONS: Record<string, string> = { 'bg-brand-dark': 'painel-azul-escuro', 'bg-brand': 'painel-azul', 'bg-accent': 'painel-vermelho' };

// Cada painel sobe e cobre o anterior (position: sticky).
export default function BrandPanels() {
  // O fundo é o mesmo azul da faixa de cima (ZoomBanner): assim os cantos arredondados do primeiro painel encaixam sem mostrar outra cor.
  return (
    <section className="relative z-10 bg-brand-dark">
      {brands.map((p, i) => (
        <article key={p.name} style={{ zIndex: i + 1 }}
          className={`sticky top-0 grid min-h-[100svh] items-center rounded-t-[2rem] px-5 py-24 text-white ${p.bg} ${TONS[p.bg] ?? ''}`}>
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <Reveal>
              <h2 className="group/roll cursor-default text-5xl font-extrabold leading-none tracking-tight md:text-8xl"><TextRoll>{p.name}</TextRoll></h2>
              <p className="mb-8 mt-5 max-w-sm text-lg opacity-90">{p.text}</p>
              <Link to={`/marca/${p.id}`}
                className="inline-block rounded-full bg-white px-7 py-3 font-extrabold text-[#2b3990] transition hover:-translate-y-0.5 dark:text-white">
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
