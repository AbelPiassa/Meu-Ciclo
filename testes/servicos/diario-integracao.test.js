import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { join } from "node:path";
import { configurarApi } from "../../src/servicos/configApi.js";
import { ErroApi } from "../../src/servicos/clienteApi.js";
import { requisicao } from "../../src/servicos/clienteApi.js";
import { entrar, sair, obterSessao, requisicaoAutenticada } from "../../src/servicos/sessao.js";
import {
  listarOcorrencias,
  criarOcorrencia,
  atualizarOcorrencia,
  excluirOcorrencia,
} from "../../src/servicos/ocorrenciasApi.js";
import { criarPastaTemporaria, iniciarServidor, localizarBackend, removerPasta } from "../apoio/servidorApi.js";

// Integração real: serviços do app -> HTTP -> API Express -> SQLite.
// Só roda se o backend do Abel estiver disponível (ver testes/apoio/servidorApi.js).
const backend = localizarBackend();
const motivoPular = backend
  ? false
  : "backend/ não encontrado (defina MEU_CICLO_BACKEND_DIR ou aguarde o merge da API do Abel)";

// Dados 100% fictícios.
const SENHA = "Apenas-demonstracao-123!";
const perfilA = { usuario: "diario.a", senha: SENHA, nome: "Perfil A fictício", telefone_emergencia: "00000000000" };
const perfilB = { usuario: "diario.b", senha: SENHA, nome: "Perfil B fictício", telefone_emergencia: "00000000000" };

