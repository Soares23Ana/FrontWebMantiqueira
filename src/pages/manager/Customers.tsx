import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError, errorMessage, fetchAllPages } from '../../api/client';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Icon from '../../components/Icon';
import ChipFilter from '../../components/manager/ChipFilter';
import Modal from '../../components/manager/Modal';
import Pagination from '../../components/manager/Pagination';
import SearchBox from '../../components/manager/SearchBox';
import SectionHeader from '../../components/manager/SectionHeader';
import TableCard from '../../components/manager/TableCard';
import Toggle from '../../components/manager/Toggle';
import StatusBadge from '../../components/StatusBadge';
import { ErrorState, FormError, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi, useDebounced } from '../../hooks/useApi';
import { formatCnpj } from '../../utils/cnpj';
import { downloadCsv } from '../../utils/csv';
import { formatDate, formatPhone } from '../../utils/format';
import type { Cliente, Endereco, Paginacao, StatusPedido } from '../../types';

interface Detalhes {
  cliente: Cliente & { enderecos: Endereco[] };
  historico_pedidos: { id_pedido: number; status: StatusPedido; data_pedido: string; itens: { quantidade: number }[] }[];
  produtos_mais_solicitados: { id_produto: number; nome: string; quantidade_solicitada: number }[];
}

