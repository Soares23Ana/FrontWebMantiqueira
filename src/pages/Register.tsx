import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError, errorMessage } from '../api/client';
import AddressFields, { cleanAddress, emptyAddress } from '../components/AddressFields';
import Button from '../components/Button';
import Field from '../components/Field';
import { FormError } from '../components/State';
import { formatCnpj, isValidCnpj } from '../utils/cnpj';
import { formatPhone } from '../utils/format';

// Cadastro de cliente: CNPJ válido, responsável, contato, senha e endereço principal (POST /auth/register).
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ cnpj: '', nome: '', email: '', telefone: '', senha: '', confirmar: '' });
  const [endereco, setEndereco] = useState(emptyAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: k === 'cnpj' ? formatCnpj(v) : k === 'telefone' ? formatPhone(v) : v }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!isValidCnpj(form.cnpj)) local.cnpj = 'Informe um CNPJ válido.';
    if (form.senha.length < 8) local.senha = 'A senha precisa ter pelo menos 8 caracteres.';
    if (form.senha !== form.confirmar) local.confirmar = 'As senhas não conferem.';
    setErrors(local);
    setFormError('');
    if (Object.keys(local).length) return;
    setSending(true);
    try {
      const { confirmar: _c, ...dados } = form;
      await api.post('/auth/register', { ...dados, endereco: cleanAddress(endereco) });
      navigate('/entrar', { state: { cadastro: 'Cadastro realizado! Entre com o CNPJ e a senha.' } });
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <h2 className="text-3xl font-extrabold">Criar conta</h2>
      <p className="mb-8 text-muted">Cadastro para lojistas. Já tem conta? <Link to="/entrar" className="font-extrabold text-brand">Entrar</Link></p>
      <form onSubmit={submit} noValidate className="rounded-3xl bg-white p-6">
        <FormError message={formError} />
        <h3 className="font-extrabold">Empresa e responsável</h3>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="CNPJ" inputMode="numeric" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={set('cnpj')} error={errors.cnpj} />
          <Field label="Nome do responsável" value={form.nome} onChange={set('nome')} error={errors.nome} autoComplete="name" />
          <Field label="E-mail" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
          <Field label="Telefone (com DDD)" inputMode="tel" placeholder="(19) 99999-0000" value={form.telefone} onChange={set('telefone')} error={errors.telefone} />
          <Field label="Senha" type="password" value={form.senha} onChange={set('senha')} error={errors.senha} autoComplete="new-password" />
          <Field label="Confirmar senha" type="password" value={form.confirmar} onChange={set('confirmar')} error={errors.confirmar} autoComplete="new-password" />
        </div>
        <h3 className="mt-8 font-extrabold">Endereço de entrega</h3>
        <AddressFields value={endereco} onChange={setEndereco} errors={errors} prefix="endereco." />
        <Button type="submit" variant="primary" disabled={sending} className="mt-8 w-full rounded-lg uppercase disabled:opacity-60">
          {sending ? 'Enviando...' : 'Criar conta'}
        </Button>
      </form>
    </section>
  );
}
