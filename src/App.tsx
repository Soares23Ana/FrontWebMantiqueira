import { useEffect, useMemo, useState } from 'react';

interface Produto {
  id_produto: number;
  sku?: string;
  nome: string;
  preco: number;
  quantidade_estoque: number;
  categoria?: string;
  marca?: string;
}

type IconName = 'search' | 'user' | 'heart' | 'package' | 'cart' | 'chevron';

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, JSX.Element> = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    heart: <path d="M20.8 8.7c0 5.4-8.8 10.3-8.8 10.3S3.2 14.1 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" />,
    package: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></>,
    cart: <><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="10" cy="21" r="1" /><circle cx="18" cy="21" r="1" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

type CategoriaColgate = 'Todos os produtos' | 'Escova de dentes' | 'Antisséptico bucal' | 'Creme dental' | 'Fio dental';

const categoriasColgate: CategoriaColgate[] = [
  'Todos os produtos',
  'Escova de dentes',
  'Antisséptico bucal',
  'Creme dental',
  'Fio dental',
];

type CategoriaHuggies =
  | 'Todos os produtos'
  | 'Fraldas'
  | 'Colônias'
  | 'Condicionadores'
  | 'Cremes para assaduras'
  | 'Shampoos'
  | 'Creme para pentear'
  | 'Toalhas e lenços'
  | 'Sabonetes';

const categoriasHuggies: CategoriaHuggies[] = [
  'Todos os produtos',
  'Fraldas',
  'Colônias',
  'Condicionadores',
  'Cremes para assaduras',
  'Shampoos',
  'Creme para pentear',
  'Toalhas e lenços',
  'Sabonetes',
];

type CategoriaGranado =
  | 'Todos os produtos'
  | 'Repelentes'
  | 'Sabonete líquido'
  | 'Sabonete em barra'
  | 'Condicionadores'
  | 'Shampoo'
  | 'Cutículas'
  | 'Gel/Creme'
  | 'Polvilho'
  | 'Talcos'
  | 'Toalhas e Lenços';

const categoriasGranado: CategoriaGranado[] = [
  'Todos os produtos',
  'Repelentes',
  'Sabonete líquido',
  'Sabonete em barra',
  'Condicionadores',
  'Shampoo',
  'Cutículas',
  'Gel/Creme',
  'Polvilho',
  'Talcos',
  'Toalhas e Lenços',
];

