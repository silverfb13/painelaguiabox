// painel.js - versão final com token real
const jsonUrl = "https://api.github.com/repos/silverfb13/painelaguiabox/contents/usuarios.json";
const token = "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";

async function carregarUsuarios() {
  const res = await fetch(jsonUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const content = atob(data.content);
  const json = JSON.parse(content);
  json._sha = data.sha; // necessário para update
  return json;
}

async function salvarUsuarios(novosUsuarios, sha) {
  const body = {
    message: "Atualização de usuários via painel",
    content: btoa(JSON.stringify(novosUsuarios, null, 2)),
    sha: sha
  };
  const res = await fetch(jsonUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  return res.ok;
}

function gerarLink(user, pass) {
  return `https://shiny-frog-756a.luizfbs2011.workers.dev/get.php?username=${user}&password=${pass}&type=m3u`;
}

async function atualizarTabela() {
  const tabela = document.getElementById("usersTable");
  const countBox = document.getElementById("userCount");
  tabela.innerHTML = "<tr><td colspan='5'>Carregando...</td></tr>";
  const users = await carregarUsuarios();
  delete users._sha;
  tabela.innerHTML = "";
  let total = 0;
  for (const usuario in users) {
    const senha = users[usuario];
    total++;
    tabela.innerHTML += `
      <tr>
        <td>${usuario}</td>
        <td>${senha}</td>
        <td>Ilimitado</td>
        <td><div class='link-box'>${gerarLink(usuario, senha)}</div></td>
        <td><button class='btn btn-sm btn-danger' onclick='removerUsuario("${usuario}")'>Excluir</button></td>
      </tr>`;
  }
  countBox.textContent = total;
}

async function removerUsuario(nome) {
  if (!confirm(`Deseja realmente excluir o usuário '${nome}'?`)) return;
  const users = await carregarUsuarios();
  const sha = users._sha;
  delete users[nome];
  delete users._sha;
  const ok = await salvarUsuarios(users, sha);
  if (ok) atualizarTabela();
  else alert("Erro ao excluir usuário.");
}

document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("newUsername").value.trim();
  const senha = document.getElementById("newPassword").value.trim();
  if (!nome || !senha) return alert("Preencha os campos");
  const users = await carregarUsuarios();
  const sha = users._sha;
  delete users._sha;
  users[nome] = senha;
  const ok = await salvarUsuarios(users, sha);
  if (ok) {
    bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();
    atualizarTabela();
  } else alert("Erro ao adicionar usuário");
});

atualizarTabela();
