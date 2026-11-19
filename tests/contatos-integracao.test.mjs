// API Express e SQLite reais, em arquivo temporário isolado; somente dados fictícios.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { openDatabase } from '../backend/src/database.js';
import { createApp } from '../backend/src/app.js';

test('Rede de Apoio: CRUD, sessão única, isolamento, persistência e 401', async () => {
  const pasta = await mkdtemp(join(tmpdir(), 'meuciclo-contatos-'));
  const arquivo = join(pasta, 'teste.sqlite');
  let db = openDatabase(arquivo);
  let servidor = createApp(db).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const porta = servidor.address().port;
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${porta}`;
  const perfil = await import('../src/services/perfil.js');
  const sessao = await import('../src/services/sessao.js');
  const contatos = await import('../src/servicos/contatosApi.js');
  const senha = randomBytes(24).toString('hex');
  const base = { nome: 'Perfil fictício', telefone_emergencia: '11999990000', senha };
  const contato = { nome: 'Contato fictício', telefone: '(11) 99999-0001', relacionamento: 'Teste', alerta_automatico: false, observacoes: 'Fictício' };
  async function parar() {
    await new Promise((resolve, reject) => servidor.close(e => e ? reject(e) : resolve()));
    db.close();
  }
  // Somente no teste Node: evita reaproveitar sockets HTTP de um servidor
  // encerrado e reiniciado na mesma porta. Não altera o cliente do aplicativo.
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = (url, opcoes = {}) => {
    const headers = new Headers(opcoes.headers);
    headers.set('Connection', 'close');
    return fetchOriginal(url, { ...opcoes, headers });
  };
  try {
    await assert.rejects(contatos.listarContatos(), e => e.status === 401);
    const a = await perfil.cadastrarPerfil({ ...base, usuario: 'contato.a' });
    assert.deepEqual(await contatos.listarContatos(), []);
    const criado = await contatos.criarContato(contato);
    assert.equal(criado.id_perfil, a.id_perfil);
    assert.equal(criado.telefone, '11999990001');
    assert.equal((await contatos.buscarContato(criado.id_contato)).nome, contato.nome);
    await contatos.atualizarContato(criado.id_contato, { ...contato, nome: 'Alterado fictício' });
    assert.equal((await contatos.listarContatos())[0].nome, 'Alterado fictício');
    await assert.rejects(contatos.criarContato({ ...contato, nome: '' }), e => e.status === 422);
    sessao.encerrarSessao();
    assert.equal(sessao.obterSessao(), null);
    await perfil.cadastrarPerfil({ ...base, usuario: 'contato.b' });
    assert.deepEqual(await contatos.listarContatos(), []);
    await assert.rejects(contatos.buscarContato(criado.id_contato), e => e.status === 404);
    await assert.rejects(contatos.atualizarContato(criado.id_contato, contato), e => e.status === 404);
    await assert.rejects(contatos.excluirContato(criado.id_contato), e => e.status === 404);
    sessao.limparSessao();
    await parar();
    db = openDatabase(arquivo);
    servidor = createApp(db).listen(porta, '127.0.0.1');
    await once(servidor, 'listening');
    await perfil.entrar('contato.a', senha);
    assert.equal((await contatos.listarContatos())[0].nome, 'Alterado fictício');
    assert.equal(await contatos.excluirContato(criado.id_contato), null);
    assert.deepEqual(await contatos.listarContatos(), []);
    db.prepare('DELETE FROM sessoes').run();
    await assert.rejects(contatos.listarContatos(), e => e.status === 401);
    assert.equal(sessao.obterSessao(), null);
  } finally {
    sessao.limparSessao();
    globalThis.fetch = fetchOriginal;
    try { await parar(); } finally { await rm(pasta, { recursive: true, force: true }); }
  }
});
