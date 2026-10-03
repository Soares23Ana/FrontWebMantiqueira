import type { ComponentProps } from 'react';

type Variant = 'primary' | 'accent' | 'ghost';
type Props = ComponentProps<'button'> & { variant?: Variant };

const styles: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  accent: 'bg-accent text-white hover:brightness-110',
  ghost: 'bg-surface text-ink hover:bg-black/10',
};

export default function Button({ variant = 'accent', className = '', ...rest }: Props) {
  return (
    <button
      className={`rounded-full px-5 py-3 font-extrabold transition ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}
