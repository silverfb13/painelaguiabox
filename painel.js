const jsonUrl = "https://api.github.com/repos/silverfb13/painelaguiabox/contents/usuarios.json";
const token = "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";

async function carregarUsuarios() {
  const res = await fetch(jsonUrl, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  const content = atob(data.content);
  const json = JSON.parse(content);
  json._sha = data.sha;
  return json;
}

async function salvarUsuarios(novos, sha) {
  const body = {
    message: "Atualizado via Painel",
    content: btoa(JSON.stringify(novos, null, 2)),
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
  const table = document.getElementById("usersTable");
  const data = await carregarUsuarios();
  const sha = data._sha;
  delete data._sha;
  window._users = data;
  window._sha = sha;
  table.innerHTML = "";
  for (const u in data) {
    const p = data[u];
    table.innerHTML += `<tr><td>${u}</td><td>${p}</td><td><a href='${gerarLink(u, p)}' target='_blank'>Abrir</a></td><td><button onclick='removerUsuario("${u}")' class='btn btn-danger btn-sm'>Excluir</button></td></tr>`;
  }
}

async function removerUsuario(nome) {
  delete window._users[nome];
  const ok = await salvarUsuarios(window._users, window._sha);
  if (ok) atualizarTabela();
}

document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const u = document.getElementById("newUsername").value.trim();
  const p = document.getElementById("newPassword").value.trim();
  window._users[u] = p;
  const ok = await salvarUsuarios(window._users, window._sha);
  if (ok) {
    bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();
    atualizarTabela();
  }
});

atualizarTabela();
