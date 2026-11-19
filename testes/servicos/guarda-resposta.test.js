import test from "node:test";
import assert from "node:assert/strict";
import { criarGuardaDeResposta } from "../../src/utils/guardaResposta.js";

// A guarda é o que impede que uma resposta antiga reponha dados sensíveis depois de
// logout, 401, Quick Exit ou novo login (inclusive na mesma conta).
// A identidade comparada é o objeto de sessão (token + perfil), não apenas id_perfil.
const SESSAO_A = { token: "a".repeat(64), id_perfil: 7 };

function cenario(sessao = SESSAO_A) {
  const estado = { ativa: true, geracao: 3, sessaoAtual: sessao };
  const guarda = criarGuardaDeResposta({
    sessao,
    geracaoEsperada: 3,
    estaAtiva: () => estado.ativa,
    geracaoAtual: () => estado.geracao,
    sessaoAtual: () => estado.sessaoAtual,
  });
  return { estado, guarda };
}

test("aceita a resposta enquanto a tela e a sessão são as mesmas", () => {
  const { guarda } = cenario();
  assert.equal(guarda(), true);
});

test("descarta a resposta depois que a tela foi desmontada (Quick Exit)", () => {
  const { estado, guarda } = cenario();
  estado.ativa = false;
  assert.equal(guarda(), false);
});

test("descarta a resposta depois do logout", () => {
  const { estado, guarda } = cenario();
  estado.geracao += 1;
  estado.sessaoAtual = null;
  assert.equal(guarda(), false);
});

test("descarta a resposta ao entrar de novo na MESMA conta (novo token, mesmo id_perfil)", () => {
  const { estado, guarda } = cenario();
  estado.geracao += 2; // logout + novo login
  estado.sessaoAtual = { token: "b".repeat(64), id_perfil: 7 };
  assert.equal(guarda(), false);
});

test("descarta a resposta de outra conta", () => {
  const { estado, guarda } = cenario();
  estado.geracao += 1;
  estado.sessaoAtual = { token: "c".repeat(64), id_perfil: 9 };
  assert.equal(guarda(), false);
});

test("logout é recusado mesmo com tela ativa e geração inalterada", () => {
  const { estado, guarda } = cenario();
  estado.sessaoAtual = null;
  assert.equal(estado.ativa, true);
  assert.equal(estado.geracao, 3);
  assert.equal(guarda(), false);
});

test("relogin na mesma conta é recusado sem depender da geração", () => {
  const { estado, guarda } = cenario();
  estado.sessaoAtual = { token: "b".repeat(64), id_perfil: 7 };
  assert.equal(estado.geracao, 3);
  assert.equal(guarda(), false);
});

test("outra conta é recusada sem depender da geração", () => {
  const { estado, guarda } = cenario();
  estado.sessaoAtual = { token: "c".repeat(64), id_perfil: 9 };
  assert.equal(estado.geracao, 3);
  assert.equal(guarda(), false);
});

test("nunca aceita quando não há sessão", () => {
  const guarda = criarGuardaDeResposta({
    sessao: null,
    geracaoEsperada: 0,
    estaAtiva: () => true,
    geracaoAtual: () => 0,
    sessaoAtual: () => null,
  });
  assert.equal(guarda(), false);
});
