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
