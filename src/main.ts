// Importa as bibliotecas necessárias
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

// Cria uma aplicação Express
const app = express();

// Configura o middleware para interpretar JSON no corpo das requisições
app.use(express.json());

// Configura o middleware CORS para permitir requisições de origens diferentes
app.use(cors());

// Função para criar a conexão com o banco de dados
async function createDbConnection() {
    return await mysql.createConnection({
        host: process.env.dbhost || 'localhost',
        user: process.env.dbuser || 'root',
        password: process.env.dbpassword || '',
        database: process.env.dbname || 'banco1022a',
        port: process.env.dbport ? parseInt(process.env.dbport) : 3306,
    });
}

// Rota GET: Retorna todos os livros do banco de dados
app.get("/livros", async (req, res) => {
    try {
        const connection = await createDbConnection();
        const [result] = await connection.query("SELECT * FROM livros");
        await connection.end();
        res.status(200).json(result); // Aqui retorna um array de livros
    } catch (e) {
        console.error(e);
        res.status(500).send("Server ERROR");
    }
});

// Rota POST: Cadastrar um livro
app.post("/livros", async (req, res) => {
    try {
        const connection = await createDbConnection();
        const { id, titulo, autor, preco, imagem, categoria_id, descricao } = req.body; // Adicione 'descricao'

        // Validação dos campos obrigatórios
        if (!id || !titulo || !autor || !preco || !imagem || !categoria_id || !descricao) {
            return res.status(400).send("Todos os campos são obrigatórios.");
        }

        const [result] = await connection.query(
            'INSERT INTO livros (id, titulo, autor, preco, imagem, categoria_id, descricao) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [id, titulo, autor, preco, imagem, categoria_id, descricao] // Inclua 'descricao' aqui
        );

        await connection.end();

        res.status(201).send({ message: "Livro cadastrado com sucesso!", result });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro interno do servidor.");
    }
});

// Rota GET para listar todas as categorias
app.get('/categorias', async (req, res) => {
    try {
        const connection = await createDbConnection();
        const [categorias] = await connection.query('SELECT * FROM categorias');
        await connection.end();
        res.status(200).json(categorias); // Resposta com array de categorias
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar categorias');
    }
});


// Rota DELETE para deletar uma avaliaçã

// Inicia o servidor
app.listen(8000, () => {
    console.log("Servidor rodando na porta 8000");
});
