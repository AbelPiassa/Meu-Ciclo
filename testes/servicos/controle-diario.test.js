import test from "node:test";
import assert from "node:assert/strict";
import { classificarGravacaoIncerta, criarControleDiario } from "../../src/utils/controleDiario.js";

function deferred() {
  let resolver;
  let rejeitador;
  const promise = new Promise((resolve, reject) => {
    resolver = resolve;
    rejeitador = reject;
  });
  return { promise, resolver, rejeitador };
}

async function drenarMicrotarefas() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function criarCenario() {
  const sessao = { id_perfil: 7, token: "sessao-a" };
  let atual = sessao;
  const controle = criarControleDiario({
    sessao,
    sessaoAtual: () => atual,
  });
  return {
    sessao,
    controle,
    trocarSessao(novaSessao) {
      atual = novaSessao;
    },
  };
}

async function deixarListaPronta(controle, lista = [{ id: 1 }]) {
  return controle.carregar(() => Promise.resolve(lista));
}

function assertBloqueado(erro) {
  assert.equal(erro?.codigo, "DIARIO_BLOQUEADO");
  assert.equal(erro?.status, 409);
  return true;
}

function assertSessaoInvalida(erro) {
  assert.equal(erro?.status, 401);
  return true;
}

test("expõe snapshot congelado, estável e só notifica mudanças", async () => {
  const { controle } = criarCenario();
  const inicial = controle.obterEstado();
  assert.deepEqual(inicial, {
    carregando: false,
    gravando: false,
    listaPronta: false,
    resultadoIncerto: false,
  });
  assert.ok(Object.isFrozen(inicial));
  assert.strictEqual(controle.obterEstado(), inicial);

  const snapshots = [];
  const remover = controle.observar((snapshot) => snapshots.push(snapshot));
  await deixarListaPronta(controle);
  assert.equal(snapshots.length, 3);
  assert.deepEqual(snapshots.map((snapshot) => snapshot.carregando), [true, true, false]);
  assert.deepEqual(snapshots.map((snapshot) => snapshot.listaPronta), [false, true, true]);
  assert.ok(snapshots.every((snapshot) => Object.isFrozen(snapshot)));
  assert.strictEqual(controle.obterEstado(), snapshots.at(-1));

  const ultimo = snapshots.at(-1);
  remover();
  const write = controle.gravar(() => "ok");
  await write;
  assert.strictEqual(controle.obterEstado(), controle.obterEstado());
  assert.notStrictEqual(controle.obterEstado(), ultimo);
  assert.equal(snapshots.length, 3);
});

test("carregar deduplica chamadas concorrentes e devolve exatamente a mesma Promise", async () => {
  const { controle } = criarCenario();
  const espera = deferred();
  let chamadas = 0;
  const primeira = controle.carregar(() => {
    chamadas += 1;
    return espera.promise;
  });
  const segunda = controle.carregar(() => {
    throw new Error("loader duplicado não pode ser chamado");
  });

  assert.strictEqual(segunda, primeira);
  assert.equal(controle.obterEstado().carregando, true);
  assert.equal(controle.obterEstado().listaPronta, false);
  await drenarMicrotarefas();
  assert.equal(chamadas, 1);

  espera.resolver(["lista carregada"]);
  assert.deepEqual(await primeira, ["lista carregada"]);
  assert.equal(controle.obterEstado().carregando, false);
  assert.equal(controle.obterEstado().listaPronta, true);
});

test("gravar é síncrono no lock, impede double-click e libera após sucesso", async () => {
  const { controle } = criarCenario();
  await deixarListaPronta(controle);
  const espera = deferred();
  let chamadas = 0;
  const writer = () => {
    chamadas += 1;
    return espera.promise;
  };

  const primeira = controle.gravar(writer);
  assert.equal(controle.obterEstado().gravando, true);
  const segunda = controle.gravar(writer);
  await assert.rejects(segunda, assertBloqueado);
  await drenarMicrotarefas();
  assert.equal(chamadas, 1);

  espera.resolver({ salvo: true });
  assert.deepEqual(await primeira, { salvo: true });
  assert.equal(controle.obterEstado().gravando, false);
  assert.equal(controle.obterEstado().listaPronta, true);
});

