import { useId } from 'react';
import { useTheme } from '../context/ThemeContext';

const ANIM = 'transition-all duration-[350ms] ease-in-out motion-reduce:transition-none';

// Botão de alternar entre o modo claro e o noturno (fica no cabeçalho da loja e do gestor).
// A animação (sol que vira lua) usa só SVG + transições de CSS, sem biblioteca extra.
// Inspirada em toggles.dev (Alfie Jones) / Skiper UI.
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { escuro, alternar } = useTheme();
  const rotulo = escuro ? 'Mudar para o modo claro' : 'Mudar para o modo noturno';
  const clipId = `tema-recorte-${useId().replace(/:/g, '')}`;
  return (
    <button type="button" onClick={alternar} aria-label={rotulo} title={rotulo} aria-pressed={escuro}
      className={`grid h-11 w-11 place-items-center rounded-full transition active:scale-95 hover:bg-surface ${className}`}>
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="currentColor" strokeLinecap="round" aria-hidden="true">
        <clipPath id={clipId}>
          {/* a "mordida" que transforma o disco em lua desliza para dentro */}
          <path d="M0-5h30a1 1 0 0 0 9 13v24H0Z" className={ANIM}
            style={{ transform: escuro ? 'translate(-12px, 10px)' : 'translate(0, 0)' }} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          <circle cx="16" cy="16" r={escuro ? 10 : 8} className={ANIM} style={{ r: escuro ? 10 : 8 }} />
          {/* raios do sol: giram, encolhem e somem na lua */}
          <g stroke="currentColor" strokeWidth="1.5" className={ANIM}
            style={{ transformOrigin: '16px 16px', transform: escuro ? 'rotate(-100deg) scale(0.5)' : 'none', opacity: escuro ? 0 : 1 }}>
            <path d="M16 5.5v-4" /><path d="M16 30.5v-4" /><path d="M1.5 16h4" /><path d="M26.5 16h4" />
            <path d="m23.4 8.6 2.8-2.8" /><path d="m5.7 26.3 2.9-2.9" /><path d="m5.8 5.8 2.8 2.8" /><path d="m23.4 23.4 2.9 2.9" />
          </g>
        </g>
      </svg>
    </button>
  );
}
