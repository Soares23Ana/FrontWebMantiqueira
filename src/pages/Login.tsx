import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, errorMessage } from '../api/client';
import Button from '../components/Button';
import Field from '../components/Field';
import { FormError } from '../components/State';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { formatCnpj, isValidCnpj, normalizarCnpj } from '../utils/cnpj';

// Tela única de login, neutra: não diz que existe uma área da equipe. O mesmo campo aceita CNPJ (numérico ou
// com letras) ou e-mail; a regra da API é só o "@": com "@" é e-mail, sem "@" é CNPJ.
export default function Login() {
  const { user, login, expiredMessage } = useAuth();
  const { config } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; cadastro?: string } | null;
  const from = state?.from;
  const cadastroMsg = state?.cadastro;
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ identificador: '', senha: '' });
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);

  if (user && !sending) return <Navigate to={user.tipo === 'equipe' ? '/gestor' : from ?? '/minha-conta'} replace />;

  // A máscara de CNPJ só entra quando dá para ter certeza de que é um CNPJ: só números, ou os 14 caracteres completos.
  // Antes disso o texto fica como foi digitado, porque um e-mail também começa com letras.
  const onChange = (value: string) => {
    if (value.includes('@')) return setIdentificador(value.trim());
    const n = normalizarCnpj(value);
    setIdentificador(/^\d*$/.test(n) || n.length >= 14 ? formatCnpj(value) : value);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const isEmail = identificador.includes('@');
    const next = {
      identificador: !identificador.trim()
        ? 'Informe seu CNPJ ou e-mail.'
        : !isEmail && !isValidCnpj(identificador) ? 'Informe um CNPJ válido ou um e-mail.' : '',
      senha: senha ? '' : 'Informe sua senha.',
    };
    setErrors(next);
    setFormError('');
    if (next.identificador || next.senha) return;
    setSending(true);
    try {
      const u = await login(isEmail ? identificador.trim() : normalizarCnpj(identificador), senha);
      if (u.tipo === 'equipe') navigate(from?.startsWith('/gestor') ? from : '/gestor', { replace: true });
      else navigate(from && !from.startsWith('/gestor') ? from : '/minha-conta', { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError && err.codigo === 'MUITAS_TENTATIVAS'
        ? 'Muitas tentativas de login. Aguarde alguns minutos e tente de novo.'
        : errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <h2 className="mb-10 text-center text-3xl font-extrabold">Entrar</h2>
      {(cadastroMsg || expiredMessage) && (
        <p role="status" className="mx-auto mb-6 max-w-xl rounded-xl bg-white p-4 text-center font-medium text-brand">{cadastroMsg ?? expiredMessage}</p>
      )}
      <div className="grid gap-14 md:grid-cols-2">
        <form onSubmit={submit} noValidate>
          <h3 className="mb-4 text-xl font-extrabold">Já tem conta? Entre.</h3>
          <FormError message={formError} />
          <Field label="CNPJ ou e-mail" value={identificador} placeholder="00.000.000/0000-00" autoComplete="username"
            autoCapitalize="none" spellCheck={false} onChange={(e) => onChange(e.target.value)} error={errors.identificador} />
          <Field label="Senha" type={showPassword ? 'text' : 'password'} value={senha} placeholder="Senha" autoComplete="current-password"
            onChange={(e) => setSenha(e.target.value)} error={errors.senha}
            adornment={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-sm font-extrabold text-brand">{showPassword ? 'Ocultar' : 'Mostrar'}</button>} />
          <p className="my-4 text-right text-sm text-muted">
            Esqueceu a senha? {config?.whatsapp ? (
              <a href={`https://wa.me/${config.whatsapp}?text=${encodeURIComponent('Olá! Esqueci a senha do site e preciso de uma senha temporária.')}`}
                target="_blank" rel="noopener noreferrer" className="font-extrabold text-brand">Fale com a Mantiqueira no WhatsApp</a>
            ) : 'Fale com a Mantiqueira pelo telefone'}: a equipe define uma senha temporária para você.
          </p>
          <Button variant="primary" type="submit" disabled={sending} className="w-full rounded-lg uppercase disabled:opacity-60">
            {sending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <div>
          <h3 className="mb-4 text-xl font-extrabold">Novo cliente? Crie sua conta</h3>
          <p className="text-muted">Cadastre sua empresa com o CNPJ e o endereço de entrega para ver o estoque e fazer pedidos.</p>
          <Link to="/cadastro" className="mt-6 block w-full rounded-lg bg-brand px-5 py-3 text-center font-extrabold uppercase text-white hover:bg-brand-dark">
            Criar conta
          </Link>
        </div>
      </div>
    </section>
  );
}
