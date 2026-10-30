import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { CampanhaAtiva, Categoria, ConfiguracoesPublicas, Marca } from '../types';

interface StoreValue {
  config: ConfiguracoesPublicas | null;
  categorias: Categoria[];
  marcas: Marca[];
  campanhas: CampanhaAtiva[];
  /** Selos de campanha por id_produto (um produto pode estar em mais de uma campanha). */
  selos: Map<number, { id_campanha: number; selo: string }[]>;
}

const StoreContext = createContext<StoreValue>({ config: null, categorias: [], marcas: [], campanhas: [], selos: new Map() });

// Dados públicos usados em várias telas da loja: contatos/aviso do topo, categorias, marcas e campanhas ativas.
export function StoreProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfiguracoesPublicas | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaAtiva[]>([]);

  useEffect(() => {
    api.get<ConfiguracoesPublicas>('/configuracoes/publicas').then(setConfig).catch(() => {});
    api.get<{ categorias: Categoria[] }>('/categorias').then((d) => setCategorias(d.categorias)).catch(() => {});
    api.get<{ marcas: Marca[] }>('/marcas').then((d) => setMarcas(d.marcas)).catch(() => {});
    api.get<{ campanhas: CampanhaAtiva[] }>('/campanhas/ativas').then((d) => setCampanhas(d.campanhas)).catch(() => {});
  }, []);

  const selos = useMemo(() => {
    const map = new Map<number, { id_campanha: number; selo: string }[]>();
    for (const c of campanhas) {
      const selo = c.selo || c.titulo;
      for (const p of c.produtos) map.set(p.id_produto, [...(map.get(p.id_produto) ?? []), { id_campanha: c.id_campanha, selo }]);
    }
    return map;
  }, [campanhas]);

  const value = useMemo(() => ({ config, categorias, marcas, campanhas, selos }), [config, categorias, marcas, campanhas, selos]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