export default function Customers() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [semCnpj, setSemCnpj] = useState(false);
  const [ordem, setOrdem] = useState<'Mais pedidos' | 'Nome (A–Z)'>('Mais pedidos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openId, setOpenId] = useState<number | null>(null);
  const busca = useDebounced(search.trim());
  const filtros = { busca, sem_cnpj: semCnpj || undefined, ordenar: ordem === 'Mais pedidos' ? 'mais_pedidos' : 'nome' };
  const lista = useApi(
    () => api.get<{ clientes: Cliente[]; paginacao: Paginacao }>('/clientes', { ...filtros, pagina: page, limite: pageSize }),
    [busca, semCnpj, ordem, page, pageSize],
  );

  const toggleActive = async (c: Cliente, ativo: boolean) => {
    try {
      await api.put(`/clientes/${c.id_usuario}`, { ativo });
      toast(ativo ? `${c.nome_exibicao}: acesso liberado.` : `${c.nome_exibicao}: acesso bloqueado.`);
      lista.reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const exportCsv = async () => {
    try {
      const todos = await fetchAllPages<Cliente>('/clientes', 'clientes', filtros);
      downloadCsv('clientes.csv', ['Cliente', 'Responsável', 'CNPJ', 'E-mail', 'Telefone', 'Cidade', 'Pedidos', 'Cadastro', 'Ativo'],
        todos.map((c) => [c.nome_exibicao, c.nome, c.cnpj ?? c.cnpj_original ?? '', c.email, formatPhone(c.telefone), c.cidade ?? '', c.total_pedidos ?? 0, formatDate(c.criado_em), c.ativo ? 'Sim' : 'Não']));
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <>
      <SectionHeader title="Clientes" subtitle="Lojistas cadastrados. Edite dados operacionais, bloqueie o acesso ou defina uma senha temporária.">
        <Button variant="ghost" onClick={exportCsv}><Icon name="download" className="mr-1 inline h-5 w-5 align-text-bottom" />Exportar</Button>
      </SectionHeader>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por nome, razão social, e-mail, CNPJ ou cidade" />
        <ChipFilter label="Ordenar" options={['Mais pedidos', 'Nome (A–Z)'] as const} value={ordem} onChange={(v) => { setOrdem(v); setPage(1); }} />
        <label className="flex items-center gap-2 text-sm">
          <Toggle checked={semCnpj} label="Só CNPJ pendente" onChange={(v) => { setSemCnpj(v); setPage(1); }} />
          Só com CNPJ pendente
        </label>
      </div>
      {semCnpj && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Estes clientes não conseguem entrar porque o CNPJ está ausente ou inválido. Corrija o CNPJ no detalhe do cliente.</p>}

      {lista.error ? <ErrorState error={lista.error} onRetry={lista.reload} /> : (
        <TableCard headers={['Cliente', 'CNPJ', 'Contato', 'Cidade', 'Pedidos', 'Ativo', '']} isEmpty={!lista.loading && lista.data?.clientes.length === 0}
          empty={busca ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente.'}
          footer={lista.data && <Pagination page={page} pageSize={pageSize} total={lista.data.paginacao.total} onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />}>
          {lista.loading && <tr><td colSpan={7}><Loading className="py-8" /></td></tr>}
          {!lista.loading && lista.data?.clientes.map((c) => (
            <tr key={c.id_usuario} className={c.ativo ? '' : 'opacity-60'}>
              <td className="px-4 py-3">
                <p className="font-extrabold">{c.nome_exibicao}</p>
                {c.razao_social && <p className="text-sm text-muted">{c.nome}</p>}
              </td>
              <td className="px-4 text-sm">
                {c.cnpj ?? <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">Pendente{c.cnpj_original ? `: ${c.cnpj_original}` : ''}</span>}
              </td>
              <td className="px-4 text-sm"><p>{c.email}</p><p className="text-muted">{formatPhone(c.telefone)}</p></td>
              <td className="px-4 text-sm">{c.cidade ?? <span className="text-muted">—</span>}</td>
              <td className="px-4 font-extrabold">{c.total_pedidos ?? 0}</td>
              <td className="px-4"><Toggle checked={c.ativo} label={`Ativar ${c.nome_exibicao}`} onChange={(v) => toggleActive(c, v)} /></td>
              <td className="px-4 text-right"><Button variant="primary" className="px-4 py-1.5 text-sm" onClick={() => setOpenId(c.id_usuario)}>Detalhes</Button></td>
            </tr>
          ))}
        </TableCard>
      )}
      {openId && <CustomerModal id={openId} onClose={() => setOpenId(null)} onChanged={lista.reload} />}
    </>
  );
}

function CustomerModal({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => api.get<Detalhes>(`/clientes/${id}/detalhes`), [id]);
  const [form, setForm] = useState({ razao_social: '', cnpj: '', telefone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaMsg, setSenhaMsg] = useState('');
  const [senhaErr, setSenhaErr] = useState('');

  useEffect(() => {
    const c = data?.cliente;
    if (c) setForm({ razao_social: c.razao_social ?? '', cnpj: c.cnpj ?? (c.cnpj_original ? formatCnpj(c.cnpj_original) : ''), telefone: formatPhone(c.telefone) });
  }, [data]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError('');
    try {
      await api.put(`/clientes/${id}`, {
        razao_social: form.razao_social.trim() || null,
        ...(form.cnpj ? { cnpj: form.cnpj } : {}),
        ...(form.telefone ? { telefone: form.telefone } : {}),
      });
      toast('Dados do cliente atualizados.');
      reload();
      onChanged();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    }
  };

  const setTempPassword = async (e: FormEvent) => {
    e.preventDefault();
    setSenhaErr('');
    setSenhaMsg('');
    try {
      const r = await api.put<{ mensagem: string }>(`/clientes/${id}/senha`, { senha });
      setSenhaMsg(r.mensagem);
      setSenha('');
    } catch (err) {
      setSenhaErr(err instanceof ApiError ? err.fieldErrors.senha ?? err.message : errorMessage(err));
    }
  };

  const generate = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => chars[b % chars.length]).join('');
    setSenha(`Mtq@${rand}`);
  };

  return (
    <Modal title={data?.cliente.nome_exibicao ?? 'Cliente'} onClose={onClose} wide>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <>
          <p className="text-sm text-muted">Responsável: {data.cliente.nome} · {data.cliente.email} · cliente desde {formatDate(data.cliente.criado_em)}</p>

          <form onSubmit={save} noValidate className="mt-4 rounded-2xl border border-black/10 p-4">
            <h4 className="font-extrabold">Dados operacionais</h4>
            <FormError message={formError} />
            <div className="grid gap-x-3 sm:grid-cols-3">
              <Field label="Razão social" mandatory={false} value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} error={errors.razao_social} />
              <Field label="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: formatCnpj(e.target.value) })} error={errors.cnpj} />
              <Field label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })} error={errors.telefone} />
            </div>
            <Button type="submit" variant="primary" className="mt-4 px-4 py-2 text-sm">Salvar dados</Button>
          </form>

          <form onSubmit={setTempPassword} noValidate className="mt-4 rounded-2xl border border-black/10 p-4">
            <h4 className="font-extrabold">Senha temporária</h4>
            <p className="text-sm text-muted">Para o cliente que esqueceu a senha. Informe a senha por telefone/WhatsApp e oriente a troca em “Minha conta”.</p>
            <div className="flex flex-wrap items-end gap-2">
              <Field className="min-w-48 flex-1" label="Nova senha (8 a 72 caracteres)" value={senha} onChange={(e) => setSenha(e.target.value)} error={senhaErr} autoComplete="off" />
              <Button type="button" variant="ghost" className="mb-0.5 px-4 py-2 text-sm" onClick={generate}>Gerar</Button>
              <Button type="submit" variant="primary" disabled={senha.length < 8} className="mb-0.5 px-4 py-2 text-sm disabled:opacity-40">Definir</Button>
            </div>
            {senhaMsg && <p role="status" className="mt-2 rounded-xl bg-green-50 p-2 text-sm text-green-800">{senhaMsg}</p>}
          </form>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-extrabold">Endereços</h4>
              <ul className="grid gap-2 text-sm">
                {data.cliente.enderecos.map((e) => (
                  <li key={e.id_endereco} className="rounded-xl bg-surface p-3">
                    {e.principal && <span className="text-xs font-extrabold text-brand">PRINCIPAL </span>}
                    {e.logradouro}, {e.numero}{e.complemento ? ` – ${e.complemento}` : ''}
                    <span className="block text-muted">{e.bairro} · {e.cidade}/{e.estado} · {e.cep}</span>
                  </li>
                ))}
                {data.cliente.enderecos.length === 0 && <li className="text-muted">Sem endereço.</li>}
              </ul>
              <h4 className="mb-2 mt-4 font-extrabold">Mais pedidos</h4>
              <ul className="grid gap-1 text-sm">
                {data.produtos_mais_solicitados.slice(0, 6).map((p) => (
                  <li key={p.id_produto} className="flex justify-between gap-2"><span className="truncate">{p.nome}</span><b>{p.quantidade_solicitada} un.</b></li>
                ))}
                {data.produtos_mais_solicitados.length === 0 && <li className="text-muted">Ainda não comprou.</li>}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-extrabold">Últimos pedidos</h4>
              <ul className="grid gap-1">
                {data.historico_pedidos.slice(0, 10).map((p) => (
                  <li key={p.id_pedido}>
                    <Link to={`/gestor/pedidos?pedido=${p.id_pedido}`} className="flex items-center gap-2 rounded-xl p-2 text-sm hover:bg-surface">
                      <b>#{p.id_pedido}</b>
                      <span className="flex-1 text-muted">{formatDate(p.data_pedido)} · {p.itens.reduce((s, i) => s + i.quantidade, 0)} un.</span>
                      <StatusBadge status={p.status} />
                    </Link>
                  </li>
                ))}
                {data.historico_pedidos.length === 0 && <li className="text-sm text-muted">Nenhum pedido.</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
