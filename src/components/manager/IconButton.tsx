import type { ComponentProps } from 'react';
import Icon from '../Icon';
import type { IconName } from '../Icon';

type Props = Omit<ComponentProps<'button'>, 'children'> & {
  icon: IconName;
  label: string;
  danger?: boolean;
};

export default function IconButton({ icon, label, danger = false, className = '', ...rest }: Props) {
  return (
    <button aria-label={label} title={label}
      className={`grid h-9 w-9 place-items-center rounded-full transition disabled:opacity-30 ${danger ? 'text-accent hover:bg-accent/10' : 'text-brand hover:bg-brand/10'} ${className}`}
      {...rest}>
      <Icon name={icon} className="h-5 w-5" />
    </button>
  );
}
