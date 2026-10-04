# 📦 Mantiqueira Distribuidora - Frontend

Interface web moderna desenvolvida para a **Mantiqueira Distribuidora** no âmbito do Projeto Integrador. Esta aplicação oferece um painel administrativo completo e intuitivo para a gestão de catálogo de produtos, pedidos, clientes e operações de distribuição.

---

## 🏢 História da Empresa

Fundada em fevereiro de 2005 em São João da Boa Vista (SP) por dois irmãos — filhos de vendedor —, a **Mantiqueira Distribuidora** iniciou suas operações em uma garagem residencial de 50 m². Com atuação focada no trabalho, dedicação e parceria com grandes fornecedores, a empresa expandiu sua presença do interior para todo o estado de São Paulo.

Ao longo de mais de duas décadas de mercado, a empresa construiu uma equipe comercial altamente capacitada e consolidou um portfólio de distribuição que atende os canais farma e alimentar, trabalhando com marcas líderes nacionais e globais, como *Kimberly-Clark, Coty, Baruel, Philips Avent, Panasonic e Colgate*.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando as ferramentas mais modernas do ecossistema front-end:

* **[React](https://reactjs.org/) + [Vite](https://vitejs.dev/):** Biblioteca de interface do usuário com bundler de alta performance.
* **[TypeScript](https://www.typescriptlang.org/):** Superconjunto de JavaScript que adiciona tipagem estática, garantindo maior segurança e previsibilidade no código.
* **[Tailwind CSS](https://tailwindcss.com/) & [PostCSS](https://postcss.org/):** Framework de utilitários para estilização ágil, moderna e totalmente responsiva.
* **Integração HTTP:** Axios / Fetch API para consumo de dados da API RESTful (Backend).
* **Gerenciador de Pacotes:** NPM (Node Package Manager).

---

## 🔑 Funcionalidades Principais

* 📋 **Gestão de Catálogo de Produtos:** Exibição, busca avançada e filtragem do catálogo oficial da Mantiqueira.
* 🛒 **Gestão de Pedidos e Vendas:** Interface dedicada para criação, acompanhamento de status e histórico de pedidos.
* 📊 **Dashboard Administrativo:** Visualização de métricas de vendas e controle de distribuição em tempo real.
* 🔒 **Autenticação e Controle de Acesso:** Sistema de Login seguro com persistência de token JWT e proteção de rotas privadas.
* 📱 **Design Responsivo:** Experiência de uso fluida em dispositivos móveis, tablets e desktops.

---

## 📁 Estrutura do Projeto

A organização de diretórios do projeto segue as melhores práticas para escalabilidade:

```text
FrontWebMantiqueira/
├── backend/                 # Diretório contendo a API do projeto
├── dist/                    # Arquivos compilados para produção (gerados no build)
├── public/                  # Arquivos estáticos globais (favicon, etc.)
├── src/                     # Código-fonte principal da aplicação React
├── package.json             # Dependências e scripts de automação
├── tsconfig.json            # Configurações do compilador TypeScript
├── vite.config.ts           # Configuração de build e plugins do Vite
├── tailwind.config.js       # Configuração de temas e utilitários do Tailwind CSS
├── postcss.config.js        # Configuração de processamento de CSS
├── index.html               # Ponto de entrada da aplicação web
└── README.md                # Documentação técnica do projeto
```


---

## 🚀 Como Executar o Projeto Localmente

Siga as instruções abaixo para rodar a aplicação em seu ambiente de desenvolvimento:

### 1. Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### 2. Clonar o Repositório
```bash
git clone https://github.com/Soares23Ana/FrontWebMantiqueira.git
cd FrontWebMantiqueira
```

### 3. Instalar as Dependências
```bash
npm install
```

### 4. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto contendo a URL de comunicação com o servidor backend:
```env
VITE_API_URL=http://localhost:3000
```
*(Nota: Projetos em Vite utilizam o prefixo `VITE_` em vez de `REACT_APP_` para expor variáveis de ambiente no frontend).*

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

### 6. Acessar a Aplicação
Abra o navegador e acesse a URL indicada no terminal (por padrão, o Vite roda na porta 5173):
👉 **http://localhost:5173**
