import { ErroApi, requisicao } from "./clienteApi.js";

// Sessão da API (Bearer). O token fica SOMENTE em memória: não é gravado em disco,
// não é registrado em log e não é exposto fora deste módulo.
// Quando o login/cadastro do app for integrado (Perfil), basta chamar entrar() aqui.
let estado = { token: null, idPerfil: null, expiraEmMs: null };
let instantaneo = { ativa: false, idPerfil: null };
const ouvintes = new Set();

function publicar() {
  const ativa = sessaoVigente();
  const novo = { ativa, idPerfil: ativa ? estado.idPerfil : null };
  if (novo.ativa !== instantaneo.ativa || novo.idPerfil !== instantaneo.idPerfil) {
    instantaneo = novo;
    ouvintes.forEach((ouvinte) => ouvinte());
  }
}

function sessaoVigente() {
  return Boolean(estado.token) && Date.now() < estado.expiraEmMs;
}

function limparLocal() {
  estado = { token: null, idPerfil: null, expiraEmMs: null };
  publicar();
}

// Compatível com useSyncExternalStore.
export function assinarSessao(ouvinte) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function obterSessao() {
  return instantaneo;
}

export async function entrar(usuario, senha) {
  const nome = String(usuario ?? "").trim();
  if (!nome || !senha) {
    throw new ErroApi({
      tipo: "validacao",
      mensagem: "Informe usuário e senha.",
      campos: [],
    });
  }

  const resposta = await requisicao("POST", "/sessoes", { corpo: { usuario: nome, senha } });
  const expiraEmMs = Date.parse(resposta?.expira_em);

  if (!Number.isInteger(resposta?.id_perfil) || typeof resposta?.token !== "string" || Number.isNaN(expiraEmMs)) {
    throw new ErroApi({ tipo: "resposta", mensagem: "Resposta inesperada do servidor." });
  }

  estado = { token: resposta.token, idPerfil: resposta.id_perfil, expiraEmMs };
  publicar();
  return { idPerfil: resposta.id_perfil };
}

// Encerra localmente sempre; avisa o servidor (revoga o token) em melhor esforço.
export async function sair() {
  const token = estado.token;
  limparLocal();
  if (!token) {
    return;
  }
  try {
    await requisicao("DELETE", "/sessoes/atual", { token, tempoLimiteMs: 3000 });
  } catch {
    // Sem rede: o token expira sozinho no servidor (24 h). Nada a mostrar.
  }
}

// Requisição autenticada. 401 encerra a sessão local para a tela pedir novo login.
export async function requisicaoAutenticada(metodo, caminho, corpo) {
  if (!sessaoVigente()) {
    limparLocal();
    throw new ErroApi({ tipo: "sessao", mensagem: "Sua sessão expirou. Entre novamente." });
  }
  try {
    return await requisicao(metodo, caminho, { corpo, token: estado.token });
  } catch (erro) {
    if (erro instanceof ErroApi && erro.tipo === "sessao") {
      limparLocal();
    }
    throw erro;
  }
}

export function obterIdPerfil() {
  return sessaoVigente() ? estado.idPerfil : null;
}
