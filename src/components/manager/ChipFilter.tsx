interface Props<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

// Componente genérico: funciona com qualquer lista de textos (categorias, status...).
export default function ChipFilter<T extends string>({ options, value, onChange, label }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} aria-pressed={value === o}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${value === o ? 'bg-brand text-white' : 'bg-white text-ink ring-1 ring-black/10 hover:bg-black/5'}`}>
          {o}
        </button>
      ))}
    </div>
  );
}
