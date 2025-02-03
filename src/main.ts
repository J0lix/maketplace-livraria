import express from 'express';
import cors from 'cors';
import mysql, { Connection, RowDataPacket } from 'mysql2/promise';

// Classe BancoMysql
class BancoMysql {
    connection: Connection | null = null;
    
    async criarConexao() {
        this.connection = await mysql.createConnection({
            host: process.env.dbhost || "localhost",
            user: process.env.dbuser || "root",
            password: process.env.dbpassword || "",
            database: process.env.dbname || "banco1022a",
            port: process.env.dbport ? parseInt(process.env.dbport) : 3306
        });
    }

    async consultar(query: string, params?: any[]) {
        if (!this.connection) throw new Error("Erro de conexão com o banco de dados.");
        const [result] = await this.connection.query(query, params);
        return result;
    }

    async finalizarConexao() {
        if (this.connection) {
            await this.connection.end();
        }
    }
}

const app = express();
const bancoMysql = new BancoMysql();

app.use(express.json());
app.use(cors());

// Middleware para criar a conexão com o banco de dados
app.use(async (req, res, next) => {
    try {
        await bancoMysql.criarConexao();
        next();
    } catch (error) {
        res.status(500).send("Erro ao conectar ao banco de dados.");
    }
});

// Rota GET: Retorna todos os livros do banco de dados
app.get("/livros", async (req, res) => {
    try {
        const result = await bancoMysql.consultar("SELECT * FROM livros");
        res.status(200).json(result);
    } catch (e) {
        console.error(e);
        res.status(500).send("Erro no servidor.");
    } finally {
        await bancoMysql.finalizarConexao();
    }
});
app.get("/livros/:id", async (req, res) => {
    try {
        const result = await bancoMysql.consultar("SELECT * FROM livros where id=?",[req.params.id]) as RowDataPacket
        res.send(result[0])
    } catch (e) {
        console.log(e)
        res.status(500).send("Server ERROR")
    }finally {
        await bancoMysql.finalizarConexao();
    }
})



// Rota POST: Cadastrar um livro
app.post("/livros", async (req, res) => {
    try {
        const { id, titulo, autor, preco, imagem, categoria_id, descricao } = req.body;

        if (!id || !titulo || !autor || !preco || !imagem || !categoria_id || !descricao) {
            return res.status(400).send("Todos os campos são obrigatórios.");
        }

        const result = await bancoMysql.consultar(
            'INSERT INTO livros (id, titulo, autor, preco, imagem, categoria_id, descricao) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [id, titulo, autor, preco, imagem, categoria_id, descricao]
        );

        res.status(201).send({ message: "Livro cadastrado com sucesso!", result });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro interno do servidor.");
    } finally {
        await bancoMysql.finalizarConexao();
    }
});

// Rota DELETE para excluir um livro
app.delete("/livros/:id", async (req, res) => {
    try {
        const result = await bancoMysql.consultar("DELETE FROM livros WHERE id = ?", [req.params.id]);
        res.status(200).send("Livro excluído com sucesso id: " + req.params.id);
    } catch (e) {
        console.log(e);
        res.status(500).send("Erro ao excluir livro");
    } finally {
        await bancoMysql.finalizarConexao();
    }
});

// Rota PUT para alterar um livro
app.put("/livros/:id", async (req, res) => {
    try {
        const { titulo, autor, preco, imagem, descricao, categoria_id } = req.body;

        const result = await bancoMysql.consultar(
            "UPDATE livros SET titulo=?, autor=?, preco=?, imagem=?, descricao=?, categoria_id=? WHERE id=?", 
            [titulo, autor, preco, imagem, descricao, categoria_id, req.params.id]
        );
        res.status(200).send("Livro alterado com sucesso id: " + req.params.id);
    } catch (e) {
        console.log(e);
        res.status(500).send("Erro ao alterar livro");
    } finally {
        await bancoMysql.finalizarConexao();
    }
});

// Rotas para categorias
app.get('/categorias', async (req, res) => {
    try {
        const result = await bancoMysql.consultar('SELECT * FROM categorias');
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar categorias');
    } finally {
        await bancoMysql.finalizarConexao();
    }
});

app.post("/categorias", async (req, res) => {
    try {
        const { id, nome } = req.body;
        if (!id || !nome) {
            return res.status(400).send("Todos os campos são obrigatórios.");
        }
        const result = await bancoMysql.consultar("INSERT INTO categorias (id, nome) VALUES (?, ?)", [id, nome]);
        res.status(201).send("Categoria cadastrada com sucesso!");
    } catch (e) {
        console.log(e);
        res.status(500).send("Erro ao cadastrar categoria");
    } finally {
        await bancoMysql.finalizarConexao();
    }
});

app.delete("/categorias/:id", async (req, res) => {
    try {
        const result = await bancoMysql.consultar("DELETE FROM categorias WHERE id = ?", [req.params.id]);
        res.status(200).send("Categoria excluída com sucesso id: " + req.params.id);
    } catch (e) {
        console.log(e);
        res.status(500).send("Erro ao excluir categoria");
    } finally {
        await bancoMysql.finalizarConexao();
    }
});

app.put("/categorias/:id", async (req, res) => {
    try {
        const { nome } = req.body;
        const result = await bancoMysql.consultar("UPDATE categorias SET nome=? WHERE id=?", [nome, req.params.id]);
        res.status(200).send("Categoria alterada com sucesso id: " + req.params.id);
    } catch (e) {
        console.log(e);
        res.status(500).send("Erro ao alterar categoria");
    } finally {
        await bancoMysql.finalizarConexao();
    }
});

app.listen(8000, () => {
    console.log("Servidor rodando na porta 8000");
});

