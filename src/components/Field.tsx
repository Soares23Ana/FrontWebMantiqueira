import type { ComponentProps, ReactNode } from 'react';

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
