const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 1. Configuração da Conexão com o Banco de Dados MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',               // Ajuste se o seu utilizador MySQL for diferente
  password: '@epiderme01A',   // A sua palavra-passe configurada no MySQL
  database: 'mantiqueira_db'
});

// 2. Conectar ao MySQL
db.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao banco MySQL:', err);
  } else {
    console.log('Conectado com sucesso ao MySQL (mantiqueira_db)!');
  }
});

// 3. Rota para buscar os Pedidos (com a Razão Social do Cliente)
app.get('/api/pedidos', (req, res) => {
  const query = `
    SELECT p.id_pedido, c.razao_social AS cliente, p.data_pedido, p.status
    FROM pedidos p
    JOIN clientes c ON p.id_cliente = c.id_cliente
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar pedidos:', err);
      return res.status(500).json({ error: 'Erro ao buscar pedidos no banco de dados' });
    }
    res.json(results);
  });
});

// 4. Rota para buscar os Produtos (para o Catálogo da Página Inicial)
app.get('/api/produtos', (req, res) => {
  db.query("SHOW COLUMNS FROM produtos LIKE 'sku'", (err, rows) => {
    const hasSkuColumn = !err && Array.isArray(rows) && rows.length > 0;

    const query = hasSkuColumn
      ? `SELECT id_produto, sku, nome, preco, quantidade_estoque, categoria, marca FROM produtos`
      : `SELECT id_produto, CAST(id_produto AS CHAR) AS sku, nome, preco, quantidade_estoque, categoria, marca FROM produtos`;

    db.query(query, (queryErr, results) => {
      if (queryErr) {
        console.error('Erro ao buscar produtos:', queryErr);
        return res.status(500).json({ error: 'Erro ao buscar produtos no banco de dados' });
      }

      const mappedResults = results.map((produto) => ({
        ...produto,
        sku: produto.sku ?? String(produto.id_produto)
      }));

      res.json(mappedResults);
    });
  });
});

// 5. Iniciar o Servidor Backend na Porta 3001
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
