import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children?: ReactNode; // botões de ação
}

export default function SectionHeader({ title, subtitle, children }: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-extrabold text-ink">{title}</h2>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
