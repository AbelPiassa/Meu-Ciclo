import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { openDatabase } from '../backend/src/database.js';
import { createApp } from '../backend/src/app.js';

test('Cliente compartilhado: CRUD real, login, validação, 401 e saída imediata', async () => {
  const db = openDatabase(':memory:');
  const server = createApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${server.address().port}`;
  const api = await import('../src/services/perfil.js');
  const sessao = await import('../src/services/sessao.js');
  const { requisicao } = await import('../src/services/api.js');
  const senha = randomBytes(24).toString('hex');
  const dados = { nome: 'Fictício', telefone_emergencia: '00000000000', modo_disfarce: true, notificacoes: false, tema: 'Claro' };
  let eventos = 0;
  const parar = sessao.observarSessao(() => eventos++);
  try {
    const perfil = await api.cadastrarPerfil({ ...dados, usuario: 'teste.integracao', senha });
    assert.equal(sessao.obterSessao().id_perfil, perfil.id_perfil);
    assert.equal((await api.consultarPerfil()).nome, dados.nome);
    await assert.rejects(api.atualizarPerfil({ ...dados, telefone_emergencia: '1' }), e => e.status === 422);
    await api.atualizarPerfil({ ...dados, nome: 'Atualizado', notificacoes: true });
    assert.equal((await api.consultarPerfil()).nome, 'Atualizado');
    const anterior = sessao.obterSessao();
    sessao.encerrarSessao();
    assert.equal(sessao.obterSessao(), null);
    await api.entrar('teste.integracao', senha);
    assert.equal((await api.consultarPerfil()).notificacoes, true);
    sessao.limparSessao(anterior);
    assert.ok(sessao.obterSessao(), 'resposta antiga não limpa sessão nova');
    db.prepare('DELETE FROM sessoes').run();
    await assert.rejects(api.consultarPerfil(), e => e.status === 401);
    assert.equal(sessao.obterSessao(), null);
    await api.entrar('teste.integracao', senha);
    const token = sessao.obterSessao().token;
    await api.excluirPerfil();
    assert.equal(sessao.obterSessao(), null);
    assert.equal(db.prepare('SELECT count(*) AS n FROM perfis').get().n, 0);
    await assert.rejects(requisicao('/api/perfis', { token }), e => e.status === 401);
    await assert.rejects(api.entrar('teste.integracao', senha), e => e.status === 401);
    assert.ok(eventos >= 6);
    const versao = sessao.obterVersaoSessao();
    sessao.encerrarSessao();
    assert.throws(() => sessao.guardarSessao({ token: randomBytes(32).toString('hex'), id_perfil: 1 }, versao), /cancelada/);
    assert.equal(sessao.obterSessao(), null);
  } finally {
    parar();
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
});
