import type { ComponentProps } from 'react';
import Icon from '../Icon';
import type { IconName } from '../Icon';

type Props = Omit<ComponentProps<'button'>, 'children'> & {
  icon: IconName;
  label: string;
  /** true: vermelho sempre; 'hover': cinza/marca e vermelho só no hover e no foco (ação destrutiva discreta). */
  danger?: boolean | 'hover';
};

export default function IconButton({ icon, label, danger = false, className = '', ...rest }: Props) {
  return (
    <button aria-label={label} title={label}
      className={`grid h-9 w-9 place-items-center rounded-full transition disabled:opacity-30 ${danger === 'hover' ? 'text-brand hover:bg-accent/10 hover:text-accent focus-visible:bg-accent/10 focus-visible:text-accent' : danger ? 'text-accent hover:bg-accent/10' : 'text-brand hover:bg-brand/10'} focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand ${className}`}
      {...rest}>
      <Icon name={icon} className="h-5 w-5" />
    </button>
  );
}
