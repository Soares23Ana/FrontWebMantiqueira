import { useScrollY } from '../hooks/useScroll';
import Reveal from './Reveal';

interface Floating {
  src: string;
  position: string;
  speed: number;
  rotate: number;
}

const floating: Floating[] = [
  { src: '/img/paixao.webp', position: 'right-[5%] top-[12%] w-56 lg:w-80', speed: 0.25, rotate: -6 },
  { src: '/img/huggies.webp', position: 'right-[27%] top-[50%] w-44 lg:w-64', speed: 0.5, rotate: 5 },
  { src: '/img/phebo.webp', position: 'right-[3%] bottom-[5%] w-48 lg:w-72', speed: 0.12, rotate: 8 },
];

export default function Hero() {
  const y = useScrollY();
  return (
    <section className="sticky top-0 h-[100svh] min-h-[600px] overflow-hidden bg-gradient-to-br from-brand to-brand-dark text-white">
      <div style={{ transform: `translateY(${y * 0.1}px)` }}
        className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-3xl" />
      {floating.map((f) => (
        <img key={f.src} src={f.src} alt=""
          style={{ transform: `translateY(${y * f.speed}px) rotate(${f.rotate}deg)` }}
          className={`absolute hidden rounded-3xl bg-white p-3 shadow-2xl will-change-transform md:block ${f.position}`} />
      ))}
      <div className="mx-auto flex h-full max-w-6xl items-center px-5 pt-24">
        <div style={{ transform: `translateY(${y * -0.15}px)`, opacity: Math.max(0, 1 - y / 600) }} className="relative z-10 max-w-2xl">
          <Reveal>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
              Higiene, farmácia e bebê num só pedido.
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-6 max-w-xl text-lg opacity-90">
              Mais de 2.000 itens em estoque. Frete grátis para todo o estado de São Paulo em pedidos a partir de R$ 265,00.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <a href="#produtos" onClick={(e) => { e.preventDefault(); document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-8 inline-block rounded-full bg-accent px-8 py-4 font-extrabold transition hover:-translate-y-0.5 hover:brightness-110">
              Ver ofertas
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
