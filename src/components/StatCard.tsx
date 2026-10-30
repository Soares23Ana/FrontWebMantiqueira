import Icon from './Icon';
import type { IconName } from './Icon';

interface Props {
  label: string;
  value: number | string;
  icon?: IconName;
  hint?: string;
  highlight?: boolean; // vermelho quando há algo a resolver
}

export default function StatCard({ label, value, icon, hint, highlight = false }: Props) {
  const alert = highlight && Number(value) > 0;
  return (
    <div className={`rounded-2xl border p-5 ${alert ? 'border-accent/40 bg-accent/5' : 'border-black/10 bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        {icon && (
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${alert ? 'bg-accent/10 text-accent' : 'bg-brand/10 text-brand'}`}>
            <Icon name={icon} className="h-5 w-5" />
          </span>
        )}
      </div>
      <p className={`mt-1 text-2xl font-extrabold sm:text-3xl ${alert ? 'text-accent' : 'text-brand'}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
