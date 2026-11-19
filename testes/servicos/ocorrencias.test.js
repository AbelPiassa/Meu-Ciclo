import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../apoio/ambiente.js"; // precisa vir antes: define EXPO_PUBLIC_API_URL
import {
  guardarSessao,
  obterSessao,
  limparSessao,
  encerrarSessao,
} from "../../src/services/sessao.js";
import * as diario from "../../src/services/ocorrencias.js";

// Testes unitários do Diário: nada de rede real, o fetch é substituído por um dublê.
// Cobrem o contrato do cliente compartilhado (services/api.js) e a identidade da sessão.
const TOKEN = "a".repeat(64); // formato exigido por guardarSessao (64 hex)
const TOKEN_NOVO = "b".repeat(64);
const PERFIL = 7;
const fetchOriginal = globalThis.fetch;
const chamadas = [];
let responder = null;

function resposta(status, corpo) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => {
      if (corpo === undefined) throw new SyntaxError("corpo vazio");
      return corpo;
    },
  };
}

function entrar(token = TOKEN, idPerfil = PERFIL) {
  guardarSessao({ token, id_perfil: idPerfil, expira_em: new Date(Date.now() + 86400000).toISOString() });
}

function pendente() {
  let liberar;
  const promessa = new Promise((resolver) => {
    liberar = resolver;
  });
  return { promessa, liberar };
}

beforeEach(() => {
  chamadas.length = 0;
  responder = null;
  limparSessao();
  globalThis.fetch = async (url, opcoes) => {
    chamadas.push({ url, opcoes });
    return responder ? responder(url, opcoes) : resposta(204);
  };
});

afterEach(() => {
  globalThis.fetch = fetchOriginal;
  limparSessao();
});

test("sem sessão: nenhuma requisição sai e o erro é 401", async () => {
  await assert.rejects(diario.listarOcorrencias(), (e) => e.status === 401);
  await assert.rejects(diario.criarOcorrencia({ data: "01/11/2026", descricao: "x" }), (e) => e.status === 401);
  await assert.rejects(diario.excluirOcorrencia(1), (e) => e.status === 401);
  assert.equal(chamadas.length, 0);
});

test("GET usa a URL base sem /api, envia Bearer e devolve datas em DD/MM/AAAA ordenadas", async () => {
  entrar();
  responder = () =>
    resposta(200, [
      { id_ocorrencia: 1, data_ocorrencia: "2026-11-01", tipo_ocorrencia: "Relato do diário", descricao_relato: "a" },
      { id_ocorrencia: 2, data_ocorrencia: "2026-11-15", tipo_ocorrencia: "Relato do diário", descricao_relato: "b" },
    ]);
  const lista = await diario.listarOcorrencias();
  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].url, "http://api.teste/api/ocorrencias");
  assert.equal(chamadas[0].opcoes.method, "GET");
  assert.equal(chamadas[0].opcoes.headers.Authorization, `Bearer ${TOKEN}`);
  assert.deepEqual(lista.map((o) => o.id_ocorrencia), [2, 1]);
  assert.equal(lista[0].data_ocorrencia, "15/11/2026");
});

test("POST envia o corpo completo com id_perfil da sessão e descrição sem espaços nas pontas", async () => {
  entrar();
  responder = (_url, opcoes) => resposta(201, { ...JSON.parse(opcoes.body), id_ocorrencia: 9 });
  const criada = await diario.criarOcorrencia({ data: "01/11/2026", descricao: "  Relato fictício  " });
  assert.equal(chamadas[0].url, "http://api.teste/api/ocorrencias");
  assert.equal(chamadas[0].opcoes.method, "POST");
  assert.deepEqual(JSON.parse(chamadas[0].opcoes.body), {
    id_perfil: PERFIL,
    data_ocorrencia: "2026-11-01",
    tipo_ocorrencia: "Relato do diário",
    descricao_relato: "Relato fictício",
    como_se_sentiu: "",
    nivel_perigo: "Não informado",
    acionou_policia: false,
  });
  assert.equal(criada.id_ocorrencia, 9);
  assert.equal(criada.data_ocorrencia, "01/11/2026");
});

