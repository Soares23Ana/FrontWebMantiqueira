import { useRef } from 'react';
import { useElementProgress } from '../hooks/useScroll';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

// Imagem que aumenta de tamanho conforme a página rola.
export default function ZoomImage({ src, alt, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useElementProgress(ref);
  return (
    <div ref={ref} style={{ transform: `scale(${0.75 + progress * 0.4})` }}
      className={`rounded-3xl bg-white p-3 shadow-2xl will-change-transform ${className}`}>
      <img src={src} alt={alt} className="mx-auto max-h-80 w-full object-contain" />
    </div>
  );
}
