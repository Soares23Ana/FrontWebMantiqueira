import { useRef } from 'react';
import { useElementProgress } from '../hooks/useScroll';
import ZoomImage from './ZoomImage';

const images = [
  { src: '/img/huggies.webp', alt: 'Fralda Huggies' },
  { src: '/img/granado.webp', alt: 'Sabonete Granado Bebê' },
  { src: '/img/phebo.webp', alt: 'Sabonete Phebo' },
];

export default function ZoomBanner() {
  const ref = useRef<HTMLElement>(null);
  const progress = useElementProgress(ref);
  const scale = 0.6 + Math.min(progress * 1.8, 1) * 0.4;
  return (
    <section ref={ref} className="relative z-10 overflow-hidden bg-brand-dark px-5 py-32 text-center text-white">
      <h2 style={{ transform: `scale(${scale})` }}
        className="mx-auto mb-20 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight will-change-transform md:text-7xl">
        Tudo para a sua casa e a sua saúde.
      </h2>
      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
        {images.map((i) => <ZoomImage key={i.src} src={i.src} alt={i.alt} />)}
      </div>
    </section>
  );
}
