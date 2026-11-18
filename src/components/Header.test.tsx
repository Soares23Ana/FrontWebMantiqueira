import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../context/CartContext', () => ({ useCart: () => ({ count: 0, favIds: [] }) }));
vi.mock('../context/StoreContext', () => ({ useStore: () => ({ categorias: [], config: null }) }));
vi.mock('./Logo', () => ({ default: () => null }));
vi.mock('./ThemeToggle', () => ({ default: () => null }));
vi.mock('./SearchAutocomplete', () => ({ default: () => null }));

import Header from './Header';

function abrirEm(entrada: string | { pathname: string; state?: unknown }) {
  return render(<MemoryRouter initialEntries={[entrada]}><Header /></MemoryRouter>);
}

const emDestaque = (nome: string) => screen.getByRole('link', { name: nome }).className.includes('text-accent');

describe('Cabeçalho (sem login): só o ícone clicado fica em destaque', () => {
  it('em /entrar aberto direto, só o ícone de entrar fica vermelho', () => {
    abrirEm('/entrar');
    expect(emDestaque('Entrar')).toBe(true);
    expect(emDestaque('Favoritos')).toBe(false);
    expect(emDestaque('Carrinho')).toBe(false);
  });

  it('veio do coração: só os favoritos ficam vermelhos', () => {
    abrirEm({ pathname: '/entrar', state: { from: '/favoritos' } });
    expect(emDestaque('Favoritos')).toBe(true);
    expect(emDestaque('Entrar')).toBe(false);
    expect(emDestaque('Carrinho')).toBe(false);
  });

  it('veio do carrinho: só o carrinho fica vermelho', () => {
    abrirEm({ pathname: '/entrar', state: { from: '/carrinho' } });
    expect(emDestaque('Carrinho')).toBe(true);
    expect(emDestaque('Entrar')).toBe(false);
    expect(emDestaque('Favoritos')).toBe(false);
  });

  it('em outra página, nenhum dos três fica vermelho', () => {
    abrirEm('/produtos');
    expect(emDestaque('Entrar')).toBe(false);
    expect(emDestaque('Favoritos')).toBe(false);
    expect(emDestaque('Carrinho')).toBe(false);
  });
});
