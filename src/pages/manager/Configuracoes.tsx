import type { FormEvent } from 'react';
import { api } from '../../api/client';
import Button from '../../components/Button';
import SectionHeader from '../../components/manager/SectionHeader';
import { ErrorState, Loading } from '../../components/State';
import { useApi } from '../../hooks/useApi';
import { CONTATO_PADRAO } from '../../data/contato';
import { formatPhone } from '../../utils/format';
import type { Configuracao } from '../../types';
import { useConfigCard } from './useConfigCard';

interface Regra {
  chave: string;
  label: string;
  ajuda: string;
  min: number;
  max: number;
}

// Regras internas do sistema. Os nomes técnicos das chaves nunca aparecem na tela; chaves desconhecidas da API são ignoradas.
const REGRAS: Regra[] = [
  {
    chave: 'meta_reposicao', label: 'Meta de reposição (unidades)', min: 1, max: 1_000_000,
    ajuda: 'Estoque-alvo usado na sugestão de compra dos alertas de reposição do painel.',
  },
  {
    chave: 'carrinho_abandonado_dias', label: 'Dias para considerar um carrinho abandonado', min: 1, max: 365,
    ajuda: 'Um carrinho com itens parado por este número de dias passa a aparecer em Carrinhos abandonados.',
  },
  {
    chave: 'estoque_faixa_alta', label: 'Limite para mostrar ‘Mais de N disponíveis’', min: 1, max: 10_000,
    ajuda: 'Acima deste estoque, a loja mostra ‘Mais de N disponíveis’ em vez da quantidade exata.',
  },
];
const CHAVES = REGRAS.map((r) => r.chave);
const porChave = Object.fromEntries(REGRAS.map((r) => [r.chave, r]));
const num = (n: number) => n.toLocaleString('pt-BR');

export default function Configuracoes() {
  const { data, loading, error, reload } = useApi(() => api.get<{ configuracoes: Configuracao[] }>('/configuracoes'), []);
  return (
    <>
      <SectionHeader title="Configurações" subtitle="Regras do sistema e informações públicas da loja." />
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <div className="grid gap-4">
          <RulesCard configs={data.configuracoes} />
          <p className="text-sm text-muted">As informações abaixo aparecem no rodapé, no botão de WhatsApp e na faixa do topo da loja.</p>
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <ContactCard configs={data.configuracoes} />
            <NoticeCard configs={data.configuracoes} />
          </div>
        </div>
      )}
    </>
  );
}

