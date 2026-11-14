import { Link, NavLink, useMatch } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import Icon from './Icon';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import SearchAutocomplete from './SearchAutocomplete';

interface IconLinkProps {
  label: string;
  icon: 'user' | 'heart' | 'cart';
  badge?: number;
  to: string;
  /** Endereço de volta depois do login, quando o link exige estar logado. */
  voltarPara?: string;
}

function IconLink({ label, icon, badge = 0, to, voltarPara }: IconLinkProps) {
  return (
    <NavLink to={to} aria-label={label} title={label} state={voltarPara ? { from: voltarPara } : undefined}
      className={({ isActive }) => `relative grid h-11 w-11 place-items-center rounded-full transition hover:bg-surface ${isActive ? 'text-accent' : ''}`}>
      <Icon name={icon} />
      {badge > 0 && (
        <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-extrabold text-white">
          {badge > 999 ? '999+' : badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Header() {
  const { user } = useAuth();
  const { count, favIds } = useCart();
  const { categorias, config } = useStore();
  const catMatch = useMatch('/categoria/:slug');

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white">
      {config?.aviso_topo && (
        <p className="bg-brand-dark px-5 py-2 text-center text-sm font-medium text-white">{config.aviso_topo}</p>
      )}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2">
        <Link to="/" aria-label="Ir para a página inicial">
          <Logo className="h-12 md:h-14" />
        </Link>
        <SearchAutocomplete className="order-last w-full md:order-none md:w-auto md:flex-1" />
        <div className="ml-auto flex items-center">
          {/* O acesso ao gestor só aparece para quem é da equipe. */}
          {user?.tipo === 'equipe' && (
            <Link to="/gestor" className="mr-1 rounded-full px-4 py-2 text-sm font-extrabold text-brand transition hover:bg-surface">
              Gestor
            </Link>
          )}
          <IconLink label={user ? `Minha conta (${user.nome})` : 'Entrar'} icon="user" to={user?.tipo === 'cliente' ? '/minha-conta' : '/entrar'} />
          {/* Sem login, favoritos e carrinho levam à tela de entrar (e voltam para cá depois). */}
          <IconLink label="Favoritos" icon="heart" badge={favIds.length} to={user ? '/favoritos' : '/entrar'} voltarPara={user ? undefined : '/favoritos'} />
          <IconLink label="Carrinho" icon="cart" badge={count} to={user ? '/carrinho' : '/entrar'} voltarPara={user ? undefined : '/carrinho'} />
          <ThemeToggle />
        </div>
      </div>
      {categorias.length > 0 && (
        <nav aria-label="Categorias" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 pb-2">
          <NavLink to="/produtos" end
            className={({ isActive }) => `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition hover:bg-surface ${isActive ? 'bg-surface text-brand' : ''}`}>
            Todos os produtos
          </NavLink>
          {categorias.map((c) => (
            <Link key={c.id_categoria} to={`/categoria/${c.slug}`}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition hover:bg-surface ${catMatch?.params.slug === c.slug ? 'bg-surface text-brand' : ''}`}>
              {c.nome}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