test("PUT preserva os campos que a tela não edita", async () => {
  entrar();
  responder = (_url, opcoes) => resposta(200, { ...JSON.parse(opcoes.body), id_ocorrencia: 5 });
  const atual = {
    id_ocorrencia: 5,
    data_ocorrencia: "02/10/2026",
    tipo_ocorrencia: "Ameaça verbal",
    descricao_relato: "Original",
    como_se_sentiu: "Insegura",
    nivel_perigo: "Médio",
    acionou_policia: true,
  };
  await diario.atualizarOcorrencia(atual, { data: "03/10/2026", descricao: "Editado pela tela" });
  assert.equal(chamadas[0].url, "http://api.teste/api/ocorrencias/5");
  assert.equal(chamadas[0].opcoes.method, "PUT");
  const enviado = JSON.parse(chamadas[0].opcoes.body);
  assert.equal(enviado.data_ocorrencia, "2026-10-03");
  assert.equal(enviado.descricao_relato, "Editado pela tela");
  assert.equal(enviado.tipo_ocorrencia, "Ameaça verbal");
  assert.equal(enviado.como_se_sentiu, "Insegura");
  assert.equal(enviado.nivel_perigo, "Médio");
  assert.equal(enviado.acionou_policia, true);
});

test("DELETE aceita 204 sem corpo", async () => {
  entrar();
  assert.equal(await diario.excluirOcorrencia(3), undefined);
  assert.equal(chamadas[0].url, "http://api.teste/api/ocorrencias/3");
  assert.equal(chamadas[0].opcoes.method, "DELETE");
});

test("validação no cliente: nada é enviado para datas ou textos inválidos", async () => {
  entrar();
  const casos = [
    { data: "31/02/2026", descricao: "x" },
    { data: "", descricao: "x" },
    { data: "01/11/2026", descricao: "   " },
    { data: "01/01/2099", descricao: "x" },
    { data: "01/11/2026", descricao: "a".repeat(5001) },
  ];
  for (const campos of casos) {
    await assert.rejects(diario.criarOcorrencia(campos), (e) => e.status === 422, JSON.stringify(campos).slice(0, 40));
  }
  assert.equal(chamadas.length, 0);
});

test("422 do servidor chega com as mensagens de campo traduzidas", async () => {
  entrar();
  responder = () =>
    resposta(422, {
      erro: {
        codigo: "VALIDACAO",
        mensagem: "Revise os campos.",
        campos: [
          { campo: "data_ocorrencia", mensagem: "Data inexistente; use AAAA-MM-DD." },
          { campo: "descricao_relato", mensagem: "Too small: expected string to have >=1 characters" },
        ],
      },
    });
  await assert.rejects(diario.criarOcorrencia({ data: "01/11/2026", descricao: "x" }), (e) => {
    assert.equal(e.status, 422);
    assert.equal(e.codigo, "VALIDACAO");
    assert.equal(e.message, "Revise os campos. Data: Data inexistente. Descrição: Preencha este campo.");
    return true;
  });
});

test("404 e 5xx são propagados com status, sem virar sucesso", async () => {
  entrar();
  responder = () => resposta(404, { erro: { codigo: "NAO_ENCONTRADO", mensagem: "Registro não encontrado." } });
  await assert.rejects(diario.excluirOcorrencia(99), (e) => e.status === 404);
  responder = () => resposta(500, { erro: { codigo: "INTERNO", mensagem: "Erro interno." } });
  await assert.rejects(diario.listarOcorrencias(), (e) => e.status === 500);
});

test("falha de rede não é tratada como sucesso", async () => {
  entrar();
  responder = () => {
    throw new TypeError("Network request failed");
  };
  await assert.rejects(diario.criarOcorrencia({ data: "01/11/2026", descricao: "x" }), (e) => {
    assert.match(e.message, /Não foi possível conectar à API/);
    return true;
  });
});

test("401 encerra a sessão compartilhada", async () => {
  entrar();
  assert.ok(obterSessao());
  responder = () => resposta(401, { erro: { codigo: "SESSAO", mensagem: "Sua sessão expirou." } });
  await assert.rejects(diario.listarOcorrencias(), (e) => e.status === 401);
  assert.equal(obterSessao(), null);
});

