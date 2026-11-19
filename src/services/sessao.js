import { requisicao } from "./api.js";

let sessaoAtual = null;
let versao = 0;
const ouvintes = new Set();
export const obterVersaoSessao = () => versao;
export function observarSessao(ouvinte) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}
function notificar() { for (const ouvinte of ouvintes) ouvinte(); }
export function limparSessao(esperada = sessaoAtual) {
  if (esperada !== sessaoAtual) return;
  sessaoAtual = null;
  versao++;
  notificar();
}

export function obterSessao() {
  return sessaoAtual;
}

export function guardarSessao(resposta, versaoEsperada = versao) {
  if (versaoEsperada !== versao) {
    void requisicao("/api/sessoes/atual", { metodo: "DELETE", token: resposta.token }).catch(() => {});
    throw new Error("Entrada cancelada. Tente novamente.");
  }
  const idPerfil = resposta.id_perfil ?? resposta.perfil?.id_perfil;

  if (typeof resposta.token !== "string" || !/^[0-9a-f]{64}$/.test(resposta.token) || !Number.isSafeInteger(idPerfil) || idPerfil < 1) {
    throw new Error("A API retornou uma sessão inválida.");
  }

  sessaoAtual = Object.freeze({
    token: resposta.token,
    id_perfil: idPerfil,
    expira_em: resposta.expira_em,
  });

  versao++;
  notificar();
  return sessaoAtual;
}

export async function requisicaoAutenticada(caminho, opcoes = {}) {
  const sessao = sessaoAtual;

  if (!sessao) {
    const erro = new Error("Entre na sua conta para continuar.");
    erro.status = 401;
    throw erro;
  }

  try {
    return await requisicao(caminho, {
      ...opcoes,
      token: sessao.token,
    });
  } catch (erro) {
    // Uma resposta antiga não pode apagar uma nova sessão.
    if (erro.status === 401 && sessaoAtual === sessao) {
      limparSessao(sessao);
    }

    throw erro;
  }
}

export function encerrarSessao() {
  const sessao = sessaoAtual;

  // Limpa imediatamente, sem aguardar a rede.
  limparSessao(sessao);

  if (sessao) {
    void requisicao("/api/sessoes/atual", {
      metodo: "DELETE",
      token: sessao.token,
    }).catch(() => {
      // Sem conexão, a revogação remota pode não acontecer.
      // A sessão local já foi encerrada.
    });
  }
}
