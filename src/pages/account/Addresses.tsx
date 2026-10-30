import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, ApiError, errorMessage } from '../../api/client';
import AddressFields, { cleanAddress, emptyAddress } from '../../components/AddressFields';
import Button from '../../components/Button';
import Modal from '../../components/manager/Modal';
import { ErrorState, FormError, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import type { Endereco, EnderecoInput } from '../../types';

export default function Addresses() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => api.get<{ enderecos: Endereco[] }>('/minha-conta/enderecos'), []);
  const [editing, setEditing] = useState<Endereco | 'novo' | null>(null);

  const makePrincipal = async (e: Endereco) => {
    try {
      await api.patch(`/minha-conta/enderecos/${e.id_endereco}`, { principal: true });
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const removeAddress = async (e: Endereco) => {
    if (!confirm('Remover este endereço? Pedidos antigos não mudam.')) return;
    try {
      await api.del(`/minha-conta/enderecos/${e.id_endereco}`);
      toast('Endereço removido.');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => setEditing('novo')}>Adicionar endereço</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {data!.enderecos.map((e) => (
          <div key={e.id_endereco} className={`rounded-2xl bg-white p-5 ${e.principal ? 'ring-2 ring-brand' : ''}`}>
            {e.principal && <span className="text-xs font-extrabold uppercase text-brand">Principal</span>}
            <p className="font-extrabold">{e.logradouro}, {e.numero}{e.complemento ? ` – ${e.complemento}` : ''}</p>
            <p className="text-sm text-muted">{e.bairro} · {e.cidade}/{e.estado} · CEP {e.cep}</p>
            {e.referencia && <p className="text-sm text-muted">Ref.: {e.referencia}</p>}
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-extrabold">
              <button onClick={() => setEditing(e)} className="text-brand">Editar</button>
              {!e.principal && <button onClick={() => makePrincipal(e)} className="text-brand">Tornar principal</button>}
              {data!.enderecos.length > 1 && <button onClick={() => removeAddress(e)} className="text-accent">Remover</button>}
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <AddressModal endereco={editing === 'novo' ? null : editing} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }} />
      )}
    </>
  );
}

function AddressModal({ endereco, onClose, onSaved }: { endereco: Endereco | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [value, setValue] = useState<EnderecoInput>(endereco ? { ...endereco } : emptyAddress);
  const [principal, setPrincipal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { cep, logradouro, numero, complemento, bairro, cidade, estado, referencia } = cleanAddress(value);
    const body = { cep, logradouro, numero, complemento, bairro, cidade, estado, referencia, ...(principal ? { principal: true } : {}) };
    try {
      if (endereco) await api.patch(`/minha-conta/enderecos/${endereco.id_endereco}`, body);
      else await api.post('/minha-conta/enderecos', body);
      toast(endereco ? 'Endereço atualizado.' : 'Endereço adicionado.');
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    }
  };

  return (
    <Modal title={endereco ? 'Editar endereço' : 'Novo endereço'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate>
        <FormError message={formError} />
        <AddressFields value={value} onChange={setValue} errors={errors} />
        {!endereco?.principal && (
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-brand" checked={principal} onChange={(e) => setPrincipal(e.target.checked)} />
            Usar como endereço principal
          </label>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
