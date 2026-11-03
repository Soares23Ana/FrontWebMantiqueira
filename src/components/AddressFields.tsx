import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import Field, { SelectField } from './Field';
import { formatCep } from '../utils/format';
import type { EnderecoInput } from '../types';

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const emptyAddress: EnderecoInput = {
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP', referencia: '',
};

/** Endereço sem campos opcionais vazios (a API recusa string vazia em alguns campos). */
export function cleanAddress(a: EnderecoInput): EnderecoInput {
  return { ...a, complemento: a.complemento?.trim() || null, referencia: a.referencia?.trim() || null };
}

interface CepResposta {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface Props {
  value: EnderecoInput;
  onChange: (value: EnderecoInput) => void;
  /** Erros vindos da API, com ou sem o prefixo "endereco." (ex.: "endereco.cep"). */
  errors: Record<string, string>;
  prefix?: string;
}

type CepStatus = { kind: 'loading' | 'ok' | 'error'; text: string } | null;

// Ao completar os 8 dígitos do CEP, consulta GET /cep/:cep uma vez e preenche rua, bairro, cidade e UF.
// Tudo continua editável, e se a consulta falhar a pessoa digita o endereço à mão (o cadastro não depende dela).
export default function AddressFields({ value, onChange, errors, prefix = '' }: Props) {
  const [status, setStatus] = useState<CepStatus>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  // O CEP que já veio preenchido (editar um endereço salvo) não é consultado de novo.
  const lastCep = useRef(value.cep.replace(/\D/g, ''));

  useEffect(() => {
    const digits = value.cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      setStatus(null);
      lastCep.current = '';
      return;
    }
    if (digits === lastCep.current) return;
    lastCep.current = digits;
    let done = false;
    setStatus({ kind: 'loading', text: 'Buscando endereço...' });
    api.get<CepResposta>(`/cep/${digits}`)
      .then((r) => {
        if (done) return;
        done = true;
        const cur = valueRef.current;
        onChange({
          ...cur,
          logradouro: r.logradouro || cur.logradouro,
          bairro: r.bairro || cur.bairro,
          cidade: r.cidade || cur.cidade,
          estado: UFS.includes(r.estado) ? r.estado : cur.estado,
        });
        setStatus({ kind: 'ok', text: r.logradouro ? 'Endereço preenchido. Complete o número.' : 'Cidade preenchida. Complete o restante do endereço.' });
      })
      .catch((e) => {
        if (done) return;
        done = true;
        setStatus({
          kind: 'error',
          text: e instanceof ApiError && e.status === 404
            ? 'Não encontramos esse CEP. Confira o número ou preencha o endereço à mão.'
            : 'Não conseguimos buscar o endereço agora. Preencha os campos à mão.',
        });
      });
    return () => {
      // CEP alterado antes da resposta: descarta o resultado e permite consultar de novo.
      if (!done) {
        done = true;
        lastCep.current = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.cep]);

  const set = (k: keyof EnderecoInput) => (e: { target: { value: string } }) =>
    onChange({ ...value, [k]: k === 'cep' ? formatCep(e.target.value) : e.target.value });
  const err = (k: string) => errors[`${prefix}${k}`];
  return (
    <div className="grid gap-x-4 sm:grid-cols-6">
      <Field className="sm:col-span-2" label="CEP" inputMode="numeric" placeholder="00000-000" value={value.cep} onChange={set('cep')} error={err('cep')} />
      <Field className="sm:col-span-4" label="Logradouro" value={value.logradouro} onChange={set('logradouro')} error={err('logradouro')} />
      {status && (
        <p role="status" className={`mt-1 text-sm sm:col-span-6 ${status.kind === 'error' ? 'text-amber-700' : status.kind === 'ok' ? 'text-green-700' : 'text-muted'}`}>
          {status.text}
        </p>
      )}
      <Field className="sm:col-span-2" label="Número" value={value.numero} onChange={set('numero')} error={err('numero')} />
      <Field className="sm:col-span-4" label="Complemento" mandatory={false} value={value.complemento ?? ''} onChange={set('complemento')} error={err('complemento')} />
      <Field className="sm:col-span-3" label="Bairro" value={value.bairro} onChange={set('bairro')} error={err('bairro')} />
      <Field className="sm:col-span-2" label="Cidade" value={value.cidade} onChange={set('cidade')} error={err('cidade')} />
      <SelectField className="sm:col-span-1" label="UF" value={value.estado} onChange={set('estado')} error={err('estado')}>
        {UFS.map((uf) => <option key={uf}>{uf}</option>)}
      </SelectField>
      <Field className="sm:col-span-6" label="Ponto de referência" mandatory={false} value={value.referencia ?? ''} onChange={set('referencia')} error={err('referencia')} />
    </div>
  );
}