function ProductGrid({
  products,
  onAdd,
  emptyMessage = 'Nenhum produto encontrado para essa busca.',
}: {
  products: Produto[];
  onAdd: (price: number) => void;
  emptyMessage?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.length > 0 ? products.map((produto, index) => {
        const numeroId = produto.id_produto || (index + 1);
        const codigoParaImagem = String(numeroId).padStart(3, '0');
        const codigoParaMostrar = produto.sku || `SKU-${codigoParaImagem}`;
        const imageUrl = `https://res.cloudinary.com/ezgj70g6/image/upload/c_fill,w_300,q_auto/produtos/${codigoParaImagem}`;

        return (
          <article key={produto.id_produto || index} className="group rounded-[22px] border border-[#eee9e4] bg-white p-4 shadow-[0_10px_30px_rgba(18,18,18,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(18,18,18,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-[#f1ede9] px-2.5 py-1 text-[9px] font-heading font-bold uppercase tracking-[0.14em] text-[#544d47]">
                {produto.categoria || produto.marca}
              </span>
              <button type="button" aria-label="Salvar item" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e7e0db] bg-[#fff] text-[#666] hover:border-[#aaa] hover:text-[#1d1d1d]">
                ♡
              </button>
            </div>

            <div className="flex h-52 items-center justify-center overflow-hidden rounded-[18px] bg-[#f7f5f3] p-3">
              <img
                src={produto.sku === 'SKU-101' ? '/images/colgate.png' : imageUrl}
                alt={produto.sku === 'SKU-101' ? 'Creme Dental Colgate' : produto.nome}
                className="max-h-full max-w-full object-contain"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = 'https://placehold.co/600x400/eeeeee/666666?text=Sem+Foto';
                }}
              />
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-heading font-bold uppercase tracking-[0.18em] text-[#8a817b]">{produto.marca}</p>
              <h3 className="mt-2 text-lg font-heading font-semibold leading-tight text-[#1d1d1d]">{produto.nome}</h3>
              <p className="mt-2 text-[11px] text-[#666]">SKU: {codigoParaMostrar}</p>
            </div>

            <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#f0ebe7] pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#7a726c]">Preço</p>
                <p className="mt-1 font-heading text-2xl font-bold text-[#1d1d1d]">R$ {Number(produto.preco).toFixed(2)}</p>
              </div>
              <button type="button" onClick={() => onAdd(Number(produto.preco))} className="rounded-full bg-[#1d1d1d] px-4 py-2.5 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors hover:bg-black">
                + Adicionar
              </button>
            </div>
          </article>
        );
      }) : (
        <p className="col-span-full rounded-xl border border-dashed border-gray-300 bg-surface py-8 text-center text-xs text-textSecondary">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}

const produtosDemo: Produto[] = [
  { id_produto: 101, sku: 'SKU-101', nome: 'Creme Dental Colgate Tripla Acao 90g', preco: 3.89, quantidade_estoque: 248, categoria: 'Higiene', marca: 'Colgate' },
  { id_produto: 102, sku: 'SKU-102', nome: 'Fralda Huggies Supreme Care M', preco: 52.9, quantidade_estoque: 84, categoria: 'Infantil', marca: 'Huggies' },
  { id_produto: 103, sku: 'SKU-103', nome: 'Sabonete Liquido Granado 300ml', preco: 18.75, quantidade_estoque: 126, categoria: 'Higiene', marca: 'Granado' },
  { id_produto: 104, sku: 'SKU-104', nome: 'Barbeador Bic Comfort 3', preco: 6.49, quantidade_estoque: 312, categoria: 'Perfumaria', marca: 'Bic' },
  { id_produto: 105, sku: 'SKU-105', nome: 'Desodorante Bozzano Aerosol 90g', preco: 10.9, quantidade_estoque: 197, categoria: 'Perfumaria', marca: 'Bozzano' },
  { id_produto: 106, sku: 'SKU-106', nome: 'Sabonete Phebo Odor de Rosas 90g', preco: 5.99, quantidade_estoque: 142, categoria: 'Higiene', marca: 'Phebo' },
  { id_produto: 107, sku: 'SKU-107', nome: 'Esmalte Coty Colorama 8ml', preco: 7.45, quantidade_estoque: 63, categoria: 'Beleza', marca: 'Coty' },
  { id_produto: 108, sku: 'SKU-108', nome: 'Papel Higienico Kimberly 30m', preco: 16.8, quantidade_estoque: 91, categoria: 'Limpeza', marca: 'Kimberly' },
];

export default function App() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [carrinho, setCarrinho] = useState(1482);
  const [paginaAtual, setPaginaAtual] = useState<'inicio' | 'conta' | 'express' | 'categoria' | 'marca-colgate' | 'marca-huggies' | 'marca-granado'>('inicio');
  const [categoriaAtual, setCategoriaAtual] = useState<'acendedores' | 'baterias'>('acendedores');
  const [categoriaColgateAtual, setCategoriaColgateAtual] = useState<CategoriaColgate>('Todos os produtos');
  const [categoriaHuggiesAtual, setCategoriaHuggiesAtual] = useState<CategoriaHuggies>('Todos os produtos');
  const [categoriaGranadoAtual, setCategoriaGranadoAtual] = useState<CategoriaGranado>('Todos os produtos');
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/produtos')
      .then((res) => res.json())
      .then((data) => setProdutos(data))
      .catch((err) => console.error('Erro ao procurar produtos:', err));
  }, []);

  const produtosVisiveis = useMemo(() => {
    const catalogo = produtos.length > 0 ? produtos : produtosDemo;
    const termo = busca.trim().toLowerCase();
    if (!termo) return catalogo;
    return catalogo.filter((produto) =>
      `${produto.nome} ${produto.marca ?? ''} ${produto.categoria ?? ''} ${produto.sku ?? ''} ${produto.id_produto}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, produtos]);

  const produtosColgate = useMemo(
    () => (produtos.length > 0 ? produtos : produtosDemo).filter((produto) => produto.marca?.trim().toLowerCase() === 'colgate'),
    [produtos]
  );

  const produtosColgateVisiveis = useMemo(() => {
    if (categoriaColgateAtual === 'Todos os produtos') return produtosColgate;
    const termosPorCategoria: Record<Exclude<CategoriaColgate, 'Todos os produtos'>, string[]> = {
      'Escova de dentes': ['escova'],
      'Antisséptico bucal': ['antisseptico', 'enxaguante', 'antiseptico'],
      'Creme dental': ['creme dental', 'pasta dental', 'dentifr'],
      'Fio dental': ['fio dental', 'fita dental'],
    };
    const termos = termosPorCategoria[categoriaColgateAtual];
    return produtosColgate.filter((produto) => {
      const textoProduto = `${produto.nome} ${produto.categoria ?? ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return termos.some((termo) => textoProduto.includes(termo));
    });
  }, [categoriaColgateAtual, produtosColgate]);

  const produtosHuggies = useMemo(
    () => (produtos.length > 0 ? produtos : produtosDemo).filter((produto) => produto.marca?.trim().toLowerCase() === 'huggies'),
    [produtos]
  );

  const produtosHuggiesVisiveis = useMemo(() => {
    if (categoriaHuggiesAtual === 'Todos os produtos') return produtosHuggies;
    const termosPorCategoria: Record<Exclude<CategoriaHuggies, 'Todos os produtos'>, string[]> = {
      'Fraldas': ['fralda', 'diaper'],
      'Colônias': ['colonia', 'colonia infantil'],
      'Condicionadores': ['condicionador'],
      'Cremes para assaduras': ['assadura', 'creme preventivo'],
      'Shampoos': ['shampoo'],
      'Creme para pentear': ['creme para pentear', 'pentear'],
      'Toalhas e lenços': ['toalha', 'lenco', 'lenço', 'wipe'],
      'Sabonetes': ['sabonete'],
    };
    const termos = termosPorCategoria[categoriaHuggiesAtual];
    return produtosHuggies.filter((produto) => {
      const textoProduto = `${produto.nome} ${produto.categoria ?? ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return termos.some((termo) => textoProduto.includes(termo.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
    });
  }, [categoriaHuggiesAtual, produtosHuggies]);

  const produtosGranado = useMemo(
    () => (produtos.length > 0 ? produtos : produtosDemo).filter((produto) => produto.marca?.trim().toLowerCase() === 'granado'),
    [produtos]
  );

  const produtosGranadoVisiveis = useMemo(() => {
    if (categoriaGranadoAtual === 'Todos os produtos') return produtosGranado;
    const termosPorCategoria: Record<Exclude<CategoriaGranado, 'Todos os produtos'>, string[]> = {
      'Repelentes': ['repelente', 'repelentes'],
      'Sabonete líquido': ['sabonete liquido', 'sabonete líquido'],
      'Sabonete em barra': ['sabonete em barra', 'sabonete barra'],
      'Condicionadores': ['condicionador'],
      'Shampoo': ['shampoo'],
      'Cutículas': ['cuticula', 'cuticulas'],
      'Gel/Creme': ['gel', 'creme'],
      'Polvilho': ['polvilho'],
      'Talcos': ['talco'],
      'Toalhas e Lenços': ['toalha', 'lenco', 'lenço', 'wipe'],
    };
    const termos = termosPorCategoria[categoriaGranadoAtual];
    return produtosGranado.filter((produto) => {
      const textoProduto = `${produto.nome} ${produto.categoria ?? ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return termos.some((termo) => textoProduto.includes(termo.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
    });
  }, [categoriaGranadoAtual, produtosGranado]);

  const adicionarProduto = (preco: number) => setCarrinho((valor) => valor + preco);
  const abrirCategoria = (categoria: 'acendedores' | 'baterias') => {
    setCategoriaAtual(categoria);
    setPaginaAtual('categoria');
  };

  const produtosCategoria = {
    acendedores: [
      { id_produto: 1, nome: 'Isqueiro Bic Mini J5 4un 4 Pague 3', preco: 12.9, marca: 'Bic', categoria: 'Acendedores', sku: 'SKU-001' },
      { id_produto: 2, nome: 'Isqueiro Bic Grande J6 C/12', preco: 18.6, marca: 'Bic', categoria: 'Acendedores', sku: 'SKU-002' },
      { id_produto: 3, nome: 'Isqueiro Bic Max J6 Decor Sleeve Fun Cartela C/12', preco: 21.4, marca: 'Bic', categoria: 'Acendedores', sku: 'SKU-003' },
      { id_produto: 4, nome: 'Isqueiro Bic Mini 4 Pague 3 Preto', preco: 14.2, marca: 'Bic', categoria: 'Acendedores', sku: 'SKU-004' },
      { id_produto: 5, nome: 'Isqueiro Bic Premium Transparente', preco: 16.9, marca: 'Bic', categoria: 'Acendedores', sku: 'SKU-005' },
      { id_produto: 6, nome: 'Isqueiro Bic Colorido X12', preco: 19.8, marca: 'Bic', categoria: 'Acendedores', sku: 'SKU-006' },
    ],
    baterias: [
      { id_produto: 7, nome: 'Bateria Alcalina 9V Flex', preco: 8.5, marca: 'Duracell', categoria: 'Baterias', sku: 'SKU-007' },
      { id_produto: 8, nome: 'Pacote de Pilhas AA 4un', preco: 10.2, marca: 'Energizer', categoria: 'Baterias', sku: 'SKU-008' },
      { id_produto: 9, nome: 'Bateria AAA 2un', preco: 6.9, marca: 'Eveready', categoria: 'Baterias', sku: 'SKU-009' },
      { id_produto: 10, nome: 'Bateria 9V Premium', preco: 11.4, marca: 'Panasonic', categoria: 'Baterias', sku: 'SKU-010' },
      { id_produto: 11, nome: 'Pacote Pilha AA 8un', preco: 18.4, marca: 'Energizer', categoria: 'Baterias', sku: 'SKU-011' },
      { id_produto: 12, nome: 'Bateria C Dobra', preco: 9.7, marca: 'Duracell', categoria: 'Baterias', sku: 'SKU-012' },
    ],
  } as const;

  return (
    <div className="min-h-screen bg-bgMain text-textPrimary font-sans">
      <div className="topbar">
        <div className="topbar-content">
          <strong>BEM VINDO A MANTIQUEIRA DISTRIBUIDORA!</strong>
          <nav className="topbar-links" aria-label="Links institucionais">
            <a href="#trabalhe-conosco">TRABALHE CONOSCO</a>
            <a href="#quem-somos">QUEM SOMOS</a>
            <button type="button" onClick={() => setPaginaAtual('conta')}>MINHA CONTA</button>
            <a href="#lista-de-desejos">LISTA DE DESEJOS</a>
            <button type="button" onClick={() => setCarrinhoAberto(true)}>CARRINHO</button>
            <button type="button" onClick={() => setPaginaAtual('conta')}>ENTRAR</button>
            <span className="topbar-divider" />
            <a href="#facebook" aria-label="Facebook">f</a>
            <a href="#instagram" aria-label="Instagram">◎</a>
          </nav>
        </div>
      </div>

      {/* 2. HEADER PRINCIPAL */}
      <header className="bg-surface border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1180px] mx-auto px-5 py-3 flex items-center justify-between gap-6">
          <button type="button" className="brand-logo flex items-center h-10 shrink-0" aria-label="Ir para a página inicial" onClick={() => setPaginaAtual('inicio')}>
            <img src="/logo-mantiqueira.svg" alt="Mantiqueira Distribuidora" className="h-full object-contain" />
          </button>

          <div className="relative flex-1 max-w-xl">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Busque por produto, marca ou categoria..."
              className="w-full bg-bgAlt border border-gray-300 rounded-full pl-5 pr-12 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-brand font-sans placeholder:text-textMuted"
            />
            <button type="button" aria-label="Buscar" className="absolute right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center text-textSecondary hover:text-brand transition-colors">
              <Icon name="search" size={21} />
            </button>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-textPrimary">
            <div className="account-trigger" onMouseEnter={() => undefined}>
              <button type="button" className="header-action group" aria-label="Minha conta" onClick={() => setPaginaAtual('conta')}>
                <Icon name="user" />
                <span>Minha conta</span>
              </button>
              <div className="account-popover" role="dialog" aria-label="Acessar minha conta">
                <h2>JÁ TEM UMA CONTA?</h2>
                <label htmlFor="account-cnpj">CNPJ</label>
                <input id="account-cnpj" type="text" placeholder="CNPJ" />
                <label htmlFor="account-password">Senha</label>
                <input id="account-password" type="password" placeholder="Senha" />
                <button type="button" className="account-login" onClick={() => setPaginaAtual('conta')}>ENTRAR</button>
                <div className="account-links">
                  <button type="button" onClick={() => setPaginaAtual('conta')}>CRIAR CONTA</button>
                  <button type="button">ESQUECEU A SENHA?</button>
                </div>
              </div>
            </div>
            <div className="wishlist-trigger">
              <button type="button" className="header-action group" aria-label="Favoritos">
                <Icon name="heart" />
                <span>Favoritos</span>
              </button>
              <div className="wishlist-popover" role="dialog" aria-label="Meus favoritos">
                <div className="wishlist-heading">
                  <strong>MEUS FAVORITOS</strong>
                  <button type="button">VER TODOS</button>
                </div>
                <div className="wishlist-empty">Você ainda não adicionou favoritos.</div>
              </div>
            </div>
            <button type="button" className="header-action group" aria-label="Meus pedidos">
              <Icon name="package" />
              <span>Pedidos</span>
            </button>
            <button type="button" className="header-cart group" aria-label={`Carrinho: R$ ${carrinho.toFixed(2)}`} onClick={() => setCarrinhoAberto(true)}>
              <span className="relative">
                <Icon name="cart" />
                {carrinho > 0 && <b className="header-cart-badge">1</b>}
              </span>
              <span className="hidden xl:block text-[11px] font-heading font-semibold">R$ {carrinho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </button>
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="border-t border-gray-100 bg-surface">
          <div className="site-nav-inner max-w-[1180px] mx-auto px-5 py-2 flex justify-between gap-7 text-xs font-heading font-medium text-textSecondary">
            <a href="#" className="nav-item hover:text-brand transition-colors" onClick={(event) => { event.preventDefault(); setPaginaAtual('inicio'); }}>HOME</a>
            <div className="nav-dropdown">
              <a href="#" className="nav-item hover:text-brand transition-colors">BAZAR <Icon name="chevron" size={13} /></a>
              <div className="nav-dropdown-panel" role="menu" aria-label="Categorias de bazar">
                <a href="#acendedores" role="menuitem" onClick={(event) => { event.preventDefault(); abrirCategoria('acendedores'); }}>ACENDEDORES</a>
                <a href="#baterias" role="menuitem" onClick={(event) => { event.preventDefault(); abrirCategoria('baterias'); }}>BATERIAS</a>
                <div className="nav-submenu-item">
                  <a href="#material-escritorio" role="menuitem">MATERIAL ESCRITÓRIO <span>›</span></a>
                  <div className="nav-submenu-panel" role="menu" aria-label="Categorias de material de escritório">
                    <a href="#canetas" role="menuitem">CANETAS</a>
                    <a href="#cera" role="menuitem">CERA</a>
                    <a href="#cola" role="menuitem">COLA</a>
                    <a href="#lapis" role="menuitem">LÁPIS</a>
                  </div>
                </div>
                <div className="nav-submenu-item">
                  <a href="#para-cozinha" role="menuitem">PARA COZINHA <span>›</span></a>
                  <div className="nav-submenu-panel" role="menu" aria-label="Categorias para cozinha">
                    <a href="#guardanapo" role="menuitem">GUARDANAPO</a>
                  </div>
                </div>
                <div className="nav-submenu-item">
                  <a href="#pilhas" role="menuitem">PILHAS <span>›</span></a>
                  <div className="nav-submenu-panel" role="menu" aria-label="Categorias de pilhas">
                    <a href="#alcalina" role="menuitem">ALCALINA</a>
                    <a href="#comum" role="menuitem">COMUM</a>
                    <a href="#eneloop" role="menuitem">ENELOOP</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="nav-dropdown nav-dropdown-wellness">
              <a href="#" className="nav-item hover:text-brand transition-colors">BEM ESTAR E SAÚDE <Icon name="chevron" size={13} /></a>
              <div className="nav-dropdown-panel" role="menu" aria-label="Categorias de bem estar e saúde">
                <a href="#cuidados-pes" role="menuitem">CUIDADOS PARA OS PÉS <span>›</span></a>
                <a href="#protecao-solar" role="menuitem">PROTEÇÃO SOLAR <span>›</span></a>
                <a href="#repelentes" role="menuitem">REPELENTES <span>›</span></a>
                <a href="#suplementos" role="menuitem">SUPLEMENTOS <span>›</span></a>
              </div>
            </div>
            <div className="nav-dropdown nav-dropdown-pharmacy">
              <a href="#" className="nav-item hover:text-brand transition-colors">FARMÁCIA <Icon name="chevron" size={13} /></a>
              <div className="nav-dropdown-panel" role="menu" aria-label="Categorias de farmácia">
                <a href="#cuidados-diversos" role="menuitem">CUIDADOS DIVERSOS <span>›</span></a>
                <a href="#medicamentos" role="menuitem">MEDICAMENTOS <span>›</span></a>
                <a href="#pastilhas-balas" role="menuitem">PASTILHAS E BALAS <span>›</span></a>
              </div>
            </div>
            <div className="nav-dropdown nav-dropdown-cleaning">
              <a href="#" className="nav-item hover:text-brand transition-colors">LIMPEZA <Icon name="chevron" size={13} /></a>
              <div className="nav-dropdown-panel" role="menu" aria-label="Categorias de limpeza">
                <a href="#panos-semi-descartaveis" role="menuitem">PANOS SEMI DESCARTÁVEIS</a>
              </div>
            </div>
            <div className="nav-dropdown nav-dropdown-beauty">
              <a href="#" className="nav-item hover:text-brand transition-colors">HIGIENE E BELEZA <Icon name="chevron" size={13} /></a>
              <div className="nav-dropdown-panel" role="menu" aria-label="Categorias de higiene e beleza">
                <a href="#cuidados-faciais" role="menuitem">CUIDADOS FACIAIS <span>›</span></a>
                <a href="#cuidados-infantis" role="menuitem">CUIDADOS INFANTIS <span>›</span></a>
                <a href="#cuidados-pessoais" role="menuitem">CUIDADOS PESSOAIS <span>›</span></a>
                <a href="#higiene-bucal" role="menuitem">HIGIENE BUCAL <span>›</span></a>
                <a href="#higiene-intima" role="menuitem">HIGIENE ÍNTIMA <span>›</span></a>
                <a href="#saude-pes" role="menuitem">SAÚDE DOS PÉS <span>›</span></a>
              </div>
            </div>
            <div className="nav-dropdown nav-dropdown-baby">
              <a href="#" className="nav-item hover:text-brand transition-colors">LOJA DO BEBÊ <Icon name="chevron" size={13} /></a>
              <div className="nav-dropdown-panel" role="menu" aria-label="Categorias da loja do bebê">
                <a href="#bicos-mamadeira" role="menuitem">BICOS MAMADEIRA <span>›</span></a>
                <a href="#chupetas" role="menuitem">CHUPETAS <span>›</span></a>
                <a href="#copos" role="menuitem">COPOS <span>›</span></a>
                <a href="#fraldas-infantis" role="menuitem">FRALDAS INFANTIS <span>›</span></a>
                <a href="#mamadeiras" role="menuitem">MAMADEIRAS <span>›</span></a>
                <a href="#para-mamae" role="menuitem">PARA A MAMÃE <span>›</span></a>
              </div>
            </div>
            <div className="nav-dropdown nav-dropdown-partners">
              <a href="#" className="nav-item hover:text-brand transition-colors">PARCEIROS <Icon name="chevron" size={13} /></a>
              <div className="nav-dropdown-panel" role="menu" aria-label="Categorias de parceiros">
                <a href="#fabricante" role="menuitem">FABRICANTE</a>
                <a href="#marca" role="menuitem">MARCA</a>
              </div>
            </div>
            <a href="#" className="nav-item nav-express hover:text-brand transition-colors" onClick={(event) => { event.preventDefault(); setPaginaAtual('express'); }}>PEDIDO EXPRESS</a>
          </div>
        </nav>
      </header>

      {carrinhoAberto && (
        <div className="cart-drawer-layer" role="presentation" onClick={() => setCarrinhoAberto(false)}>
          <aside className="cart-drawer" role="dialog" aria-label="Meu carrinho" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="cart-close" aria-label="Fechar carrinho" onClick={() => setCarrinhoAberto(false)}>×</button>
            <h2>{carrinho > 0 ? 'MEU CARRINHO' : 'SEU CARRINHO ESTÁ VAZIO'}</h2>
            {carrinho > 0 ? (
              <>
                <p className="cart-shipping">Parabéns, você ganhou frete grátis! <span>*na modalidade de entrega Normal</span></p>
                <div className="cart-product">
                  <div className="cart-product-image"><Icon name="package" size={42} /></div>
                  <div className="cart-product-info">
                    <strong>MANTIQUEIRA</strong>
                    <h3>Produtos selecionados para reposição</h3>
                    <p>Catálogo de higiene, beleza e utilidades</p>
                    <b>R$ {carrinho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b>
                    <span>QTD: 1</span>
                  </div>
                  <div className="cart-quantity">
                    <strong>QTD</strong>
                    <div><button type="button">−</button><b>1</b><button type="button">+</button></div>
                    <button type="button" className="cart-remove" onClick={() => setCarrinho(0)}>Remover</button>
                  </div>
                </div>
                <div className="cart-summary">
                  <div><strong>QUANTIDADE DE PRODUTOS</strong><b>1</b></div>
                  <div><strong>TOTAL</strong><b>R$ {carrinho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></div>
                  <small>ou 10x de R$ {(carrinho / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</small>
                  <div><strong>- DESCONTOS</strong><b>−</b></div>
                </div>
                <button type="button" className="cart-checkout">Conferir carrinho</button>
              </>
            ) : (
              <div className="cart-empty-state">
                <Icon name="cart" size={52} />
                <p>Adicione produtos ao seu carrinho para vê-los aqui.</p>
                <button type="button" onClick={() => { setCarrinhoAberto(false); setPaginaAtual('inicio'); }}>Continuar comprando</button>
              </div>
            )}
          </aside>
        </div>
      )}

      {paginaAtual === 'express' ? (
        <main className="express-page">
          <div className="express-steps">
            <strong>Pedido Express</strong><span>›</span><b>Checkout</b><span>›</span><b>Finalizar Pedido</b>
          </div>
          <section className="express-order">
            <div className="express-table-head"><strong>NOME DO PRODUTO</strong><strong>QUANTIDADE</strong></div>
            <div className="express-search-row">
              <input type="search" placeholder="Digite o nome ou código do produto para pesquisar..." aria-label="Pesquisar produto para pedido express" />
            </div>
            <div className="express-empty-row" />
            <div className="express-actions">
              <button type="button" onClick={() => setPaginaAtual('inicio')}>VOLTAR PARA A LOJA</button>
              <button type="button" className="express-primary">PROSSEGUIR PARA O CHECKOUT <span>→</span></button>
            </div>
          </section>
        </main>
      ) : paginaAtual === 'conta' ? (
        <main className="max-w-[1180px] mx-auto px-5 py-12">
          <section className="account-page">
            <div className="account-page-heading">
              <span className="account-eyebrow">MANTIQUEIRA DISTRIBUIDORA</span>
              <h1>Minha conta</h1>
              <p>Gerencie seus pedidos e compre para o seu negócio.</p>
            </div>
            <div className="account-columns">
              <form className="account-form" onSubmit={(event) => event.preventDefault()}>
                <h2>Já sou cliente</h2>
                <p className="account-form-note">Entre com os dados da sua empresa.</p>
                <label htmlFor="page-cnpj">CNPJ</label>
                <input id="page-cnpj" type="text" placeholder="00.000.000/0000-00" />
                <label htmlFor="page-password">Senha</label>
                <input id="page-password" type="password" placeholder="Digite sua senha" />
                <button type="submit" className="account-page-primary">ENTRAR</button>
                <button type="button" className="account-page-link">Esqueci minha senha</button>
              </form>
              <form className="account-form account-register" onSubmit={(event) => event.preventDefault()}>
                <h2>Novo cliente? Crie sua conta</h2>
                <p className="account-form-note">Cadastre sua empresa para comprar com a Mantiqueira.</p>
                <label htmlFor="register-company">Razão social</label>
                <input id="register-company" type="text" placeholder="Nome da empresa" />
                <label htmlFor="register-cnpj">CNPJ</label>
                <input id="register-cnpj" type="text" placeholder="00.000.000/0000-00" />
                <label htmlFor="register-email">E-mail do responsável</label>
                <input id="register-email" type="email" placeholder="seuemail@empresa.com.br" />
                <button type="submit" className="account-page-primary">CRIAR CONTA</button>
              </form>
            </div>
            <div className="account-page-actions">
              <button type="button" onClick={() => setPaginaAtual('inicio')}>Voltar para a loja</button>
            </div>
          </section>
        </main>
      ) : paginaAtual === 'marca-colgate' ? (
        <main className="mx-auto max-w-[1180px] space-y-12 px-5 py-8">
          <div className="flex items-center gap-2 text-sm text-textSecondary">
            <button type="button" className="text-textMuted hover:text-brand" onClick={() => setPaginaAtual('inicio')}>Início</button>
            <span>/</span>
            <span className="font-medium text-textPrimary">Colgate</span>
          </div>

          <section className="grid overflow-hidden rounded-[4px] border border-[#eee9e4] bg-white md:grid-cols-2">
            <div className="flex flex-col justify-center px-7 py-10 md:px-12 md:py-14">
              <span className="text-xs font-heading font-bold uppercase tracking-[0.2em] text-[#d71920]">Saúde bucal</span>
              <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-[#252525] md:text-5xl">Colgate</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#555]">
                A <strong>Colgate</strong> é a marca global líder em higiene oral e saúde bucal, mundialmente conhecida por seus cremes dentais, escovas de dente, enxaguantes bucais e fios dentais. Fundada originalmente em <strong>1806 por William Colgate</strong> como uma fábrica de sabonetes e velas, a marca lançou sua primeira pasta de dentes em 1873 e, em 1896, introduziu o revolucionário formato de tubo flexível.
              </p>
              <button type="button" onClick={() => { setCategoriaColgateAtual('Todos os produtos'); document.getElementById('colgate-produtos')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-6 w-fit border-b-2 border-[#d71920] pb-1 text-sm font-heading font-bold uppercase text-[#d71920]">
                Todos os produtos
              </button>
            </div>
            <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-[#d71920] px-8 py-10 text-white md:min-h-[340px]">
              <div className="absolute inset-y-0 right-0 w-[34%] bg-[#b8131a]" />
              <div className="relative z-10 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">Sorriso saudável</p>
                <p className="mt-2 font-heading text-5xl font-bold tracking-wide md:text-7xl">Colgate</p>
                <p className="mt-3 text-sm text-white/90">Cuidado diário para toda a família</p>
              </div>
            </div>
          </section>

          <section aria-label="Navegação por categoria Colgate">
            <h2 className="mb-4 text-center font-heading text-2xl font-medium text-[#292929] md:text-3xl">Compre por categoria</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categoriasColgate.map((categoria) => (
                <button
                  key={categoria}
                  type="button"
                  aria-pressed={categoriaColgateAtual === categoria}
                  onClick={() => {
                    setCategoriaColgateAtual(categoria);
                    document.getElementById('colgate-produtos')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`min-h-16 border px-3 py-4 text-center text-sm font-heading font-semibold transition-colors ${categoriaColgateAtual === categoria ? 'border-[#d71920] bg-[#d71920] text-white' : 'border-[#e5e1de] bg-white text-[#292929] hover:border-[#d71920]'}`}
                >
                  {categoria}
                </button>
              ))}
            </div>
          </section>

          <section id="colgate-produtos" className="scroll-mt-32 space-y-5">
            <div className="flex flex-col justify-between gap-2 border-b border-[#e8e3df] pb-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-[#d71920]">Colgate</span>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-[#292929]">{categoriaColgateAtual}</h2>
              </div>
              <p className="text-sm text-[#666]">Mostrando {produtosColgateVisiveis.length} produtos</p>
            </div>
            <ProductGrid
              products={produtosColgateVisiveis}
              onAdd={adicionarProduto}
              emptyMessage={`Nenhum produto Colgate encontrado em "${categoriaColgateAtual}".`}
            />
          </section>
        </main>
      ) : paginaAtual === 'marca-huggies' ? (
        <main className="mx-auto max-w-[1180px] space-y-12 px-5 py-8">
          <div className="flex items-center gap-2 text-sm text-textSecondary">
            <button type="button" className="text-textMuted hover:text-brand" onClick={() => setPaginaAtual('inicio')}>Início</button>
            <span>/</span>
            <span className="font-medium text-textPrimary">Huggies</span>
          </div>

          <section className="grid overflow-hidden rounded-[4px] border border-[#eee9e4] bg-white md:grid-cols-2">
            <div className="flex flex-col justify-center px-7 py-10 md:px-12 md:py-14">
              <span className="text-xs font-heading font-bold uppercase tracking-[0.2em] text-[#d71955]">Cuidado infantil</span>
              <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-[#252525] md:text-5xl">Huggies</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#555]">
                A <a href="https://www.huggies.com.br/" target="_blank" rel="noreferrer" className="font-semibold text-[#d71955] underline decoration-[#d71955]/40 underline-offset-2">Huggies</a> é uma marca global da Kimberly-Clark especializada em produtos de cuidado infantil, amplamente conhecida por suas linhas de fraldas descartáveis e lenços umedecidos.
              </p>
              <button type="button" onClick={() => { setCategoriaHuggiesAtual('Todos os produtos'); document.getElementById('huggies-produtos')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-6 w-fit border-b-2 border-[#d71955] pb-1 text-sm font-heading font-bold uppercase text-[#d71955]">
                Todos os produtos
              </button>
            </div>
            <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-[#d71955] px-8 py-10 text-white md:min-h-[340px]">
              <div className="absolute inset-y-0 right-0 w-[34%] bg-[#b81043]" />
              <div className="relative z-10 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">Cuidado que abraça</p>
                <p className="mt-2 font-heading text-5xl font-bold tracking-wide md:text-7xl">Huggies</p>
                <p className="mt-3 text-sm text-white/90">Proteção e carinho em cada fase</p>
              </div>
            </div>
          </section>

          <section aria-label="Navegação por categoria Huggies">
            <h2 className="mb-4 text-center font-heading text-2xl font-medium text-[#292929] md:text-3xl">Compre por categoria</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {categoriasHuggies.map((categoria) => (
                <button
                  key={categoria}
                  type="button"
                  aria-pressed={categoriaHuggiesAtual === categoria}
                  onClick={() => {
                    setCategoriaHuggiesAtual(categoria);
                    document.getElementById('huggies-produtos')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`min-h-16 border px-3 py-4 text-center text-sm font-heading font-semibold transition-colors ${categoriaHuggiesAtual === categoria ? 'border-[#d71955] bg-[#d71955] text-white' : 'border-[#e5e1de] bg-white text-[#292929] hover:border-[#d71955]'}`}
                >
                  {categoria}
                </button>
              ))}
            </div>
          </section>

          <section id="huggies-produtos" className="scroll-mt-32 space-y-5">
            <div className="flex flex-col justify-between gap-2 border-b border-[#e8e3df] pb-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-[#d71955]">Huggies</span>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-[#292929]">{categoriaHuggiesAtual}</h2>
              </div>
              <p className="text-sm text-[#666]">Mostrando {produtosHuggiesVisiveis.length} produtos</p>
            </div>
            <ProductGrid
              products={produtosHuggiesVisiveis}
              onAdd={adicionarProduto}
              emptyMessage={`Nenhum produto Huggies encontrado em "${categoriaHuggiesAtual}".`}
            />
          </section>
        </main>
      ) : paginaAtual === 'marca-granado' ? (
        <main className="mx-auto max-w-[1180px] space-y-12 px-5 py-8">
          <div className="flex items-center gap-2 text-sm text-textSecondary">
            <button type="button" className="text-textMuted hover:text-brand" onClick={() => setPaginaAtual('inicio')}>Início</button>
            <span>/</span>
            <span className="font-medium text-textPrimary">Granado</span>
          </div>

          <section className="grid overflow-hidden rounded-[4px] border border-[#e8e5dc] bg-white md:grid-cols-2">
            <div className="flex flex-col justify-center px-7 py-10 md:px-12 md:py-14">
              <span className="text-xs font-heading font-bold uppercase tracking-[0.2em] text-[#49664d]">Perfumaria brasileira desde 1870</span>
              <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-[#252525] md:text-5xl">Granado</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#555]">
                A Granado Pharmácias é a botica mais tradicional do Brasil, fundada em 1870 pelo português José Antônio Coxito Granado no centro do Rio de Janeiro. Com mais de 150 anos de história, a empresa transformou-se de uma farmácia de manipulação imperial em uma das maiores referências nacionais de perfumaria, cosméticos e cuidados pessoais, unindo o charme vintage ao mercado de luxo contemporâneo.
              </p>
              <button type="button" onClick={() => { setCategoriaGranadoAtual('Todos os produtos'); document.getElementById('granado-produtos')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-6 w-fit border-b-2 border-[#49664d] pb-1 text-sm font-heading font-bold uppercase text-[#49664d]">
                Todos os produtos
              </button>
            </div>
            <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-[#49664d] px-8 py-10 text-white md:min-h-[340px]">
              <div className="absolute inset-y-0 right-0 w-[34%] bg-[#344b39]" />
              <div className="relative z-10 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">Botica tradicional do Brasil</p>
                <p className="mt-2 font-heading text-5xl font-bold tracking-wide md:text-7xl">Granado</p>
                <p className="mt-3 text-sm text-white/90">História, cuidado e perfumaria</p>
              </div>
            </div>
          </section>

          <section aria-label="Navegação por categoria Granado">
            <h2 className="mb-4 text-center font-heading text-2xl font-medium text-[#292929] md:text-3xl">Compre por categoria</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categoriasGranado.map((categoria) => (
                <button
                  key={categoria}
                  type="button"
                  aria-pressed={categoriaGranadoAtual === categoria}
                  onClick={() => {
                    setCategoriaGranadoAtual(categoria);
                    document.getElementById('granado-produtos')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`min-h-16 border px-3 py-4 text-center text-sm font-heading font-semibold transition-colors ${categoriaGranadoAtual === categoria ? 'border-[#49664d] bg-[#49664d] text-white' : 'border-[#e5e1de] bg-white text-[#292929] hover:border-[#49664d]'}`}
                >
                  {categoria}
                </button>
              ))}
            </div>
          </section>

          <section id="granado-produtos" className="scroll-mt-32 space-y-5">
            <div className="flex flex-col justify-between gap-2 border-b border-[#e8e3df] pb-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-[#49664d]">Granado Pharmácias</span>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-[#292929]">{categoriaGranadoAtual}</h2>
              </div>
              <p className="text-sm text-[#666]">Mostrando {produtosGranadoVisiveis.length} produtos</p>
            </div>
            <ProductGrid
              products={produtosGranadoVisiveis}
              onAdd={adicionarProduto}
              emptyMessage={`Nenhum produto Granado encontrado em "${categoriaGranadoAtual}".`}
            />
          </section>
        </main>
      ) : paginaAtual === 'categoria' ? (
        <main className="max-w-[1180px] mx-auto px-5 py-8">
          <div className="mb-6 text-sm text-textSecondary flex items-center gap-2">
            <button type="button" className="text-textMuted hover:text-brand" onClick={() => setPaginaAtual('inicio')}>Página inicial</button>
            <span>/</span>
            <span className="text-textPrimary font-medium">{categoriaAtual === 'acendedores' ? 'Acendedores' : 'Baterias'}</span>
          </div>

          <section className="rounded-[28px] bg-[#f6f1eb] border border-[#ece5dd] px-6 py-7 md:px-8 md:py-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex items-center rounded-full border border-[#e7d8c4] bg-white px-3 py-1 text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-[#5a4b3d]">
                  {categoriaAtual === 'acendedores' ? 'Bazar Premium' : 'Energia e uso diário'}
                </span>
                <h1 className="mt-4 font-heading text-3xl md:text-5xl font-bold tracking-tight text-[#1d1d1d]">
                  {categoriaAtual === 'acendedores' ? 'Acendedores' : 'Baterias'}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="rounded-full border border-[#d7d1ca] bg-white px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider text-[#1d1d1d] hover:border-[#aaa] transition-colors">
                  Ofertas
                </button>
                <button type="button" className="rounded-full bg-[#1d1d1d] px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider text-white hover:bg-[#000] transition-colors">
                  Comprar agora
                </button>
              </div>
            </div>
          </section>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[240px,1fr]">
            <aside className="rounded-[24px] border border-[#ece7e1] bg-white p-5 shadow-sm">
              <h2 className="text-sm font-heading font-bold uppercase tracking-[0.18em] text-[#363636]">Filtrar</h2>
              <div className="mt-5 space-y-6">
                <div>
                  <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#666]">Marca</h3>
                  <div className="mt-3 space-y-2 text-sm text-[#444]">
                    <label className="flex items-center gap-2"><input type="checkbox" /> Bic</label>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#666]">Preço</h3>
                  <div className="mt-3 space-y-2 text-sm text-[#444]">
                    <label className="flex items-center gap-2"><input type="radio" name="preco" /> Até R$ 15</label>
                    <label className="flex items-center gap-2"><input type="radio" name="preco" /> R$ 15 a R$ 30</label>
                    <label className="flex items-center gap-2"><input type="radio" name="preco" /> Acima de R$ 30</label>
                  </div>
                </div>
              </div>
            </aside>

            <section className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-[#666]">Mostrando <span className="font-semibold text-[#1d1d1d]">{produtosCategoria[categoriaAtual].length}</span> itens</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-[#555]">Ordenar por</label>
                  <select className="rounded-full border border-[#ddd7d2] bg-white px-4 py-2 text-sm text-[#1d1d1d] focus:outline-none">
                    <option>Mais relevantes</option>
                    <option>Menor preço</option>
                    <option>Maior preço</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {produtosCategoria[categoriaAtual].map((produto) => {
                  const imageUrl = `https://res.cloudinary.com/ezgj70g6/image/upload/c_fill,w_300,q_auto/produtos/${String(produto.id_produto).padStart(3, '0')}`;
                  return (
                    <article key={produto.id_produto} className="group rounded-[22px] border border-[#eee9e4] bg-white p-4 shadow-[0_10px_30px_rgba(18,18,18,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(18,18,18,0.08)]">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="rounded-full bg-[#f1ede9] px-2.5 py-1 text-[9px] font-heading font-bold uppercase tracking-[0.14em] text-[#544d47]">
                          {produto.categoria}
                        </span>
                        <button type="button" aria-label="Salvar item" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e7e0db] bg-[#fff] text-[#666] hover:border-[#aaa] hover:text-[#1d1d1d]">
                          ♡
                        </button>
                      </div>

                      <div className="flex h-52 items-center justify-center overflow-hidden rounded-[18px] bg-[#f7f5f3] p-3">
                        <img src={imageUrl} alt={produto.nome} className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/eeeeee/666666?text=Sem+Foto'; }} />
                      </div>

                      <div className="mt-5">
                        <p className="text-[11px] font-heading font-bold uppercase tracking-[0.18em] text-[#8a817b]">{produto.marca}</p>
                        <h3 className="mt-2 text-lg font-heading font-semibold leading-tight text-[#1d1d1d]">{produto.nome}</h3>
                        <p className="mt-2 text-[11px] text-[#666]">SKU: {produto.sku}</p>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#f0ebe7] pt-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-[#7a726c]">Preço</p>
                          <p className="mt-1 font-heading text-2xl font-bold text-[#1d1d1d]">R$ {Number(produto.preco).toFixed(2)}</p>
                        </div>
                        <button type="button" onClick={() => adicionarProduto(Number(produto.preco))} className="rounded-full bg-[#1d1d1d] px-4 py-2.5 text-xs font-heading font-bold uppercase tracking-wider text-white hover:bg-black transition-colors">
                          + Adicionar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      ) : (
      <main className="max-w-[1180px] mx-auto px-5 py-7 space-y-8">
        {/* 3. BANNER PRINCIPAL (AZUL BRAND) & CARD LATERAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-brand lg:col-span-2 text-white rounded-2xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div>
              <span className="bg-accent text-white text-[10px] uppercase tracking-wider font-heading font-bold px-3 py-1 rounded-full">
                OFERTAS DA SEMANA
              </span>
              <h1 className="font-heading text-2xl md:text-3xl font-bold mt-4 mb-2 leading-tight">
                Abastecimento com Margem Garantida para Drogarias e Mercados.
              </h1>
              <p className="text-gray-200 text-sm max-w-lg font-sans">
                Mais de 2.000 SKUs essenciais com marcas nacionais inteligentes, entrega rápida e frete grátis.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="bg-accent hover:bg-accent-hover text-white text-xs font-heading font-bold px-5 py-3 rounded-lg transition-colors uppercase">
                Comprar com Pedido
              </button>
              <button className="bg-brand-dark hover:bg-opacity-80 text-white text-xs font-heading font-semibold px-4 py-3 rounded-lg border border-white/20 transition-colors">
                Digitação Rápida de SKU
              </button>
            </div>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-heading font-bold text-textMuted uppercase tracking-wider">
                Limite Aprovado
              </span>
              <h2 className="font-heading text-2xl font-bold text-brand mt-1">
                R$ 18.500,00
              </h2>
              <p className="text-xs text-textSecondary mt-1">Disponível para faturamento a prazo.</p>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-xs text-textSecondary border-b border-gray-100 pb-2">
                <span>Condição Padrão:</span>
                <b className="text-textPrimary font-heading">28 Dias Boleto</b>
              </div>
              <div className="flex justify-between text-xs text-textSecondary border-b border-gray-100 pb-2">
                <span>Representante:</span>
                <b className="text-textPrimary font-heading">Mantiqueira Direto</b>
              </div>
            </div>
            <button className="w-full mt-4 bg-bgAlt hover:bg-gray-200 text-textPrimary text-xs font-heading font-bold py-2.5 rounded-lg border border-gray-200 transition-colors">
              Falar com Representante
            </button>
          </div>
        </div>

        {/* 4. MARCAS PARCEIRAS */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-heading font-bold text-textMuted uppercase tracking-wider">
              Marcas Parceiras em Destaque
            </h3>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {['Colgate', 'Huggies', 'Granado', 'Bic', 'Bozzano', 'Phebo', 'Coty', 'Kimberly'].map((marca) => (
              marca === 'Colgate' ? (
                <button key={marca} type="button" onClick={() => { setCategoriaColgateAtual('Todos os produtos'); setPaginaAtual('marca-colgate'); }} className="bg-surface border border-gray-200 rounded-xl p-3 text-center text-xs font-heading font-bold text-textPrimary hover:border-brand hover:shadow-sm transition-all">
                  {marca}
                </button>
              ) : marca === 'Huggies' ? (
                <button key={marca} type="button" onClick={() => { setCategoriaHuggiesAtual('Todos os produtos'); setPaginaAtual('marca-huggies'); }} className="bg-surface border border-gray-200 rounded-xl p-3 text-center text-xs font-heading font-bold text-textPrimary hover:border-brand hover:shadow-sm transition-all">
                  {marca}
                </button>
              ) : marca === 'Granado' ? (
                <button key={marca} type="button" onClick={() => { setCategoriaGranadoAtual('Todos os produtos'); setPaginaAtual('marca-granado'); }} className="bg-surface border border-gray-200 rounded-xl p-3 text-center text-xs font-heading font-bold text-textPrimary hover:border-brand hover:shadow-sm transition-all">
                  {marca}
                </button>
              ) : (
                <div key={marca} className="bg-surface border border-gray-200 rounded-xl p-3 text-center text-xs font-heading font-bold text-textPrimary">
                  {marca}
                </div>
              )
            ))}
          </div>
        </section>

        {/* 5. PRODUTOS DO SEU BANCO DE DADOS */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading text-xl font-bold text-textDark">
              Catálogo de Reposição Rápida
            </h2>
            <span className="text-xs text-t extSecondary">Mostrando produtos do seu banco de dados</span>
          </div>

          <ProductGrid products={produtosVisiveis} onAdd={adicionarProduto} />
        </section>
      </main>
      )}

      <footer className="site-footer">
        <div className="site-footer-content">
          <div className="footer-brand">
            <img src="/logo-mantiqueira.svg" alt="Mantiqueira Distribuidora" className="footer-logo" />
            <p>Sua referência em distribuição!</p>
          </div>
          <div className="footer-column">
            <h6>Contato</h6>
            <p><strong>TELEFONE:</strong><br />(19) 3638-1010</p>
            <p><strong>WHATSAPP CONTATO:</strong><br />(19) 99672-7161</p>
            <p><strong>E-MAIL:</strong><br />ecommerce@dmantiqueira.com.br</p>
            <p><strong>HORÁRIO DE ATENDIMENTO:</strong><br />Seg - Sex / das 7h45 às 18h00</p>
          </div>
          <div className="footer-column">
            <h6>Área do cliente</h6>
            <button type="button">Dúvidas Frequentes</button>
            <button type="button">Histórico de Pedidos</button>
            <button type="button" onClick={() => setPaginaAtual('conta')}>Minha Conta</button>
            <button type="button">Trabalhe Conosco</button>
            <button type="button">Quem Somos</button>
            <button type="button">Política de Privacidade</button>
            <button type="button">Segunda Via de Boleto</button>
          </div>
          <div className="footer-column footer-social">
            <h6>Redes sociais</h6>
            <div className="social-links">
              <a href="#facebook" aria-label="Facebook">f</a>
              <a href="#instagram" aria-label="Instagram">◎</a>
              <a href="#linkedin" aria-label="LinkedIn">in</a>
            </div>
          </div>
        </div>
        <div className="footer-line" />
      </footer>
    </div>
  );
}