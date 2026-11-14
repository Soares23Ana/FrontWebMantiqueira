import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, imageUrl } from '../api/client';
import { useDebounced } from '../hooks/useApi';
import type { Sugestoes } from '../types';
import Icon from './Icon';

type Option = { key: string; label: string; hint: string; to: string; image?: string | null };

// Busca do cabeçalho com sugestões de produtos, categorias e marcas (GET /produtos/sugestoes).
export default function SearchAutocomplete({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [options, setOptions] = useState<Option[]>([]);
  const term = useDebounced(text.trim(), 250);
  const boxRef = useRef<HTMLFormElement>(null);

  // Mantém o campo com o termo da URL quando o usuário está na página de resultados.
  useEffect(() => {
    if (location.pathname === '/produtos') setText(new URLSearchParams(location.search).get('busca') ?? '');
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (term.length < 2) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    api.get<Sugestoes>('/produtos/sugestoes', { busca: term })
      .then((s) => {
        if (cancelled) return;
        setOptions([
          ...s.categorias.map((c) => ({ key: `c${c.id_categoria}`, label: c.nome, hint: 'Categoria', to: `/categoria/${c.slug}` })),
          ...s.marcas.map((m) => ({ key: `m${m.id_marca}`, label: m.nome, hint: 'Marca', to: `/marca/${m.slug}` })),
          ...s.produtos.map((p) => ({ key: `p${p.id_produto}`, label: p.nome, hint: p.marca ?? 'Produto', to: `/produto/${p.id_produto}`, image: p.imagem_url })),
        ]);
        setActive(-1);
      })
      .catch(() => !cancelled && setOptions([]));
    return () => {
      cancelled = true;
    };
  }, [term]);

  useEffect(() => {
    const close = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (active >= 0 && options[active]) return go(options[active].to);
    const q = text.trim();
    go(q ? `/produtos?busca=${encodeURIComponent(q)}` : '/produtos');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showList = open && term.length >= 2;

  return (
    <form ref={boxRef} role="search" onSubmit={submit} className={`relative ${className}`}>
      <label className="relative block">
        <span className="sr-only">Buscar produtos</span>
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input type="search" value={text} placeholder="Buscar produtos, marcas ou categorias"
          onChange={(e) => { setText(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
          role="combobox" aria-expanded={showList} aria-controls="sugestoes-busca" aria-autocomplete="list"
          className="w-full rounded-full border border-black/10 bg-surface py-2.5 pl-11 pr-4 outline-none focus:border-brand focus:bg-white" />
      </label>
      {showList && (
        <ul id="sugestoes-busca" role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-2xl">
          {options.length === 0 && <li className="p-3 text-sm text-muted">Nenhuma sugestão. Tecle Enter para buscar “{term}”.</li>}
          {options.map((o, i) => (
            <li key={o.key} role="option" aria-selected={i === active}>
              <button type="button" onMouseEnter={() => setActive(i)} onClick={() => go(o.to)}
                className={`flex w-full items-center gap-3 rounded-xl p-2 text-left ${i === active ? 'bg-surface' : ''}`}>
                {o.image !== undefined ? (
                  <img src={imageUrl(o.image)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain foto-produto" />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Icon name="search" className="h-4 w-4" /></span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{o.label}</span>
                  <span className="block text-xs text-muted">{o.hint}</span>
                </span>
              </button>
            </li>
          ))}
          <li>
            <button type="submit" className="w-full rounded-xl p-2 text-left text-sm font-extrabold text-brand hover:bg-surface">
              Ver todos os resultados para “{term}”
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}
