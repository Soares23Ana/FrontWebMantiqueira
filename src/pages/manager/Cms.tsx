import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { api, ApiError, errorMessage, imageUrl } from '../../api/client';
import Button from '../../components/Button';
import Field, { TextAreaField } from '../../components/Field';
import DestinoFields, { DESTINO_VAZIO, destinoDeApi, destinoParaApi } from '../../components/manager/DestinoFields';
import type { DestinoValue } from '../../components/manager/DestinoFields';
import Icon from '../../components/Icon';
import BannerPreview from '../../components/manager/BannerPreview';
import ChipFilter from '../../components/manager/ChipFilter';
import IconButton from '../../components/manager/IconButton';
import Modal from '../../components/manager/Modal';
import SectionHeader from '../../components/manager/SectionHeader';
import Toggle from '../../components/manager/Toggle';
import { ErrorState, FormError, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { formatDateTime, formatPhone, toLocalInput } from '../../utils/format';
import type { Banner, BlocoCms, Configuracao, Destino, SituacaoBanner } from '../../types';

const tabs = ['Banners', 'Pop-up', 'Blocos de texto', 'Contatos e avisos'] as const;

export default function Cms() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Banners');
  return (
    <>
      <SectionHeader title="Conteúdo (CMS)" subtitle="Banners e pop-up da página inicial, blocos de texto e dados de contato do site." />
      <div className="mb-5"><ChipFilter label="Seção" options={tabs} value={tab} onChange={setTab} /></div>
      {tab === 'Banners' && <Banners />}
      {tab === 'Pop-up' && <PopupTab />}
      {tab === 'Blocos de texto' && <Blocks />}
      {tab === 'Contatos e avisos' && <Settings />}
    </>
  );
}

// ---------- Banners ----------
const SITUACAO: Record<SituacaoBanner, [string, string]> = {
  no_ar: ['No ar', 'bg-green-100 text-green-800'],
  agendado: ['Agendado', 'bg-brand/10 text-brand'],
  expirado: ['Expirado', 'bg-black/10 text-muted'],
  inativo: ['Inativo', 'bg-black/10 text-muted'],
};

