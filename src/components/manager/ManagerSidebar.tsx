import { NavLink } from 'react-router-dom';
import Icon from '../Icon';
import type { IconName } from '../Icon';

export interface SidebarItem {
  to: string;
  label: string;
  icon: IconName;
  badge?: number;
}

interface Props {
  groups: { title: string; items: SidebarItem[] }[];
}

export default function ManagerSidebar({ groups }: Props) {
  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <nav aria-label="Menu do gestor"
        className="flex gap-1 overflow-x-auto rounded-2xl bg-brand-dark p-2 text-white lg:flex-col lg:overflow-visible lg:p-3">
        {groups.map((g) => (
          <div key={g.title} className="contents lg:block lg:pb-2">
            <p className="hidden px-3 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-white/60 lg:block">{g.title}</p>
            {g.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/gestor'}
                className={({ isActive }) => `flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-left font-medium transition lg:w-full lg:whitespace-normal ${isActive ? 'bg-white text-brand-dark' : 'text-white/85 hover:bg-white/10'}`}>
                <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1 leading-tight">{item.label}</span>
                {!!item.badge && item.badge > 0 && (
                  <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-xs font-extrabold text-white">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
