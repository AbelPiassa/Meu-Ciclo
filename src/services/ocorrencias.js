import { requisicaoAutenticada, obterSessao } from "./sessao.js";
import { brParaIso, isoParaBr } from "../utils/datasApi.js";
import { validarOcorrencia } from "../utils/validacaoOcorrencia.js";
import { detalharCampos } from "../utils/mensagensApi.js";

// CRUD do Diário de Ocorrências sobre /api/ocorrencias (contrato: backend/docs/API.md).
// Usa exclusivamente o cliente HTTP compartilhado (services/api.js) e a sessão única
// do aplicativo (services/sessao.js): aqui não existe token nem login próprios.
// A tela trabalha com data em DD/MM/AAAA; a API, com AAAA-MM-DD. A conversão é feita aqui.
export const TIPO_PADRAO = "Relato do diário";
export const NIVEL_PERIGO_PADRAO = "Não informado";
const ROTULOS = {
  data_ocorrencia: "Data",
  descricao_relato: "Descrição",
  tipo_ocorrencia: "Tipo",
  como_se_sentiu: "Como se sentiu",
  nivel_perigo: "Nível de perigo",
  id_perfil: "Perfil",
};

// Registro da API -> registro usado pela tela.
export function paraTela(registro) {
  return { ...registro, data_ocorrencia: isoParaBr(registro.data_ocorrencia) };
}

// Mais recentes primeiro (data e, em empate, id).
export function ordenarOcorrencias(lista) {
  return [...lista].sort((a, b) => {
    const porData = String(brParaIso(b.data_ocorrencia)).localeCompare(String(brParaIso(a.data_ocorrencia)));
    return porData !== 0 ? porData : b.id_ocorrencia - a.id_ocorrencia;
  });
}

// O PUT da API substitui todos os campos editáveis (opcionais omitidos voltam ao padrão),
// então o corpo é sempre montado completo, preservando o que a tela não edita.
export function montarCorpo(idPerfil, { data, descricao }, base = {}) {
  return {
    id_perfil: idPerfil,
    data_ocorrencia: brParaIso(data),
    tipo_ocorrencia: base.tipo_ocorrencia || TIPO_PADRAO,
    descricao_relato: descricao.trim(),
    como_se_sentiu: base.como_se_sentiu ?? "",
    nivel_perigo: base.nivel_perigo ?? NIVEL_PERIGO_PADRAO,
    acionou_policia: base.acionou_policia ?? false,
  };
}

function erroDeSessao() {
  const erro = new Error("Entre na sua conta para continuar.");
  erro.status = 401;
  return erro;
}

function exigirIdPerfil() {
  const sessao = obterSessao();
  if (!sessao) {
    throw erroDeSessao();
  }
  return sessao.id_perfil;
}

function exigirValido(campos) {
  const resultado = validarOcorrencia(campos);
  if (!resultado.valido) {
    const erro = new Error(resultado.mensagem);
    erro.status = 422;
    erro.codigo = "VALIDACAO";
    erro.campos = [];
    throw erro;
  }
}

// Troca a mensagem genérica de validação do servidor por "Campo: motivo".
async function comMensagensDeCampo(operacao) {
  try {
    return await operacao();
  } catch (erro) {
    if (erro?.status === 422 && Array.isArray(erro.campos) && erro.campos.length > 0) {
      const detalhes = detalharCampos(erro.campos, ROTULOS);
      erro.message = `Revise os campos. ${detalhes}`;
    }
    throw erro;
  }
}

export async function listarOcorrencias() {
  exigirIdPerfil();
  const dados = await requisicaoAutenticada("/api/ocorrencias");
  if (!Array.isArray(dados)) {
    throw new Error("Resposta inesperada do servidor.");
  }
  return ordenarOcorrencias(dados.map(paraTela));
}

export async function criarOcorrencia({ data, descricao }) {
  const idPerfil = exigirIdPerfil();
  exigirValido({ data, descricao });
  const criado = await comMensagensDeCampo(() =>
    requisicaoAutenticada("/api/ocorrencias", {
      metodo: "POST",
      dados: montarCorpo(idPerfil, { data, descricao }),
    })
  );
  return paraTela(criado);
}

export async function atualizarOcorrencia(atual, { data, descricao }) {
  const idPerfil = exigirIdPerfil();
  exigirValido({ data, descricao });
  const corpo = montarCorpo(idPerfil, { data, descricao }, atual);
  const atualizado = await comMensagensDeCampo(() =>
    requisicaoAutenticada(`/api/ocorrencias/${atual.id_ocorrencia}`, {
      metodo: "PUT",
      dados: corpo,
    })
  );
  return paraTela(atualizado);
}

export async function excluirOcorrencia(id) {
  exigirIdPerfil();
  // 204 sem corpo: o cliente compartilhado devolve null.
  await requisicaoAutenticada(`/api/ocorrencias/${id}`, { metodo: "DELETE" });
}
