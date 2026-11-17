/**
 * A única função deste arquivo é conversar com a API do Abel.
 * O login será implementado pelo Abel; este arquivo recebe a sessão dele.
 * Não guardar senhas ou dados reais aqui. Somente demonstração acadêmica.
 */
const URL_API = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/+$/, "");

// Sessão temporária em memória: será compartilhada pelo login do Abel.
let sessao = null;

/** Chamar APÓS um cadastro/login bem-sucedido feito pelo módulo do Abel. */
export function configurarSessaoRedeApoio({ token, id_perfil }) {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) {
    throw new Error("Token de sessão inválido.");
  }
  if (!Number.isSafeInteger(id_perfil) || id_perfil < 1) {
    throw new Error("Perfil da sessão inválido.");
  }
  sessao = { token, id_perfil };
}

/** Chamar no logout/encerramento de sessão definido pela equipe. */
export function limparSessaoRedeApoio() {
  sessao = null;
}

function exigirSessao() {
  if (!sessao) throw new Error("Faça login com o perfil fictício para acessar seus contatos.");
  return sessao;
}

function exigirId(id) {
  if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) {
    throw new Error("ID de contato inválido.");
  }
  return Number(id);
}

async function chamarApi(caminho, metodo = "GET", dados) {
  if (!URL_API) throw new Error("Configure EXPO_PUBLIC_API_URL no .env do aplicativo.");
  const { token } = exigirSessao();
  let resposta;
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      method: metodo,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(dados === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(dados === undefined ? {} : { body: JSON.stringify(dados) }),
    });
  } catch {
    throw new Error("Sem conexão com a API. Confira o endereço e se o servidor está ligado.");
  }

  // DELETE bem-sucedido retorna 204 sem JSON.
  if (resposta.status === 204) return null;
  let resultado;
  try {
    resultado = await resposta.json();
  } catch {
    throw new Error("Resposta inesperada do servidor.");
  }

  if (resposta.status === 401) {
    limparSessaoRedeApoio();
    throw new Error("Sessão expirada. Entre novamente no aplicativo.");
  }
  if (!resposta.ok) {
    const erro = resultado?.erro;
    const campo = erro?.campos?.[0];
    const detalhe = campo ? ` (${campo.campo}: ${campo.mensagem})` : "";
    throw new Error(`${erro?.mensagem || `Erro HTTP ${resposta.status}`}${detalhe}`);
  }
  return resultado;
}

// A API determina o perfil pela sessão. Nunca usar um id_perfil fixo.
function dadosParaApi(contato) {
  return {
    id_perfil: exigirSessao().id_perfil,
    nome: contato.nome.trim(),
    telefone: contato.telefone.trim(),
    relacionamento: contato.relacionamento.trim(),
    alerta_automatico: contato.alerta_automatico ?? false,
    observacoes: contato.observacoes ?? "",
  };
}

export async function listarContatos() {
  const lista = await chamarApi("/contatos");
  if (!Array.isArray(lista)) throw new Error("A API não retornou uma lista de contatos.");
  return lista;
}
export function buscarContato(id) {
  return chamarApi(`/contatos/${exigirId(id)}`);
}
export function criarContato(contato) {
  return chamarApi("/contatos", "POST", dadosParaApi(contato));
}
export function atualizarContato(id, contato) {
  return chamarApi(`/contatos/${exigirId(id)}`, "PUT", dadosParaApi(contato));
}
export function excluirContato(id) {
  return chamarApi(`/contatos/${exigirId(id)}`, "DELETE");
}
