import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, imageUrl } from '../api/client';
import { useApi } from '../hooks/useApi';
import { readJson, writeJson } from '../utils/storage';
import type { PopupPublico } from '../types';
import Icon from './Icon';

// Pop-up da home, configurado no painel (GET /cms/popup). Aparece uma vez por aba: depois de fechado,
// só volta quando o gestor trocar o título ou o texto.
export default function PopupCms() {
  const { data } = useApi(() => api.get<{ popup: PopupPublico | null }>('/cms/popup'), []);
  const popup = data?.popup ?? null;
  const chave = popup ? `mantiqueira.popup.${popup.titulo}|${popup.texto ?? ''}` : '';
  const [fechado, setFechado] = useState(false);
  if (!popup || fechado || readJson<boolean>(chave, false)) return null;

  const fechar = () => {
    writeJson(chave, true);
    setFechado(true);
  };
  const link = popup.destino.link;
  const externo = !!link && /^https?:\/\//.test(link);
  const botao = 'mt-5 inline-block rounded-full bg-accent px-6 py-3 font-extrabold text-white hover:brightness-110';

  return (
    <div role="dialog" aria-modal="true" aria-label={popup.titulo} onClick={fechar}
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div onClick={(e) => e.stopPropagation()} className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <button onClick={fechar} aria-label="Fechar" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow">
          <Icon name="close" className="h-4 w-4" />
        </button>
        {popup.imagem_url && <img src={imageUrl(popup.imagem_url)} alt="" className="max-h-64 w-full object-cover" />}
        <div className="p-6 text-center">
          <h2 className="text-2xl font-extrabold">{popup.titulo}</h2>
          {popup.texto && <p className="mt-2 whitespace-pre-line text-muted">{popup.texto}</p>}
          {link && (externo
            ? <a href={link} target="_blank" rel="noopener noreferrer" onClick={fechar} className={botao}>Ver agora</a>
            : <Link to={link} onClick={fechar} className={botao}>Ver agora</Link>)}
        </div>
      </div>
    </div>
  );
}
