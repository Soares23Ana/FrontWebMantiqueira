const paths = {
  user: 'M12 4a4 4 0 100 8 4 4 0 000-8zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7',
  heart: 'M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z',
  cart: 'M3 4h2.5l2.2 11h10.6l2-8H6.5M9 18.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM17 18.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
};

interface Props {
  name: keyof typeof paths;
  filled?: boolean;
  className?: string;
}

export default function Icon({ name, filled = false, className = 'h-6 w-6' }: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}
      fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}
