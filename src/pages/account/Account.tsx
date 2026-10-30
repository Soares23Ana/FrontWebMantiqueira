import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Addresses from './Addresses';
import MyOrderDetail from './MyOrderDetail';
import MyOrders from './MyOrders';
import Password from './Password';
import Profile from './Profile';

const tabs = [
  { to: 'pedidos', label: 'Meus pedidos' },
  { to: 'perfil', label: 'Perfil' },
  { to: 'enderecos', label: 'Endereços' },
  { to: 'senha', label: 'Senha' },
];

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold">Minha conta</h2>
          <p className="text-muted">Olá, {user?.nome}.</p>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} className="rounded-full bg-white px-5 py-2 font-extrabold text-accent ring-1 ring-black/10 hover:bg-accent/5">
          Sair
        </button>
      </div>
      <nav aria-label="Minha conta" className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-white p-1.5">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to}
            className={({ isActive }) => `whitespace-nowrap rounded-xl px-4 py-2 font-medium ${isActive ? 'bg-brand text-white' : 'hover:bg-surface'}`}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<Navigate to="pedidos" replace />} />
        <Route path="pedidos" element={<MyOrders />} />
        <Route path="pedidos/:id" element={<MyOrderDetail />} />
        <Route path="perfil" element={<Profile />} />
        <Route path="enderecos" element={<Addresses />} />
        <Route path="senha" element={<Password />} />
        <Route path="*" element={<Navigate to="pedidos" replace />} />
      </Routes>
    </section>
  );
}
