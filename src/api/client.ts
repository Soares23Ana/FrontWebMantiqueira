// Cliente HTTP da API Mantiqueira (/api/v1). Em desenvolvimento o Vite faz proxy para http://localhost:3000;
// em produção defina VITE_API_URL (ex.: https://api.mantiqueira.com.br).
export const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const API_BASE = `${API_ORIGIN}/api/v1`;
const TOKEN_KEY = 'mantiqueira.token';

export interface ErrorDetail {
  campo?: string;
  mensagem?: string;
  [key: string]: unknown;
}

// Erro no formato único da API: { sucesso: false, mensagem, codigo, detalhes }.
export class ApiError extends Error {
  status: number;
  codigo: string;
  detalhes: unknown;

  constructor(status: number, mensagem: string, codigo: string, detalhes?: unknown) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }

  /** Erros de validação por campo ({ campo: mensagem }), para mostrar embaixo de cada input. */
  get fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.detalhes)) return {};
    const out: Record<string, string> = {};
    for (const d of this.detalhes as ErrorDetail[]) {
      if (d.campo && d.mensagem && !out[d.campo]) out[d.campo] = d.mensagem;
    }
    return out;
  }
}

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* navegador sem storage: a sessão dura só esta aba */
  }
};

// Avisado quando a API responde 401 com token (expirou ou usuário desativado).
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

type Query = Record<string, string | number | boolean | null | undefined>;

export function buildQuery(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Query;
  /** Caminho fora de /api/v1 (ex.: /saude/detalhado). */
  raw?: boolean;
  headers?: Record<string, string>;
}

export async function request<T>(path: string, { method = 'GET', body, query, raw = false, headers: extra = {} }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...extra };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${raw ? API_ORIGIN : API_BASE}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.', 'SEM_CONEXAO');
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const d = (data ?? {}) as { mensagem?: string; codigo?: string; detalhes?: unknown };
    if (res.status === 401 && token && d.codigo === 'NAO_AUTENTICADO') onUnauthorized?.();
    throw new ApiError(res.status, d.mensagem ?? 'Algo deu errado. Tente novamente.', d.codigo ?? 'ERRO', d.detalhes);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>(path, { query }),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>(path, { method: 'POST', body, query }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/** Busca todas as páginas de uma lista paginada (para exportar CSV). */
export async function fetchAllPages<T>(path: string, key: string, query: Query = {}): Promise<T[]> {
  const out: T[] = [];
  for (let pagina = 1; pagina <= 50; pagina++) {
    const data = await api.get<Record<string, unknown>>(path, { ...query, pagina, limite: 100 });
    out.push(...((data[key] as T[]) ?? []));
    const pag = data.paginacao as { total_paginas: number } | undefined;
    if (!pag || pagina >= pag.total_paginas) break;
  }
  return out;
}

/** Imagens em /arquivos/... são servidas pela API; as de /img/... ficam no próprio front. */
export function imageUrl(url: string | null | undefined): string {
  if (!url) return '/logo-mantiqueira.svg';
  if (url.startsWith('/arquivos/')) return `${API_ORIGIN}${url}`;
  return url;
}

export const errorMessage = (e: unknown) =>
  e instanceof ApiError ? e.message : 'Algo deu errado. Tente novamente.';
