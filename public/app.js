let API = "http://localhost:3000";

try {
  API = localStorage.getItem("apiUrl") || API;
} catch (e) {}

const $ = (id) => document.getElementById(id);
$("apiUrl").value = API;

function setStatus(ok, msg) {
  const s = $("status");
  s.className = "status " + (ok ? "ok" : "off");
  s.textContent = msg;
}

async function carregarCategorias() {
  const resp = await fetch(`${API}/categorias`);
  const dados = await resp.json();

  const selForm = $("categoriaId");
  const selFiltro = $("filtroCategoria");

  selForm.innerHTML = "";
  selFiltro.innerHTML = '<option value="">Todas as categorias</option>';

  dados.forEach((c) => {
    selForm.insertAdjacentHTML("beforeend", `<option value="${c.id}">${c.nome}</option>`);
    selFiltro.insertAdjacentHTML("beforeend", `<option value="${c.id}">${c.nome}</option>`);
  });
}

async function carregarProdutos() {
  const params = new URLSearchParams();

  if ($("filtroCategoria").value) params.set("categoria", $("filtroCategoria").value);
  if ($("ordenar").value) params.set("ordenar", $("ordenar").value);

  const resp = await fetch(`${API}/produtos?${params.toString()}`);
  const produtos = await resp.json();
  const ul = $("lista");

  ul.innerHTML = "";
  $("vazio").textContent = produtos.length ? "" : "Nenhum produto encontrado";

  produtos.forEach((p) => {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div>
        <div class="nome">${p.nome}</div>
        <div class="meta">${p.categoria} · estoque: ${p.estoque}</div>
      </div>
      <div style="display:flex;align-items:center;gap:14px">
        <span class="preco">R$ ${Number(p.preco).toFixed(2)}</span>
        <div class="btns">
          <button data-ed="${p.id}">Editar</button>
          <button class="del" data-del="${p.id}">Excluir</button>
        </div>
      </div>
    `;
    ul.appendChild(li);
  });
}

async function conectar() {
  API = $("apiUrl").value.trim().replace(/\/$/, "");

  try {
    localStorage.setItem("apiUrl", API);
  } catch (e) {}

  try {
    await carregarCategorias();
    await carregarProdutos();
    setStatus(true, "conectado");
  } catch (e) {
    setStatus(false, "sem conexão com a API");
  }
}

function entrarEdicao(p) {
  $("editId").value = p.id;
  $("nome").value = p.nome;
  $("preco").value = p.preco;
  $("estoque").value = p.estoque;
  $("categoriaId").value = p.categoriaId;
  $("formTitulo").textContent = "Editar produto";
  $("salvarProduto").textContent = "Salvar";
  $("cancelar").hidden = false;
}

function limparForm() {
  $("editId").value = "";
  $("nome").value = "";
  $("preco").value = "";
  $("estoque").value = "";
  $("formTitulo").textContent = "Novo produto";
  $("salvarProduto").textContent = "Adicionar";
  $("cancelar").hidden = true;
  $("formErro").textContent = "";
}

async function salvarProduto() {
  const corpo = {
    nome: $("nome").value,
    preco: $("preco").value,
    estoque: $("estoque").value,
    categoriaId: $("categoriaId").value,
  };

  const id = $("editId").value;
  const url = id ? `${API}/produtos/${id}` : `${API}/produtos`;
  const metodo = id ? "PUT" : "POST";

  const resp = await fetch(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });

  const dados = await resp.json();

  if (!resp.ok) {
    $("formErro").textContent = "? " + (dados.erro || "Erro");
    return;
  }

  limparForm();
  await carregarProdutos();
}

document.addEventListener("click", async (e) => {
  const target = e.target.closest("[data-del]");
  if (target) {
    await fetch(`${API}/produtos/${target.dataset.del}`, { method: "DELETE" });
    await carregarProdutos();
    return;
  }

  const editTarget = e.target.closest("[data-ed]");
  if (editTarget) {
    const resp = await fetch(`${API}/produtos/${editTarget.dataset.ed}`);
    entrarEdicao(await resp.json());
  }
});

$("salvarUrl").addEventListener("click", conectar);
$("salvarProduto").addEventListener("click", salvarProduto);
$("cancelar").addEventListener("click", limparForm);
$("recarregar").addEventListener("click", carregarProdutos);
$("ordenar").addEventListener("change", carregarProdutos);
$("filtroCategoria").addEventListener("change", carregarProdutos);

conectar();