import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Carrinho e favoritos são só para cliente logado. Quem não entrou é levado para a tela de login
 * (e volta para a página em que estava depois de entrar). Devolve true quando a ação pode seguir.
 */
export function useRequireLogin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  return useCallback((motivo: 'carrinho' | 'favorito'): boolean => {
    if (user?.tipo === 'cliente') return true;
    if (user?.tipo === 'equipe') {
      toast('Carrinho e favoritos são da conta do cliente (CNPJ). A equipe usa o painel do gestor.', 'info');
      return false;
    }
    toast(motivo === 'carrinho'
      ? 'Entre com o CNPJ da sua empresa para adicionar ao carrinho.'
      : 'Entre com o CNPJ da sua empresa para favoritar produtos.', 'info');
    navigate('/entrar', { state: { from: location.pathname + location.search } });
    return false;
  }, [user, navigate, location, toast]);
}
