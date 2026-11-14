import { useTheme } from '../context/ThemeContext';
import Icon from './Icon';

// Botão de alternar entre o modo claro e o noturno (fica no cabeçalho da loja e do gestor).
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { escuro, alternar } = useTheme();
  const rotulo = escuro ? 'Mudar para o modo claro' : 'Mudar para o modo noturno';
  return (
    <button type="button" onClick={alternar} aria-label={rotulo} title={rotulo} aria-pressed={escuro}
      className={`grid h-11 w-11 place-items-center rounded-full transition hover:bg-surface ${className}`}>
      <Icon name={escuro ? 'sun' : 'moon'} />
    </button>
  );
}
