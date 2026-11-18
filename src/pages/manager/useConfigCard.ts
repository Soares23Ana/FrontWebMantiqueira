import { useState } from 'react';
import { api, errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import type { Configuracao } from '../../types';

interface Options {
  /** Chaves que este cartão edita (as outras chaves da API não aparecem em lugar nenhum). */
  chaves: readonly string[];
  configs: Configuracao[];
  /** Valor da API → texto do campo. */
  paraCampo: (chave: string, valor: Configuracao['valor']) => string;
  /** Texto do campo → valor enviado à API (PUT /configuracoes/:chave). */
  paraApi: (chave: string, texto: string) => string | number | null;
  /** Mensagem de erro de validação do front (vazio = válido). */
  validar?: (chave: string, texto: string) => string;
  mensagemOk: string;
}

// Estado de um cartão de configurações: um Salvar para o cartão, que envia um PUT só dos campos alterados.
// Se um campo falhar e outro der certo, o que deu certo fica salvo e o erro aparece só no que falhou.
export function useConfigCard({ chaves, configs, paraCampo, paraApi, validar, mensagemOk }: Options) {
  const toast = useToast();
  const inicial = Object.fromEntries(chaves.map((k) => [k, paraCampo(k, configs.find((c) => c.chave === k)?.valor ?? null)]));
  const [base, setBase] = useState<Record<string, string>>(inicial);
  const [valores, setValores] = useState<Record<string, string>>(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const alteradas = chaves.filter((k) => valores[k] !== base[k]);

  const alterar = (chave: string, texto: string) => {
    setValores((v) => ({ ...v, [chave]: texto }));
    setErros((e) => ({ ...e, [chave]: '' }));
  };

  const descartar = () => {
    setValores(base);
    setErros({});
  };

  const salvar = async () => {
    const locais: Record<string, string> = {};
    for (const k of alteradas) {
      const msg = validar?.(k, valores[k]) ?? '';
      if (msg) locais[k] = msg;
    }
    setErros(locais);
    if (Object.keys(locais).length) return;
    setSalvando(true);
    const resultados = await Promise.allSettled(alteradas.map((k) => api.put(`/configuracoes/${k}`, { valor: paraApi(k, valores[k]) })));
    setSalvando(false);
    const novaBase = { ...base };
    const novosErros: Record<string, string> = {};
    resultados.forEach((r, i) => {
      const k = alteradas[i];
      if (r.status === 'fulfilled') novaBase[k] = valores[k];
      else novosErros[k] = errorMessage(r.reason);
    });
    setBase(novaBase);
    setErros(novosErros);
    if (Object.keys(novosErros).length === 0) toast(mensagemOk);
    else toast('Alguns campos não foram salvos. Veja os avisos nos campos.', 'error');
  };

  return { valores, base, erros, alterar, descartar, salvar, salvando, alterou: alteradas.length > 0 };
}
