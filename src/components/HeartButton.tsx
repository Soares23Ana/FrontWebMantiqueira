import { useState } from 'react';
import type { CSSProperties } from 'react';
import Icon from './Icon';

interface Props {
  active: boolean;
  onToggle: () => void;
  /** Precisa conter o posicionamento (ex.: "absolute right-3 top-3" ou "relative"). */
  className?: string;
}

const particles = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { dx: Math.cos(angle) * 26, dy: Math.sin(angle) * 26 };
});

// Botão de favorito: ao favoritar, o coração "pula" e solta um anel e pequenas faíscas.
export default function HeartButton({ active, onToggle, className = '' }: Props) {
  const [burst, setBurst] = useState(0);

  const click = () => {
    if (!active) setBurst((n) => n + 1);
    onToggle();
  };

  return (
    <button onClick={click} aria-pressed={active}
      aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={`grid place-items-center transition active:scale-90 ${active ? 'text-accent' : 'text-ink'} ${className}`}>
      {burst > 0 && active && (
        <span key={burst} aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="heart-ring absolute h-8 w-8 rounded-full border-2 border-accent" />
          {particles.map((p, i) => (
            <span key={i} className="heart-particle absolute h-1.5 w-1.5 rounded-full bg-accent"
              style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px` } as CSSProperties} />
          ))}
        </span>
      )}
      <span key={active ? `on-${burst}` : 'off'} className={active ? 'heart-pop' : ''}>
        <Icon name="heart" filled={active} className="h-5 w-5" />
      </span>
    </button>
  );
}
