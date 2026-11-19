import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { openDatabase } from '../backend/src/database.js';
import { createApp } from '../backend/src/app.js';

// Teste do serviço de Ciclos com a API real (Express + SQLite em memória) e dados fictícios.
test('Ciclos: cadastro, consulta, edição, exclusão, isolamento entre contas e sessão encerrada', async () => {
  const db = openDatabase(':memory:');
  const server = createApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${server.address().port}`;
  const perfil = await import('../src/services/perfil.js');
  const sessao = await import('../src/services/sessao.js');
  const ciclos = await import('../src/services/ciclos.js');
  const datas = await import('../src/utils/datas.js');
  const senha = randomBytes(24).toString('hex');
  const base = { nome: 'Fictícia', telefone_emergencia: '00000000000', modo_disfarce: true, notificacoes: false, tema: 'Claro' };

  try {
    // Conversão de datas
    assert.equal(datas.dataApiParaTexto('2026-11-05'), '05/11/2026');
    assert.equal(datas.textoParaDataApi('05/11/2026'), '2026-11-05');

    // Sem sessão: 401 e nenhuma chamada de rede
    await assert.rejects(ciclos.listarCiclos(), e => e.status === 401);
    await assert.rejects(ciclos.criarCiclo({ data_inicio: '01/11/2026', data_fim: '05/11/2026', fluxo: 'Leve' }), e => e.status === 401);

    // Conta A
    await perfil.cadastrarPerfil({ ...base, usuario: 'ciclos.a', senha });
    assert.deepEqual(await ciclos.listarCiclos(), []);

    // Cadastro
    const criado = await ciclos.criarCiclo({ data_inicio: '01/11/2026', data_fim: '05/11/2026', fluxo: 'Moderado' });
    assert.equal(criado.data_inicio, '01/11/2026');
    assert.equal(criado.data_fim, '05/11/2026');
    assert.equal(criado.id_perfil, sessao.obterSessao().id_perfil);
    // O banco guarda AAAA-MM-DD
    assert.equal(db.prepare('SELECT data_inicio FROM ciclos WHERE id_ciclo = ?').get(criado.id_ciclo).data_inicio, '2026-11-01');

    // Consulta
    assert.equal((await ciclos.consultarCiclo(criado.id_ciclo)).fluxo, 'Moderado');
    assert.equal((await ciclos.listarCiclos()).length, 1);

    // Edição (preserva campos opcionais enviados)
    const editado = await ciclos.atualizarCiclo(criado.id_ciclo, { ...criado, data_fim: '06/11/2026', fluxo: 'Intenso', sintomas: 'Registro fictício' });
    assert.equal(editado.data_fim, '06/11/2026');
    assert.equal((await ciclos.consultarCiclo(criado.id_ciclo)).sintomas, 'Registro fictício');

    // Validação da API: fim antes do início -> 422
    await assert.rejects(ciclos.criarCiclo({ data_inicio: '10/11/2026', data_fim: '05/11/2026', fluxo: 'Leve' }), e => e.status === 422);
    await assert.rejects(ciclos.criarCiclo({ data_inicio: '31/02/2026', data_fim: '05/03/2026', fluxo: 'Leve' }), e => e.status === 422);
    assert.equal((await ciclos.listarCiclos()).length, 1, 'registros inválidos não são gravados');

    // Isolamento: conta B não vê nem altera o ciclo da conta A
    sessao.encerrarSessao();
    assert.equal(sessao.obterSessao(), null);
    await assert.rejects(ciclos.listarCiclos(), e => e.status === 401);
    await perfil.cadastrarPerfil({ ...base, usuario: 'ciclos.b', senha });
    assert.deepEqual(await ciclos.listarCiclos(), []);
    await assert.rejects(ciclos.consultarCiclo(criado.id_ciclo), e => e.status === 404);
    await assert.rejects(ciclos.atualizarCiclo(criado.id_ciclo, criado), e => e.status === 404);
    await assert.rejects(ciclos.excluirCiclo(criado.id_ciclo), e => e.status === 404);

    // Volta para A e exclui
    sessao.encerrarSessao();
    await perfil.entrar('ciclos.a', senha);
    assert.equal((await ciclos.listarCiclos()).length, 1);
    await ciclos.excluirCiclo(criado.id_ciclo);
    assert.deepEqual(await ciclos.listarCiclos(), []);
    await assert.rejects(ciclos.consultarCiclo(criado.id_ciclo), e => e.status === 404);

    // Sessão revogada no servidor: 401 e sessão local limpa
    db.prepare('DELETE FROM sessoes').run();
    await assert.rejects(ciclos.listarCiclos(), e => e.status === 401);
    assert.equal(sessao.obterSessao(), null);
  } finally {
    sessao.encerrarSessao();
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
});
