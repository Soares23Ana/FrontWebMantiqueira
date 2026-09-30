## Mantiqueira Distribuidora - Frontend 

Interface web e aplicação Frontend desenvolvida para a Mantiqueira Distribuidora no âmbito do Projeto Integrador. A aplicação oferece um painel completo para gestão de catálogo, pedidos, clientes e distribuição.

🛠️ Tecnologias Utilizadas

    . React.js / Vue.js / HTML5 & CSS3: Framework/Biblioteca de interface do usuário.

    . JavaScript (ES6+): Lógica e dinamismo da aplicação frontend.

    . Axios / Fetch API: Integração e consumo da API Backend RESTful.

    . CSS Modules / Tailwind CSS / Bootstrap: Estilização moderna e responsiva.

    . Node.js & npm: Gerenciamento de dependências e scripts de build.

📁 Estrutura do Projeto Frontend

    .
    ├── public/                 # Arquivos estáticos (index.html, favicon, imagens)
    ├── src/
    │   ├── assets/             # Logos, ícones e arquivos de estilo globais
    │   ├── components/         # Componentes reutilizáveis (Header, Footer, Cards, Modais)
    │   ├── pages/              # Páginas da aplicação (Home, Produtos, Pedidos, Login, Dashboard)
    │   ├── services/           # Configuração de integração HTTP (API Axios)
    │   ├── utils/              # Funções utilitárias e formatadores
    │   ├── App.js              # Componente principal / Roteador
    │   └── index.js            # Ponto de entrada da aplicação React
    ├── .env.example            # Exemplo de variáveis de ambiente do Frontend (ex: REACT_APP_API_URL)
    ├── package.json            # Dependências e scripts do projeto
    └── README.md               # Documentação do projeto

🔑 Funcionalidades Principais

    . Gestão de Catálogo de Produtos: Exibição, busca e filtragem do catálogo da Mantiqueira Distribuidora.

    . Gestão de Pedidos e Vendas: Interface para criação, acompanhamento e histórico de pedidos.

    . Painel Administrativo / Dashboard: Visualização de métricas e controle de distribuição.

    . Autenticação e Controle de Acesso: Tela de Login com persistência de token JWT e rotas protegidas.

    . Design Responsivo: Adaptado para acesso em dispositivos móveis, tablets e desktops.

⚙️ Como Executar o Projeto Localmente

    1- Clone o repositório:
   
    Bash

    git clone https://github.com/Soares23Ana/EstudodeCasoP1.git
    cd EstudodeCasoP1

    2- Instale as dependências:
    
    Bash

    npm install

    3- Configure as Variáveis de Ambiente:
    Crie um arquivo .env na raiz da pasta frontend informando a URL do servidor backend:
    
    Snippet de código

    REACT_APP_API_URL=http://localhost:3000

    4- Inicie o servidor de desenvolvimento:
    Bash
    
    npm start
    ou npm run dev (dependendo do bundler/Vite)

    5- Acesse no navegador:

    Abra http://localhost:3000 (ou a porta indicada no terminal, ex: http://localhost:5173).
