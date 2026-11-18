import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, errorMessage } from '../api/client';
import Button from '../components/Button';
import Field, { PasswordField } from '../components/Field';
import Logo from '../components/Logo';
import { FormError } from '../components/State';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { api } from '../api/client';
import { formatCnpj, isValidCnpj, normalizarCnpj } from '../utils/cnpj';
import { caminhoInternoSeguro } from '../utils/safeRedirect';

// Tela única de login, neutra: não diz que existe uma área da equipe. Para o cliente o campo é só de CNPJ (numérico ou
// com letras). A equipe continua entrando pelo mesmo campo com o e-mail, sem aparecer na tela: a regra da API é só o
// "@" (com "@" é e-mail, sem "@" é CNPJ).
export default function Login() {
  const { user, login, expiredMessage } = useAuth();
  const { config } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; cadastro?: string } | null;
  // O destino de retorno vem do histórico do navegador: só vale se for um caminho interno seguro.
  const from = caminhoInternoSeguro(state?.from);
  const cadastroMsg = state?.cadastro;
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState({ identificador: '', senha: '' });
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [esqueci, setEsqueci] = useState(false);
  const [cnpjEsqueci, setCnpjEsqueci] = useState('');
  const [erroEsqueci, setErroEsqueci] = useState('');
  const [respostaEsqueci, setRespostaEsqueci] = useState('');
  const [enviandoEsqueci, setEnviandoEsqueci] = useState(false);

  if (user && !sending) return <Navigate to={user.tipo === 'equipe' ? '/gestor' : from ?? '/minha-conta'} replace />;

  // A máscara de CNPJ só entra quando dá para ter certeza de que é um CNPJ: só números, ou os 14 caracteres completos.
  // Antes disso o texto fica como foi digitado, porque um e-mail também começa com letras.
  const onChange = (value: string) => {
    if (value.includes('@')) return setIdentificador(value.trim());
    const n = normalizarCnpj(value);
    setIdentificador(/^\d*$/.test(n) || n.length >= 14 ? formatCnpj(value) : value);
  };

  // "Esqueci a senha": o cliente informa o CNPJ e a equipe recebe o pedido (aviso no painel). A resposta é sempre a mesma.
  const pedirNovaSenha = async () => {
    setErroEsqueci('');
    if (!isValidCnpj(cnpjEsqueci)) {
      setErroEsqueci(cnpjEsqueci.trim() ? 'Informe um CNPJ válido.' : 'Informe o CNPJ da sua empresa.');
      return;
    }
    setEnviandoEsqueci(true);
    try {
      const r = await api.post<{ mensagem: string }>('/auth/redefinicao-senha/solicitar', { documento: normalizarCnpj(cnpjEsqueci) });
      setRespostaEsqueci(r.mensagem);
    } catch (err) {
      setErroEsqueci(errorMessage(err));
    } finally {
      setEnviandoEsqueci(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const isEmail = identificador.includes('@');
    const next = {
      identificador: !identificador.trim()
        ? 'Informe seu CNPJ.'
        : !isEmail && !isValidCnpj(identificador) ? 'Informe um CNPJ válido.' : '',
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
      <Logo variante="vertical" className="mx-auto mb-6 h-28" />
      <h2 className="mb-10 text-center text-3xl font-extrabold">Entrar</h2>
      {(cadastroMsg || expiredMessage) && (
        <p role="status" className="mx-auto mb-6 max-w-xl rounded-xl bg-white p-4 text-center font-medium text-brand">{cadastroMsg ?? expiredMessage}</p>
      )}
      <div className="grid gap-14 md:grid-cols-2">
        <form onSubmit={submit} noValidate>
          <h3 className="mb-4 text-xl font-extrabold">Já tem conta? Entre.</h3>
          <FormError message={formError} />
          <Field label="CNPJ" value={identificador} placeholder="00.000.000/0000-00" autoComplete="username"
            autoCapitalize="none" spellCheck={false} onChange={(e) => onChange(e.target.value)} error={errors.identificador} />
          <PasswordField label="Senha" value={senha} placeholder="Senha" autoComplete="current-password"
            onChange={(e) => setSenha(e.target.value)} error={errors.senha} />
          <div className="my-4 text-sm text-muted">
            {!esqueci ? (
              <p className="text-right">
                Esqueceu a senha?{' '}
                <button type="button" onClick={() => setEsqueci(true)} className="font-extrabold text-brand hover:underline">Peça uma nova senha</button>
              </p>
            ) : respostaEsqueci ? (
              <div role="status" className="rounded-xl bg-green-100 p-3 text-green-800">
                <p className="font-extrabold">{respostaEsqueci}</p>
                {config?.whatsapp && (
                  <p className="mt-1">
                    Se preferir, <a href={`https://wa.me/${config.whatsapp}?text=${encodeURIComponent('Olá! Esqueci a senha do site e preciso de um link para criar uma nova senha.')}`}
                      target="_blank" rel="noopener noreferrer" className="font-extrabold underline">fale com a Mantiqueira no WhatsApp</a>.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-black/10 p-3">
                <p className="font-extrabold text-ink">Esqueceu a senha?</p>
                <p className="mb-1">Informe o CNPJ da sua empresa. A equipe da Mantiqueira recebe o seu pedido e envia um link para você criar uma nova senha.</p>
                <Field label="CNPJ da empresa" value={cnpjEsqueci} placeholder="00.000.000/0000-00" autoCapitalize="characters" spellCheck={false}
                  onChange={(e) => setCnpjEsqueci(formatCnpj(e.target.value))} error={erroEsqueci}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void pedirNovaSenha(); } }} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="primary" disabled={enviandoEsqueci} onClick={() => void pedirNovaSenha()} className="px-4 py-2 text-sm disabled:opacity-60">
                    {enviandoEsqueci ? 'Enviando...' : 'Pedir nova senha'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => { setEsqueci(false); setErroEsqueci(''); }} className="px-4 py-2 text-sm">Cancelar</Button>
                </div>
              </div>
            )}
          </div>
          <Button variant="primary" type="submit" disabled={sending} className="w-full rounded-lg uppercase disabled:opacity-60">
            {sending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <div>
          <h3 className="mb-4 text-xl font-extrabold">Novo cliente? Crie sua conta</h3>
          <p className="text-muted">Cadastre sua empresa com o CNPJ e o endereço de entrega para consultar a disponibilidade e fazer pedidos.</p>
          <Link to="/cadastro" className="mt-6 block w-full rounded-lg bg-brand px-5 py-3 text-center font-extrabold uppercase text-white hover:bg-brand-dark">
            Criar conta
          </Link>
        </div>
      </div>
    </section>
  );
}
