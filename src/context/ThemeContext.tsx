import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Tema = 'claro' | 'escuro';

const CHAVE = 'mantiqueira.tema';

// Sem escolha salva, segue o tema do sistema. O index.html já aplica a classe antes da página aparecer.
function temaInicial(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === 'claro' || salvo === 'escuro') return salvo;
  } catch {
    /* sem storage: segue o sistema */
  }
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}

interface ThemeValue {
  tema: Tema;
  escuro: boolean;
  alternar: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro');
  }, [tema]);

  const alternar = useCallback(() => {
    setTema((atual) => {
      const proximo: Tema = atual === 'escuro' ? 'claro' : 'escuro';
      try {
        localStorage.setItem(CHAVE, proximo);
      } catch {
        /* a escolha vale só nesta aba */
      }
      return proximo;
    });
  }, []);

  const value = useMemo(() => ({ tema, escuro: tema === 'escuro', alternar }), [tema, alternar]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme fora do ThemeProvider');
  return ctx;
}

const FUNDO_ESCURO = [20, 26, 63]; // o fundo dos cartões no modo noturno (#141a3f)
const CONTRASTE_MINIMO = 7; // nível AAA: as cores de marca aparecem em títulos e textos grandes sobre o fundo escuro e precisam ser bem legíveis

function luminancia([r, g, b]: number[]): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contraste(a: number[], b: number[]): number {
  const [maior, menor] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (maior + 0.05) / (menor + 0.05);
}

/**
 * Cor de marca legível no tema atual. No modo noturno a cor é mantida exatamente como é quando já tem contraste
 * suficiente sobre o fundo escuro (como o laranja do BIC); só as cores muito escuras (como o azul da Baruel) são
 * misturadas com branco, o mínimo necessário para chegar ao contraste.
 */
export function corNoTema(cor: string, escuro: boolean): string {
  if (!escuro) return cor;
  const m = /^#([0-9a-f]{6})$/i.exec(cor);
  if (!m) return `color-mix(in oklab, ${cor} 42%, white)`;
  const rgb = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  for (let t = 0; t <= 1.0001; t += 0.04) {
    const mix = rgb.map((v) => Math.round(v + (255 - v) * t));
    if (contraste(mix, FUNDO_ESCURO) >= CONTRASTE_MINIMO) return `rgb(${mix.join(',')})`;
  }
  return '#ffffff';
}