function Banners() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useApi(() => api.get<{ banners: Banner[] }>('/cms/todos'), []);
  const [editing, setEditing] = useState<Banner | 'novo' | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const banners = data?.banners ?? [];

  const move = async (index: number, dir: -1 | 1) => {
    const ids = banners.map((b) => b.id_banner);
    [ids[index], ids[index + dir]] = [ids[index + dir], ids[index]];
    try {
      const r = await api.put<{ banners: Banner[] }>('/cms/ordem', { ids });
      setData(() => ({ banners: r.banners }));
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const toggle = async (b: Banner, ativo: boolean) => {
    try {
      await api.patch(`/cms/${b.id_banner}`, { ativo });
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const remove = async (b: Banner) => {
    try {
      await api.del(`/cms/${b.id_banner}`);
      toast('Banner excluído.');
      setConfirmId(null);
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-extrabold">Slider da página inicial</h3>
          <p className="text-sm text-muted">A ordem abaixo é a ordem de exibição. Sem banners no ar, a home mostra a abertura padrão.</p>
        </div>
        <Button variant="accent" onClick={() => setEditing('novo')}><Icon name="plus" className="mr-1 inline h-5 w-5 align-text-bottom" />Adicionar banner</Button>
      </div>
      {loading && <Loading className="py-6" />}
      {error && <ErrorState error={error} onRetry={reload} className="py-6" />}
      {data && banners.length === 0 && <p className="py-6 text-center text-muted">Nenhum banner cadastrado.</p>}
      <ul className="grid gap-3">
        {banners.map((b, i) => (
          <li key={b.id_banner} className={`flex flex-wrap items-center gap-3 rounded-xl border border-black/10 p-3 ${b.situacao === 'no_ar' ? '' : 'opacity-70'}`}>
            <BannerPreview title={b.titulo} image={imageUrl(b.imagem_url)} className="aspect-[1920/700] w-40 shrink-0" />
            <div className="min-w-40 flex-1">
              <p className="font-medium">{b.titulo}</p>
              <p className="truncate text-sm text-muted">{b.destino?.link ?? b.link ?? 'Sem destino'}</p>
              <p className="text-xs text-muted">
                <span className={`mr-2 rounded-full px-2 py-0.5 font-medium ${SITUACAO[b.situacao][1]}`}>{SITUACAO[b.situacao][0]}</span>
                {b.inicio_em || b.fim_em ? `${b.inicio_em ? formatDateTime(b.inicio_em) : '…'} até ${b.fim_em ? formatDateTime(b.fim_em) : '…'}` : 'Sem período'}
              </p>
            </div>
            <div className="flex items-center">
              <Toggle checked={b.ativo} label={`Ativar ${b.titulo}`} onChange={(v) => toggle(b, v)} />
              <IconButton icon="up" label="Mover para cima" disabled={i === 0} onClick={() => move(i, -1)} />
              <IconButton icon="down" label="Mover para baixo" disabled={i === banners.length - 1} onClick={() => move(i, 1)} />
              <IconButton icon="edit" label="Editar" onClick={() => setEditing(b)} />
              {confirmId === b.id_banner ? (
                <span className="ml-1 flex items-center gap-1">
                  <Button variant="accent" className="px-3 py-1 text-sm" onClick={() => remove(b)}>Excluir</Button>
                  <Button variant="ghost" className="px-3 py-1 text-sm" onClick={() => setConfirmId(null)}>Não</Button>
                </span>
              ) : (
                <IconButton icon="trash" label="Excluir" danger onClick={() => setConfirmId(b.id_banner)} />
              )}
            </div>
          </li>
        ))}
      </ul>
      {editing && <BannerFormModal banner={editing === 'novo' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

const MAX_MB = 5;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function BannerFormModal({ banner, onClose, onSaved }: { banner: Banner | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [titulo, setTitulo] = useState(banner?.titulo ?? '');
  const [destino, setDestino] = useState<DestinoValue>(destinoDeApi(banner?.tipo_destino, banner?.id_destino, banner?.link));
  const [ativo, setAtivo] = useState(banner?.ativo ?? true);
  const [inicio, setInicio] = useState(toLocalInput(banner?.inicio_em));
  const [fim, setFim] = useState(toLocalInput(banner?.fim_em));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(banner ? imageUrl(banner.imagem_url) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) return setErrors((p) => ({ ...p, imagem: 'Use uma imagem PNG, JPG, WEBP ou GIF.' }));
    if (f.size > MAX_MB * 1024 * 1024) return setErrors((p) => ({ ...p, imagem: `A imagem deve ter até ${MAX_MB} MB.` }));
    setErrors((p) => ({ ...p, imagem: '' }));
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!banner && !file) return setErrors({ imagem: 'Escolha a imagem do banner.' });
    setSaving(true);
    setFormError('');
    // Multipart nos dois casos: datas vazias ("") removem a janela de exibição.
    const fd = new FormData();
    fd.append('titulo', titulo.trim());
    // Destino: produto, categoria, marca, campanha ou link. A API devolve o link interno já resolvido.
    for (const [k, v] of Object.entries(destinoParaApi(destino))) fd.append(k, v);
    fd.append('ativo', String(ativo));
    fd.append('inicio_em', inicio);
    fd.append('fim_em', fim);
    if (file) fd.append('imagem', file);
    try {
      if (banner) await api.patch(`/cms/${banner.id_banner}`, fd);
      else await api.post('/cms', fd);
      toast('Banner salvo.');
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={banner ? 'Editar banner' : 'Adicionar banner'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <FormError message={formError} />
        <Field label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} error={errors.titulo} />
        <DestinoFields value={destino} onChange={setDestino} errors={errors} />
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Field label="Início (Brasília)" mandatory={false} type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} error={errors.inicio_em} />
          <Field label="Fim (Brasília)" mandatory={false} type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} error={errors.fim_em} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><Toggle checked={ativo} label="Banner ativo" onChange={setAtivo} /> Ativo</label>
        <div className="mt-3 grid gap-1.5 text-muted">
          <span>Imagem (1920 × 700 px, até {MAX_MB} MB) {!banner && <b className="text-accent">*</b>}</span>
          <BannerPreview title={titulo || 'Pré-visualização'} image={preview} className="aspect-[1920/700] w-full" />
          <input type="file" accept={ACCEPTED.join(',')} onChange={onFile} aria-label="Escolher imagem"
            className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:font-medium file:text-ink hover:file:bg-black/10" />
          {errors.imagem && <small role="alert" className="text-accent">{errors.imagem}</small>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Pop-up ----------
interface PopupBloco {
  titulo: string;
  conteudo: string;
  ativo: boolean;
  imagem_url: string | null;
  destino: Destino;
  inicio_em: string | null;
  fim_em: string | null;
  atualizado_em: string;
}

// Pop-up da página inicial (bloco "popup"): título, texto, imagem, destino do botão e janela de exibição.
function PopupTab() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(async () => {
    const d = await api.get<{ blocos: (PopupBloco & { chave: string })[] }>('/cms/blocos');
    return d.blocos.find((b) => b.chave === 'popup') ?? null;
  }, []);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [destino, setDestino] = useState<DestinoValue>(DESTINO_VAZIO);
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data === undefined) return;
    setTitulo(data?.titulo ?? '');
    setTexto(data?.conteudo ?? '');
    setDestino(data ? destinoDeApi(data.destino.tipo, data.destino.id, data.destino.link) : DESTINO_VAZIO);
    setInicio(toLocalInput(data?.inicio_em));
    setFim(toLocalInput(data?.fim_em));
    setAtivo(data?.ativo ?? true);
    setPreview(data?.imagem_url ? imageUrl(data.imagem_url) : '');
    setFile(null);
  }, [data]);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) return setErrors((p) => ({ ...p, imagem: 'Use uma imagem PNG, JPG, WEBP ou GIF.' }));
    if (f.size > MAX_MB * 1024 * 1024) return setErrors((p) => ({ ...p, imagem: `A imagem deve ter até ${MAX_MB} MB.` }));
    setErrors((p) => ({ ...p, imagem: '' }));
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError('');
    try {
      const body: Record<string, unknown> = {
        titulo: titulo.trim(), texto: texto.trim(), ativo,
        inicio_em: inicio || null, fim_em: fim || null,
        ...destinoParaApi(destino),
      };
      if (body.id_destino) body.id_destino = Number(body.id_destino);
      await api.put('/cms/blocos/popup', body);
      // A imagem só pode ser enviada depois que o pop-up existe.
      if (file) {
        const fd = new FormData();
        fd.append('imagem', file);
        await api.post('/cms/blocos/popup/imagem', fd);
      }
      toast('Pop-up salvo.');
      reload();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (v: boolean) => {
    try {
      await api.patch('/cms/blocos/popup', { ativo: v });
      toast(v ? 'Pop-up ligado.' : 'Pop-up desligado.');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const remove = async () => {
    if (!confirm('Excluir o pop-up e a imagem dele?')) return;
    try {
      await api.del('/cms/blocos/popup');
      toast('Pop-up excluído.');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-extrabold">Pop-up da página inicial</h3>
          <p className="text-sm text-muted">Aparece uma vez por visita na home, dentro da janela de datas, enquanto estiver ligado.</p>
        </div>
        {data && (
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-2"><Toggle checked={data.ativo} label="Pop-up ligado" onChange={toggle} /> Ligado</label>
            <IconButton icon="trash" label="Excluir pop-up" danger onClick={remove} />
          </div>
        )}
      </div>
      {loading && <Loading className="py-6" />}
      {error && <ErrorState error={error} onRetry={reload} className="py-6" />}
      {!loading && !error && (
        <form onSubmit={submit} noValidate className="max-w-xl">
          <FormError message={formError} />
          <Field label="Título" maxLength={150} value={titulo} onChange={(e) => setTitulo(e.target.value)} error={errors.titulo} />
          <TextAreaField label="Texto" maxLength={2000} value={texto} onChange={(e) => setTexto(e.target.value)} error={errors.texto} />
          <DestinoFields value={destino} onChange={setDestino} errors={errors} />
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Field label="Início (Brasília)" mandatory={false} type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} error={errors.inicio_em} />
            <Field label="Fim (Brasília)" mandatory={false} type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} error={errors.fim_em} />
          </div>
          {!data && <label className="mt-3 flex items-center gap-2 text-sm"><Toggle checked={ativo} label="Pop-up ligado" onChange={setAtivo} /> Ligado ao salvar</label>}
          <div className="mt-3 grid gap-1.5 text-muted">
            <span>Imagem (opcional, até {MAX_MB} MB)</span>
            {preview && <img src={preview} alt="" className="max-h-40 w-auto rounded-xl border border-black/10 object-contain" />}
            <input type="file" accept={ACCEPTED.join(',')} onChange={onFile} aria-label="Escolher imagem do pop-up"
              className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:font-medium file:text-ink hover:file:bg-black/10" />
            {errors.imagem && <small role="alert" className="text-accent">{errors.imagem}</small>}
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar pop-up'}</Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ---------- Blocos ----------
function Blocks() {
  const toast = useToast();
  // O pop-up é um bloco de chave reservada ("popup"): ele tem aba própria.
  const { data, loading, error, reload } = useApi(async () => {
    const d = await api.get<{ blocos: BlocoCms[] }>('/cms/blocos');
    return { blocos: d.blocos.filter((b) => b.chave !== 'popup') };
  }, []);
  const [editing, setEditing] = useState<BlocoCms | 'novo' | null>(null);

  const remove = async (b: BlocoCms) => {
    if (!confirm(`Excluir o bloco “${b.titulo}”?`)) return;
    try {
      await api.del(`/cms/blocos/${b.chave}`);
      toast('Bloco excluído.');
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const toggle = async (b: BlocoCms, ativo: boolean) => {
    try {
      const r = await api.patch<{ mensagem: string }>(`/cms/blocos/${b.chave}`, { ativo });
      toast(r.mensagem);
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-extrabold">Blocos de texto</h3>
          <p className="text-sm text-muted">Textos como política de entrega e “sobre a distribuidora”, identificados por uma chave.</p>
        </div>
        <Button variant="accent" onClick={() => setEditing('novo')}><Icon name="plus" className="mr-1 inline h-5 w-5 align-text-bottom" />Novo bloco</Button>
      </div>
      {loading && <Loading className="py-6" />}
      {error && <ErrorState error={error} onRetry={reload} className="py-6" />}
      {data?.blocos.length === 0 && <p className="py-6 text-center text-muted">Nenhum bloco cadastrado.</p>}
      <ul className="grid gap-3">
        {data?.blocos.map((b) => (
          <li key={b.chave} className={`rounded-xl border border-black/10 p-4 ${b.ativo ? '' : 'opacity-60'}`}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="flex-1 font-extrabold">{b.titulo} <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">{b.chave}</span></p>
              <Toggle checked={b.ativo} label={`Ativar bloco ${b.titulo}`} onChange={(v) => toggle(b, v)} />
              <IconButton icon="edit" label="Editar" onClick={() => setEditing(b)} />
              <IconButton icon="trash" label="Excluir" danger onClick={() => remove(b)} />
            </div>
            <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-muted">{b.conteudo}</p>
            <p className="mt-1 text-xs text-muted">Atualizado em {formatDateTime(b.atualizado_em)}</p>
          </li>
        ))}
      </ul>
      {editing && <BlockModal bloco={editing === 'novo' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function BlockModal({ bloco, onClose, onSaved }: { bloco: BlocoCms | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [chave, setChave] = useState(bloco?.chave ?? '');
  const [titulo, setTitulo] = useState(bloco?.titulo ?? '');
  const [conteudo, setConteudo] = useState(bloco?.conteudo ?? '');
  const [ativo, setAtivo] = useState(bloco?.ativo ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(chave)) return setErrors({ chave: 'Use só letras minúsculas, números e hífens (ex.: politica-de-entrega).' });
    try {
      await api.put(`/cms/blocos/${chave}`, { titulo: titulo.trim(), conteudo, ativo });
      toast('Bloco salvo.');
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    }
  };

  return (
    <Modal title={bloco ? 'Editar bloco' : 'Novo bloco'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate>
        <FormError message={formError} />
        <Field label="Chave" value={chave} disabled={!!bloco} placeholder="politica-de-entrega"
          onChange={(e) => setChave(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} error={errors.chave} />
        <Field label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} error={errors.titulo} />
        <TextAreaField label="Conteúdo" mandatory rows={8} value={conteudo} onChange={(e) => setConteudo(e.target.value)} error={errors.conteudo} />
        <label className="mt-3 flex items-center gap-2 text-sm"><Toggle checked={ativo} label="Bloco ativo" onChange={setAtivo} /> Ativo</label>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Configurações ----------
const LABELS: Record<string, { label: string; placeholder?: string; hint?: string }> = {
  whatsapp: { label: 'WhatsApp', placeholder: '5519996727161', hint: 'Com DDI e DDD, só números. Mostra o botão flutuante no site.' },
  telefone_contato: { label: 'Telefone de contato', placeholder: '(19) 3638-1010' },
  email_contato: { label: 'E-mail de contato', placeholder: 'ecommerce@dmantiqueira.com.br' },
  horario_atendimento: { label: 'Horário de atendimento', placeholder: 'Seg a sex, das 7h45 às 18h00' },
  aviso_topo: { label: 'Aviso do topo', placeholder: 'Ex.: Entregas normais no feriado', hint: 'Faixa exibida acima do cabeçalho da loja. Deixe vazio para esconder.' },
  meta_reposicao: { label: 'Meta de reposição (unidades)', hint: 'Usada nos alertas de reposição do painel.' },
};

function Settings() {
  const { data, loading, error, reload } = useApi(() => api.get<{ configuracoes: Configuracao[] }>('/configuracoes'), []);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return (
    <div className="grid gap-3 rounded-2xl border border-black/10 bg-white p-5">
      <p className="text-sm text-muted">Cada campo é salvo separadamente. As informações públicas aparecem no rodapé, no botão de WhatsApp e no aviso do topo.</p>
      {data!.configuracoes.map((c) => <SettingRow key={c.chave} config={c} />)}
    </div>
  );
}

function SettingRow({ config }: { config: Configuracao }) {
  const toast = useToast();
  const meta = LABELS[config.chave] ?? { label: config.chave };
  const initial = config.valor == null ? '' : config.chave === 'telefone_contato' ? formatPhone(String(config.valor)) : String(config.valor);
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [err, setErr] = useState('');
  useEffect(() => setErr(''), [value]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const v = value.trim();
      await api.put(`/configuracoes/${config.chave}`, { valor: v === '' ? null : config.chave === 'meta_reposicao' ? Number(v) : v });
      setSaved(value);
      toast(`${meta.label} salvo.`);
    } catch (e2) {
      setErr(errorMessage(e2));
    }
  };

  return (
    <form onSubmit={save} className="grid items-end gap-2 border-t border-black/10 pt-3 first:border-0 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <Field label={meta.label} mandatory={false} value={value} placeholder={meta.placeholder} error={err}
          type={config.chave === 'meta_reposicao' ? 'number' : 'text'} onChange={(e) => setValue(e.target.value)} />
        <p className="mt-1 text-xs text-muted">{meta.hint ?? config.descricao}{config.publica ? ' · público' : ' · interno'}</p>
      </div>
      <Button type="submit" variant="primary" disabled={value === saved} className="mb-6 px-4 py-2 text-sm disabled:opacity-40">Salvar</Button>
    </form>
  );
}
