import { categories } from '../data/products';
import type { CategoryOption, Page } from '../types';
import Icon from './Icon';

interface Props {
  page: Page;
  category: CategoryOption;
  cartCount: number;
  favCount: number;
  onNavigate: (page: Page) => void;
  onSelectCategory: (category: CategoryOption) => void;
}

interface IconLinkProps {
  label: string;
  icon: 'user' | 'heart' | 'cart';
  badge?: number;
  active: boolean;
  onClick: () => void;
}

function IconLink({ label, icon, badge = 0, active, onClick }: IconLinkProps) {
  return (
    <button aria-label={label} onClick={onClick}
      className={`relative grid h-11 w-11 place-items-center rounded-full transition hover:bg-surface ${active ? 'text-accent' : ''}`}>
      <Icon name={icon} />
      {badge > 0 && (
        <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-extrabold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

export default function Header({ page, category, cartCount, favCount, onNavigate, onSelectCategory }: Props) {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-2 md:flex-nowrap md:gap-6">
        <button onClick={() => onSelectCategory('Todos')} className="text-left" aria-label="Ir para a página inicial">
          <img src="/logo-mantiqueira.svg" alt="Mantiqueira Distribuidora" className="h-12 w-auto md:h-14" />
        </button>
        <nav aria-label="Categorias" className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1">
          {categories.map((c) => (
            <button key={c} onClick={() => onSelectCategory(c)}
              className={`whitespace-nowrap rounded-full px-4 py-2 font-medium transition hover:bg-surface ${page === 'home' && category === c ? 'bg-surface text-brand' : ''}`}>
              {c}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex">
          <button onClick={() => onNavigate('gestor')} className={`mr-1 hidden rounded-full px-4 py-2 text-sm font-extrabold transition hover:bg-surface sm:block ${page === 'gestor' ? 'bg-brand text-white hover:bg-brand' : 'text-brand'}`}>Gestor</button>
          <IconLink label="Entrar" icon="user" active={page === 'login'} onClick={() => onNavigate('login')} />
          <IconLink label="Favoritos" icon="heart" badge={favCount} active={page === 'favoritos'} onClick={() => onNavigate('favoritos')} />
          <IconLink label="Carrinho" icon="cart" badge={cartCount} active={page === 'carrinho'} onClick={() => onNavigate('carrinho')} />
        </div>
      </div>
    </header>
  );
}
