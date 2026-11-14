import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FormEvent } from 'react';
import { api, ApiError, errorMessage } from '../../api/client';
import Button from '../../components/Button';
import { PasswordField } from '../../components/Field';
import { FormError } from '../../components/State';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Password() {
  const toast = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ senha_atual: '', nova_senha: '', confirmar: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.nova_senha !== form.confirmar) return setErrors({ confirmar: 'As senhas não conferem.' });
    setSending(true);
    setErrors({});
    setFormError('');
    try {
      await api.patch('/minha-conta/senha', { senha_atual: form.senha_atual, nova_senha: form.nova_senha });
      // A API encerra todas as sessões abertas antes da troca, inclusive esta.
      logout();
      toast('Senha alterada. Entre de novo com a senha nova.');
      navigate('/entrar', { replace: true, state: { from: '/minha-conta', cadastro: 'Senha alterada. Entre com a senha nova.' } });
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="max-w-md rounded-3xl bg-white p-6">
      <p className="text-sm text-muted">Recebeu uma senha temporária da equipe? Troque por uma só sua aqui. Depois da troca você entra de novo com a senha nova.</p>
      <FormError message={formError} />
      <PasswordField label="Senha atual" autoComplete="current-password" value={form.senha_atual} onChange={(e) => setForm({ ...form, senha_atual: e.target.value })} error={errors.senha_atual} />
      <PasswordField label="Nova senha (8 a 72 caracteres)" autoComplete="new-password" value={form.nova_senha} onChange={(e) => setForm({ ...form, nova_senha: e.target.value })} error={errors.nova_senha} />
      <PasswordField label="Confirmar nova senha" autoComplete="new-password" value={form.confirmar} onChange={(e) => setForm({ ...form, confirmar: e.target.value })} error={errors.confirmar} />
      <Button type="submit" variant="primary" disabled={sending} className="mt-6 disabled:opacity-60">{sending ? 'Salvando...' : 'Trocar senha'}</Button>
    </form>
  );
}
