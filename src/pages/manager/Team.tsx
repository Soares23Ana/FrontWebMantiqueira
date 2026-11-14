import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, ApiError, errorMessage } from '../../api/client';
import Button from '../../components/Button';
import Field, { PasswordField } from '../../components/Field';
import Icon from '../../components/Icon';
import IconButton from '../../components/manager/IconButton';
import Modal from '../../components/manager/Modal';
import SectionHeader from '../../components/manager/SectionHeader';
import TableCard from '../../components/manager/TableCard';
import Toggle from '../../components/manager/Toggle';
import { ErrorState, FormError, Loading } from '../../components/State';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { formatDate, formatPhone } from '../../utils/format';
import type { MembroEquipe, Paginacao } from '../../types';

// Gestão da equipe: só para quem tem pode_gerenciar_equipe.
export default function Team() {
  const toast = useToast();
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(
    () => api.get<{ usuarios: MembroEquipe[]; paginacao: Paginacao }>('/admin/usuarios', { tipo: 'equipe', limite: 100 }),
    [],
  );
  const [editing, setEditing] = useState<MembroEquipe | 'novo' | null>(null);

  const patch = async (u: MembroEquipe, body: Record<string, unknown>, msg: string) => {
    try {
      await api.patch(`/admin/usuarios/${u.id_usuario}`, body);
      toast(msg);
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <>
      <SectionHeader title="Equipe" subtitle="Contas de quem acessa o gestor. Quem tem “gerencia a equipe” pode criar e desativar contas.">
        <Button variant="accent" onClick={() => setEditing('novo')}><Icon name="plus" className="mr-1 inline h-5 w-5 align-text-bottom" />Novo usuário</Button>
      </SectionHeader>
      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <TableCard headers={['Nome', 'Cargo', 'Contato', 'Desde', 'Gerencia a equipe', 'Ativo', '']} isEmpty={!loading && data?.usuarios.length === 0} empty="Nenhum usuário.">
          {loading && <tr><td colSpan={7}><Loading className="py-8" /></td></tr>}
          {data?.usuarios.map((u) => {
            const me = u.id_usuario === user?.id;
            return (
              <tr key={u.id_usuario} className={u.ativo ? '' : 'opacity-60'}>
                <td className="px-4 py-3 font-extrabold">{u.nome}{me && <span className="ml-1 text-xs font-medium text-muted">(você)</span>}</td>
                <td className="px-4 text-sm">{u.cargo ?? '—'}</td>
                <td className="px-4 text-sm">{u.email}<span className="block text-muted">{formatPhone(u.telefone)}</span></td>
                <td className="px-4 text-sm text-muted">{formatDate(u.criado_em)}</td>
                <td className="px-4"><Toggle checked={u.pode_gerenciar_equipe} label={`${u.nome} gerencia a equipe`}
                  onChange={(v) => patch(u, { pode_gerenciar_equipe: v }, v ? `${u.nome} agora gerencia a equipe.` : `${u.nome} não gerencia mais a equipe.`)} /></td>
                <td className="px-4">{me ? <span className="text-xs text-muted">—</span> : <Toggle checked={u.ativo} label={`Ativar ${u.nome}`}
                  onChange={(v) => patch(u, { ativo: v }, v ? `${u.nome} reativado.` : `${u.nome} desativado: perdeu o acesso.`)} />}</td>
                <td className="px-4 text-right"><IconButton icon="edit" label="Editar" onClick={() => setEditing(u)} /></td>
              </tr>
            );
          })}
        </TableCard>
      )}
      {editing && <MemberModal membro={editing === 'novo' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}

function MemberModal({ membro, onClose, onSaved }: { membro: MembroEquipe | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ nome: membro?.nome ?? '', email: membro?.email ?? '', cargo: membro?.cargo ?? '', telefone: formatPhone(membro?.telefone), senha: '' });
  const [gerencia, setGerencia] = useState(membro?.pode_gerenciar_equipe ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: k === 'telefone' ? formatPhone(e.target.value) : e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError('');
    const body: Record<string, unknown> = { nome: form.nome.trim(), email: form.email.trim(), cargo: form.cargo.trim() || null, pode_gerenciar_equipe: gerencia };
    if (form.telefone) body.telefone = form.telefone;
    if (form.senha) body.senha = form.senha;
    try {
      if (membro) await api.patch(`/admin/usuarios/${membro.id_usuario}`, body);
      else await api.post('/admin/usuarios', body);
      toast(membro ? 'Usuário atualizado.' : 'Usuário da equipe criado.');
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    }
  };

  return (
    <Modal title={membro ? 'Editar usuário' : 'Novo usuário da equipe'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <FormError message={formError} />
        <Field label="Nome" value={form.nome} onChange={set('nome')} error={errors.nome} />
        <Field label="E-mail (usado no login)" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Field label="Cargo" mandatory={false} placeholder="Ex.: Estoquista" value={form.cargo} onChange={set('cargo')} error={errors.cargo} />
          <Field label="Telefone" mandatory={false} value={form.telefone} onChange={set('telefone')} error={errors.telefone} />
        </div>
        <PasswordField label={membro ? 'Nova senha (deixe vazio para manter)' : 'Senha (8 a 72 caracteres)'} mandatory={!membro}
          autoComplete="new-password" value={form.senha} onChange={set('senha')} error={errors.senha} />
        <label className="mt-4 flex items-center gap-2 text-sm"><Toggle checked={gerencia} label="Gerencia a equipe" onChange={setGerencia} /> Pode gerenciar a equipe</label>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
