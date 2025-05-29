const jsonUrl = "https://api.github.com/repos/silverfb13/painelaguiabox/contents/usuarios.json";
const token = "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";

async function carregarUsuarios() {
  const res = await fetch(jsonUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const content = atob(data.content);
  const json = JSON.parse(content);
  json._sha = data.sha;
  return json;
}

async function salvarUsuarios(novosUsuarios, sha) {
  const body = {
    message: "Update via painel",
    content: btoa(JSON.stringify(novosUsuarios, null, 2)),
    sha
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
  const users = await carregarUsuarios();
  const sha = users._sha;
  delete users._sha;
  tabela.innerHTML = "";
  for (const u in users) {
    const p = users[u];
    tabela.innerHTML += `<tr><td>${u}</td><td>${p}</td><td><a href='${gerarLink(u,p)}' target='_blank'>Abrir</a></td><td><button onclick='removerUsuario("${u}")'>Excluir</button></td></tr>`;
  }
  window._sha = sha;
  window._users = users;
}

async function removerUsuario(nome) {
  delete window._users[nome];
  const ok = await salvarUsuarios(window._users, window._sha);
  if (ok) atualizarTabela();
}

document.getElementById("userForm").addEventListener("submit", async e => {
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
