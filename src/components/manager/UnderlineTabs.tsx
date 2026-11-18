import type { KeyboardEvent } from 'react';

interface Props<T extends string> {
  tabs: readonly T[];
  value: T;
  onChange: (tab: T) => void;
  label: string;
  /** Prefixo dos ids (aba-0, aba-1...), para o painel apontar com aria-labelledby. */
  idPrefix?: string;
  /** Id do painel controlado pelas abas (aria-controls). */
  panelId?: string;
}

// Abas sublinhadas (padrão WAI-ARIA: setas e Home/End trocam de aba, só a ativa entra na ordem do Tab).
export default function UnderlineTabs<T extends string>({ tabs, value, onChange, label, idPrefix = 'aba', panelId }: Props<T>) {
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = tabs.indexOf(value);
    const prox = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : e.key === 'ArrowLeft' ? tabs[(i + tabs.length - 1) % tabs.length]
      : e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs[tabs.length - 1] : null;
    if (!prox) return;
    e.preventDefault();
    onChange(prox);
    document.getElementById(`${idPrefix}-${tabs.indexOf(prox)}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="flex gap-6 overflow-x-auto border-b border-black/10">
      {tabs.map((a, i) => (
        <button key={a} id={`${idPrefix}-${i}`} type="button" role="tab" aria-selected={value === a} aria-controls={panelId} tabIndex={value === a ? 0 : -1}
          onClick={() => onChange(a)} onKeyDown={onKeyDown}
          className={`-mb-px whitespace-nowrap border-b-2 px-1 pb-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${value === a ? 'border-brand font-extrabold text-ink' : 'border-transparent font-medium text-muted hover:text-ink'}`}>
          {a}
        </button>
      ))}
    </div>
  );
}
