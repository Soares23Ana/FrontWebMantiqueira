# Mantiqueira Distribuidora — front-end (React + Vite + TypeScript + Tailwind CSS)

Conectado à API `BackMantiqueiraWeb` (`/api/v1`). Nenhum dado é fixo no front: produtos, pedidos,
clientes, banners, campanhas e configurações vêm da API.

## Como rodar

1. Suba a API (pasta `BackMantiqueiraWeb`):

       npm install
       npm run migrar         # cria o banco e aplica as migrations
       npm run seed:catalogo  # 38 produtos
       npm run seed:dev       # usuários de teste (senha Mantiqueira@2026)
       npm run seed:demo      # banners, campanha, contatos e 5 pedidos (um por status)
       npm run dev            # http://localhost:3000

2. Suba o front (esta pasta):

       npm install
       npm run dev            # http://localhost:5173

   Em desenvolvimento o Vite encaminha `/api`, `/arquivos` e `/saude` para `http://localhost:3000`.
   Se a API estiver em outra porta, rode com `VITE_API_PROXY` (ex.: `VITE_API_PROXY=http://localhost:3001 npm run dev`).
   Em produção defina `VITE_API_URL` (veja `.env.example`) e rode `npm run build`.

## Acessos de teste (seed:dev)
- Cliente: CNPJ `11.222.333/0001-81`
- Equipe (gerencia a equipe): `admin@mantiqueira.com`
- Senha de todos: `Mantiqueira@2026`

A tela de login é única e neutra (não menciona a equipe): o mesmo campo aceita CNPJ (numérico ou com letras) ou e-mail. A regra é só o `@`: com `@` é e-mail e entra a equipe (vai para `/gestor`); sem `@` é CNPJ e entra o cliente (vai para "Minha conta").

## Rotas
| Rota | Tela |
|---|---|
| `/` | Home dirigida pelo CMS (banners, campanhas ativas, destaques) |
| `/produtos?busca=&marca=&disponibilidade=&ordenar=&pagina=` | Vitrine com busca, filtros e paginação |
| `/categoria/:slug`, `/marca/:slug`, `/produto/:id` | Categoria, marca e produto |
| `/carrinho`, `/checkout`, `/favoritos` | Carrinho (salvo no navegador), checkout e favoritos |
| `/entrar`, `/cadastro` | Login (CNPJ ou e-mail) e cadastro de cliente |
| `/minha-conta/pedidos`, `/perfil`, `/enderecos`, `/senha` | Área do cliente, com "Repetir pedido" |
| `/gestor/...` | Área da equipe: painel, pedidos, produtos, importação, clientes, CMS, campanhas, métricas, equipe e saúde |

## Estrutura
- `src/api/client.ts` – chamadas à API, token, erros no formato da API e URLs de imagem
- `src/context` – sessão (Auth), carrinho/favoritos (Cart), dados públicos da loja (Store) e avisos (Toast)
- `src/hooks/useApi.ts` – carregamento/erro/recarregar de cada chamada
- `src/pages` – telas da loja; `src/pages/account` – Minha conta; `src/pages/manager` – gestor
- `src/data/brands.ts` – texto editorial das páginas de marca (o id é o slug da marca na API)

## Decisões
- Nada financeiro no front: sem preço, total, faturamento ou grupos de tabela de preço (a API também não envia).
- Visitante vê só a disponibilidade; cliente logado vê o estoque exato.
- Status de pedido iguais aos do back: Aguardando Separação → Em Separação → Saiu para Entrega → Entregue (ou Cancelado, com motivo obrigatório).
- Clientes e pedidos exibem `nome_exibicao` (razão social, ou o nome do responsável).
- **CNPJ alfanumérico** (Receita Federal, desde julho de 2026): máscara, validação (módulo 11, caractere = ASCII − 48) e login aceitam letras nas 12 primeiras posições (`src/utils/cnpj.ts`).
- **Cadastro:** ao completar o CNPJ, mostra o nome da empresa na Receita (`GET /cnpj/:cnpj`) antes de enviar; ao completar o CEP, preenche o endereço (`GET /cep/:cep`). As duas consultas são só de apoio: se falharem, a pessoa digita à mão.
- **Novos cadastros no gestor:** selo no menu, card no painel e filtro "Novos (7 dias)" em Clientes (`GET /clientes?novos_dias=7`). É só consulta: não há aprovação de cadastro.
- O checkout envia `Idempotency-Key` (uma por abertura da tela): reenviar não duplica o pedido.
- Trocar a senha encerra a sessão (a API invalida os tokens anteriores); o front leva de volta ao login.
- Sessão de 8 horas; qualquer `401` leva ao login com o aviso de sessão expirada.
