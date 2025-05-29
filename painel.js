const jsonUrl = "https://api.github.com/repos/silverfb13/painelaguiabox/contents/usuarios.json";
const token = "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";

async function carregarUsuarios() {
  try {
    const res = await fetch(jsonUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error("Token inválido ou sem permissão.");
    }
    const data = await res.json();
    const content = atob(data.content);
    const json = JSON.parse(content);
    json._sha = data.sha;
    return json;
  } catch (e) {
    alert("Erro ao carregar usuários: " + e.message);
    return null;
  }
}

async function salvarUsuarios(novos, sha) {
  const body = {
    message: "Atualizado via Painel IPTV",
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
  if (!data || !data._sha) {
    table.innerHTML = "<tr><td colspan='4'>Erro ao carregar usuários.</td></tr>";
    return;
  }

  const sha = data._sha;
  delete data._sha;
  window._users = data;
  window._sha = sha;
  table.innerHTML = "";

  for (const u in data) {
    const p = data[u];
    table.innerHTML += `
      <tr>
        <td>${u}</td>
        <td>${p}</td>
        <td><a href="${gerarLink(u, p)}" target="_blank">Abrir</a></td>
        <td><button onclick='removerUsuario("${u}")' class='btn btn-danger btn-sm'>Excluir</button></td>
      </tr>`;
  }
}

async function removerUsuario(nome) {
  delete window._users[nome];
  const ok = await salvarUsuarios(window._users, window._sha);
  if (ok) atualizarTabela();
  else alert("Erro ao excluir.");
}

document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const u = document.getElementById("newUsername").value.trim();
  const p = document.getElementById("newPassword").value.trim();
  if (!u || !p) return alert("Preencha usuário e senha.");
  if (!window._users) return alert("Erro: dados não carregados.");
  window._users[u] = p;
  const ok = await salvarUsuarios(window._users, window._sha);
  if (ok) {
    bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();
    atualizarTabela();
  } else {
    alert("Erro ao salvar usuário.");
  }
});

atualizarTabela();
