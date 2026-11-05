const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const ARQUIVO = path.join(__dirname, "dados.json");

const dadosPadrao = {
  categorias: [
    { id: 1, nome: "Eletrônicos" },
    { id: 2, nome: "Casa" },
    { id: 3, nome: "Acessórios" }
  ],
  produtos: [
    { id: 1, nome: "Teclado Mecânico", preco: 249.9, estoque: 15, categoriaId: 1 },
    { id: 2, nome: "Lâmpada LED", preco: 39.9, estoque: 8, categoriaId: 2 },
    { id: 3, nome: "Fone Bluetooth", preco: 149.9, estoque: 12, categoriaId: 3 }
  ]
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function carregar() {
  try {
    const texto = fs.readFileSync(ARQUIVO, "utf-8").trim();
    if (!texto) return dadosPadrao;

    const dados = JSON.parse(texto);
    if (!dados || !Array.isArray(dados.categorias) || !Array.isArray(dados.produtos)) {
      return dadosPadrao;
    }

    return dados;
  } catch (error) {
    fs.writeFileSync(ARQUIVO, JSON.stringify(dadosPadrao, null, 2));
    return dadosPadrao;
  }
}

function salvar(dados) {
  fs.writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2));
}

let { categorias, produtos } = carregar();
let proximoId = produtos.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;

function comCategoria(p) {
  const cat = categorias.find((c) => c.id === p.categoriaId);
  return { ...p, categoria: cat ? cat.nome : "Sem categoria" };
}

app.get("/categorias", (req, res) => {
  res.status(200).json(categorias);
});

app.get("/produtos", (req, res) => {
  let lista = produtos.map(comCategoria);

  if (req.query.categoria) {
    const idCat = Number(req.query.categoria);
    lista = lista.filter((p) => p.categoriaId === idCat);
  }

  const ordenar = req.query.ordenar;
  if (ordenar === "preco") lista.sort((a, b) => a.preco - b.preco);
  if (ordenar === "estoque") lista.sort((a, b) => a.estoque - b.estoque);
  if (ordenar === "nome") lista.sort((a, b) => a.nome.localeCompare(b.nome));

  res.status(200).json(lista);
});

app.get("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);
  const produto = produtos.find((p) => p.id === id);

  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });

  res.status(200).json(comCategoria(produto));
});

function validar(body) {
  const nome = (body.nome || "").trim();
  const preco = Number(body.preco);
  const estoque = Number.parseInt(body.estoque, 10);
  const categoriaId = Number(body.categoriaId);

  if (!nome) return { erro: "Informe o nome" };
  if (Number.isNaN(preco) || preco <= 0) return { erro: "Preço deve ser um número maior que zero" };
  if (Number.isNaN(estoque) || estoque < 0) return { erro: "Estoque deve ser um número inteiro maior ou igual a zero" };
  if (!categorias.find((c) => c.id === categoriaId)) return { erro: "categoriaId inexistente" };

  return { ok: { nome, preco, estoque, categoriaId } };
}

app.post("/produtos", (req, res) => {
  const v = validar(req.body);
  if (v.erro) return res.status(400).json({ erro: v.erro });

  const novo = { id: proximoId++, ...v.ok };
  produtos.push(novo);
  salvar({ categorias, produtos });
  res.status(201).json(comCategoria(novo));
});

app.put("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);
  const produto = produtos.find((p) => p.id === id);

  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });

  const v = validar(req.body);
  if (v.erro) return res.status(400).json({ erro: v.erro });

  produto.nome = v.ok.nome;
  produto.preco = v.ok.preco;
  produto.estoque = v.ok.estoque;
  produto.categoriaId = v.ok.categoriaId;

  salvar({ categorias, produtos });
  res.status(200).json(comCategoria(produto));
});

app.delete("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);
  const indice = produtos.findIndex((p) => p.id === id);

  if (indice === -1) return res.status(404).json({ erro: "Produto não encontrado" });

  produtos.splice(indice, 1);
  salvar({ categorias, produtos });
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`API loja no ar: http://localhost:${PORT}`);
});