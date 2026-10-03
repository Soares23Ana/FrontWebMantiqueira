import type { ComponentProps, ReactNode } from 'react';

type Props = ComponentProps<'input'> & {
  label: string;
  error?: string;
  adornment?: ReactNode;
};

export default function Field({ label, error, adornment, ...input }: Props) {
  return (
    <label className="mt-3 grid gap-1.5 text-muted">
      <span>{label} <b className="text-accent">*</b></span>
      <span className="relative block">
        <input {...input} className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-ink outline-none focus:border-brand" />
        {adornment && <span className="absolute right-3 top-1/2 -translate-y-1/2">{adornment}</span>}
      </span>
      {error && <small role="alert" className="text-accent">{error}</small>}
    </label>
  );
}
