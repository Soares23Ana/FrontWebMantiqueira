import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, errorMessage } from '../../api/client';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import ChipFilter from '../../components/manager/ChipFilter';
import Modal from '../../components/manager/Modal';
import Pagination from '../../components/manager/Pagination';
import SectionHeader from '../../components/manager/SectionHeader';
import TableCard from '../../components/manager/TableCard';
import Toggle from '../../components/manager/Toggle';
import { ErrorState, FormError, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { formatDateTime } from '../../utils/format';
import type { ErroImportacao, Importacao, Paginacao } from '../../types';
import { useManager } from './ManagerLayout';

interface Resultado {
  mensagem: string;
  id_sincronizacao: number;
  status: Importacao['status'];
  relatorio: {
    simulado: boolean; linhas: number; criados: number; atualizados: number; inalterados: number; desativados: number;
    com_erro: number; categorias_criadas: number; marcas_criadas: number; movimentacoes_estoque: number;
    erros: ErroImportacao[]; avisos: (string | ErroImportacao)[];
  };
}

const STATUS_STYLE: Record<string, string> = {
  sucesso: 'bg-green-100 text-green-800',
  parcial: 'bg-amber-100 text-amber-800',
  falha: 'bg-accent/10 text-accent',
  em_andamento: 'bg-brand/10 text-brand',
};

const TIPO_LABEL: Record<string, string> = {
  importacao_manual: 'Upload manual',
  carga_completa: 'Carga completa',
  estoque: 'Estoque',
};

const tipoOptions = ['Todos', 'Upload manual', 'Carga completa', 'Estoque'] as const;
const tipoValue: Record<(typeof tipoOptions)[number], string> = { Todos: '', 'Upload manual': 'importacao_manual', 'Carga completa': 'carga_completa', Estoque: 'estoque' };

// Importação de catálogo/estoque por CSV: é a demonstração da integração de dados.
export default function Imports() {
  const toast = useToast();
  const { refreshCounters } = useManager();
  const [file, setFile] = useState<File | null>(null);
  const [simular, setSimular] = useState(true);
  const [cargaCompleta, setCargaCompleta] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [tipo, setTipo] = useState<(typeof tipoOptions)[number]>('Todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailId, setDetailId] = useState<number | null>(null);
  const historico = useApi(
    () => api.get<{ importacoes: Importacao[]; paginacao: Paginacao }>('/produtos/importacoes', { tipo: tipoValue[tipo], pagina: page, limite: pageSize }),
    [tipo, page, pageSize],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return setFormError('Escolha um arquivo .csv.');
    setSending(true);
    setFormError('');
    setResultado(null);
    const fd = new FormData();
    fd.append('arquivo', file);
    try {
      const r = await api.post<Resultado>('/produtos/importar', fd, { simular: simular || undefined, carga_completa: cargaCompleta || undefined });
      setResultado(r);
      toast(r.mensagem, r.status === 'falha' ? 'error' : 'success');
      historico.reload();
      if (!simular) refreshCounters();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SectionHeader title="Importação de catálogo" subtitle="Envie um CSV para criar ou atualizar produtos e estoque. Use a simulação para conferir antes de gravar." />
      <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={submit} className="rounded-2xl border border-black/10 bg-white p-5">
          <FormError message={formError} />
          <label className="grid cursor-pointer place-items-center gap-2 rounded-2xl border-2 border-dashed border-brand/30 p-8 text-center hover:bg-brand/5">
            <Icon name="upload" className="h-8 w-8 text-brand" />
            <span className="font-extrabold">{file ? file.name : 'Escolher arquivo CSV'}</span>
            <span className="text-sm text-muted">Separador ; ou , · UTF-8 ou padrão do Excel · até 5 MB · coluna sku obrigatória</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResultado(null); }} />
          </label>
          <div className="mt-4 grid gap-3 text-sm">
            <label className="flex items-start gap-3">
              <Toggle checked={simular} label="Modo simulação" onChange={setSimular} />
              <span><b>Modo simulação</b><span className="block text-muted">Valida e mostra o que mudaria, sem gravar nada.</span></span>
            </label>
            <label className="flex items-start gap-3">
              <Toggle checked={cargaCompleta} label="Carga completa" onChange={setCargaCompleta} />
              <span><b>Carga completa</b><span className="block text-muted">Desativa produtos que não estão no arquivo (só se o arquivo não tiver erros).</span></span>
            </label>
          </div>
          <Button type="submit" variant={simular ? 'primary' : 'accent'} disabled={sending || !file} className="mt-5 w-full disabled:opacity-50">
            {sending ? 'Processando...' : simular ? 'Simular importação' : 'Importar e gravar'}
          </Button>
          <p className="mt-3 text-xs text-muted">
            Colunas aceitas: sku, nome, categoria, marca, descricao, destaques, imagem_url, ativo, estoque_minimo, multiplo_venda, estoque.
            Colunas ausentes não são alteradas. O estoque do arquivo substitui o valor atual.
          </p>
        </form>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h3 className="mb-3 font-extrabold">Resultado</h3>
          {!resultado && <p className="py-10 text-center text-muted">Envie um arquivo para ver o relatório aqui.</p>}
          {resultado && <Report r={resultado.relatorio} status={resultado.status} mensagem={resultado.mensagem} />}
        </div>
      </div>

      <SectionHeader title="Histórico de sincronizações" subtitle="Uploads feitos aqui e os jobs automáticos (catálogo à meia-noite, estoque a cada 30 min)." />
      <div className="mb-4"><ChipFilter label="Tipo" options={tipoOptions} value={tipo} onChange={(v) => { setTipo(v); setPage(1); }} /></div>
      {historico.error ? <ErrorState error={historico.error} onRetry={historico.reload} /> : (
        <TableCard headers={['Quando', 'Tipo', 'Status', 'Linhas', 'Criados / atualizados', 'Erros', 'Por', '']}
          isEmpty={!historico.loading && historico.data?.importacoes.length === 0} empty="Nenhuma sincronização ainda."
          footer={historico.data && <Pagination page={page} pageSize={pageSize} total={historico.data.paginacao.total} onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />}>
          {historico.loading && <tr><td colSpan={8}><Loading className="py-8" /></td></tr>}
          {!historico.loading && historico.data?.importacoes.map((i) => (
            <tr key={i.id_sincronizacao}>
              <td className="px-4 py-3 text-sm">{formatDateTime(i.iniciado_em)}</td>
              <td className="px-4 text-sm">{TIPO_LABEL[i.tipo] ?? i.tipo}{i.simulado && <span className="ml-1 rounded-full bg-surface px-2 py-0.5 text-xs">simulação</span>}</td>
              <td className="px-4"><span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLE[i.status] ?? ''}`}>{i.status}</span></td>
              <td className="px-4">{i.linhas}</td>
              <td className="px-4 text-sm">{i.criados} / {i.atualizados}</td>
              <td className={`px-4 ${i.com_erro ? 'font-extrabold text-accent' : ''}`}>{i.com_erro}</td>
              <td className="px-4 text-sm text-muted">{i.usuario?.nome ?? `Job (${i.origem})`}</td>
              <td className="px-4 text-right"><Button variant="ghost" className="px-3 py-1 text-sm" onClick={() => setDetailId(i.id_sincronizacao)}>Relatório</Button></td>
            </tr>
          ))}
        </TableCard>
      )}
      {detailId && <ImportDetail id={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}

function Report({ r, status, mensagem }: { r: Partial<Resultado['relatorio']> & { erros?: ErroImportacao[]; avisos?: (string | ErroImportacao)[] }; status: string; mensagem?: string | null }) {
  const stats: [string, number | undefined][] = [
    ['Linhas', r.linhas], ['Criados', r.criados], ['Atualizados', r.atualizados], ['Inalterados', r.inalterados],
    ['Desativados', r.desativados], ['Com erro', r.com_erro], ['Mov. de estoque', r.movimentacoes_estoque],
  ];
  return (
    <>
      <p className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLE[status] ?? ''}`}>{status}</span>
        {r.simulado && <span className="rounded-full bg-surface px-3 py-1 text-sm">Simulação: nada foi gravado</span>}
      </p>
      {mensagem && <p className="mb-3 text-sm text-muted">{mensagem}</p>}
      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {stats.filter(([, v]) => v !== undefined).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-surface p-3 text-center">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className={`text-xl font-extrabold ${k === 'Com erro' && v ? 'text-accent' : 'text-brand'}`}>{v}</dd>
          </div>
        ))}
      </dl>
      {r.erros && r.erros.length > 0 && (
        <>
          <h4 className="mb-2 mt-4 font-extrabold text-accent">Erros por linha</h4>
          <div className="max-h-72 overflow-auto rounded-xl border border-black/10">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface text-muted"><tr><th className="p-2 font-medium">Linha</th><th className="font-medium">SKU</th><th className="font-medium">Campo</th><th className="font-medium">Problema</th></tr></thead>
              <tbody className="[&>tr]:border-t [&>tr]:border-black/10">
                {r.erros.map((e, i) => (
                  <tr key={i}><td className="p-2">{e.linha}</td><td>{e.sku ?? '—'}</td><td>{e.campo ?? '—'}</td><td className="pr-2">{e.mensagem}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {r.avisos && r.avisos.length > 0 && (
        <>
          <h4 className="mb-2 mt-4 font-extrabold text-amber-700">Avisos</h4>
          <ul className="grid gap-1 text-sm">
            {r.avisos.map((a, i) => <li key={i} className="rounded-lg bg-amber-50 px-3 py-1.5">{typeof a === 'string' ? a : `Linha ${a.linha}: ${a.mensagem}`}</li>)}
          </ul>
        </>
      )}
    </>
  );
}

function ImportDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, loading, error, reload } = useApi(() => api.get<{ importacao: Importacao }>(`/produtos/importacoes/${id}`), [id]);
  const i = data?.importacao;
  return (
    <Modal title={`Sincronização #${id}`} onClose={onClose} wide>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {i && (
        <>
          <p className="mb-3 text-sm text-muted">
            {TIPO_LABEL[i.tipo] ?? i.tipo} · {formatDateTime(i.iniciado_em)}{i.duracao_ms != null ? ` · ${(i.duracao_ms / 1000).toFixed(1)} s` : ''} · {i.usuario?.nome ?? `Job (${i.origem})`}
          </p>
          <Report r={{ ...i, erros: i.relatorio?.erros, avisos: i.relatorio?.avisos }} status={i.status} mensagem={i.mensagem} />
        </>
      )}
    </Modal>
  );
}
