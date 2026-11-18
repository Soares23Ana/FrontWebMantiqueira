import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Icon from '../Icon';

// Janelas abertas, da mais antiga à mais nova.
const abertas: symbol[] = [];

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export default function Modal({ title, onClose, children, wide = false }: Props) {
  // fecha com ESC
  // (com janelas empilhadas, ex.: o link de senha sobre a edição do usuário, o ESC fecha só a de cima)
  useEffect(() => {
    const id = Symbol();
    abertas.push(id);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && abertas[abertas.length - 1] === id && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      abertas.splice(abertas.indexOf(id), 1);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-extrabold">{title}</h3>
          <button type="button" aria-label="Fechar" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
