import { api } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import type { Campanha, Categoria, Marca, TipoDestino } from '../../types';
import Field, { SelectField } from '../Field';

export interface DestinoValue {
  tipo: TipoDestino;
  /** id do produto, da categoria, da marca ou da campanha (texto do campo). */
  id: string;
  link: string;
}

export const DESTINO_VAZIO: DestinoValue = { tipo: 'nenhum', id: '', link: '' };

const TIPOS: { value: TipoDestino; label: string }[] = [
  { value: 'nenhum', label: 'Sem destino (não clicável)' },
  { value: 'produto', label: 'Um produto' },
  { value: 'categoria', label: 'Uma categoria' },
  { value: 'marca', label: 'Uma marca' },
  { value: 'campanha', label: 'Uma campanha' },
  { value: 'link', label: 'Um link (endereço)' },
];

/** Campos do corpo da API a partir do destino escolhido (tipo_destino, id_destino e link só no tipo link). */
export function destinoParaApi(d: DestinoValue): Record<string, string> {
  const out: Record<string, string> = { tipo_destino: d.tipo };
  if (d.tipo === 'link') out.link = d.link.trim();
  else if (d.tipo !== 'nenhum') out.id_destino = d.id;
  return out;
}

/** Destino salvo (como a API devolve) em valores de formulário. */
export function destinoDeApi(tipo: TipoDestino | undefined, id: number | null | undefined, link: string | null | undefined): DestinoValue {
  const t = tipo ?? (link ? 'link' : 'nenhum');
  return { tipo: t, id: id != null ? String(id) : '', link: t === 'link' ? link ?? '' : '' };
}

// Destino do clique de um banner ou do pop-up: produto, categoria (ou subcategoria), marca, campanha ou um link.
// A API devolve o link interno já resolvido (por exemplo, /produto/8 ou /categoria/higiene-e-beleza).
export default function DestinoFields({ value, onChange, errors }: {
  value: DestinoValue; onChange: (v: DestinoValue) => void; errors: Record<string, string>;
}) {
  // GET /categorias devolve a árvore (principais com subcategorias).
  const categorias = useApi(() => api.get<{ categorias: Categoria[] }>('/categorias'), []);
  const marcas = useApi(() => api.get<{ marcas: Marca[] }>('/marcas'), []);
  const campanhas = useApi(() => api.get<{ campanhas: Campanha[] }>('/campanhas'), []);
  const set = (changes: Partial<DestinoValue>) => onChange({ ...value, ...changes });

  return (
    <>
      <SelectField label="Ao clicar, abrir" mandatory={false} value={value.tipo} error={errors.tipo_destino}
        onChange={(e) => onChange({ tipo: e.target.value as TipoDestino, id: '', link: '' })}>
        {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </SelectField>
      {value.tipo === 'produto' && (
        <Field label="Código do produto (id)" mandatory={false} inputMode="numeric" value={value.id} placeholder="Ex.: 15"
          onChange={(e) => set({ id: e.target.value.replace(/\D/g, '') })} error={errors.id_destino} />
      )}
      {value.tipo === 'categoria' && (
        <SelectField label="Categoria" mandatory={false} value={value.id} onChange={(e) => set({ id: e.target.value })} error={errors.id_destino}>
          <option value="">Escolha...</option>
          {categorias.data?.categorias.flatMap((c) => [
            <option key={c.id_categoria} value={c.id_categoria}>{c.nome}</option>,
            ...(c.subcategorias ?? []).map((s) => <option key={s.id_categoria} value={s.id_categoria}>— {s.nome}</option>),
          ])}
        </SelectField>
      )}
      {value.tipo === 'marca' && (
        <SelectField label="Marca" mandatory={false} value={value.id} onChange={(e) => set({ id: e.target.value })} error={errors.id_destino}>
          <option value="">Escolha...</option>
          {marcas.data?.marcas.map((m) => <option key={m.id_marca} value={m.id_marca}>{m.nome}</option>)}
        </SelectField>
      )}
      {value.tipo === 'campanha' && (
        <SelectField label="Campanha" mandatory={false} value={value.id} onChange={(e) => set({ id: e.target.value })} error={errors.id_destino}>
          <option value="">Escolha...</option>
          {campanhas.data?.campanhas.map((c) => <option key={c.id_campanha} value={c.id_campanha}>{c.titulo}</option>)}
        </SelectField>
      )}
      {value.tipo === 'link' && (
        <Field label="Link" mandatory={false} value={value.link} onChange={(e) => set({ link: e.target.value })}
          placeholder="/produtos?marca=bic ou https://..." error={errors.link} />
      )}
    </>
  );
}