test("write durante GET e GET durante write são bloqueados sem invocar a operação", async () => {
  const primeiro = criarCenario();
  const esperaGet = deferred();
  let chamadasWriter = 0;
  const get = primeiro.controle.carregar(() => esperaGet.promise);
  const writeDuranteGet = primeiro.controle.gravar(() => {
    chamadasWriter += 1;
    return "não enviado";
  });
  await assert.rejects(writeDuranteGet, assertBloqueado);
  assert.equal(chamadasWriter, 0);
  esperaGet.resolver([]);
  await get;

  const segundo = criarCenario();
  await deixarListaPronta(segundo.controle);
  const esperaWrite = deferred();
  let chamadasLoader = 0;
  const write = segundo.controle.gravar(() => esperaWrite.promise);
  const getDuranteWrite = segundo.controle.carregar(() => {
    chamadasLoader += 1;
    return [];
  });
  await assert.rejects(getDuranteWrite, assertBloqueado);
  assert.equal(chamadasLoader, 0);
  esperaWrite.resolver("ok");
  await write;
});

test("falha de rede depois de efeito aplicado torna o resultado incerto e bloqueia nova gravação", async () => {
  const { controle } = criarCenario();
  await deixarListaPronta(controle);
  let efeitos = 0;
  const falhaDeRede = new Error("Network request failed");
  const primeira = controle.gravar(() => {
    efeitos += 1;
    throw falhaDeRede;
  });

  await assert.rejects(primeira, (erro) => erro === falhaDeRede);
  assert.equal(efeitos, 1);
  assert.deepEqual(controle.obterEstado(), {
    carregando: false,
    gravando: false,
    listaPronta: false,
    resultadoIncerto: true,
  });

  let novaChamada = false;
  await assert.rejects(
    controle.gravar(() => {
      novaChamada = true;
    }),
    assertBloqueado
  );
  assert.equal(novaChamada, false);
});

test("GET que falha preserva a incerteza e mantém a gravação bloqueada", async () => {
  const { controle } = criarCenario();
  await deixarListaPronta(controle);
  await assert.rejects(controle.gravar(() => { throw new Error("sem resposta"); }));
  assert.equal(controle.obterEstado().resultadoIncerto, true);

  const falhaGet = Object.assign(new Error("API indisponível"), { status: 503 });
  await assert.rejects(controle.carregar(() => Promise.reject(falhaGet)), (erro) => erro === falhaGet);
  assert.deepEqual(controle.obterEstado(), {
    carregando: false,
    gravando: false,
    listaPronta: false,
    resultadoIncerto: true,
  });
  await assert.rejects(controle.gravar(() => "não enviado"), assertBloqueado);
});

test("GET bem-sucedido limpa a incerteza e permite nova gravação", async () => {
  const { controle } = criarCenario();
  await deixarListaPronta(controle);
  await assert.rejects(controle.gravar(() => { throw new Error("rede caiu"); }));
  assert.equal(controle.obterEstado().resultadoIncerto, true);

  await controle.carregar(() => ["estado atual do servidor"]);
  assert.deepEqual(controle.obterEstado(), {
    carregando: false,
    gravando: false,
    listaPronta: true,
    resultadoIncerto: false,
  });
  assert.equal(await controle.gravar(() => "corrigido"), "corrigido");
});

test("500, timeout e falha sem status são ambíguos; 401, 404 e 422 não são", async () => {
  assert.equal(classificarGravacaoIncerta(Object.assign(new Error("interno"), { status: 500 })), true);
  assert.equal(classificarGravacaoIncerta(Object.assign(new Error("tempo esgotado"), { status: 408 })), true);
  assert.equal(classificarGravacaoIncerta(Object.assign(new Error("ETIMEDOUT"), { status: 408, code: "ETIMEDOUT" })), true);
  assert.equal(classificarGravacaoIncerta(new Error("falha de rede")), true);
  assert.equal(classificarGravacaoIncerta(Object.assign(new Error("não autorizado"), { status: 401 })), false);
  assert.equal(classificarGravacaoIncerta(Object.assign(new Error("ausente"), { status: 404 })), false);
  assert.equal(classificarGravacaoIncerta(Object.assign(new Error("corrija os campos"), { status: 422 })), false);

  for (const erro of [
    Object.assign(new Error("interno"), { status: 500 }),
    Object.assign(new Error("tempo esgotado"), { status: 408, code: "ETIMEDOUT" }),
  ]) {
    const { controle } = criarCenario();
    await deixarListaPronta(controle);
    await assert.rejects(controle.gravar(() => Promise.reject(erro)), (recebido) => recebido === erro);
    assert.equal(controle.obterEstado().resultadoIncerto, true);
  }
});

