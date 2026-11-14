const paths = {
  user: 'M12 4a4 4 0 100 8 4 4 0 000-8zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7',
  heart: 'M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z',
  cart: 'M3 4h2.5l2.2 11h10.6l2-8H6.5M9 18.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM17 18.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
  dashboard: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  orders: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7',
  box: 'M3 7.5L12 3l9 4.5v9L12 21l-9-4.5zM3 7.5L12 12l9-4.5M12 12v9',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-3.6 3-6 7-6s7 2.4 7 6M16 4.2a3.5 3.5 0 010 6.6M18 14.4c2.4.7 4 2.5 4 5.6',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5h.01',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6',
  up: 'M6 14l6-6 6 6',
  down: 'M6 10l6 6 6-6',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  left: 'M14 6l-6 6 6 6',
  right: 'M10 6l6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  upload: 'M12 16V5M7 9l5-5 5 5M5 20h14',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  pulse: 'M3 12h4l3-7 4 14 3-7h4',
  history: 'M4 12a8 8 0 108-8 8 8 0 00-6 2.7M4 4v4h4M12 8v4l3 2',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
  eyeOff: 'M3 3l18 18M10.6 6.2A9.8 9.8 0 0112 6c6.4 0 10 6 10 6a17 17 0 01-3.2 3.9M6.7 7.7C3.9 9.4 2 12 2 12s3.6 6 10 6c1.6 0 3-.3 4.2-.9M9.9 9.9a3 3 0 004.2 4.2',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
};

export type IconName = keyof typeof paths;

interface Props {
  name: IconName;
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
