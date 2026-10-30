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

interface Props {
  value: EnderecoInput;
  onChange: (value: EnderecoInput) => void;
  /** Erros vindos da API, com ou sem o prefixo "endereco." (ex.: "endereco.cep"). */
  errors: Record<string, string>;
  prefix?: string;
}

export default function AddressFields({ value, onChange, errors, prefix = '' }: Props) {
  const set = (k: keyof EnderecoInput) => (e: { target: { value: string } }) =>
    onChange({ ...value, [k]: k === 'cep' ? formatCep(e.target.value) : e.target.value });
  const err = (k: string) => errors[`${prefix}${k}`];
  return (
    <div className="grid gap-x-4 sm:grid-cols-6">
      <Field className="sm:col-span-2" label="CEP" inputMode="numeric" placeholder="00000-000" value={value.cep} onChange={set('cep')} error={err('cep')} />
      <Field className="sm:col-span-4" label="Logradouro" value={value.logradouro} onChange={set('logradouro')} error={err('logradouro')} />
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