test("erro 422 permite correção e 401 não transforma a lista em incerta", async () => {
  const cenario = criarCenario();
  await deixarListaPronta(cenario.controle);
  const validacao = Object.assign(new Error("dados inválidos"), { status: 422 });
  await assert.rejects(cenario.controle.gravar(() => Promise.reject(validacao)), (erro) => erro === validacao);
  assert.deepEqual(cenario.controle.obterEstado(), {
    carregando: false,
    gravando: false,
    listaPronta: true,
    resultadoIncerto: false,
  });
  assert.equal(await cenario.controle.gravar(() => "corrigido"), "corrigido");

  const sessaoNova = { id_perfil: 8, token: "sessao-b" };
  cenario.trocarSessao(sessaoNova);
  const antes = cenario.controle.obterEstado();
  await assert.rejects(cenario.controle.gravar(() => "não enviado"), assertSessaoInvalida);
  assert.strictEqual(cenario.controle.obterEstado(), antes);
});

test("sessão inválida impede carga e writer nem é chamado", async () => {
  const cenario = criarCenario();
  const sessaoNova = { id_perfil: 8, token: "sessao-b" };
  cenario.trocarSessao(sessaoNova);
  let chamadasLoader = 0;
  let chamadasWriter = 0;

  await assert.rejects(
    cenario.controle.carregar(() => {
      chamadasLoader += 1;
      return [];
    }),
    assertSessaoInvalida
  );
  await assert.rejects(
    cenario.controle.gravar(() => {
      chamadasWriter += 1;
    }),
    assertBloqueado
  );
  assert.equal(chamadasLoader, 0);
  assert.equal(chamadasWriter, 0);
});

test("sessão alterada antes do microtask não envia writer e libera o lock", async () => {
  const cenario = criarCenario();
  await deixarListaPronta(cenario.controle);
  const sessaoNova = { id_perfil: 8, token: "sessao-b" };
  let chamadas = 0;
  const write = cenario.controle.gravar(() => {
    chamadas += 1;
    return "não enviado";
  });
  assert.equal(cenario.controle.obterEstado().gravando, true);
  cenario.trocarSessao(sessaoNova);
  await assert.rejects(write, assertSessaoInvalida);
  assert.equal(chamadas, 0);
  assert.equal(cenario.controle.obterEstado().gravando, false);
});

test("resposta antiga após troca de sessão não deixa lock vazado nem libera lock novo", async () => {
  const cenario = criarCenario();
  await deixarListaPronta(cenario.controle);
  const espera = deferred();
  const antigo = cenario.controle.gravar(() => espera.promise);
  const sessaoNova = { id_perfil: 8, token: "sessao-b" };
  cenario.trocarSessao(sessaoNova);
  await drenarMicrotarefas();

  espera.resolver("resposta antiga");
  await assert.rejects(antigo, assertSessaoInvalida);
  assert.equal(cenario.controle.obterEstado().gravando, false);

  // Reutilizar a identidade original mostra que o ticket antigo foi liberado
  // pelo próprio finally; ele não pode interferir na próxima operação.
  cenario.trocarSessao(cenario.sessao);
  let chamadasNovas = 0;
  assert.equal(
    await cenario.controle.gravar(() => {
      chamadasNovas += 1;
      return "nova operação";
    }),
    "nova operação"
  );
  assert.equal(chamadasNovas, 1);
});

test("write pendente continua bloqueado mesmo sem subscriber (perda de foco)", async () => {
  const { controle } = criarCenario();
  await deixarListaPronta(controle);
  const remover = controle.observar(() => {});
  const espera = deferred();
  const primeira = controle.gravar(() => espera.promise);
  remover();

  assert.equal(controle.obterEstado().gravando, true);
  let chamadaIndevida = false;
  await assert.rejects(
    controle.gravar(() => {
      chamadaIndevida = true;
      return "não enviado";
    }),
    assertBloqueado
  );
  assert.equal(chamadaIndevida, false);

  espera.resolver("concluído");
  assert.equal(await primeira, "concluído");
  assert.equal(controle.obterEstado().gravando, false);
});
