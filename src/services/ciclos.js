import { obterSessao, requisicaoAutenticada } from "./sessao.js";
import { dataApiParaTexto, textoParaDataApi } from "../utils/datas.js";

// Serviço do CRUD de Ciclos. Usa a sessão compartilhada (sessao.js); não guarda token nem id próprios.
// O app trabalha com datas DD/MM/AAAA; a API, com AAAA-MM-DD. A conversão acontece só aqui.

function idDaSessao() {
  const sessao = obterSessao();

  if (!sessao) {
    const erro = new Error("Entre na sua conta para continuar.");
    erro.status = 401;
    throw erro;
  }

  return sessao.id_perfil;
}

function doApi(ciclo) {
  return {
    ...ciclo,
    data_inicio: dataApiParaTexto(ciclo.data_inicio),
    data_fim: dataApiParaTexto(ciclo.data_fim),
  };
}

// Monta somente os campos editáveis do contrato (sem id_ciclo).
function paraApi(dados) {
  return {
    id_perfil: idDaSessao(),
    data_inicio: textoParaDataApi(dados.data_inicio),
    data_fim: textoParaDataApi(dados.data_fim),
    fluxo: dados.fluxo,
    humor: dados.humor ?? "",
    sintomas: dados.sintomas ?? "",
    observacoes: dados.observacoes ?? "",
  };
}

export async function listarCiclos() {
  const lista = await requisicaoAutenticada("/api/ciclos");
  return lista.map(doApi);
}

export async function consultarCiclo(id) {
  return doApi(await requisicaoAutenticada(`/api/ciclos/${id}`));
}

export async function criarCiclo(dados) {
  return doApi(
    await requisicaoAutenticada("/api/ciclos", { metodo: "POST", dados: paraApi(dados) })
  );
}

export async function atualizarCiclo(id, dados) {
  return doApi(
    await requisicaoAutenticada(`/api/ciclos/${id}`, { metodo: "PUT", dados: paraApi(dados) })
  );
}

export async function excluirCiclo(id) {
  await requisicaoAutenticada(`/api/ciclos/${id}`, { metodo: "DELETE" });
}
