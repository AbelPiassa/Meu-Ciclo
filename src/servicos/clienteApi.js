import { obterConfigApi } from "./configApi.js";

// Erro único para todas as falhas de comunicação com a API.
// tipo: "rede" | "tempo" | "credenciais" | "sessao" | "validacao" | "naoEncontrado"
//       | "conflito" | "limite" | "servidor" | "resposta"
// "message" já é um texto em português, seguro para mostrar à usuária
// (nunca contém SQL, token, senha ou o conteúdo de relatos).
export class ErroApi extends Error {
  constructor({ tipo, mensagem, status = null, codigo = null, campos = [] }) {
    super(mensagem);
    this.name = "ErroApi";
    this.tipo = tipo;
    this.status = status;
    this.codigo = codigo;
    this.campos = campos;
  }
}

// O Zod do backend devolve parte das mensagens em inglês; traduzimos as conhecidas
// e mantemos as que já vêm em português (ex.: "Data inexistente; use AAAA-MM-DD.").
export function traduzirMensagemCampo(mensagem) {
  const texto = String(mensagem ?? "");

  if (/^Too small/i.test(texto) || /^Invalid input: expected string, received undefined/i.test(texto)) {
    return "Preencha este campo.";
  }
  if (/^Too big/i.test(texto)) {
    return "Texto longo demais.";
  }
  if (/Data inexistente/i.test(texto)) {
    return "Data inexistente.";
  }
  if (/[À-ÿ]/.test(texto)) {
    return texto;
  }
  return "Valor inválido.";
}

function erroDeStatus(status, corpo) {
  const erro = corpo && typeof corpo === "object" ? corpo.erro : null;
  const codigo = erro?.codigo ?? null;
  const campos = Array.isArray(erro?.campos)
    ? erro.campos.map((c) => ({ campo: String(c.campo), mensagem: traduzirMensagemCampo(c.mensagem) }))
    : [];
  const base = { status, codigo, campos };

  if (status === 401) {
    return codigo === "CREDENCIAIS"
      ? new ErroApi({ ...base, tipo: "credenciais", mensagem: "Usuário ou senha inválidos." })
      : new ErroApi({ ...base, tipo: "sessao", mensagem: "Sua sessão expirou. Entre novamente." });
  }
  if (status === 404) {
    return new ErroApi({ ...base, tipo: "naoEncontrado", mensagem: "Registro não encontrado." });
  }
  if (status === 409) {
    return new ErroApi({ ...base, tipo: "conflito", mensagem: "Conflito com um registro existente." });
  }
  if (status === 413) {
    return new ErroApi({ ...base, tipo: "validacao", mensagem: "O texto enviado é grande demais." });
  }
  if (status === 422) {
    return new ErroApi({ ...base, tipo: "validacao", mensagem: "Revise os campos informados." });
  }
  if (status === 429) {
    return new ErroApi({ ...base, tipo: "limite", mensagem: "Muitas tentativas. Aguarde um pouco e tente de novo." });
  }
  if (status >= 500) {
    return new ErroApi({ ...base, tipo: "servidor", mensagem: "O servidor não conseguiu concluir a operação." });
  }
  return new ErroApi({ ...base, tipo: "resposta", mensagem: "Resposta inesperada do servidor." });
}

// Faz uma requisição JSON à API. Retorna o corpo já decodificado (ou null em 204).
// Nunca trata falha como sucesso: qualquer problema vira ErroApi.
export async function requisicao(metodo, caminho, { corpo, token, fetchImpl, tempoLimiteMs } = {}) {
  const { urlBase, tempoLimiteMs: tempoPadrao } = obterConfigApi();
  const executar = fetchImpl ?? fetch;
  const controlador = new AbortController();
  const limite = tempoLimiteMs ?? tempoPadrao;
  let estourou = false;
  const cronometro = setTimeout(() => {
    estourou = true;
    controlador.abort();
  }, limite);

  const cabecalhos = { Accept: "application/json" };
  if (corpo !== undefined) {
    cabecalhos["Content-Type"] = "application/json";
  }
  if (token) {
    cabecalhos.Authorization = `Bearer ${token}`;
  }

  try {
    let resposta;
    try {
      resposta = await executar(`${urlBase}${caminho}`, {
        method: metodo,
        headers: cabecalhos,
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
        signal: controlador.signal,
      });
    } catch {
      throw estourou
        ? new ErroApi({ tipo: "tempo", mensagem: "O servidor demorou demais para responder. Nada foi confirmado." })
        : new ErroApi({
            tipo: "rede",
            mensagem: "Não foi possível conectar ao servidor. Verifique a conexão; nada foi salvo.",
          });
    }

    if (resposta.status === 204) {
      return null;
    }

    let dados = null;
    let textoValido = true;
    try {
      dados = await resposta.json();
    } catch {
      textoValido = false;
    }

    if (!resposta.ok) {
      throw erroDeStatus(resposta.status, dados);
    }
    if (!textoValido) {
      throw new ErroApi({ tipo: "resposta", status: resposta.status, mensagem: "Resposta inesperada do servidor." });
    }
    return dados;
  } finally {
    clearTimeout(cronometro);
  }
}
