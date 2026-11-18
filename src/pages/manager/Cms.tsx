import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, ApiError, errorMessage, imageUrl } from '../../api/client';
import Button from '../../components/Button';
import Field, { TextAreaField } from '../../components/Field';
import DestinoFields, { DESTINO_VAZIO, destinoDeApi, destinoParaApi } from '../../components/manager/DestinoFields';
import type { DestinoValue } from '../../components/manager/DestinoFields';
import Icon from '../../components/Icon';
import BannerPreview from '../../components/manager/BannerPreview';
import ImagePicker, { MAX_IMAGE_MB, validarImagem } from '../../components/manager/ImagePicker';
import UnderlineTabs from '../../components/manager/UnderlineTabs';
import IconButton from '../../components/manager/IconButton';
import Modal from '../../components/manager/Modal';
import SectionHeader from '../../components/manager/SectionHeader';
import Toggle from '../../components/manager/Toggle';
import { ErrorState, FormError, Loading } from '../../components/State';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { formatDateTime, toLocalInput } from '../../utils/format';
import type { Banner, BlocoCms, Destino, SituacaoBanner } from '../../types';

type Aba = 'Banners' | 'Pop-up' | 'Blocos de texto';

// A aba "Blocos de texto" fica escondida: o site público ainda não tem página que exiba esses blocos.
// O código continua aqui; para reativar, troque para true (ver o README).
const MOSTRAR_BLOCOS: boolean = false;
const ABAS: Aba[] = MOSTRAR_BLOCOS ? ['Banners', 'Pop-up', 'Blocos de texto'] : ['Banners', 'Pop-up'];

