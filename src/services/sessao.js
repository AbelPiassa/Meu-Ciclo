import { requisicao } from "./api.js";

let sessaoAtual = null;

export function obterSessao() {
  return sessaoAtual;
}

export function guardarSessao(resposta) {
  const idPerfil = resposta.id_perfil ?? resposta.perfil?.id_perfil;

  if (!resposta.token || !Number.isInteger(idPerfil)) {
    throw new Error("A API retornou uma sessão inválida.");
  }

  sessaoAtual = Object.freeze({
    token: resposta.token,
    id_perfil: idPerfil,
    expira_em: resposta.expira_em,
  });

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
      sessaoAtual = null;
    }

    throw erro;
  }
}

export function encerrarSessao() {
  const sessao = sessaoAtual;

  // Limpa imediatamente, sem aguardar a rede.
  sessaoAtual = null;

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