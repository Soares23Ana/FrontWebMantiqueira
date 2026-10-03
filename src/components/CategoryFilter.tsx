import type { CategoryOption } from '../types';

interface Props {
  options: CategoryOption[];
  active: CategoryOption;
  onSelect: (category: CategoryOption) => void;
}

export default function CategoryFilter({ options, active, onSelect }: Props) {
  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => onSelect(o)}
          className={`rounded-full border px-5 py-2 font-medium transition ${o === active ? 'border-brand bg-brand text-white' : 'border-black/10 bg-white hover:border-brand'}`}>
          {o}
        </button>
      ))}
    </div>
  );
}
