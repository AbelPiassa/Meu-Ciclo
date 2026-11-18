import { ErroApi } from "./clienteApi.js";
import { obterIdPerfil, requisicaoAutenticada } from "./sessao.js";
import { brParaIso, isoParaBr } from "../utils/datasApi.js";
import { validarOcorrencia } from "../utils/validacaoOcorrencia.js";

// CRUD do Diário de Ocorrências sobre /api/ocorrencias (contrato: backend/docs/API.md).
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

function exigirPerfil() {
  const idPerfil = obterIdPerfil();
  if (idPerfil === null) {
    throw new ErroApi({ tipo: "sessao", mensagem: "Sua sessão expirou. Entre novamente." });
  }
  return idPerfil;
}

function exigirValido(campos) {
  const resultado = validarOcorrencia(campos);
  if (!resultado.valido) {
    throw new ErroApi({ tipo: "validacao", mensagem: resultado.mensagem });
  }
}

// Troca a mensagem genérica de validação do servidor por "Campo: motivo".
async function comMensagensDeCampo(operacao) {
  try {
    return await operacao();
  } catch (erro) {
    if (erro instanceof ErroApi && erro.tipo === "validacao" && erro.campos.length > 0) {
      const detalhes = erro.campos
        .map(({ campo, mensagem }) => `${ROTULOS[campo] ?? campo}: ${mensagem}`)
        .join(" ");
      erro.message = `Revise os campos. ${detalhes}`;
    }
    throw erro;
  }
}

export async function listarOcorrencias() {
  exigirPerfil();
  const dados = await requisicaoAutenticada("GET", "/ocorrencias");
  if (!Array.isArray(dados)) {
    throw new ErroApi({ tipo: "resposta", mensagem: "Resposta inesperada do servidor." });
  }
  return ordenarOcorrencias(dados.map(paraTela));
}

export async function criarOcorrencia({ data, descricao }) {
  const idPerfil = exigirPerfil();
  exigirValido({ data, descricao });
  const criado = await comMensagensDeCampo(() =>
    requisicaoAutenticada("POST", "/ocorrencias", montarCorpo(idPerfil, { data, descricao }))
  );
  return paraTela(criado);
}

export async function atualizarOcorrencia(atual, { data, descricao }) {
  const idPerfil = exigirPerfil();
  exigirValido({ data, descricao });
  const corpo = montarCorpo(idPerfil, { data, descricao }, atual);
  const atualizado = await comMensagensDeCampo(() =>
    requisicaoAutenticada("PUT", `/ocorrencias/${atual.id_ocorrencia}`, corpo)
  );
  return paraTela(atualizado);
}

export async function excluirOcorrencia(id) {
  exigirPerfil();
  await requisicaoAutenticada("DELETE", `/ocorrencias/${id}`);
}
