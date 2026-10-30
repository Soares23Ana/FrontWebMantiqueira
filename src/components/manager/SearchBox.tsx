import Icon from '../Icon';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export default function SearchBox({ value, onChange, placeholder }: Props) {
  return (
    <label className="relative block min-w-56 flex-1">
      <span className="sr-only">{placeholder}</span>
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-4 outline-none focus:border-brand" />
    </label>
  );
}
