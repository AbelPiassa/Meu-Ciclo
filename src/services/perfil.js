import { requisicao } from "./api.js";
import {
  guardarSessao,
  obterSessao,
  requisicaoAutenticada,
  limparSessao,
  obterVersaoSessao,
} from "./sessao.js";

export async function entrar(usuario, senha) {
  const versao = obterVersaoSessao();
  const resposta = await requisicao("/api/sessoes", {
    metodo: "POST",
    dados: { usuario, senha },
  });

  return guardarSessao(resposta, versao);
}

export async function cadastrarPerfil(dados) {
  const versao = obterVersaoSessao();
  const resposta = await requisicao("/api/perfis", {
    metodo: "POST",
    dados,
  });

  guardarSessao(resposta, versao);
  return resposta.perfil;
}

function caminhoDoPerfil() {
  const sessao = obterSessao();

  if (!sessao) {
    const erro = new Error("Entre na sua conta para continuar.");
    erro.status = 401;
    throw erro;
  }

  return `/api/perfis/${sessao.id_perfil}`;
}

export async function consultarPerfil() {
  return requisicaoAutenticada(caminhoDoPerfil());
}

export async function atualizarPerfil(dados) {
  return requisicaoAutenticada(caminhoDoPerfil(), {
    metodo: "PUT",
    dados,
  });
}

export async function excluirPerfil() {
  const sessao = obterSessao();
  await requisicaoAutenticada(caminhoDoPerfil(), {
    metodo: "DELETE",
  });

  limparSessao(sessao);
}