describe("Diário de Ocorrências x API real", { skip: motivoPular }, () => {
  let servidor;
  let pasta;
  let caminhoBanco;
  let idA;

  async function levantar() {
    servidor = await iniciarServidor(backend, caminhoBanco);
    configurarApi({ urlBase: servidor.urlApi, tempoLimiteMs: 5000 });
  }

  before(async () => {
    pasta = criarPastaTemporaria();
    caminhoBanco = join(pasta, "teste.sqlite");
    await levantar();
    const a = await requisicao("POST", "/perfis", { corpo: perfilA });
    await requisicao("POST", "/perfis", { corpo: perfilB });
    idA = a.perfil.id_perfil;
  });

  after(async () => {
    await sair();
    await servidor?.parar();
    removerPasta(pasta);
  });

  test("sem sessão: operações falham com tipo 'sessao' e nada é enviado", async () => {
    assert.equal(obterSessao().ativa, false);
    await assert.rejects(listarOcorrencias(), (e) => e instanceof ErroApi && e.tipo === "sessao");
    await assert.rejects(criarOcorrencia({ data: "01/11/2026", descricao: "x" }), (e) => e.tipo === "sessao");
  });

  test("login com senha errada: tipo 'credenciais' e sessão continua inativa", async () => {
    await assert.rejects(entrar(perfilA.usuario, "senha-errada-123456"), (e) => e.tipo === "credenciais");
    assert.equal(obterSessao().ativa, false);
    await assert.rejects(entrar("", ""), (e) => e.tipo === "validacao");
  });

  test("CRUD completo: criar, ler, atualizar, excluir (conversão de datas incluída)", async () => {
    await entrar(perfilA.usuario, SENHA);
    assert.deepEqual(obterSessao(), { ativa: true, idPerfil: idA });
    assert.deepEqual(await listarOcorrencias(), []);

    // CREATE
    const criada = await criarOcorrencia({ data: "01/11/2026", descricao: "  Relato fictício 1  " });
    assert.equal(criada.data_ocorrencia, "01/11/2026"); // volta em DD/MM/AAAA
    assert.equal(criada.descricao_relato, "Relato fictício 1"); // trim
    assert.equal(criada.id_perfil, idA);
    assert.equal(criada.tipo_ocorrencia, "Relato do diário");
    assert.equal(criada.nivel_perigo, "Não informado");
    assert.equal(criada.acionou_policia, false);

    // READ (ordem: data mais recente primeiro)
    const outra = await criarOcorrencia({ data: "15/11/2026", descricao: "Relato fictício 2" });
    const lista = await listarOcorrencias();
    assert.deepEqual(lista.map((o) => o.id_ocorrencia), [outra.id_ocorrencia, criada.id_ocorrencia]);

    // UPDATE
    const atualizada = await atualizarOcorrencia(criada, { data: "02/11/2026", descricao: "Relato alterado" });
    assert.equal(atualizada.id_ocorrencia, criada.id_ocorrencia);
    assert.equal(atualizada.data_ocorrencia, "02/11/2026");
    assert.equal(atualizada.descricao_relato, "Relato alterado");
    const releitura = await listarOcorrencias();
    assert.equal(releitura.find((o) => o.id_ocorrencia === criada.id_ocorrencia).descricao_relato, "Relato alterado");

    // DELETE (204 sem corpo não pode quebrar)
    assert.equal(await excluirOcorrencia(criada.id_ocorrencia), undefined);
    assert.equal(await excluirOcorrencia(outra.id_ocorrencia), undefined);
    assert.deepEqual(await listarOcorrencias(), []);
    await assert.rejects(excluirOcorrencia(criada.id_ocorrencia), (e) => e.tipo === "naoEncontrado");
  });

  test("PUT preserva tipo, como_se_sentiu, nível de perigo e acionou_policia", async () => {
    // Registro "rico" criado direto na API (a tela só edita data e descrição).
    const rico = await requisicaoAutenticada("POST", "/ocorrencias", {
      id_perfil: idA, data_ocorrencia: "2026-10-02", tipo_ocorrencia: "Ameaça verbal",
      descricao_relato: "Original", como_se_sentiu: "Insegura", nivel_perigo: "Médio", acionou_policia: true,
    });
    const [daTela] = await listarOcorrencias();
    await atualizarOcorrencia(daTela, { data: "03/10/2026", descricao: "Editado pela tela" });

    const depois = await requisicaoAutenticada("GET", `/ocorrencias/${rico.id_ocorrencia}`);
    assert.equal(depois.descricao_relato, "Editado pela tela");
    assert.equal(depois.data_ocorrencia, "2026-10-03");
    assert.equal(depois.tipo_ocorrencia, "Ameaça verbal");
    assert.equal(depois.como_se_sentiu, "Insegura");
    assert.equal(depois.nivel_perigo, "Médio");
    assert.equal(depois.acionou_policia, true);
    await excluirOcorrencia(rico.id_ocorrencia);
  });

  test("validação no cliente: nada é enviado para datas/campos inválidos", async () => {
    for (const campos of [
      { data: "31/02/2026", descricao: "x" },
      { data: "", descricao: "x" },
      { data: "01/11/2026", descricao: "   " },
      { data: "01/01/2099", descricao: "x" },
      { data: "01/11/2026", descricao: "a".repeat(5001) },
    ]) {
      await assert.rejects(criarOcorrencia(campos), (e) => e.tipo === "validacao");
    }
    assert.deepEqual(await listarOcorrencias(), []); // nada chegou ao banco
  });

  test("validação no servidor: erros de campo chegam traduzidos", async () => {
    await assert.rejects(
      requisicaoAutenticada("POST", "/ocorrencias", {
        id_perfil: idA, data_ocorrencia: "2026-02-31", tipo_ocorrencia: "", descricao_relato: "",
      }),
      (e) => {
        assert.equal(e.tipo, "validacao");
        const porCampo = Object.fromEntries(e.campos.map((c) => [c.campo, c.mensagem]));
        assert.equal(porCampo.data_ocorrencia, "Data inexistente.");
        assert.equal(porCampo.descricao_relato, "Preencha este campo.");
        assert.equal(porCampo.tipo_ocorrencia, "Preencha este campo.");
        return true;
      }
    );
  });

  test("identificação do perfil: id_perfil de outro perfil é rejeitado (422)", async () => {
    await assert.rejects(
      requisicaoAutenticada("POST", "/ocorrencias", {
        id_perfil: idA + 1, data_ocorrencia: "2026-11-01", tipo_ocorrencia: "x", descricao_relato: "y",
      }),
      (e) => e.tipo === "validacao" && e.status === 422
    );
  });

  test("isolamento: outro perfil não vê nem exclui relatos alheios", async () => {
    const minha = await criarOcorrencia({ data: "05/11/2026", descricao: "Só do perfil A" });
    await sair();
    assert.equal(obterSessao().ativa, false);

    await entrar(perfilB.usuario, SENHA);
    assert.deepEqual(await listarOcorrencias(), []);
    await assert.rejects(excluirOcorrencia(minha.id_ocorrencia), (e) => e.tipo === "naoEncontrado");
    await assert.rejects(atualizarOcorrencia(minha, { data: "05/11/2026", descricao: "invasão" }), (e) => e.tipo === "naoEncontrado");
    await sair();

    await entrar(perfilA.usuario, SENHA);
    const [intacta] = await listarOcorrencias();
    assert.equal(intacta.descricao_relato, "Só do perfil A");
    await excluirOcorrencia(minha.id_ocorrencia);
  });

  test("sessão revogada no servidor: 401 encerra a sessão local", async () => {
    await requisicaoAutenticada("DELETE", "/sessoes/atual"); // revoga só no servidor
    assert.equal(obterSessao().ativa, true); // o app ainda não sabe
    await assert.rejects(listarOcorrencias(), (e) => e.tipo === "sessao");
    assert.equal(obterSessao().ativa, false); // agora sabe: a tela volta ao login
    await entrar(perfilA.usuario, SENHA);
  });

  test("persistência: relato sobrevive à reinicialização da API", async () => {
    const criada = await criarOcorrencia({ data: "10/11/2026", descricao: "Deve persistir" });
    await sair();
    await servidor.parar();
    await levantar(); // mesmo arquivo de banco, processo novo
    await entrar(perfilA.usuario, SENHA);
    const lista = await listarOcorrencias();
    assert.equal(lista.length, 1);
    assert.equal(lista[0].id_ocorrencia, criada.id_ocorrencia);
    assert.equal(lista[0].descricao_relato, "Deve persistir");
    assert.equal(lista[0].data_ocorrencia, "10/11/2026");
    await excluirOcorrencia(criada.id_ocorrencia);
  });

  test("API fora do ar: tipo 'rede', e a lista não é dada como salva", async () => {
    const urlOk = servidor.urlApi;
    configurarApi({ urlBase: "http://127.0.0.1:1/api" }); // porta sem serviço
    await assert.rejects(criarOcorrencia({ data: "10/11/2026", descricao: "não vai" }), (e) => {
      assert.equal(e.tipo, "rede");
      assert.match(e.message, /nada foi salvo/i);
      return true;
    });
    configurarApi({ urlBase: urlOk });
    assert.deepEqual(await listarOcorrencias(), []); // nada foi gravado
  });

  test("API que não responde: tempo limite vira tipo 'tempo'", async () => {
    const mudo = net.createServer(() => {}); // aceita a conexão e nunca responde
    await new Promise((r) => mudo.listen(0, "127.0.0.1", r));
    const urlOk = servidor.urlApi;
    configurarApi({ urlBase: `http://127.0.0.1:${mudo.address().port}/api`, tempoLimiteMs: 300 });
    try {
      await assert.rejects(listarOcorrencias(), (e) => e.tipo === "tempo");
    } finally {
      configurarApi({ urlBase: urlOk, tempoLimiteMs: 5000 });
      mudo.closeAllConnections?.();
      mudo.close();
    }
  });
});
