import { useState } from 'react';
import type { FormEvent } from 'react';
import Button from '../components/Button';
import Field from '../components/Field';
import { formatCnpj, isValidCnpj } from '../utils/cnpj';

const CNPJ_ERROR = 'Informe um CNPJ válido, com 14 dígitos.';

export default function Login() {
  const [cnpj, setCnpj] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newCnpj, setNewCnpj] = useState('');
  const [errors, setErrors] = useState({ cnpj: '', password: '', newCnpj: '' });
  const [message, setMessage] = useState('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const next = { ...errors, cnpj: isValidCnpj(cnpj) ? '' : CNPJ_ERROR, password: password ? '' : 'Informe sua senha.' };
    setErrors(next);
    setMessage(!next.cnpj && !next.password ? 'Login realizado (demonstração).' : '');
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    const error = isValidCnpj(newCnpj) ? '' : CNPJ_ERROR;
    setErrors({ ...errors, newCnpj: error });
    setMessage(error ? '' : 'Cadastro iniciado (demonstração).');
  };

  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <h2 className="mb-10 text-center text-3xl font-extrabold">Login do Cliente</h2>
      {message && <p role="status" className="mb-6 rounded-xl bg-white p-4 text-center font-medium text-brand">{message}</p>}
      <div className="grid gap-14 md:grid-cols-2">
        <form onSubmit={handleLogin} noValidate>
          <h3 className="mb-4 text-xl font-extrabold">Se você tem uma conta, faça login com seu CNPJ.</h3>
          <Field label="CNPJ" value={cnpj} placeholder="00.000.000/0000-00" inputMode="numeric"
            onChange={(e) => setCnpj(formatCnpj(e.target.value))} error={errors.cnpj} />
          <Field label="Senha" type={showPassword ? 'text' : 'password'} value={password} placeholder="Senha"
            onChange={(e) => setPassword(e.target.value)} error={errors.password}
            adornment={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-sm font-extrabold text-brand">{showPassword ? 'Ocultar' : 'Mostrar'}</button>} />
          <p className="my-4 text-right font-extrabold">Recuperar senha</p>
          <Button variant="primary" type="submit" className="w-full rounded-lg uppercase">Entrar</Button>
        </form>
        <form onSubmit={handleRegister} noValidate>
          <h3 className="mb-4 text-xl font-extrabold">Novo cliente? Crie sua conta</h3>
          <Field label="CNPJ" value={newCnpj} placeholder="00.000.000/0000-00" inputMode="numeric"
            onChange={(e) => setNewCnpj(formatCnpj(e.target.value))} error={errors.newCnpj} />
          <Button variant="primary" type="submit" className="mt-6 w-full rounded-lg uppercase">Registrar</Button>
        </form>
      </div>
    </section>
  );
}
