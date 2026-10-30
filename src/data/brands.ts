// Conteúdo editorial das páginas de marca. O id é o slug da marca na API (GET /marcas).
export interface Brand {
  id: string;
  name: string;
  text: string;
  image: string;
  bg: string;
  color: string;
  about?: string;
  facts?: { value: string; label: string }[];
  lines?: { title: string; text: string }[];
}

export const brands: Brand[] = [
  {
    id: 'risque',
    name: 'Risqué',
    text: 'Esmaltes e coleções da marca no catálogo.',
    image: '/img/risque.webp',
    bg: 'bg-brand-dark',
    color: '#b0123a',
    about:
      'A Risqué é a marca líder de esmaltes no Brasil, pertencente ao grupo multinacional Coty. Oferece mais de 100 cores regulares, além de linhas especiais como Risqué Diamond Gel, Risqué Bio e coleções temáticas periódicas. Todos os esmaltes da marca são 100% hipoalergênicos e possuem o selo internacional Leaping Bunny da Cruelty Free International, atestando que não são testados em animais.',
    facts: [
      { value: 'Líder', label: 'Esmaltes no Brasil' },
      { value: '100+', label: 'Cores regulares' },
      { value: '100%', label: 'Hipoalergênicos' },
    ],
    lines: [
      { title: 'Diamond Gel', text: 'Linha especial Risqué Diamond Gel.' },
      { title: 'Risqué Bio', text: 'Linha especial Risqué Bio.' },
      { title: 'Coleções temáticas', text: 'Lançamentos periódicos, como a coleção Lollapalooza.' },
      { title: 'Cruelty free', text: 'Selo Leaping Bunny da Cruelty Free International: não testado em animais.' },
    ],
  },
  {
    id: 'kimberly-clark',
    name: 'Kimberly-Clark',
    text: 'Fraldas Huggies e mais para a família.',
    image: '/img/huggies.webp',
    bg: 'bg-accent',
    color: '#0057b8',
    about:
      'A Kimberly-Clark é uma multinacional americana de bens de consumo, líder global na fabricação de produtos essenciais de higiene pessoal, cuidado infantil e papel. Fundada há mais de 150 anos, em 1872, nos Estados Unidos.',
    facts: [
      { value: '1872', label: 'Ano de fundação' },
      { value: '175+', label: 'Países' },
      { value: '1996', label: 'No Brasil desde' },
    ],
    lines: [
      { title: 'Alcance global', text: 'Presente em mais de 175 países, com produtos que atendem diariamente a quase um quarto da população mundial.' },
      { title: 'Presença no Brasil', text: 'Atua fortemente no país desde 1996, oferecendo itens de cuidado pessoal e familiar de grande reconhecimento no mercado nacional.' },
    ],
  },
  {
    id: 'bic',
    name: 'Bic',
    text: 'Aparelhos de barbear, canetas, isqueiros e mais.',
    image: '/img/bic.webp',
    bg: 'bg-brand',
    color: '#d9480f',
    about:
      'O Grupo BIC é uma empresa francesa criada em 1945 que lidera o mercado mundial na fabricação de artigos de papelaria, isqueiros e aparelhos de barbear.',
    facts: [
      { value: '1945', label: 'Ano de criação' },
      { value: 'França', label: 'País de origem' },
      { value: 'Líder', label: 'Mercado mundial' },
    ],
    lines: [
      { title: 'Canetas', text: 'A clássica BIC Cristal, a caneta BIC 4 Cores e linhas de gel e marca-texto.' },
      { title: 'Isqueiros', text: 'Isqueiros de bolso seguros e testados rigorosamente antes da venda.' },
      { title: 'Barbeadores', text: 'Aparelhos de barbear descartáveis e recarregáveis para o cuidado pessoal.' },
    ],
  },
  {
    id: 'baruel',
    name: 'Baruel',
    text: 'Tenys Pé, Baruel Baby e repelentes.',
    image: '/img/tenys.webp',
    bg: 'bg-brand-dark',
    color: '#2b3990',
    about:
      'A Baruel é uma tradicional marca brasileira de cuidados pessoais e bem-estar com mais de 120 anos de mercado. Ela é líder no segmento de cuidados para os pés com a famosa linha Tenys Pé Baruel.',
    facts: [
      { value: '120+', label: 'Anos de mercado' },
      { value: 'Líder', label: 'Cuidados para os pés' },
      { value: '4', label: 'Linhas de produtos' },
    ],
    lines: [
      { title: 'Tenys Pé Baruel', text: 'Líder em proteção para os pés. Oferece talcos antissépticos, aerossóis jato seco, cremes hidratantes para calcanhares e géis para pernas cansadas, incluindo parcerias como a linha com Sabrina Sato.' },
      { title: 'Baruel Baby', text: 'Focada no cuidado infantil, com sabonetes líquidos e em barra (linhas Pele Delicada, Glicerina e Sono Tranquilo), colônias, cremes de assadura e linhas especiais para cabelos cacheados e crespos (curvaturas 3ABC e 4ABC).' },
      { title: 'Baruel Kids', text: 'Produtos voltados para o banho e a diversão das crianças.' },
      { title: 'Baruel Repelentes', text: 'Proteção contra insetos para toda a família.' },
    ],
  },
  {
    id: 'granado',
    name: 'Granado',
    text: 'Granado Pharmácias e a linha Granado Bebê.',
    image: '/img/granado.webp',
    bg: 'bg-accent',
    color: '#1f5c3a',
    about:
      'A linha Granado Bebê oferece produtos naturais e hipoalergênicos, dermatologicamente testados e livres de parabenos e corantes, ideais para a pele delicada dos pequenos. Faz parte da Granado Pharmácias, fundada no Rio de Janeiro em 1870 pelo imigrante português José Antônio Coxito Granado.',
    facts: [
      { value: '1870', label: 'Ano de fundação' },
      { value: 'Rio de Janeiro', label: 'Local de origem' },
      { value: 'Natural', label: 'Linha Bebê hipoalergênica' },
    ],
    lines: [
      { title: 'Granado Bebê', text: 'Produtos naturais e hipoalergênicos, dermatologicamente testados, para a pele delicada dos pequenos.' },
      { title: 'Granado Pharmácias', text: 'Fundada em 1870 pelo imigrante português José Antônio Coxito Granado.' },
    ],
  },
  {
    id: 'colgate-palmolive',
    name: 'Colgate-Palmolive',
    text: 'Higiene bucal e cuidados pessoais para toda a família.',
    image: '/img/colgate-plax.webp',
    bg: 'bg-accent',
    color: '#e30613',
    about:
      'A Colgate-Palmolive é uma das marcas mais tradicionais e consumidas do mundo, líder global no segmento de higiene bucal. Fundada em 1806 em Nova York por William Colgate, a companhia opera hoje em mais de 200 países e territórios, impactando bilhões de pessoas diariamente.',
    facts: [
      { value: '1806', label: 'Ano de fundação' },
      { value: 'Nova York', label: 'Local de origem' },
      { value: '200+', label: 'Países e territórios' },
    ],
  },
];