function RulesCard({ configs }: { configs: Configuracao[] }) {
  const card = useConfigCard({
    chaves: CHAVES,
    configs,
    paraCampo: (_k, v) => (v == null ? '' : String(v)),
    paraApi: (_k, texto) => Number(texto.trim()),
    validar: (k, texto) => {
      const r = porChave[k];
      const t = texto.trim();
      const n = Number(t);
      return /^\d+$/.test(t) && n >= r.min && n <= r.max ? '' : `Informe um número inteiro de ${num(r.min)} a ${num(r.max)}.`;
    },
    mensagemOk: 'Configurações salvas.',
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (card.alterou) card.salvar();
  };

  return (
    <form onSubmit={submit} noValidate className="max-w-2xl rounded-2xl border border-black/10 bg-white p-5">
      <h3 className="font-extrabold">Regras do sistema</h3>
      <div className="mt-4 grid gap-4">
        {REGRAS.map((r) => (
          <div key={r.chave}>
            <label htmlFor={`cfg-${r.chave}`} className="mb-1 block text-sm text-muted">{r.label}</label>
            <input id={`cfg-${r.chave}`} type="number" inputMode="numeric" step={1} min={r.min} max={r.max} value={card.valores[r.chave]}
              onChange={(e) => card.alterar(r.chave, e.target.value)} aria-invalid={!!card.erros[r.chave]} aria-describedby={`cfg-${r.chave}-ajuda`}
              className="campo h-11 w-full max-w-xs rounded-xl border border-black/10 bg-white px-4 text-ink outline-none focus:border-brand" />
            <div id={`cfg-${r.chave}-ajuda`} className="mt-1 text-xs leading-5">
              {card.erros[r.chave] ? <p role="alert" className="text-accent">{card.erros[r.chave]}</p> : <p className="text-muted">{r.ajuda}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {card.alterou && <Button type="button" variant="ghost" className="h-11 py-0" onClick={card.descartar}>Descartar alterações</Button>}
        <Button type="submit" variant="primary" className="h-11 py-0 disabled:opacity-40" disabled={!card.alterou || card.salvando}>Salvar</Button>
      </div>
    </form>
  );
}

// ---------- Contatos e aviso do topo (públicos: rodapé, botão de WhatsApp e faixa do topo da loja) ----------
const CONTATOS = [
  { chave: 'whatsapp', label: 'WhatsApp', placeholder: '5519996727161', padrao: CONTATO_PADRAO.whatsapp,
    extra: ' (o botão flutuante só aparece com um número preenchido).', dica: 'Com DDI e DDD, só números.' },
  { chave: 'telefone_contato', label: 'Telefone de contato', placeholder: '(19) 3638-1010', padrao: CONTATO_PADRAO.telefone, extra: '', dica: '' },
  { chave: 'email_contato', label: 'E-mail de contato', placeholder: 'ecommerce@dmantiqueira.com.br', padrao: CONTATO_PADRAO.email, extra: '', dica: '' },
  { chave: 'horario_atendimento', label: 'Horário de atendimento', placeholder: 'Seg a sex, das 7h45 às 18h00', padrao: CONTATO_PADRAO.horario, extra: '', dica: '' },
];
const AVISO_MAX = 200;
const HORARIO_MAX = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mesmas regras do back (campo vazio = usar o padrão da empresa).
function validarContato(chave: string, texto: string): string {
  const t = texto.trim();
  if (!t) return '';
  const digitos = t.replace(/\D/g, '');
  if (chave === 'whatsapp') return digitos.length >= 12 && digitos.length <= 13 ? '' : 'O WhatsApp deve ter de 12 a 13 dígitos, com DDI e DDD (ex.: 5519999990000).';
  if (chave === 'telefone_contato') return digitos.length >= 10 && digitos.length <= 11 ? '' : 'O telefone deve ter de 10 a 11 dígitos, com DDD.';
  if (chave === 'email_contato') return EMAIL_RE.test(t) && t.length <= 100 ? '' : 'Informe um e-mail válido.';
  if (chave === 'horario_atendimento') return t.length <= HORARIO_MAX ? '' : `O horário pode ter até ${HORARIO_MAX} caracteres.`;
  return '';
}

const paraCampoConfig = (chave: string, valor: Configuracao['valor']) => (valor == null ? '' : chave === 'telefone_contato' ? formatPhone(String(valor)) : String(valor));
const paraApiConfig = (_chave: string, texto: string) => (texto.trim() === '' ? null : texto.trim());

function CardActions({ alterou, salvando, onDiscard }: { alterou: boolean; salvando: boolean; onDiscard: () => void }) {
  return (
    <div className="mt-4 flex flex-wrap justify-end gap-2">
      {alterou && <Button type="button" variant="ghost" className="h-11 py-0" onClick={onDiscard}>Descartar alterações</Button>}
      <Button type="submit" variant="primary" className="h-11 py-0 disabled:opacity-40" disabled={!alterou || salvando}>Salvar</Button>
    </div>
  );
}

function ContactCard({ configs }: { configs: Configuracao[] }) {
  const card = useConfigCard({ chaves: CONTATOS.map((c) => c.chave), configs, paraCampo: paraCampoConfig, paraApi: paraApiConfig, validar: validarContato, mensagemOk: 'Contato salvo.' });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (card.alterou) card.salvar();
  };
  const digitos = card.base.whatsapp.replace(/\D/g, '');
  const testarWhats = digitos.length >= 12 && digitos.length <= 13;
  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-black/10 bg-white p-5">
      <h3 className="font-extrabold">Contato público</h3>
      <div className="mt-4 grid gap-4">
        {CONTATOS.map((c) => (
          <div key={c.chave}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
              <label htmlFor={`ct-${c.chave}`} className="text-sm text-muted">{c.label}</label>
              {c.chave === 'whatsapp' && testarWhats && (
                <a href={`https://wa.me/${digitos}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-700 underline hover:text-blue-900">Testar no WhatsApp</a>
              )}
            </div>
            <input id={`ct-${c.chave}`} type="text" value={card.valores[c.chave]} placeholder={c.placeholder} aria-invalid={!!card.erros[c.chave]} aria-describedby={`ct-${c.chave}-ajuda`}
              onChange={(e) => card.alterar(c.chave, e.target.value)}
              className="campo h-11 w-full min-w-0 rounded-xl border border-black/10 bg-white px-4 text-ink outline-none focus:border-brand" />
            <div id={`ct-${c.chave}-ajuda`} className="mt-1 text-xs leading-5">
              {card.erros[c.chave] ? <p role="alert" className="text-accent">{card.erros[c.chave]}</p> : (
                <p className="text-muted">{c.dica ? `${c.dica} ` : ''}Deixe vazio para usar o padrão da empresa: {c.padrao}{c.extra}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <CardActions alterou={card.alterou} salvando={card.salvando} onDiscard={card.descartar} />
    </form>
  );
}

function NoticeCard({ configs }: { configs: Configuracao[] }) {
  const card = useConfigCard({
    chaves: ['aviso_topo'], configs, paraCampo: paraCampoConfig, paraApi: paraApiConfig, mensagemOk: 'Aviso salvo.',
    validar: (_k, t) => (t.length > AVISO_MAX ? `O aviso pode ter até ${AVISO_MAX} caracteres.` : ''),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (card.alterou) card.salvar();
  };
  const texto = card.valores.aviso_topo;
  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-black/10 bg-white p-5">
      <h3 className="font-extrabold">Aviso do topo</h3>
      <p className="mb-1 mt-4 text-sm text-muted">Pré-visualização</p>
      <div className="overflow-hidden rounded-xl border border-black/10">
        {texto.trim() ? (
          <p data-testid="previa-aviso" className="bg-brand-dark px-5 py-2 text-center text-sm font-medium text-white">{texto}</p>
        ) : (
          <p className="bg-surface px-5 py-2 text-center text-sm text-muted">Sem aviso: a faixa fica escondida.</p>
        )}
      </div>
      <label htmlFor="ct-aviso_topo" className="mb-1 mt-4 block text-sm text-muted">Texto do aviso</label>
      <input id="ct-aviso_topo" type="text" value={texto} maxLength={AVISO_MAX} placeholder="Ex.: Entregas normais no feriado" aria-invalid={!!card.erros.aviso_topo}
        aria-describedby="ct-aviso_topo-ajuda" onChange={(e) => card.alterar('aviso_topo', e.target.value)}
        className="campo h-11 w-full min-w-0 rounded-xl border border-black/10 bg-white px-4 text-ink outline-none focus:border-brand" />
      <div id="ct-aviso_topo-ajuda" className="mt-1 flex justify-between gap-3 text-xs leading-5">
        {card.erros.aviso_topo ? <p role="alert" className="text-accent">{card.erros.aviso_topo}</p> : <p className="text-muted">Faixa exibida acima do cabeçalho da loja. Deixe vazio para esconder.</p>}
        <span className="shrink-0 text-muted">{texto.length}/{AVISO_MAX}</span>
      </div>
      <CardActions alterou={card.alterou} salvando={card.salvando} onDiscard={card.descartar} />
    </form>
  );
}
