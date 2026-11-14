import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import Icon from './Icon';

type Props = ComponentProps<'input'> & {
  label: string;
  error?: string;
  adornment?: ReactNode;
  mandatory?: boolean; // mostra o * vermelho (padrão: sim)
};

const inputClass = 'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-ink outline-none focus:border-brand disabled:bg-surface';

export default function Field({ label, error, adornment, mandatory = true, className = '', ...input }: Props) {
  return (
    <label className={`mt-3 grid gap-1.5 text-muted ${className}`}>
      <span>{label} {mandatory && <b className="text-accent">*</b>}</span>
      <span className="relative block">
        <input {...input} aria-invalid={!!error} className={`${inputClass} ${adornment ? 'pr-20' : ''}`} />
        {adornment && <span className="absolute right-3 top-1/2 -translate-y-1/2">{adornment}</span>}
      </span>
      {error && <small role="alert" className="text-accent">{error}</small>}
    </label>
  );
}

type PasswordProps = Omit<ComponentProps<typeof Field>, 'type' | 'adornment'> & {
  /** Começa com a senha visível (ex.: senha temporária que a equipe acabou de gerar). */
  visivelInicial?: boolean;
};

// Campo de senha com o olhinho para mostrar ou esconder o que foi digitado.
export function PasswordField({ visivelInicial = false, ...props }: PasswordProps) {
  const [visivel, setVisivel] = useState(visivelInicial);
  const rotulo = visivel ? 'Ocultar senha' : 'Mostrar senha';
  return (
    <Field {...props} type={visivel ? 'text' : 'password'}
      adornment={
        <button type="button" onClick={() => setVisivel((v) => !v)} aria-label={rotulo} title={rotulo} aria-pressed={visivel}
          className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:text-brand">
          <Icon name={visivel ? 'eyeOff' : 'eye'} className="h-5 w-5" />
        </button>
      } />
  );
}

type SelectProps = ComponentProps<'select'> & { label: string; error?: string; mandatory?: boolean };

export function SelectField({ label, error, mandatory = true, className = '', children, ...select }: SelectProps) {
  return (
    <label className={`mt-3 grid gap-1.5 text-muted ${className}`}>
      <span>{label} {mandatory && <b className="text-accent">*</b>}</span>
      <select {...select} aria-invalid={!!error} className={inputClass}>{children}</select>
      {error && <small role="alert" className="text-accent">{error}</small>}
    </label>
  );
}

type TextAreaProps = ComponentProps<'textarea'> & { label: string; error?: string; mandatory?: boolean };

export function TextAreaField({ label, error, mandatory = false, className = '', ...area }: TextAreaProps) {
  return (
    <label className={`mt-3 grid gap-1.5 text-muted ${className}`}>
      <span>{label} {mandatory && <b className="text-accent">*</b>}</span>
      <textarea rows={3} {...area} aria-invalid={!!error} className={inputClass} />
      {error && <small role="alert" className="text-accent">{error}</small>}
    </label>
  );
}
