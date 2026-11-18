import test from "node:test";
import assert from "node:assert/strict";
import { ErroApi, requisicao, traduzirMensagemCampo } from "../../src/servicos/clienteApi.js";
import { configurarApi } from "../../src/servicos/configApi.js";

configurarApi({ urlBase: "http://api.teste/api" });

function resposta(status, corpo, { json = true } = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => {
      if (!json) throw new SyntaxError("Unexpected token <");
      return corpo;
    },
  };
}

test("204 não tenta decodificar JSON e devolve null", async () => {
  const fetchImpl = async () => ({ status: 204, ok: true, json: async () => { throw new Error("não deveria ler"); } });
  assert.equal(await requisicao("DELETE", "/ocorrencias/1", { fetchImpl }), null);
});

test("envia método, URL, Bearer e corpo JSON", async () => {
  let chamada;
  const fetchImpl = async (url, opcoes) => { chamada = { url, opcoes }; return resposta(201, { id: 1 }); };
  const r = await requisicao("POST", "/ocorrencias", { corpo: { a: 1 }, token: "abc", fetchImpl });
  assert.deepEqual(r, { id: 1 });
  assert.equal(chamada.url, "http://api.teste/api/ocorrencias");
  assert.equal(chamada.opcoes.method, "POST");
  assert.equal(chamada.opcoes.headers.Authorization, "Bearer abc");
  assert.equal(chamada.opcoes.headers["Content-Type"], "application/json");
  assert.equal(chamada.opcoes.body, '{"a":1}');
});

test("sem token e sem corpo: não envia Authorization nem body", async () => {
  let chamada;
  const fetchImpl = async (url, opcoes) => { chamada = opcoes; return resposta(200, []); };
  await requisicao("GET", "/ocorrencias", { fetchImpl });
  assert.equal(chamada.headers.Authorization, undefined);
  assert.equal(chamada.body, undefined);
});

test("mapeia status HTTP para tipos de erro", async () => {
  const casos = [
    [401, { erro: { codigo: "SESSAO" } }, "sessao"],
    [401, { erro: { codigo: "CREDENCIAIS" } }, "credenciais"],
    [404, { erro: { codigo: "NAO_ENCONTRADO" } }, "naoEncontrado"],
    [409, { erro: { codigo: "CONFLITO" } }, "conflito"],
    [413, { erro: { codigo: "TAMANHO" } }, "validacao"],
    [422, { erro: { codigo: "VALIDACAO" } }, "validacao"],
    [429, { erro: { codigo: "LIMITE" } }, "limite"],
    [500, { erro: { codigo: "INTERNO" } }, "servidor"],
  ];
  for (const [status, corpo, tipo] of casos) {
    const fetchImpl = async () => resposta(status, corpo);
    await assert.rejects(requisicao("GET", "/x", { fetchImpl }), (e) => {
      assert.ok(e instanceof ErroApi);
      assert.equal(e.tipo, tipo, `status ${status}`);
      assert.equal(e.status, status);
      return true;
    });
  }
});

test("422 traduz mensagens de campo do Zod (inglês) e mantém as em português", async () => {
  const corpo = { erro: { codigo: "VALIDACAO", campos: [
    { campo: "descricao_relato", mensagem: "Too small: expected string to have >=1 characters" },
    { campo: "data_ocorrencia", mensagem: "Data inexistente; use AAAA-MM-DD." },
    { campo: "tipo_ocorrencia", mensagem: "Too big: expected string to have <=100 characters" },
    { campo: "x", mensagem: "Invalid input: expected boolean, received string" },
  ] } };
  await assert.rejects(requisicao("POST", "/x", { fetchImpl: async () => resposta(422, corpo) }), (e) => {
    assert.deepEqual(e.campos.map((c) => c.mensagem), [
      "Preencha este campo.", "Data inexistente.", "Texto longo demais.", "Valor inválido.",
    ]);
    return true;
  });
  assert.equal(traduzirMensagemCampo("Informe 10 ou 11 dígitos com DDD."), "Informe 10 ou 11 dígitos com DDD.");
});

test("erro de servidor com corpo não-JSON (HTML) vira ErroApi, sem vazar o corpo", async () => {
  const fetchImpl = async () => resposta(500, null, { json: false });
  await assert.rejects(requisicao("GET", "/x", { fetchImpl }), (e) => {
    assert.equal(e.tipo, "servidor");
    assert.doesNotMatch(e.message, /<|SyntaxError/);
    return true;
  });
});

test("sucesso com corpo ilegível NÃO é tratado como sucesso", async () => {
  const fetchImpl = async () => resposta(200, null, { json: false });
  await assert.rejects(requisicao("GET", "/x", { fetchImpl }), (e) => e.tipo === "resposta");
});

test("falha de rede vira tipo 'rede' e a mensagem diz que nada foi salvo", async () => {
  const fetchImpl = async () => { throw new TypeError("Network request failed"); };
  await assert.rejects(requisicao("POST", "/x", { corpo: {}, fetchImpl }), (e) => {
    assert.equal(e.tipo, "rede");
    assert.match(e.message, /nada foi salvo/i);
    return true;
  });
});

test("timeout aborta a requisição e vira tipo 'tempo'", async () => {
  const fetchImpl = (url, { signal }) => new Promise((_, rejeitar) => {
    signal.addEventListener("abort", () => rejeitar(new DOMException("aborted", "AbortError")));
  });
  await assert.rejects(requisicao("GET", "/x", { fetchImpl, tempoLimiteMs: 50 }), (e) => e.tipo === "tempo");
});
