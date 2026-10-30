import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../api/client';
import { track } from '../utils/events';
import type { BannerPublico } from '../types';
import Icon from './Icon';

// Slider dos banners cadastrados no CMS (GET /cms), na ordem definida pelo gestor.
export default function BannerCarousel({ banners }: { banners: BannerPublico[] }) {
  const [index, setIndex] = useState(0);
  const total = banners.length;

  useEffect(() => {
    if (total < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 6000);
    return () => clearInterval(t);
  }, [total]);

  if (total === 0) return null;
  const go = (d: number) => setIndex((i) => (i + d + total) % total);

  return (
    <section aria-roledescription="carrossel" aria-label="Destaques" className="relative mx-auto max-w-6xl px-5 pt-6">
      <div className="relative aspect-[1920/700] overflow-hidden rounded-3xl bg-gradient-to-r from-brand-dark to-brand">
        {banners.map((b, i) => {
          const img = <img src={imageUrl(b.imagem_url)} alt={b.titulo} className="h-full w-full object-cover" />;
          const external = b.link && /^https?:\/\//.test(b.link);
          const onClick = () => track({ tipo: 'banner_clique', id_banner: b.id_banner });
          return (
            <div key={b.id_banner} aria-hidden={i !== index}
              className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
              {!b.link ? img : external ? (
                <a href={b.link} target="_blank" rel="noopener noreferrer" onClick={onClick} tabIndex={i === index ? 0 : -1}>{img}</a>
              ) : (
                <Link to={b.link} onClick={onClick} tabIndex={i === index ? 0 : -1}>{img}</Link>
              )}
            </div>
          );
        })}
        {total > 1 && (
          <>
            <button aria-label="Banner anterior" onClick={() => go(-1)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-ink shadow hover:bg-white">
              <Icon name="left" className="h-5 w-5" />
            </button>
            <button aria-label="Próximo banner" onClick={() => go(1)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-ink shadow hover:bg-white">
              <Icon name="right" className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {banners.map((b, i) => (
            <button key={b.id_banner} aria-label={`Banner ${i + 1}`} onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all ${i === index ? 'w-6 bg-brand' : 'w-2.5 bg-brand/25'}`} />
          ))}
        </div>
      )}
    </section>
  );
}
