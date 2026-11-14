import type { ComponentProps } from 'react';

type Variant = 'primary' | 'accent' | 'ghost';
type Props = ComponentProps<'button'> & { variant?: Variant };

const styles: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  accent: 'bg-accent text-white hover:brightness-110',
  ghost: 'bg-surface text-ink hover:bg-black/10',
};

export default function Button({ variant = 'accent', className = '', ...rest }: Props) {
  // O espaçamento padrão (px-5 py-3) só vale quando a tela não define o próprio: sem isso, "px-3 py-1" não
  // vence "px-5 py-3" e os botões pequenos ficavam grandes.
  const padrao = `${/(^|\s)px-/.test(className) ? '' : 'px-5'} ${/(^|\s)py-/.test(className) ? '' : 'py-3'}`;
  return (
    <button
      className={`rounded-full ${padrao} font-extrabold transition ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}
