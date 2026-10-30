import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from '../api/client';
import type { Usuario } from '../types';

interface AuthValue {
  user: Usuario | null;
  /** true enquanto confere o token salvo (evita "piscar" a tela de login). */
  checking: boolean;
  login: (identificador: string, senha: string) => Promise<Usuario>;
  logout: () => void;
  /** Mensagem mostrada na tela de login depois de a sessão expirar. */
  expiredMessage: string;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [checking, setChecking] = useState(() => !!getToken());
  const [expiredMessage, setExpiredMessage] = useState('');

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      setExpiredMessage('Sua sessão expirou. Entre novamente.');
    });
    if (getToken()) {
      api.get<Usuario>('/auth/me')
        .then(setUser)
        .catch(() => setToken(null))
        .finally(() => setChecking(false));
    }
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (identificador: string, senha: string) => {
    const data = await api.post<{ token: string; usuario: Usuario }>('/auth/login', { identificador, senha });
    setToken(data.token);
    setUser(data.usuario);
    setExpiredMessage('');
    return data.usuario;
  }, []);

  const value = useMemo(() => ({ user, checking, login, logout, expiredMessage }), [user, checking, login, logout, expiredMessage]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}
