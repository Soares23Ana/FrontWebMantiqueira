import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError, errorMessage } from '../api/client';
import Button from '../components/Button';
import { PasswordField } from '../components/Field';
import Logo from '../components/Logo';
import { FormError } from '../components/State';
import { useStore } from '../context/StoreContext';

type Fase = 'validando' | 'invalido' | 'formulario' | 'sucesso';

// Página pública aberta pelo link que a equipe envia: a pessoa escolhe a nova senha. O token fica só em memória
// (sai do endereço assim que a página abre), não vai para localStorage nem para o console, e a página não tem
// links externos nem imagens de terceiros para o token não vazar pelo cabeçalho de origem.
export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { config } = useStore();
  const token = useRef(params.get('token') ?? '');
  const [fase, setFase] = useState<Fase>('validando');
  const [senha, setSenha] = useState('');
  const [repita, setRepita] = useState('');
  const [errors, setErrors] = useState({ senha: '', repita: '' });
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);

  // Sem este meta, o navegador poderia mandar o endereço (com o token) a outros sites.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = 'no-referrer';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  useEffect(() => {
    const t = token.current;
    navigate('/redefinir-senha', { replace: true }); // tira o token do endereço
    if (!t) { setFase('invalido'); return; }
    let ativo = true;
    api.post<{ valido: boolean }>('/auth/redefinir-senha/validar', { token: t })
      .then((r) => ativo && setFase(r.valido ? 'formulario' : 'invalido'))
      .catch(() => ativo && setFase('invalido'));
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      senha: senha.length < 8 || senha.length > 72 ? 'A senha deve ter de 8 a 72 caracteres.' : '',
      repita: repita !== senha ? 'As senhas não são iguais.' : '',
    };
    setErrors(next);
    setFormError('');
    if (next.senha || next.repita) return;
    setSending(true);
    try {
      await api.post('/auth/redefinir-senha', { token: token.current, nova_senha: senha });
      token.current = '';
      setSenha('');
      setRepita('');
      setFase('sucesso');
    } catch (err) {
      if (err instanceof ApiError && err.codigo === 'TOKEN_INVALIDO') setFase('invalido');
      else if (err instanceof ApiError && err.fieldErrors.nova_senha) setErrors({ senha: err.fieldErrors.nova_senha, repita: '' });
      else setFormError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-5 py-12">
      <Logo variante="vertical" className="mx-auto mb-6 h-28" />
      <h2 className="mb-8 text-center text-3xl font-extrabold">Nova senha</h2>

      {fase === 'validando' && <p role="status" className="text-center text-muted">Verificando o link...</p>}

      {fase === 'invalido' && (
        <div role="alert" className="rounded-2xl bg-accent/10 p-5 text-center text-accent">
          <p className="font-extrabold">Link inválido ou expirado. Peça um novo link à equipe.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {config?.whatsapp && (
              <a href={`https://wa.me/${config.whatsapp}?text=${encodeURIComponent('Olá! Meu link para criar uma nova senha não funcionou. Pode me enviar outro?')}`}
                target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-600 px-5 py-2 font-extrabold text-white hover:brightness-110">
                Fale com a Mantiqueira no WhatsApp
              </a>
            )}
            <Link to="/entrar" className="rounded-full bg-brand px-5 py-2 font-extrabold text-white hover:bg-brand-dark">Ir para o login</Link>
          </div>
        </div>
      )}

      {fase === 'formulario' && (
        <form onSubmit={submit} noValidate>
          <p className="mb-4 text-muted">Escolha a nova senha da sua conta, de 8 a 72 caracteres.</p>
          <FormError message={formError} />
          <PasswordField label="Nova senha" value={senha} autoComplete="new-password" onChange={(e) => setSenha(e.target.value)} error={errors.senha} />
          <PasswordField label="Repita a nova senha" value={repita} autoComplete="new-password" onChange={(e) => setRepita(e.target.value)} error={errors.repita} />
          <Button type="submit" variant="primary" disabled={sending} className="mt-4 w-full rounded-lg uppercase disabled:opacity-60">
            {sending ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      )}

      {fase === 'sucesso' && (
        <div role="status" className="rounded-2xl bg-green-100 p-5 text-center text-green-800">
          <p className="font-extrabold">Senha alterada. Entre com a nova senha.</p>
          <Link to="/entrar" className="mt-4 inline-block rounded-full bg-brand px-6 py-2 font-extrabold text-white hover:bg-brand-dark">Entrar</Link>
        </div>
      )}
    </section>
  );
}
