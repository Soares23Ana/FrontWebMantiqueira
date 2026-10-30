import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

// Re-renderiza o componente a cada quadro de rolagem e devolve a posição atual.
export function useScrollY(): number {
  const [, setTick] = useState(0);
  useEffect(() => {
    let waiting = false;
    const update = () => {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(() => {
        setTick((n) => n + 1);
        waiting = false;
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return window.scrollY;
}

// Progresso de 0 a 1 de um elemento atravessando a tela.
export function useElementProgress(ref: RefObject<HTMLElement | null>): number {
  useScrollY();
  const el = ref.current;
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const h = window.innerHeight;
  return Math.min(1, Math.max(0, (h - rect.top) / (h + rect.height)));
}
