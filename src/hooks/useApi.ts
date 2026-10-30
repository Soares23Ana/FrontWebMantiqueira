import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

// Executa uma chamada à API quando as dependências mudam e devolve { data, loading, error, reload }.
// Respostas antigas são descartadas se outra chamada começar antes (ex.: digitação rápida na busca).
export function useApi<T>(fn: () => Promise<T>, deps: unknown[], enabled = true) {
  const [state, setState] = useState<State<T>>({ data: null, loading: enabled, error: null });
  const callId = useRef(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => id === callId.current && setState({ data, loading: false, error: null }))
      .catch((e) => {
        if (id !== callId.current) return;
        const error = e instanceof ApiError ? e : new ApiError(0, 'Algo deu errado. Tente novamente.', 'ERRO');
        setState((s) => ({ ...s, loading: false, error }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  const setData = useCallback((updater: (prev: T | null) => T | null) => setState((s) => ({ ...s, data: updater(s.data) })), []);
  return { ...state, reload, setData };
}

// Atrasa um valor (ex.: texto da busca) para não chamar a API a cada tecla.
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
