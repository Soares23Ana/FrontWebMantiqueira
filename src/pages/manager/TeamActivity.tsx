import { useState } from 'react';
import { api } from '../../api/client';
import Button from '../../components/Button';
import Pagination from '../../components/manager/Pagination';
import SectionHeader from '../../components/manager/SectionHeader';
import TableCard from '../../components/manager/TableCard';
import { ErrorState, Loading } from '../../components/State';
import { useApi } from '../../hooks/useApi';
import { formatDateTime } from '../../utils/format';
import type { Paginacao } from '../../types';

interface Alteracao {
  antes?: unknown;
  depois?: unknown;
}

interface RegistroAuditoria {
  id_auditoria: number;
  usuario: { id_usuario: number; nome: string } | null;
  acao: string;
  entidade: string;
  id_entidade: number | string | null;
  resumo?: { alteracoes?: Record<string, Alteracao> } | null;
  detalhe?: Record<string, unknown> | null;
  criado_em: string;
}

const MAX_TEXTO = 80;

// Tipos de item do filtro: o valor é o que a API espera em `entidade`.
const ENTIDADES: { value: string; label: string }[] = [
  { value: 'produto', label: 'Produto' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'pedido', label: 'Pedido' },
  { value: 'banner', label: 'Banner' },
  { value: 'popup', label: 'Pop-up' },
  { value: 'bloco_cms', label: 'Bloco de conteúdo' },
  { value: 'campanha', label: 'Campanha' },
  { value: 'configuracao', label: 'Configuração' },
  { value: 'usuario', label: 'Equipe' },
];

const ACOES: Record<string, string> = {
  'produto.criar': 'Produto criado',
  'produto.editar': 'Produto editado',
  'produto.ativar': 'Produto ativado',
  'produto.desativar': 'Produto desativado',
  'produto.estoque': 'Estoque ajustado',
  'cliente.editar': 'Cliente editado',
  'cliente.bloquear': 'Cliente bloqueado',
  'cliente.desbloquear': 'Cliente desbloqueado',
  'cliente.senha_temporaria': 'Senha temporária definida',
  'cliente.redefinicao_senha_gerada': 'Link de nova senha gerado',
  'pedido.status': 'Status do pedido alterado',
  'pedido.cancelar': 'Pedido cancelado',
  'banner.criar': 'Banner criado',
  'banner.editar': 'Banner editado',
  'banner.excluir': 'Banner excluído',
  'banner.reordenar': 'Banners reordenados',
  'popup.salvar': 'Pop-up salvo',
  'popup.ativar': 'Pop-up ativado',
  'popup.desativar': 'Pop-up desativado',
  'popup.imagem': 'Imagem do pop-up alterada',
  'popup.excluir': 'Pop-up excluído',
  'bloco.salvar': 'Bloco salvo',
  'bloco.ativar': 'Bloco ativado',
  'bloco.desativar': 'Bloco desativado',
  'bloco.excluir': 'Bloco excluído',
  'campanha.criar': 'Campanha criada',
  'campanha.editar': 'Campanha editada',
  'campanha.excluir': 'Campanha excluída',
  'configuracao.editar': 'Configuração alterada',
  'equipe.criar': 'Usuário da equipe criado',
  'equipe.editar': 'Usuário da equipe editado',
  'usuario.redefinicao_senha_gerada': 'Link de nova senha gerado (equipe)',
  'usuario.senha_redefinida_por_link': 'Senha redefinida pelo próprio usuário',
  'usuario.redefinicao_senha_gerada_por_terminal': 'Link de nova senha gerado no servidor',
  'pedido_senha.criado': 'Pedido de nova senha',
  'pedido_senha.link_enviado': 'Link enviado ao cliente',
  'pedido_senha.dispensado': 'Pedido de nova senha dispensado',
};

const traduzirAcao = (acao: string) => (Object.prototype.hasOwnProperty.call(ACOES, acao) ? ACOES[acao] : acao);

const rotuloEntidade = (entidade: string) => ENTIDADES.find((e) => e.value === entidade)?.label ?? entidade;

/** Quem fez: o cliente do pedido de senha não tem login e algumas ações vêm do terminal do servidor. */
const quemFez = (r: Pick<RegistroAuditoria, 'usuario' | 'acao'>) =>
  r.usuario ? r.usuario.nome : r.acao === 'pedido_senha.criado' ? 'Cliente (pelo site)' : 'Servidor (terminal)';