export default function Cms() {
  const [tab, setTab] = useState<Aba>('Banners');
  return (
    <>
      <SectionHeader title="Conteúdo (CMS)" subtitle="Banners e pop-up da página inicial">
        <a href={import.meta.env.BASE_URL} target="_blank" rel="noopener noreferrer"
          className="rounded-full px-3 py-2 text-sm font-medium text-brand underline hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          Ver como fica na loja
        </a>
      </SectionHeader>
      <div className="mb-4"><UnderlineTabs tabs={ABAS} value={tab} onChange={setTab} label="Seção" idPrefix="cms-aba" panelId="painel-cms" /></div>
      <div role="tabpanel" id="painel-cms">
        {tab === 'Banners' && <Banners />}
        {tab === 'Pop-up' && <PopupTab />}
        {MOSTRAR_BLOCOS && tab === 'Blocos de texto' && <Blocks />}
      </div>
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
  const { data, loading, loaded, error, reload, setData } = useApi(() => api.get<{ banners: Banner[] }>('/cms/todos'), []);
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
    // o botão desliza na hora; se o servidor recusar, a lista é recarregada e ele volta
    setData((prev) => prev && { banners: prev.banners.map((x) => (x.id_banner === b.id_banner ? { ...x, ativo } : x)) });
    try {
      await api.patch(`/cms/${b.id_banner}`, { ativo });
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
      reload();
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
      {loading && !loaded && <Loading className="py-6" />}
      {error && <ErrorState error={error} onRetry={reload} className="py-6" />}
      {data && banners.length === 0 && <p className="py-6 text-center text-muted">Nenhum banner cadastrado.</p>}
      {data && banners.length > 0 && !banners.some((b) => b.situacao === 'no_ar') && (
        <p role="status" className="mb-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-800">
          Nenhum banner está no ar. A página inicial mostra a abertura padrão. Ative um banner e escolha para onde ele leva.
        </p>
      )}
      <ul className="grid gap-3">
        {banners.map((b, i) => (
          <li key={b.id_banner} className={`flex flex-wrap items-center gap-3 rounded-xl border border-black/10 p-3 ${b.situacao === 'no_ar' ? '' : 'opacity-70'}`}>
            <BannerPreview title={b.titulo} image={imageUrl(b.imagem_url)} className="aspect-[1920/700] w-40 shrink-0 sm:w-48" />
            <div className="min-w-40 flex-1">
              <p className="font-medium">{b.titulo}</p>
              <p className={`truncate text-sm ${textoDestino(b).temDestino ? 'font-medium text-ink' : 'text-muted'}`}>{textoDestino(b).texto}</p>
              <p className="text-xs text-muted">
                <span className={`mr-2 rounded-full px-2 py-0.5 font-medium ${SITUACAO[b.situacao][1]}`}>{SITUACAO[b.situacao][0]}</span>
                {b.inicio_em || b.fim_em ? `${b.inicio_em ? formatDateTime(b.inicio_em) : '…'} até ${b.fim_em ? formatDateTime(b.fim_em) : '…'}` : 'Sem período'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Toggle checked={b.ativo} label={`Ativar ${b.titulo}`} onChange={(v) => toggle(b, v)} />
              <div role="group" aria-label={`Ordem de ${b.titulo}`} className="flex items-center rounded-full bg-surface">
                <IconButton icon="up" label={`Subir ${b.titulo}`} disabled={i === 0} onClick={() => move(i, -1)} />
                <IconButton icon="down" label={`Descer ${b.titulo}`} disabled={i === banners.length - 1} onClick={() => move(i, 1)} />
              </div>
              <div className="flex items-center border-l border-black/10 pl-2">
                <IconButton icon="edit" label={`Editar ${b.titulo}`} onClick={() => setEditing(b)} />
                {confirmId === b.id_banner ? (
                  <span className="ml-1 flex items-center gap-1">
                    <Button variant="accent" className="px-3 py-1 text-sm" onClick={() => remove(b)}>Excluir</Button>
                    <Button variant="ghost" className="px-3 py-1 text-sm" onClick={() => setConfirmId(null)}>Não</Button>
                  </span>
                ) : (
                  <IconButton icon="trash" label={`Excluir ${b.titulo}`} danger="hover" onClick={() => setConfirmId(b.id_banner)} />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {editing && <BannerFormModal banner={editing === 'novo' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

const BANNER_PROPORCAO = 1920 / 700;

/** Lê a largura e a altura da imagem no navegador (nada é enviado). */
function lerDimensoes(url: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const TIPO_DESTINO_ROTULO: Record<string, string> = { produto: 'Produto', categoria: 'Categoria', marca: 'Marca', campanha: 'Campanha', link: 'Link' };

/** Texto do destino na linha do banner: "Abre: Categoria · /categoria/higiene" ou "Sem destino (não clicável)". */
function textoDestino(b: Banner): { texto: string; temDestino: boolean } {
  const tipo = b.tipo_destino ?? b.destino?.tipo;
  const link = b.destino?.link ?? b.link;
  if (tipo === 'nenhum' || (!tipo && !link)) return { texto: 'Sem destino (não clicável)', temDestino: false };
  const rotulo = tipo ? TIPO_DESTINO_ROTULO[tipo] : undefined;
  return { texto: `Abre: ${[rotulo, link].filter(Boolean).join(' · ')}`, temDestino: true };
}

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

  const [avisoProporcao, setAvisoProporcao] = useState(false);

  const onPick = async (f: File) => {
    const msg = validarImagem(f);
    setErrors((p) => ({ ...p, imagem: msg }));
    if (msg) return;
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreview(url);
    // Aviso que não bloqueia: proporção mais de 10% diferente de 1920 × 700.
    const dim = await lerDimensoes(url);
    setAvisoProporcao(!!dim && dim.h > 0 && Math.abs(dim.w / dim.h / BANNER_PROPORCAO - 1) > 0.1);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (inicio && fim && fim <= inicio) return setErrors({ fim_em: 'O fim deve ser depois do início.' });
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
        <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Field className="min-w-0" label="Início (Brasília)" mandatory={false} type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} error={errors.inicio_em} />
          <Field className="min-w-0" label="Fim (Brasília)" mandatory={false} type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} error={errors.fim_em} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><Toggle checked={ativo} label="Banner ativo" onChange={setAtivo} /> Ativo</label>
        <div className="mt-3 grid gap-1.5 text-muted">
          <span>Imagem (1920 × 700 px, até {MAX_IMAGE_MB} MB) {!banner && <b className="text-accent">*</b>}</span>
          <BannerPreview title={titulo || 'Pré-visualização'} image={preview} className="aspect-[1920/700] w-full" />
          <ImagePicker ariaLabel="Escolher imagem" fileName={file?.name} onPick={onPick} />
          {avisoProporcao && (
            <p role="status" className="rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-800">Esta imagem tem proporção diferente de 1920 × 700 e será recortada no site.</p>
          )}
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
type SituacaoPopup = 'desligado' | 'agendado' | 'expirado' | 'no_ar';

// Mesma regra dos banners: desligado vence; depois a janela de datas.
export function situacaoPopup(p: { ativo: boolean; inicio_em: string | null; fim_em: string | null }, agora = new Date()): SituacaoPopup {
  if (!p.ativo) return 'desligado';
  if (p.inicio_em && new Date(p.inicio_em) > agora) return 'agendado';
  if (p.fim_em && new Date(p.fim_em) < agora) return 'expirado';
  return 'no_ar';
}

const SITUACAO_POPUP: Record<SituacaoPopup, [string, string]> = {
  desligado: ['Desligado', 'bg-black/10 text-muted'],
  agendado: ['Agendado', 'bg-brand/10 text-brand'],
  expirado: ['Expirado', 'bg-black/10 text-muted'],
  no_ar: ['No ar', 'bg-green-100 text-green-800'],
};

function fraseSituacao(s: SituacaoPopup, p: { inicio_em: string | null; fim_em: string | null }) {
  if (s === 'agendado') return `Começa em ${formatDateTime(p.inicio_em)}`;
  if (s === 'expirado') return `Encerrou em ${formatDateTime(p.fim_em)}`;
  if (s === 'no_ar') return p.fim_em ? `No ar até ${formatDateTime(p.fim_em)}` : 'No ar, sem data para acabar';
  return 'Não aparece na loja enquanto estiver desligado.';
}

function Contador({ n, max }: { n: number; max: number }) {
  return <p className="mt-1 text-right text-xs text-muted">{n}/{max}</p>;
}

// Como o pop-up aparece na loja (mesmo estilo de src/components/PopupCms.tsx), atualizado enquanto a pessoa digita.
function PopupPreview({ titulo, texto, imagem, temDestino }: { titulo: string; texto: string; imagem: string; temDestino: boolean }) {
  return (
    <section aria-label="Pré-visualização do pop-up" className="rounded-2xl bg-black/5 p-4">
      <h4 className="mb-3 text-sm font-extrabold text-muted">Pré-visualização</h4>
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {imagem && <img src={imagem} alt="" className="max-h-64 w-full object-cover" />}
        <div className="p-6 text-center">
          <h2 className={`text-2xl font-extrabold ${titulo.trim() ? '' : 'text-muted'}`}>{titulo.trim() || 'Título do pop-up'}</h2>
          {texto.trim() && <p className="mt-2 whitespace-pre-line text-muted">{texto}</p>}
          {temDestino && <span className="mt-5 inline-block rounded-full bg-accent px-6 py-3 font-extrabold text-white">Ver agora</span>}
        </div>
      </div>
    </section>
  );
}

function PopupTab() {
  const toast = useToast();
  const { data, loading, loaded, error, reload } = useApi(async () => {
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
  const [confirmando, setConfirmando] = useState(false);

  // Valores salvos (ou o formulário vazio, se ainda não existe pop-up): base para "Salvar" e "Descartar".
  const salvo = {
    titulo: data?.titulo ?? '',
    texto: data?.conteudo ?? '',
    destino: data ? destinoDeApi(data.destino.tipo, data.destino.id, data.destino.link) : DESTINO_VAZIO,
    inicio: toLocalInput(data?.inicio_em),
    fim: toLocalInput(data?.fim_em),
    imagem: data?.imagem_url ? imageUrl(data.imagem_url) : '',
  };
  const restaurar = () => {
    setTitulo(salvo.titulo);
    setTexto(salvo.texto);
    setDestino(salvo.destino);
    setInicio(salvo.inicio);
    setFim(salvo.fim);
    setAtivo(data?.ativo ?? true);
    setPreview(salvo.imagem);
    setFile(null);
    setErrors({});
    setFormError('');
  };

  useEffect(() => {
    if (data === undefined) return;
    restaurar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const alterado = !!file || titulo !== salvo.titulo || texto !== salvo.texto || inicio !== salvo.inicio || fim !== salvo.fim
    || JSON.stringify(destino) !== JSON.stringify(salvo.destino) || (!data && !ativo);

  const onPick = (f: File) => {
    const msg = validarImagem(f);
    setErrors((p) => ({ ...p, imagem: msg }));
    if (msg) return;
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
    if (!data) return setAtivo(v); // ainda não existe: define o estado inicial, que vai junto no "Salvar pop-up"
    try {
      await api.patch('/cms/blocos/popup', { ativo: v });
      toast(v ? 'Pop-up ligado.' : 'Pop-up desligado.');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const remove = async () => {
    try {
      await api.del('/cms/blocos/popup');
      toast('Pop-up excluído.');
      setConfirmando(false);
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const situ = data ? situacaoPopup(data) : null;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-extrabold">Pop-up da página inicial</h3>
            {loaded && (situ ? (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SITUACAO_POPUP[situ][1]}`}>{SITUACAO_POPUP[situ][0]}</span>
            ) : (
              <span className="text-xs text-muted">Nenhum pop-up cadastrado</span>
            ))}
          </div>
          <p className="text-sm text-muted">Aparece uma vez por visita na home, dentro da janela de datas, enquanto estiver ligado.</p>
          {data && situ && <p className="text-xs text-muted">{fraseSituacao(situ, data)}</p>}
        </div>
        {loaded && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2"><Toggle checked={data ? data.ativo : ativo} label="Pop-up ligado" onChange={toggle} /> Ligado</label>
            {data && (confirmando ? (
              <span role="group" aria-label="Confirmar exclusão do pop-up" className="flex flex-wrap items-center gap-2">
                <span>Excluir o pop-up e a imagem dele?</span>
                <Button variant="accent" className="px-3 py-1 text-sm" onClick={remove}>Sim, excluir</Button>
                <Button variant="ghost" className="px-3 py-1 text-sm" onClick={() => setConfirmando(false)}>Não</Button>
              </span>
            ) : (
              <IconButton icon="trash" label="Excluir pop-up" danger="hover" onClick={() => setConfirmando(true)} />
            ))}
          </div>
        )}
      </div>
      {loading && !loaded && <Loading className="py-6" />}
      {error && <ErrorState error={error} onRetry={reload} className="py-6" />}
      {(!loading || loaded) && !error && (
        <div className="mt-3 grid items-start gap-6 lg:grid-cols-2">
          <form onSubmit={submit} noValidate className="min-w-0">
            <FormError message={formError} />
            <Field label="Título" maxLength={150} value={titulo} onChange={(e) => setTitulo(e.target.value)} error={errors.titulo} />
            <Contador n={titulo.length} max={150} />
            <TextAreaField label="Texto" maxLength={2000} value={texto} onChange={(e) => setTexto(e.target.value)} error={errors.texto} />
            <Contador n={texto.length} max={2000} />
            <DestinoFields value={destino} onChange={setDestino} errors={errors} />
            <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Field className="min-w-0" label="Início (Brasília)" mandatory={false} type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} error={errors.inicio_em} />
              <Field className="min-w-0" label="Fim (Brasília)" mandatory={false} type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} error={errors.fim_em} />
            </div>
            <div className="mt-3 grid gap-1.5 text-muted">
              <span>Imagem (opcional, até {MAX_IMAGE_MB} MB)</span>
              <ImagePicker ariaLabel="Escolher imagem do pop-up" fileName={file?.name} onPick={onPick} />
              {data?.imagem_url && <small>Você pode trocar a imagem. Para ficar sem imagem, exclua o pop-up e crie de novo.</small>}
              {errors.imagem && <small role="alert" className="text-accent">{errors.imagem}</small>}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {alterado && <Button type="button" variant="ghost" onClick={restaurar}>Descartar alterações</Button>}
              <Button type="submit" variant="primary" disabled={saving || !alterado} className="disabled:opacity-40">{saving ? 'Salvando...' : 'Salvar pop-up'}</Button>
            </div>
          </form>
          <PopupPreview titulo={titulo} texto={texto} imagem={preview} temDestino={destino.tipo !== 'nenhum'} />
        </div>
      )}
    </div>
  );
}

// ---------- Blocos ----------
function Blocks() {
  const toast = useToast();
  // O pop-up é um bloco de chave reservada ("popup"): ele tem aba própria.
  const { data, loading, loaded, error, reload, setData } = useApi(async () => {
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
    setData((prev) => prev && { blocos: prev.blocos.map((x) => (x.chave === b.chave ? { ...x, ativo } : x)) });
    try {
      const r = await api.patch<{ mensagem: string }>(`/cms/blocos/${b.chave}`, { ativo });
      toast(r.mensagem);
      reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
      reload();
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
      {loading && !loaded && <Loading className="py-6" />}
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
