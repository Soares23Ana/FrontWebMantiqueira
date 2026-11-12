// Tipos no formato da API (snake_case), conforme docs/API.md do back-end.

export type TipoUsuario = 'cliente' | 'equipe';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  pode_gerenciar_equipe: boolean;
}

export interface Paginacao {
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

export type Disponibilidade = 'disponivel' | 'ultimas_unidades' | 'indisponivel';

export interface Categoria {
  id_categoria: number;
  nome: string;
  slug: string;
  /** Nulo nas categorias principais; o id da principal nas subcategorias (2 níveis). */
  id_pai?: number | null;
  ordem?: number;
  ativo?: boolean;
  total_produtos?: number;
  /** Só em GET /categorias (árvore): as subcategorias da principal. */
  subcategorias?: Categoria[];
}

export type FaixaCodigo = 'acima_do_limite' | 'disponivel' | 'ultimas_unidades' | 'indisponivel';

/** Faixa de estoque mostrada a visitantes e clientes (a quantidade exata só vai para a equipe). */
export interface FaixaEstoque {
  codigo: FaixaCodigo;
  rotulo: string;
}

export interface Marca {
  id_marca: number;
  nome: string;
  slug: string;
  ativo?: boolean;
  total_produtos?: number;
}

export interface Produto {
  id_produto: number;
  sku: string;
  nome: string;
  descricao: string | null;
  destaques: string[] | null;
  imagem_url: string | null;
  categoria: Categoria | null;
  subcategoria?: Categoria | null;
  marca: Marca | null;
  multiplo_venda: number;
  disponibilidade: Disponibilidade;
  faixa_estoque?: FaixaEstoque;
  // Só para a equipe (visitante e cliente nunca recebem a quantidade exata):
  estoque?: number;
  estoque_minimo?: number;
  ativo?: boolean;
  criado_em?: string;
  atualizado_em?: string;
}

export interface Sugestoes {
  produtos: { id_produto: number; sku: string; nome: string; imagem_url: string | null; marca: string | null }[];
  categorias: { id_categoria: number; nome: string; slug: string }[];
  marcas: { id_marca: number; nome: string; slug: string }[];
}

export interface Filtros {
  categorias: (Omit<Categoria, 'subcategorias'> & { total: number; subcategorias?: (Omit<Categoria, 'subcategorias'> & { total: number })[] })[];
  marcas: (Marca & { total: number })[];
  disponibilidade: Record<Disponibilidade | 'em_estoque', number>;
}

export interface Endereco {
  id_endereco: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  referencia: string | null;
  principal: boolean;
}

export type EnderecoInput = Omit<Endereco, 'id_endereco' | 'principal'> & { principal?: boolean };

export interface Conta {
  id_usuario: number;
  nome: string;
  email: string;
  telefone: string | null;
  tipo: TipoUsuario;
  razao_social: string | null;
  cnpj: string | null;
  cargo: string | null;
  criado_em: string;
  enderecos: Endereco[];
}

export const STATUS_FLUXO = ['Aguardando Separação', 'Em Separação', 'Saiu para Entrega', 'Entregue'] as const;
export type StatusPedido = (typeof STATUS_FLUXO)[number] | 'Cancelado';
export const TODOS_STATUS: StatusPedido[] = [...STATUS_FLUXO, 'Cancelado'];

export interface ItemPedido {
  id_produto: number;
  sku?: string;
  nome: string;
  imagem_url: string | null;
  quantidade: number;
}

export interface ClienteResumo {
  id_usuario: number;
  nome: string;
  razao_social: string | null;
  nome_exibicao: string;
  cnpj: string | null;
  email: string;
  telefone: string | null;
}

export interface HistoricoStatus {
  status_anterior: StatusPedido | null;
  status_novo: StatusPedido;
  observacao: string | null;
  data: string;
  usuario: { id_usuario: number; nome: string; tipo: TipoUsuario } | null;
}

export interface Pedido {
  id_pedido: number;
  status: StatusPedido;
  data_pedido: string;
  data_entrega_desejada: string | null;
  data_entrega: string | null;
  observacao: string | null;
  motivo_cancelamento: string | null;
  endereco_entrega: Omit<Endereco, 'id_endereco'> & { id_endereco?: number } | null;
  itens: ItemPedido[];
  total_itens: number;
  pode_cancelar?: boolean;
  cliente?: ClienteResumo;
  funcionario?: { id_usuario: number; nome: string; cargo: string | null } | null;
  proximo_status?: StatusPedido | null;
  historico?: HistoricoStatus[];
}

export interface ItemIndisponivel {
  id_produto: number;
  sku: string | null;
  nome: string | null;
  solicitado: number;
  multiplo_venda: number;
  /** A quantidade em estoque nunca é informada: só a situação do produto. */
  disponibilidade?: Disponibilidade;
  motivo: 'produto_inexistente' | 'produto_inativo' | 'multiplo_de_venda' | 'estoque_insuficiente';
}

export interface RepetirPedido {
  id_pedido_origem: number;
  itens: {
    id_produto: number;
    sku: string;
    nome: string;
    imagem_url: string | null;
    multiplo_venda: number;
    disponibilidade: Disponibilidade;
    faixa_estoque?: FaixaEstoque;
    quantidade_anterior: number;
    quantidade_sugerida: number;
    ajuste: null | 'ajustado_ao_multiplo' | 'estoque_parcial' | 'indisponivel' | 'produto_inativo';
  }[];
  itens_para_checkout: { id_produto: number; quantidade: number }[];
  itens_ajustados: number;
}

export interface Cliente extends ClienteResumo {
  cnpj_original?: string | null;
  ativo: boolean;
  /** Cidade do endereço principal (só na listagem). */
  cidade?: string | null;
  /** Pedidos não cancelados (só na listagem). */
  total_pedidos?: number;
  criado_em: string;
  enderecos?: Endereco[];
}

export type TipoDestino = 'nenhum' | 'produto' | 'categoria' | 'marca' | 'campanha' | 'link';

/** Destino de um banner ou do pop-up, com o link interno já resolvido pela API. */
export interface Destino {
  tipo: TipoDestino;
  id: number | null;
  link: string | null;
}

export interface BannerPublico {
  id_banner: number;
  titulo: string;
  link: string | null;
  imagem_url: string;
  ordem: number;
  destino?: Destino;
}

export interface PopupPublico {
  titulo: string;
  texto: string | null;
  imagem_url: string | null;
  destino: Destino;
  inicio_em: string | null;
  fim_em: string | null;
}

export type SituacaoBanner = 'no_ar' | 'agendado' | 'expirado' | 'inativo';

export interface Banner extends BannerPublico {
  tipo_destino?: TipoDestino;
  id_destino?: number | null;
  ativo: boolean;
  inicio_em: string | null;
  fim_em: string | null;
  situacao: SituacaoBanner;
}

export interface BlocoCms {
  id_bloco: number;
  chave: string;
  titulo: string;
  conteudo: string;
  ativo: boolean;
  atualizado_em: string;
}

export interface ConfiguracoesPublicas {
  whatsapp: string | null;
  telefone_contato: string | null;
  email_contato: string | null;
  horario_atendimento: string | null;
  aviso_topo: string | null;
}

export interface Configuracao {
  chave: string;
  valor: string | number | null;
  publica: boolean;
  descricao: string;
  atualizado_em: string | null;
}

export type SituacaoCampanha = 'agendada' | 'ativa' | 'encerrada';

export interface CampanhaAtiva {
  id_campanha: number;
  slug?: string;
  titulo: string;
  selo: string | null;
  inicio_em: string;
  fim_em: string;
  produtos: Produto[];
}

export interface Campanha {
  id_campanha: number;
  slug?: string;
  titulo: string;
  selo: string | null;
  inicio_em: string;
  fim_em: string;
  situacao: SituacaoCampanha;
  produtos: { id_produto: number; sku: string; nome: string; imagem_url: string | null; ativo: boolean }[];
  total_produtos: number;
}

export interface MembroEquipe {
  id_usuario: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  pode_gerenciar_equipe: boolean;
  cargo: string | null;
  telefone: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface Movimentacao {
  id_movimentacao: number;
  tipo: 'ajuste' | 'pedido' | 'cancelamento' | 'importacao';
  quantidade: number;
  estoque_anterior: number;
  estoque_novo: number;
  observacao: string | null;
  id_pedido: number | null;
  criado_em: string;
  usuario: { id_usuario: number; nome: string } | null;
}

export interface ErroImportacao {
  linha: number;
  sku: string | null;
  campo: string | null;
  mensagem: string;
}

export interface Importacao {
  id_sincronizacao: number;
  tipo: string;
  origem: string;
  simulado: boolean;
  status: 'sucesso' | 'parcial' | 'falha' | 'em_andamento';
  linhas: number;
  criados: number;
  atualizados: number;
  inalterados: number;
  desativados: number;
  com_erro: number;
  movimentacoes_estoque: number;
  estoque_descontado?: number;
  mensagem: string | null;
  iniciado_em: string;
  finalizado_em: string | null;
  duracao_ms: number | null;
  usuario: { id_usuario: number; nome: string } | null;
  relatorio?: { erros: ErroImportacao[]; avisos: (string | ErroImportacao)[] };
}

/** Carrinho guardado na conta do cliente (GET/PUT /carrinho). */
export interface CarrinhoApi {
  itens: {
    id_produto: number;
    sku: string;
    nome: string;
    imagem_url: string | null;
    quantidade: number;
    multiplo_venda: number;
    ativo: boolean;
    disponibilidade: Disponibilidade;
    faixa_estoque?: FaixaEstoque;
  }[];
  total_itens: number;
  atualizado_em: string | null;
}

export interface CartItem {
  id_produto: number;
  quantidade: number;
  // Cópia do produto no momento em que foi adicionado (o carrinho mostra algo mesmo antes de recarregar da API).
  nome: string;
  imagem_url: string | null;
  multiplo_venda: number;
}
