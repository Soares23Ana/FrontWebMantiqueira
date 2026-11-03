import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError, errorMessage } from '../api/client';
import AddressFields, { cleanAddress, emptyAddress } from '../components/AddressFields';
import Button from '../components/Button';
import Field from '../components/Field';
import { FormError } from '../components/State';
import { formatCnpj, isValidCnpj, normalizarCnpj } from '../utils/cnpj';
import { formatPhone } from '../utils/format';

interface Empresa {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao: string;
  cidade: string;
  estado: string;
}

type EmpresaStatus = { kind: 'loading' } | { kind: 'ok'; empresa: Empresa } | { kind: 'nao-encontrado' } | null;

// Cadastro de cliente: CNPJ válido (numérico ou com letras), responsável, contato, senha e endereço principal.
// Com o CNPJ completo, mostra o nome da empresa na Receita antes de enviar (GET /cnpj/:cnpj). A consulta é só
// informativa: quem valida é o POST /auth/register.
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ cnpj: '', nome: '', email: '', telefone: '', senha: '', confirmar: '' });
  const [endereco, setEndereco] = useState(emptyAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [empresa, setEmpresa] = useState<EmpresaStatus>(null);

  const cnpjNormalizado = normalizarCnpj(form.cnpj);
  const cnpjOk = isValidCnpj(cnpjNormalizado);

  useEffect(() => {
    if (!cnpjOk) {
      setEmpresa(null);
      return;
    }
    let cancelled = false;
    setEmpresa({ kind: 'loading' });
    // Sem pontuação: a "/" do CNPJ quebraria o caminho da rota.
    api.get<Empresa>(`/cnpj/${cnpjNormalizado}`)
      .then((e) => !cancelled && setEmpresa({ kind: 'ok', empresa: e }))
      .catch((e) => !cancelled && setEmpresa(e instanceof ApiError && e.status === 404 ? { kind: 'nao-encontrado' } : null));
    return () => {
      cancelled = true;
    };
  }, [cnpjOk, cnpjNormalizado]);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: k === 'cnpj' ? formatCnpj(v) : k === 'telefone' ? formatPhone(v) : v }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!cnpjOk) local.cnpj = 'Informe um CNPJ válido.';
    if (form.senha.length < 8) local.senha = 'A senha precisa ter pelo menos 8 caracteres.';
    if (form.senha !== form.confirmar) local.confirmar = 'As senhas não conferem.';
    setErrors(local);
    setFormError('');
    if (Object.keys(local).length) return;
    setSending(true);
    try {
      const { confirmar: _c, ...dados } = form;
      await api.post('/auth/register', { ...dados, cnpj: cnpjNormalizado, endereco: cleanAddress(endereco) });
      navigate('/entrar', { state: { cadastro: 'Cadastro realizado! Entre com o CNPJ e a senha.' } });
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = err.fieldErrors;
        if (err.codigo === 'CNPJ_NAO_ENCONTRADO') fields.cnpj = 'Não encontramos este CNPJ na Receita Federal. Confira os números e letras digitados.';
        setErrors(fields);
        // Os erros de CNPJ já aparecem no próprio campo.
        if (err.codigo === 'CNPJ_NAO_ENCONTRADO' || err.codigo === 'CNPJ_INATIVO') return setFormError('');
        if (err.codigo === 'SERVICO_INDISPONIVEL') return setFormError('Não foi possível validar o CNPJ agora. Tente novamente em instantes.');
      }
      setFormError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const temLetras = /[A-Z]/.test(cnpjNormalizado.slice(0, 12));

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <h2 className="text-3xl font-extrabold">Criar conta</h2>
      <p className="mb-8 text-muted">Cadastro para lojistas. Já tem conta? <Link to="/entrar" className="font-extrabold text-brand">Entrar</Link></p>
      <form onSubmit={submit} noValidate className="rounded-3xl bg-white p-6">
        <FormError message={formError} />
        <h3 className="font-extrabold">Empresa e responsável</h3>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field className="sm:col-span-2" label="CNPJ" autoCapitalize="characters" spellCheck={false} placeholder="00.000.000/0000-00"
            value={form.cnpj} onChange={set('cnpj')} error={errors.cnpj} />
          {empresa?.kind === 'loading' && <p role="status" className="mt-1 text-sm text-muted sm:col-span-2">Consultando a Receita Federal...</p>}
          {empresa?.kind === 'ok' && (
            <p role="status" className={`mt-2 rounded-xl p-3 text-sm sm:col-span-2 ${empresa.empresa.situacao === 'ATIVA' ? 'bg-green-50 text-green-800' : 'bg-accent/10 text-accent'}`}>
              <b>{empresa.empresa.razao_social}</b>
              {empresa.empresa.nome_fantasia && empresa.empresa.nome_fantasia !== empresa.empresa.razao_social && <> ({empresa.empresa.nome_fantasia})</>}
              {empresa.empresa.cidade && <> · {empresa.empresa.cidade}/{empresa.empresa.estado}</>}
              <span className="block">
                {empresa.empresa.situacao === 'ATIVA'
                  ? 'Situação ativa na Receita Federal. Confira se é a sua empresa.'
                  : `Este CNPJ está com situação ${empresa.empresa.situacao} na Receita Federal. Só empresas com CNPJ ativo podem se cadastrar.`}
              </span>
            </p>
          )}
          {empresa?.kind === 'nao-encontrado' && (
            <p role="status" className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 sm:col-span-2">
              CNPJ não encontrado na Receita Federal.{' '}
              {temLetras ? 'Os CNPJs com letras são novos e a consulta pode ainda não conhecê-los: você pode continuar, e a equipe confere o cadastro.' : 'Confira os números digitados.'}
            </p>
          )}
          <Field label="Nome do responsável" value={form.nome} onChange={set('nome')} error={errors.nome} autoComplete="name" />
          <Field label="E-mail" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
          <Field label="Telefone (com DDD)" inputMode="tel" placeholder="(19) 99999-0000" value={form.telefone} onChange={set('telefone')} error={errors.telefone} />
          <span className="hidden sm:block" />
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
