import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { openDatabase } from '../src/database.js';
import { createApp } from '../src/app.js';

async function fixture(t, path = ':memory:') {
  const db = openDatabase(path);
  const server = createApp(db, { corsOrigins: ['http://localhost:8081'] }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let closed = false;
  async function close() {
    if (closed) return;
    closed = true;
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    db.close();
  }
  t.after(close);
  async function request(method, path, body, token) {
    const res = await fetch(base + path, { method, headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: res.status, headers: res.headers, body: res.status === 204 ? null : await res.json() };
  }
  return { db, close, request, base };
}
const profile = { nome: 'Perfil fictício', telefone_emergencia: '00000000000', modo_disfarce: true, notificacoes: false, tema: 'Claro' };
const senha = 'Senha-apenas-teste-123!';
async function register(f, usuario = 'perfil.teste') {
  const res = await f.request('POST', '/api/perfis', { ...profile, usuario, senha });
  assert.equal(res.status, 201);
  return res.body;
}
function samples(id_perfil) {
  return {
    ciclos: { id_perfil, data_inicio: '2026-11-01', data_fim: '2026-11-05', fluxo: 'Moderado', observacoes: 'Fictício' },
    contatos: { id_perfil, nome: 'Contato fictício', telefone: '(00) 00000-0000', relacionamento: 'Teste', observacoes: 'Não ligar' },
    ocorrencias: { id_perfil, data_ocorrencia: '2026-11-01', tipo_ocorrencia: 'Teste', descricao_relato: 'Relato inteiramente fictício.' },
  };
}
const ids = { ciclos: 'id_ciclo', contatos: 'id_contato', ocorrencias: 'id_ocorrencia' };

test('Perfil: POST, GET coleção/ID, PUT e DELETE; senha nunca é retornada', async t => {
  const f = await fixture(t);
  const { perfil, token } = await register(f);
  assert.equal(perfil.usuario, 'perfil.teste');
  assert.equal('senha_hash' in perfil, false);
  const all = await f.request('GET', '/api/perfis', undefined, token);
  assert.equal(all.status, 200); assert.equal(all.body.length, 1);
  const one = await f.request('GET', `/api/perfis/${perfil.id_perfil}`, undefined, token);
  assert.equal(one.status, 200); assert.equal(one.body.modo_disfarce, true);
  const updated = await f.request('PUT', `/api/perfis/${perfil.id_perfil}`, { ...profile, nome: 'Nome atualizado', notificacoes: true }, token);
  assert.equal(updated.status, 200); assert.equal(updated.body.nome, 'Nome atualizado'); assert.equal(updated.body.notificacoes, true);
  assert.equal((await f.request('DELETE', `/api/perfis/${perfil.id_perfil}`, undefined, token)).status, 204);
  assert.equal((await f.request('GET', '/api/perfis', undefined, token)).status, 401);
});

for (const resource of Object.keys(ids)) {
  test(`${resource}: cinco operações persistem no banco e tratam registro ausente`, async t => {
    const f = await fixture(t);
    const { perfil, token } = await register(f);
    const data = samples(perfil.id_perfil)[resource];
    const created = await f.request('POST', `/api/${resource}`, data, token);
    assert.equal(created.status, 201);
    const id = created.body[ids[resource]];
    const get = await f.request('GET', `/api/${resource}/${id}`, undefined, token);
    assert.equal(get.status, 200); assert.equal(get.body.id_perfil, perfil.id_perfil);
    assert.equal((await f.request('GET', `/api/${resource}`, undefined, token)).body.length, 1);
    const edit = resource === 'ocorrencias' ? { descricao_relato: "Fictício '); DROP TABLE perfis; --" } : { observacoes: 'Alterado' };
    const changed = await f.request('PUT', `/api/${resource}/${id}`, { ...data, ...edit }, token);
    assert.equal(changed.status, 200);
    for (const [key, value] of Object.entries(edit)) assert.equal(changed.body[key], value);
    assert.equal(Number(f.db.prepare(`SELECT count(*) AS n FROM ${resource}`).get().n), 1);
    assert.equal((await f.request('DELETE', `/api/${resource}/${id}`, undefined, token)).status, 204);
    assert.equal((await f.request('GET', `/api/${resource}/${id}`, undefined, token)).status, 404);
    assert.equal((await f.request('PUT', `/api/${resource}/${id}`, data, token)).status, 404);
    assert.equal((await f.request('DELETE', `/api/${resource}/${id}`, undefined, token)).status, 404);
    assert.deepEqual((await f.request('GET', `/api/${resource}`, undefined, token)).body, []);
  });
}

test('Isolamento entre perfis em todos os recursos e relacionamento validado', async t => {
  const f = await fixture(t);
  const a = await register(f, 'teste.a'); const b = await register(f, 'teste.b');
  for (const [resource, data] of Object.entries(samples(a.perfil.id_perfil))) {
    const created = await f.request('POST', `/api/${resource}`, data, a.token);
    const url = `/api/${resource}/${created.body[ids[resource]]}`;
    for (const method of ['GET', 'PUT', 'DELETE']) assert.equal((await f.request(method, url, method === 'PUT' ? data : undefined, b.token)).status, 404);
    assert.deepEqual((await f.request('GET', `/api/${resource}`, undefined, b.token)).body, []);
    assert.equal((await f.request('POST', `/api/${resource}`, data, b.token)).status, 422);
    assert.equal((await f.request('POST', `/api/${resource}`, { ...data, id_perfil: 99999 }, a.token)).status, 422);
    assert.equal((await f.request('PUT', url, { ...data, id_perfil: b.perfil.id_perfil }, a.token)).status, 422);
  }
  for (const method of ['GET', 'PUT', 'DELETE']) assert.equal((await f.request(method, `/api/perfis/${a.perfil.id_perfil}`, method === 'PUT' ? profile : undefined, b.token)).status, 404);
  assert.equal((await f.request('GET', '/api/perfis', undefined, b.token)).body.length, 1);
  assert.throws(() => f.db.prepare('INSERT INTO contatos (id_perfil,nome,telefone,relacionamento,alerta_automatico,observacoes) VALUES (99999,?,?,?,?,?)').run('Fictício','00000000000','Teste',0,''), /FOREIGN KEY/);
});

test('Validações: datas impossíveis, intervalo, telefone, campos extras, JSON e IDs', async t => {
  const f = await fixture(t); const { perfil, token } = await register(f);
  const data = samples(perfil.id_perfil);
  for (const [resource, body] of [
    ['ciclos', { ...data.ciclos, data_fim: '2026-02-30' }],
    ['ciclos', { ...data.ciclos, data_fim: '2026-10-01' }],
    ['contatos', { ...data.contatos, telefone: '1' }],
    ['contatos', { ...data.contatos, administrador: true }],
    ['ocorrencias', { ...data.ocorrencias, data_ocorrencia: '31/02/2026' }],
    ['ocorrencias', { ...data.ocorrencias, descricao_relato: ' ' }],
  ]) assert.equal((await f.request('POST', `/api/${resource}`, body, token)).status, 422);
  assert.equal((await f.request('GET', '/api/ciclos/abc', undefined, token)).status, 422);
  assert.equal((await f.request('GET', '/api/ciclos')).status, 401);
  assert.equal((await f.request('GET', '/api/ciclos?id_perfil=99999', undefined, token)).status, 404);
  const bad = await fetch(f.base + '/api/ciclos', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: '{' });
  assert.equal(bad.status, 400); assert.equal('stack' in await bad.json(), false);
  const tooLarge = await f.request('POST', '/api/ocorrencias', { ...data.ocorrencias, descricao_relato: 'x'.repeat(40000) }, token);
  assert.equal(tooLarge.status, 413);
});

test('Login, conflito de usuário, expiração e revogação de sessão', async t => {
  const f = await fixture(t); const a = await register(f);
  const row = f.db.prepare('SELECT senha_hash FROM perfis').get();
  assert.notEqual(row.senha_hash, senha); assert.equal(String(row.senha_hash).includes(senha), false);
  const collision = await f.request('POST', '/api/perfis', { ...profile, usuario: 'perfil.teste', senha });
  assert.equal(collision.status, 409);
  const invalid = await f.request('POST', '/api/sessoes', { usuario: 'perfil.teste', senha: 'Incorreta-apenas-teste' });
  assert.equal(invalid.status, 401);
  const login = await f.request('POST', '/api/sessoes', { usuario: 'perfil.teste', senha });
  assert.equal(login.status, 200);
  assert.equal((await f.request('DELETE', '/api/sessoes/atual', undefined, login.body.token)).status, 204);
  assert.equal((await f.request('GET', '/api/perfis', undefined, login.body.token)).status, 401);
  f.db.prepare('UPDATE sessoes SET expira_em = 0').run();
  assert.equal((await f.request('GET', '/api/perfis', undefined, a.token)).status, 401);
});

test('Banco em arquivo: reabrir mantém os quatro recursos; excluir Perfil remove filhos e sessões', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'meu-ciclo-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'teste.sqlite');
  const f = await fixture(t, path); const a = await register(f);
  for (const [resource, data] of Object.entries(samples(a.perfil.id_perfil))) assert.equal((await f.request('POST', `/api/${resource}`, data, a.token)).status, 201);
  await f.close();
  const next = await fixture(t, path);
  for (const resource of ['perfis', 'ciclos', 'contatos', 'ocorrencias']) {
    const res = await next.request('GET', `/api/${resource}`, undefined, a.token);
    assert.equal(res.status, 200); assert.equal(res.body.length, 1);
  }
  assert.equal((await next.request('DELETE', `/api/perfis/${a.perfil.id_perfil}`, undefined, a.token)).status, 204);
  for (const table of ['perfis', 'ciclos', 'contatos', 'ocorrencias', 'sessoes']) assert.equal(Number(next.db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n), 0);
  await next.close();
});

test('Respostas sem cache e CORS restrito à origem configurada', async t => {
  const f = await fixture(t);
  const allowed = await fetch(f.base + '/health', { headers: { Origin: 'http://localhost:8081' } });
  assert.equal(allowed.status, 200); assert.equal(allowed.headers.get('cache-control'), 'no-store');
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:8081');
  const other = await fetch(f.base + '/health', { headers: { Origin: 'https://example.invalid' } });
  assert.equal(other.headers.get('access-control-allow-origin'), null);
});
