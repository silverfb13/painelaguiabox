const workerName = "shiny-frog-756a";
const accountId = "de758fbcc77916ba79a164714c7581bf";
const apiToken = "cNDtaY1qwurVApAJCaDAi1Km7xN7a4BoC6Vnra-V";
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
    const raw = trecho.match(/const users = ({[\s\S]*?})/)[1];
    const json = raw.replace(/(\w+):\s*"([^"]+)",?/g, '"$1":"$2"').replace(/,\s*}/, '}');
    return JSON.parse(json);
  } catch (e) {
    console.error("Erro ao ler usuários:", e);
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
  const linhas = Object.entries(newUsers).map(([u, p]) => `  ${u}: "${p}",`);
  const novoUsers = `const users = {
${linhas.join("\n")}
};`;
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

function gerarLink(user, pass) {
  return `https://shiny-frog-756a.luizfbs2011.workers.dev/get.php?username=${user}&password=${pass}&type=m3u`;
}

async function atualizarTabela() {
  const tabela = document.getElementById("usersTable");
  const countBox = document.getElementById("userCount");
  tabela.innerHTML = "<tr><td colspan='5'>Carregando...</td></tr>";
  const users = await getUsers();
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
  const users = await getUsers();
  delete users[nome];
  const ok = await updateUsers(users);
  if (ok) atualizarTabela();
  else alert("Erro ao excluir usuário.");
}

document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("newUsername").value.trim();
  const senha = document.getElementById("newPassword").value.trim();
  if (!nome || !senha) return alert("Preencha os campos");
  const users = await getUsers();
  users[nome] = senha;
  const ok = await updateUsers(users);
  if (ok) {
    bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();
    atualizarTabela();
  } else alert("Erro ao adicionar usuário");
});

atualizarTabela();
