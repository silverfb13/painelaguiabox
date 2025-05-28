const workerName = "shiny-frog-756a";
const accountId = "de758fbcc77916ba79a164714c7581bf";
const apiToken = "1KQl88EvnwhizN2YuUeJ6mIUrO0LpGmp7WTbu5Ve";
const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}`;

async function getUsers() {
  const res = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${apiToken}` }
  });
  const code = await res.text();
  const inicio = code.indexOf("const users = ");
  const fim = code.indexOf("};", inicio) + 1;
  const trecho = code.substring(inicio, fim);
  try {
    const json = trecho.match(/const users = (.*);/s)[1];
    return JSON.parse(json);
  } catch {
    return {};
  }
}

async function updateUsers(newUsers) {
  const res = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${apiToken}` }
  });
  let code = await res.text();
  const inicio = code.indexOf("const users = ");
  const fim = code.indexOf("};", inicio) + 1;
  const antes = code.substring(0, inicio);
  const depois = code.substring(fim + 1);
  const novoUsers = `const users = ${JSON.stringify(newUsers, null, 2)};`;
  const novoCodigo = antes + novoUsers + depois;

  const formData = new FormData();
  formData.append("script", new Blob([novoCodigo], { type: "application/javascript" }), `${workerName}.js`);

  const upload = await fetch(apiUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${apiToken}` },
    body: formData
  });

  return upload.ok;
}

function tempo(expira) {
  if (!expira || expira === 0) return "Ilimitado";
  const s = expira - Math.floor(Date.now() / 1000);
  if (s <= 0) return "<span class='text-danger'>Expirado</span>";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}min`;
}

function gerarLink(user, pass) {
  return `https://shiny-frog-756a.luizfbs2011.workers.dev/get.php?username=${user}&password=${pass}&type=m3u`;
}

async function atualizarTabela() {
  const tabela = document.getElementById("usersTable");
  const countBox = document.getElementById("userCount");
  tabela.innerHTML = "<tr><td colspan='4'>Carregando...</td></tr>";
  const users = await getUsers();
  tabela.innerHTML = "";
  let total = 0;
  for (const usuario in users) {
    const dados = users[usuario];
    total++;
    tabela.innerHTML += `
      <tr>
        <td>${usuario}</td>
        <td>${dados.senha}</td>
        <td>${tempo(dados.expira_em)}</td>
        <td><div class='link-box'>${gerarLink(usuario, dados.senha)}</div></td>
      </tr>`;
  }
  countBox.textContent = total;
}

document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const u = document.getElementById("newUsername").value.trim();
  const p = document.getElementById("newPassword").value.trim();
  const v = parseInt(document.getElementById("validade").value);
  const users = await getUsers();
  users[u] = {
    senha: p,
    expira_em: v > 0 ? Math.floor(Date.now() / 1000) + v : 0
  };
  const sucesso = await updateUsers(users);
  if (sucesso) {
    bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();
    atualizarTabela();
  } else {
    alert("Erro ao salvar usuário.");
  }
});

// Inicializa o painel
atualizarTabela();
