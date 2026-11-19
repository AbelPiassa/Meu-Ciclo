import test from "node:test";
import assert from "node:assert/strict";
import { criarGuardaDeResposta } from "../../src/utils/guardaResposta.js";

// A guarda é o que impede que uma resposta antiga reponha dados sensíveis depois de
// logout, 401 ou Quick Exit. Aqui ela é testada isoladamente, com estado simulado.
function cenario({ montada = true, geracao = 3, idPerfil = 7 } = {}) {
  const estado = { montada, geracao, idPerfil };
  const guarda = criarGuardaDeResposta({
    idPerfil,
    geracaoEsperada: geracao,
    estaMontada: () => estado.montada,
    geracaoAtual: () => estado.geracao,
    idPerfilAtual: () => estado.idPerfil,
  });
  return { estado, guarda };
}

test("aceita a resposta enquanto a tela, a geração e o perfil são os mesmos", () => {
  const { guarda } = cenario();
  assert.equal(guarda(), true);
});

test("descarta a resposta depois que a tela foi desmontada (Quick Exit)", () => {
  const { estado, guarda } = cenario();
  estado.montada = false;
  assert.equal(guarda(), false);
});

test("descarta a resposta depois do logout", () => {
  const { estado, guarda } = cenario();
  estado.geracao += 1; // logout incrementa a geração
  estado.idPerfil = null; // sessão limpa
  assert.equal(guarda(), false);
});

test("descarta a resposta de uma sessão anterior mesmo com novo login", () => {
  const { estado, guarda } = cenario();
  estado.geracao += 2; // logout + novo login
  estado.idPerfil = 9; // outra conta
  assert.equal(guarda(), false);
  estado.idPerfil = 7; // mesma conta, mas a geração mudou
  assert.equal(guarda(), false);
});

test("nunca aceita quando não há sessão", () => {
  const guarda = criarGuardaDeResposta({
    idPerfil: null,
    geracaoEsperada: 0,
    estaMontada: () => true,
    geracaoAtual: () => 0,
    idPerfilAtual: () => null,
  });
  assert.equal(guarda(), false);
});
