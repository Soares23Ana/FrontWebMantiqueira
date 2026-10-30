import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import Icon from './Icon';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

// Zoom ao passar o mouse (a imagem acompanha o cursor) e, ao clicar, abre a imagem em tela cheia.
export default function HoverZoom({ src, alt, className = '' }: Props) {
  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const move = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <>
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onMouseMove={move}
        onClick={() => setOpen(true)} role="button" tabIndex={0} aria-label={`Ampliar imagem: ${alt}`}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
        className={`relative cursor-zoom-in overflow-hidden ${className}`}>
        <img src={src} alt={alt} draggable={false}
          style={{ transformOrigin: origin, transform: hover ? 'scale(2.2)' : 'scale(1)' }}
          className="h-full max-h-[28rem] w-full select-none object-contain mix-blend-multiply transition-transform duration-200 ease-out" />
        <span className={`pointer-events-none absolute bottom-3 right-3 text-ink/60 transition-opacity ${hover ? 'opacity-0' : 'opacity-100'}`}>
          <Icon name="plus" />
        </span>
      </div>
      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-black/70 p-5">
          <button aria-label="Fechar" onClick={() => setOpen(false)}
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white text-ink">
            <Icon name="close" />
          </button>
          <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] max-w-full rounded-sm bg-white object-contain p-4" />
        </div>
      )}
    </>
  );
}
