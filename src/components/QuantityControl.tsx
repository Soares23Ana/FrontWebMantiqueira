interface Props {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

export default function QuantityControl({ value, onDecrease, onIncrease }: Props) {
  const style = 'h-8 w-8 rounded-full bg-surface font-extrabold transition hover:bg-black/10';
  return (
    <div className="flex items-center gap-2">
      <button aria-label="Diminuir" onClick={onDecrease} className={style}>−</button>
      <span className="w-8 text-center">{value}</span>
      <button aria-label="Aumentar" onClick={onIncrease} className={style}>+</button>
    </div>
  );
}
