import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, ApiError, errorMessage } from '../../api/client';
import Button from '../../components/Button';
import Field from '../../components/Field';
import { ErrorState, FormError, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { formatPhone } from '../../utils/format';
import type { Conta } from '../../types';

export default function Profile() {
  const toast = useToast();
  const conta = useApi(() => api.get<{ conta: Conta }>('/minha-conta'), []);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const c = conta.data?.conta;
    if (c) setForm({ nome: c.nome, email: c.email, telefone: formatPhone(c.telefone) });
  }, [conta.data]);

  if (conta.loading) return <Loading />;
  if (conta.error) return <ErrorState error={conta.error} onRetry={conta.reload} />;
  const c = conta.data!.conta;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setErrors({});
    setFormError('');
    try {
      await api.patch('/minha-conta', form);
      toast('Dados atualizados.');
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="rounded-3xl bg-white p-6">
      <FormError message={formError} />
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="CNPJ" value={c.cnpj ?? ''} disabled mandatory={false} />
        <Field label="Razão social" value={c.razao_social ?? 'A preencher pela Mantiqueira'} disabled mandatory={false} />
        <Field label="Nome do responsável" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} error={errors.nome} />
        <Field label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
        <Field label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })} error={errors.telefone} />
      </div>
      <p className="mt-3 text-sm text-muted">CNPJ e razão social só podem ser alterados pela equipe da Mantiqueira.</p>
      <Button type="submit" variant="primary" disabled={sending} className="mt-6 disabled:opacity-60">{sending ? 'Salvando...' : 'Salvar'}</Button>
    </form>
  );
}
