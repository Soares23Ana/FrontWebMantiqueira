import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Kind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  text: string;
  kind: Kind;
}

const ToastContext = createContext<(text: string, kind?: Kind) => void>(() => {});

// Avisos rápidos no canto da tela ("Adicionado ao carrinho", "Status atualizado"...).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((text: string, kind: Kind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const styles: Record<Kind, string> = {
    success: 'bg-brand-dark text-white',
    error: 'bg-accent text-white',
    info: 'bg-white text-ink ring-1 ring-black/10',
  };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-24 left-1/2 z-50 grid w-[min(92vw,26rem)] -translate-x-1/2 gap-2">
        {toasts.map((t) => (
          <p key={t.id} role="status" className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-xl ${styles[t.kind]}`}>{t.text}</p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
