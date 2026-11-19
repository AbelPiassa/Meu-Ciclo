import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { openDatabase } from '../backend/src/database.js';
import { createApp } from '../backend/src/app.js';

// Corrida na troca de sessão: a resposta de uma requisição antiga não pode ser tratada como da sessão nova.
// O contexto usa exatamente esta comparação (token capturado antes do await x obterSessao() depois).
test('Ciclos: requisição em andamento durante logout e troca de conta não vaza para a nova sessão', async () => {
  const db = openDatabase(':memory:');
  const server = createApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${server.address().port}`;
  const perfil = await import('../src/services/perfil.js');
  const sessao = await import('../src/services/sessao.js');
  const ciclos = await import('../src/services/ciclos.js');
  const senha = randomBytes(24).toString('hex');
  const base = { nome: 'Fictícia', telefone_emergencia: '00000000000', modo_disfarce: true, notificacoes: false, tema: 'Claro' };

  try {
    await perfil.cadastrarPerfil({ ...base, usuario: 'corrida.a', senha });
    await ciclos.criarCiclo({ data_inicio: '01/11/2026', data_fim: '05/11/2026', fluxo: 'Leve' });
    const tokenA = sessao.obterSessao().token;

    // Listagem em andamento da conta A; logout e entrada na conta B antes de a resposta ser usada
    const pendente = ciclos.listarCiclos().then(
      (lista) => ({ lista }),
      (erro) => ({ erro })
    );
    sessao.encerrarSessao();
    assert.equal(sessao.obterSessao(), null, 'logout limpa a sessão na hora, sem esperar a rede');
    await perfil.cadastrarPerfil({ ...base, usuario: 'corrida.b', senha });
    const tokenB = sessao.obterSessao().token;
    assert.notEqual(tokenA, tokenB);

    const resultado = await pendente;
    // A resposta antiga pode ter chegado (200) ou falhado (401 pela revogação): nos dois casos
    // a sessão vigente continua sendo a de B e o token capturado (A) é diferente dela.
    assert.equal(sessao.obterSessao()?.token, tokenB, 'resposta antiga não derruba nem substitui a sessão nova');
    assert.notEqual(sessao.obterSessao()?.token, tokenA, 'o contexto descartaria esta resposta');
    if (resultado.erro) assert.equal(resultado.erro.status, 401);

    // A conta B continua sem ver nada da A
    assert.deepEqual(await ciclos.listarCiclos(), []);

    // Logout durante uma escrita: a sessão local é limpa na hora e nada fica pendurado
    const escrita = ciclos.criarCiclo({ data_inicio: '10/11/2026', data_fim: '12/11/2026', fluxo: 'Leve' }).then(
      (c) => ({ c }),
      (erro) => ({ erro })
    );
    sessao.encerrarSessao();
    assert.equal(sessao.obterSessao(), null);
    const fim = await escrita;
    assert.ok(fim.c || fim.erro, 'a escrita termina com sucesso ou erro, sem travar');
    assert.equal(sessao.obterSessao(), null, 'resposta tardia não recria a sessão');
  } finally {
    sessao.encerrarSessao();
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
});
