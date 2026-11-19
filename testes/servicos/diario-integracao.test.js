import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { criarPastaTemporaria, iniciarServidor, localizarBackend, removerPasta } from "../apoio/servidorApi.js";

// Integração real: serviços do app -> HTTP -> API Express -> SQLite.
// Usa a sessão única (services/sessao.js) e o cliente compartilhado (services/api.js).
// Só roda se o backend estiver instalado (ver testes/apoio/servidorApi.js).
const backend = localizarBackend();
const motivoPular = backend
  ? false
  : "backend/ indisponível: rode `npm ci` em backend/ ou defina MEU_CICLO_BACKEND_DIR";

// Dados 100% fictícios.
const SENHA = "Apenas-demonstracao-123!";
const perfilA = { usuario: "diario.a", senha: SENHA, nome: "Perfil A fictício", telefone_emergencia: "00000000000" };
const perfilB = { usuario: "diario.b", senha: SENHA, nome: "Perfil B fictício", telefone_emergencia: "00000000000" };

describe("Diário de Ocorrências x API real (sessão compartilhada)", { skip: motivoPular }, () => {
  let servidor;
  let pasta;
  let caminhoBanco;
  let idA;
  let api;

  async function levantar(porta) {
    servidor = await iniciarServidor(backend, caminhoBanco, porta);
    // O cliente compartilhado lê EXPO_PUBLIC_API_URL (sem /api) na inicialização do módulo,
    // por isso os módulos são importados só depois que a API está no ar.
    process.env.EXPO_PUBLIC_API_URL = servidor.urlBase;
    api = {
      requisicao: (await import("../../src/services/api.js")).requisicao,
      sessao: await import("../../src/services/sessao.js"),
      perfil: await import("../../src/services/perfil.js"),
      diario: await import("../../src/services/ocorrencias.js"),
    };
  }

  before(async () => {
    pasta = criarPastaTemporaria();
    caminhoBanco = join(pasta, "teste.sqlite");
    await levantar();
    const a = await api.requisicao("/api/perfis", { metodo: "POST", dados: perfilA });
    await api.requisicao("/api/perfis", { metodo: "POST", dados: perfilB });
    idA = a.perfil.id_perfil;
  });

  after(async () => {
    api?.sessao.encerrarSessao();
    await servidor?.parar();
    removerPasta(pasta);
  });

  test("sem sessão: operações falham com 401 e nada é enviado", async () => {
    assert.equal(api.sessao.obterSessao(), null);
    await assert.rejects(api.diario.listarOcorrencias(), (e) => e.status === 401);
    await assert.rejects(api.diario.criarOcorrencia({ data: "01/11/2026", descricao: "x" }), (e) => e.status === 401);
  });

  test("login com senha errada: 401 e a sessão continua vazia", async () => {
    await assert.rejects(api.perfil.entrar(perfilA.usuario, "senha-errada-123456"), (e) => e.status === 401);
    assert.equal(api.sessao.obterSessao(), null);
  });

  test("CRUD completo com a sessão do login (conversão de datas incluída)", async () => {
    await api.perfil.entrar(perfilA.usuario, SENHA);
    assert.equal(api.sessao.obterSessao().id_perfil, idA);
    assert.deepEqual(await api.diario.listarOcorrencias(), []);

    // CREATE
    const criada = await api.diario.criarOcorrencia({ data: "01/11/2026", descricao: "  Relato fictício 1  " });
    assert.equal(criada.data_ocorrencia, "01/11/2026"); // volta em DD/MM/AAAA
    assert.equal(criada.descricao_relato, "Relato fictício 1"); // trim
    assert.equal(criada.id_perfil, idA);
    assert.equal(criada.tipo_ocorrencia, "Relato do diário");
    assert.equal(criada.nivel_perigo, "Não informado");
    assert.equal(criada.acionou_policia, false);

    // READ (data mais recente primeiro)
    const outra = await api.diario.criarOcorrencia({ data: "15/11/2026", descricao: "Relato fictício 2" });
    const lista = await api.diario.listarOcorrencias();
    assert.deepEqual(lista.map((o) => o.id_ocorrencia), [outra.id_ocorrencia, criada.id_ocorrencia]);

    // UPDATE
    const atualizada = await api.diario.atualizarOcorrencia(criada, { data: "02/11/2026", descricao: "Relato alterado" });
    assert.equal(atualizada.id_ocorrencia, criada.id_ocorrencia);
    assert.equal(atualizada.data_ocorrencia, "02/11/2026");
    assert.equal(atualizada.descricao_relato, "Relato alterado");
    const releitura = await api.diario.listarOcorrencias();
    assert.equal(releitura.find((o) => o.id_ocorrencia === criada.id_ocorrencia).descricao_relato, "Relato alterado");

    // DELETE (204 sem corpo não pode quebrar)
    assert.equal(await api.diario.excluirOcorrencia(criada.id_ocorrencia), undefined);
    assert.equal(await api.diario.excluirOcorrencia(outra.id_ocorrencia), undefined);
    assert.deepEqual(await api.diario.listarOcorrencias(), []);
    await assert.rejects(api.diario.excluirOcorrencia(criada.id_ocorrencia), (e) => e.status === 404);
  });

  test("PUT preserva tipo, como_se_sentiu, nível de perigo e acionou_policia", async () => {
    // Registro "rico" criado direto na API (a tela só edita data e descrição).
    const rico = await api.sessao.requisicaoAutenticada("/api/ocorrencias", {
      metodo: "POST",
      dados: {
        id_perfil: idA,
        data_ocorrencia: "2026-10-02",
        tipo_ocorrencia: "Ameaça verbal",
        descricao_relato: "Original",
        como_se_sentiu: "Insegura",
        nivel_perigo: "Médio",
        acionou_policia: true,
      },
    });
    const [daTela] = await api.diario.listarOcorrencias();
    await api.diario.atualizarOcorrencia(daTela, { data: "03/10/2026", descricao: "Editado pela tela" });

    const depois = await api.sessao.requisicaoAutenticada(`/api/ocorrencias/${rico.id_ocorrencia}`);
    assert.equal(depois.descricao_relato, "Editado pela tela");
    assert.equal(depois.data_ocorrencia, "2026-10-03");
    assert.equal(depois.tipo_ocorrencia, "Ameaça verbal");
    assert.equal(depois.como_se_sentiu, "Insegura");
    assert.equal(depois.nivel_perigo, "Médio");
    assert.equal(depois.acionou_policia, true);
    await api.diario.excluirOcorrencia(rico.id_ocorrencia);
  });

  test("validação no cliente: nada é enviado para campos inválidos", async () => {
    for (const campos of [
      { data: "31/02/2026", descricao: "x" },
      { data: "", descricao: "x" },
      { data: "01/11/2026", descricao: "   " },
      { data: "01/01/2099", descricao: "x" },
      { data: "01/11/2026", descricao: "a".repeat(5001) },
    ]) {
      await assert.rejects(api.diario.criarOcorrencia(campos), (e) => e.status === 422);
    }
    assert.deepEqual(await api.diario.listarOcorrencias(), []); // nada chegou ao banco
  });

  test("validação no servidor: 422 chega com os campos traduzidos", async () => {
    await assert.rejects(
      api.sessao.requisicaoAutenticada("/api/ocorrencias", {
        metodo: "POST",
        dados: {
          id_perfil: idA,
          data_ocorrencia: "2026-02-31",
          tipo_ocorrencia: "",
          descricao_relato: "",
        },
      }),
      (e) => {
        assert.equal(e.status, 422);
        const porCampo = Object.fromEntries((e.campos ?? []).map((c) => [c.campo, c.mensagem]));
        assert.equal(porCampo.data_ocorrencia, "Data inexistente; use AAAA-MM-DD.");
        assert.match(porCampo.descricao_relato, /Too small/i);
        return true;
      }
    );
  });

  test("isolamento: outro perfil não vê nem exclui relatos alheios", async () => {
    const minha = await api.diario.criarOcorrencia({ data: "05/11/2026", descricao: "Só do perfil A" });
    api.sessao.encerrarSessao();
    assert.equal(api.sessao.obterSessao(), null);
    await api.perfil.entrar(perfilB.usuario, SENHA);
    assert.deepEqual(await api.diario.listarOcorrencias(), []);
    await assert.rejects(api.diario.excluirOcorrencia(minha.id_ocorrencia), (e) => e.status === 404);
    await assert.rejects(
      api.diario.atualizarOcorrencia(minha, { data: "05/11/2026", descricao: "invasão" }),
      (e) => e.status === 404
    );
    api.sessao.encerrarSessao();
    await api.perfil.entrar(perfilA.usuario, SENHA);
    const [intacta] = await api.diario.listarOcorrencias();
    assert.equal(intacta.descricao_relato, "Só do perfil A");
    await api.diario.excluirOcorrencia(minha.id_ocorrencia);
  });

  test("sessão revogada no servidor: 401 encerra a sessão compartilhada", async () => {
    await api.sessao.requisicaoAutenticada("/api/sessoes/atual", { metodo: "DELETE" }); // revoga só no servidor
    assert.ok(api.sessao.obterSessao()); // o app ainda não sabe
    await assert.rejects(api.diario.listarOcorrencias(), (e) => e.status === 401);
    assert.equal(api.sessao.obterSessao(), null); // agora sabe: a tela volta ao login
    await api.perfil.entrar(perfilA.usuario, SENHA);
  });

  test("resposta antiga depois do logout é recusada e não reabre a sessão", async () => {
    // O erro é capturado desde o início para não virar rejeição não tratada.
    const emVoo = api.diario.listarOcorrencias().then(() => null, (e) => e);
    api.sessao.encerrarSessao(); // Sair da conta / Quick Exit: limpa antes da resposta
    assert.equal(api.sessao.obterSessao(), null);
    const falha = await emVoo;
    assert.equal(falha?.status, 401);
    assert.match(falha.message, /Sessão alterada/);
    assert.equal(api.sessao.obterSessao(), null);
    await assert.rejects(api.diario.listarOcorrencias(), (e) => e.status === 401);
    await api.perfil.entrar(perfilA.usuario, SENHA);
  });

  test("novo login na MESMA conta descarta a resposta da sessão anterior", async () => {
    const tokenAntigo = api.sessao.obterSessao().token;
    const emVoo = api.diario.listarOcorrencias().then(() => null, (e) => e);
    api.sessao.encerrarSessao();
    await api.perfil.entrar(perfilA.usuario, SENHA);
    const nova = api.sessao.obterSessao();
    assert.notEqual(nova.token, tokenAntigo);
    assert.equal(nova.id_perfil, idA); // mesma conta, sessão diferente
    const falha = await emVoo;
    assert.equal(falha?.status, 401);
    assert.match(falha.message, /Sessão alterada/);
    assert.equal(api.sessao.obterSessao(), nova);
  });

  test("persistência: relato sobrevive à reinicialização da API", async () => {
    const criada = await api.diario.criarOcorrencia({ data: "10/11/2026", descricao: "Deve persistir" });
    api.sessao.encerrarSessao();
    await servidor.parar();
    await levantar(servidor.porta); // mesmo arquivo de banco, processo novo
    await api.perfil.entrar(perfilA.usuario, SENHA);
    const lista = await api.diario.listarOcorrencias();
    assert.equal(lista.length, 1);
    assert.equal(lista[0].id_ocorrencia, criada.id_ocorrencia);
    assert.equal(lista[0].descricao_relato, "Deve persistir");
    assert.equal(lista[0].data_ocorrencia, "10/11/2026");
    await api.diario.excluirOcorrencia(criada.id_ocorrencia);
  });
});
