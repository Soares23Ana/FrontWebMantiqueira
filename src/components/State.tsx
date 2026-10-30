import type { ReactNode } from 'react';
import type { ApiError } from '../api/client';

// Estados de carregamento, erro e vazio usados em todas as telas que chamam a API.
export function Loading({ label = 'Carregando...', className = 'py-16' }: { label?: string; className?: string }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-3 text-muted ${className}`}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/30 border-t-brand" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ error, onRetry, className = 'py-16' }: { error: ApiError | Error | string; onRetry?: () => void; className?: string }) {
  const message = typeof error === 'string' ? error : error.message;
  return (
    <div role="alert" className={`mx-auto max-w-md text-center ${className}`}>
      <p className="font-extrabold text-accent">Não foi possível carregar</p>
      <p className="mt-1 text-muted">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-full bg-brand px-5 py-2 font-extrabold text-white hover:bg-brand-dark">
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function Empty({ children, className = 'py-12' }: { children: ReactNode; className?: string }) {
  return <p className={`text-center text-muted ${className}`}>{children}</p>;
}

/** Mensagem de erro de formulário (topo do form). */
export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return <p role="alert" className="mb-4 rounded-xl bg-accent/10 p-3 text-sm font-medium text-accent">{message}</p>;
}