/** Valor como texto puro, cortado com "..." quando muito longo. */
function cortar(valor: unknown, max = MAX_TEXTO): string {
  let texto: string;
  if (valor === null || valor === undefined || valor === '') texto = '—';
  else if (typeof valor === 'object') {
    try { texto = JSON.stringify(valor) ?? '—'; } catch { texto = '—'; }
  } else texto = String(valor);
  return texto.length > max ? `${texto.slice(0, max)}...` : texto;
}

/** "campo: antes → depois" (na criação só há "depois", na exclusão só "antes"); depois, o detalhe extra da API. */
function linhasResumo(r: RegistroAuditoria): string[] {
  const alteracoes = r.resumo?.alteracoes;
  const linhas = alteracoes && typeof alteracoes === 'object'
    ? Object.entries(alteracoes).map(([campo, v]) => {
      const a: Alteracao = v && typeof v === 'object' ? v : {};
      return `${cortar(campo, 40)}: ${'antes' in a ? cortar(a.antes) : '—'} → ${'depois' in a ? cortar(a.depois) : '—'}`;
    })
    : [];
  const detalhe = r.detalhe && typeof r.detalhe === 'object'
    ? Object.entries(r.detalhe).map(([k, v]) => `${cortar(k, 40)}: ${cortar(v)}`)
    : [];
  return [...linhas, ...detalhe];
}

const PAGE_SIZE_PADRAO = 20;
const campo = 'rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-ink';

// Auditoria: o que a equipe (e o sistema) fez, do mais recente para o mais antigo.
export default function TeamActivity() {
  const [entidade, setEntidade] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_PADRAO);

  const { data, loading, error, reload } = useApi(
    () => api.get<{ registros: RegistroAuditoria[]; paginacao: Paginacao }>('/auditoria', { entidade, de, ate, pagina: page, limite: pageSize }),
    [entidade, de, ate, page, pageSize],
  );

  const registros = data?.registros ?? [];
  const filtrando = !!(entidade || de || ate);
  const limpar = () => { setEntidade(''); setDe(''); setAte(''); setPage(1); };

  return (
    <>
      <SectionHeader title="Atividade da equipe" subtitle="O que foi alterado no sistema, por quem e quando. Os mais recentes primeiro." />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs text-muted">Tipo de item
          <select value={entidade} onChange={(e) => { setEntidade(e.target.value); setPage(1); }} className={campo}>
            <option value="">Todos</option>
            {ENTIDADES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted">De
          <input type="date" value={de} onChange={(e) => { setDe(e.target.value); setPage(1); }} className={campo} />
        </label>
        <label className="grid gap-1 text-xs text-muted">Até
          <input type="date" value={ate} onChange={(e) => { setAte(e.target.value); setPage(1); }} className={campo} />
        </label>
        {filtrando && <Button variant="ghost" type="button" onClick={limpar} className="px-4 py-2 text-sm">Limpar</Button>}
      </div>
      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <TableCard headers={['Data e hora', 'Quem', 'Ação', 'Item', 'Resumo']} isEmpty={!loading && registros.length === 0} empty="Nenhuma atividade encontrada."
          footer={data && data.paginacao.total > 0 && (
            <Pagination page={page} pageSize={pageSize} total={data.paginacao.total} onPageChange={setPage}
              onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
          )}>
          {loading && !data && <tr><td colSpan={5}><Loading className="py-8" /></td></tr>}
          {registros.map((r) => (
            <tr key={r.id_auditoria} className="align-top">
              <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">{formatDateTime(r.criado_em)}</td>
              <td className="px-4 py-3 text-sm font-extrabold">{cortar(quemFez(r), 60)}</td>
              <td className="px-4 py-3 text-sm">{traduzirAcao(r.acao)}</td>
              <td className="px-4 py-3 text-sm">
                {cortar(rotuloEntidade(r.entidade), 40)}
                {r.id_entidade !== null && r.id_entidade !== undefined && <span className="text-muted"> #{cortar(r.id_entidade, 20)}</span>}
              </td>
              <td className="px-4 py-3 text-sm">
                {linhasResumo(r).map((l, i) => <span key={i} className="block break-words">{l}</span>)}
              </td>
            </tr>
          ))}
        </TableCard>
      )}
    </>
  );
}
