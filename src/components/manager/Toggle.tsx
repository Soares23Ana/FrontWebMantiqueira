interface Props {
  checked: boolean;
  label: string; // lido por leitores de tela
  onChange: (checked: boolean) => void;
}

export default function Toggle({ checked, label, onChange }: Props) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`group relative h-6 w-11 shrink-0 rounded-full ring-1 ring-inset ring-white/25 transition-colors duration-300 motion-reduce:transition-none ${checked ? 'bg-[#4757f0]' : 'bg-[#e30613]'}`}>
      {/* a bolinha desliza com um leve "quique" no fim e se alonga enquanto o botão é pressionado */}
      <span style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[#fff] shadow transition-all duration-300 motion-reduce:transition-none group-active:w-6 ${checked ? 'translate-x-5 group-active:translate-x-4' : ''}`} />
    </button>
  );
}
