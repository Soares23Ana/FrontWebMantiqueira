import { api } from '../api/client';
import { readJson, writeJson } from './storage';

// Eventos de navegação para as métricas do gestor (POST /eventos). A API não guarda IP;
// para visitantes mandamos um identificador aleatório de sessão guardado no navegador.
function sessao(): string {
  let id = readJson<string | null>('mantiqueira.sessao', null);
  if (!id) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
    writeJson('mantiqueira.sessao', id);
  }
  return id;
}

type Evento =
  | { tipo: 'produto_visto'; id_produto: number }
  | { tipo: 'carrinho_adicionar'; id_produto: number; quantidade?: number }
  | { tipo: 'checkout_iniciado' }
  | { tipo: 'banner_clique'; id_banner: number }
  | { tipo: 'campanha_clique'; id_campanha: number };

export function track(evento: Evento) {
  // Falha de métrica nunca atrapalha a navegação.
  api.post('/eventos', { ...evento, sessao: sessao() }).catch(() => {});
}