test("resposta que chega depois do logout é recusada", async () => {
  entrar();
  const espera = pendente();
  responder = (_url, opcoes) => (opcoes.method === "DELETE" ? resposta(204) : espera.promessa);
  const emVoo = diario.listarOcorrencias();
  encerrarSessao(); // Sair da conta / Quick Exit: limpa antes da resposta
  assert.equal(obterSessao(), null);
  espera.liberar(
    resposta(200, [{ id_ocorrencia: 1, data_ocorrencia: "2026-11-01", tipo_ocorrencia: "x", descricao_relato: "sensível" }])
  );
  await assert.rejects(emVoo, (e) => e.status === 401 && /Sessão alterada/.test(e.message));
  assert.equal(obterSessao(), null);
});

test("entrar de novo na MESMA conta descarta a resposta da sessão anterior", async () => {
  entrar();
  const espera = pendente();
  responder = () => espera.promessa;
  const emVoo = diario.listarOcorrencias();
  entrar(TOKEN_NOVO, PERFIL); // mesmo id_perfil, nova sessão
  espera.liberar(resposta(200, [{ id_ocorrencia: 1, data_ocorrencia: "2026-11-01", tipo_ocorrencia: "x", descricao_relato: "antigo" }]));
  await assert.rejects(emVoo, (e) => e.status === 401 && /Sessão alterada/.test(e.message));
  assert.equal(obterSessao().token, TOKEN_NOVO);
});

test("a próxima requisição já usa o token da sessão nova", async () => {
  entrar();
  responder = () => resposta(200, []);
  await diario.listarOcorrencias();
  entrar(TOKEN_NOVO, PERFIL);
  await diario.listarOcorrencias();
  assert.equal(chamadas[0].opcoes.headers.Authorization, `Bearer ${TOKEN}`);
  assert.equal(chamadas[1].opcoes.headers.Authorization, `Bearer ${TOKEN_NOVO}`);
});

const registroFicticio = {
  id_ocorrencia: 8, id_perfil: PERFIL, data_ocorrencia: "2026-11-01",
  tipo_ocorrencia: "Relato fictício", descricao_relato: "Apenas teste",
  como_se_sentiu: "", nivel_perigo: "Não informado", acionou_policia: false,
};
const operacoesPendentes = {
  GET: () => diario.listarOcorrencias(),
  POST: () => diario.criarOcorrencia({ data: "01/11/2026", descricao: "Apenas teste" }),
  PUT: () => diario.atualizarOcorrencia({ ...registroFicticio, data_ocorrencia: "01/11/2026" }, { data: "01/11/2026", descricao: "Apenas teste" }),
  DELETE: () => diario.excluirOcorrencia(8),
};
for (const [metodo, executar] of Object.entries(operacoesPendentes)) {
  test(`${metodo} atrasado após logout não entrega dados nem reabre a sessão`, async () => {
    entrar();
    const espera = pendente();
    responder = (url) => url.endsWith("/api/sessoes/atual") ? resposta(204) : espera.promessa;
    const resultado = executar().then(() => null, (e) => e);
    encerrarSessao();
    espera.liberar(metodo === "DELETE" ? resposta(204) : resposta(metodo === "POST" ? 201 : 200, metodo === "GET" ? [registroFicticio] : registroFicticio));
    assert.equal((await resultado)?.status, 401);
    assert.equal(obterSessao(), null);
    assert.equal(chamadas.filter((c) => !c.url.includes("sessoes")).length, 1);
  });
  test(`${metodo} 401 antigo não apaga a sessão nova da mesma conta`, async () => {
    entrar();
    const espera = pendente();
    responder = () => espera.promessa;
    const resultado = executar().then(() => null, (e) => e);
    entrar(TOKEN_NOVO, PERFIL);
    const novaSessao = obterSessao();
    espera.liberar(resposta(401, { erro: { codigo: "SESSAO", mensagem: "Sessão anterior expirada." } }));
    assert.equal((await resultado)?.status, 401);
    assert.equal(obterSessao(), novaSessao);
    assert.equal(novaSessao.token, TOKEN_NOVO);
  });
}
