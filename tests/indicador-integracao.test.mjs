import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { openDatabase } from '../backend/src/database.js';
import { createApp } from '../backend/src/app.js';

test('Indicador: cliente compartilhado consulta resultado real e rejeita sessão encerrada', async () => {
  const db = openDatabase(':memory:');
  const server = createApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${server.address().port}`;
  const perfil = await import('../src/services/perfil.js');
  const sessao = await import('../src/services/sessao.js');
  const { consultarIndicadorSinan } = await import('../src/services/indicadores.js');
  try {
    await assert.rejects(consultarIndicadorSinan(), /Entre na sua conta/);
    await perfil.cadastrarPerfil({ usuario: 'teste.indicador', senha: 'Senha-apenas-teste-123!', nome: 'Fictício', telefone_emergencia: '00000000000', modo_disfarce: true, notificacoes: false, tema: 'Claro' });
    const dados = await consultarIndicadorSinan();
    assert.equal(dados.id, 'perfil_historico_notificacoes_sinan');
    assert.equal(dados.total_notificacoes, 2775742);
    assert.equal(dados.n_ufs, 27);
    assert.match(dados.aviso, /não substitui/);
    sessao.encerrarSessao();
    await assert.rejects(consultarIndicadorSinan(), /Entre na sua conta/);
  } finally {
    sessao.limparSessao();
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
});
