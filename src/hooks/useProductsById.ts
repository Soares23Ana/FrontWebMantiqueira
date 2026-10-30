import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Produto } from '../types';
import { useApi } from './useApi';

/** Dados atuais de uma lista de produtos (carrinho, favoritos). null = produto não existe mais ou saiu de linha. */
export function useProductsById(ids: number[]) {
  const { user } = useAuth();
  const key = [...ids].sort((a, b) => a - b).join(',');
  return useApi(async () => {
    const results = await Promise.all(
      ids.map((id) =>
        api.get<{ produto: Produto }>(`/produtos/${id}`)
          .then((d) => [id, d.produto] as const)
          .catch((e) => {
            if (e instanceof ApiError && e.status === 404) return [id, null] as const;
            throw e;
          }),
      ),
    );
    return new Map<number, Produto | null>(results);
  }, [key, user?.id], ids.length > 0);
}
