import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../src/database.js';
import { createApp } from '../src/app.js';

test('SOS: conta fictícia autenticada, painel separado, localização, status e isolamento', async t => {
  const db = openDatabase(':memory:');
  const key = randomBytes(32).toString('hex');
  const server = createApp(db, { painelToken: key }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); db.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  async function req(method, path, body, token) {
    const r = await fetch(base+path, {method, headers:{...(token?{Authorization:'Bearer '+token}:{}), ...(body?{'Content-Type':'application/json'}:{})}, ...(body?{body:JSON.stringify(body)}:{})});
    return {status:r.status, body:await r.json(), headers:r.headers};
  }
  async function registrar(usuario) {
    const r = await req('POST','/api/perfis',{ usuario, senha:'Senha-apenas-teste-123!', nome:'Fictício', telefone_emergencia:'00000000000', modo_disfarce:true, notificacoes:false, tema:'Claro' });
    assert.equal(r.status,201); return r.body.token;
  }
  const token=await registrar('teste.sos'); const outro=await registrar('perfil.ficticio');
  const dados={latitude:-23.31,longitude:-51.16,origem:'simulada'};
  assert.equal((await req('POST','/api/sos',dados)).status,401);
  assert.equal((await req('POST','/api/sos',dados,outro)).status,403);
  assert.equal((await req('POST','/api/sos',{...dados,latitude:999},token)).status,422);
  assert.equal((await req('POST','/api/sos',{...dados,id_perfil:2},token)).status,422);
  const criado=await req('POST','/api/sos',dados,token); assert.equal(criado.status,201);
  assert.equal((await req('GET','/painel/api/alertas',undefined,token)).status,401);
  assert.equal((await req('GET','/painel/api/alertas')).status,401);
  const lista=await req('GET','/painel/api/alertas',undefined,key);
  assert.equal(lista.status,200); assert.equal(lista.headers.get('cache-control'),'no-store'); assert.equal(lista.body.length,1);
  assert.equal(lista.body[0].conta_teste,'teste.sos'); assert.equal(lista.body[0].latitude,dados.latitude); assert.equal(lista.body[0].status,'Novo');
  assert.ok(Number.isFinite(Date.parse(lista.body[0].criado_em)));
  const url='/painel/api/alertas/'+criado.body.id_alerta;
  assert.equal((await req('PUT',url,{status:'Concluído'},token)).status,401);
  assert.equal((await req('PUT',url,{status:'invalido'},key)).status,422);
  assert.equal((await req('PUT',url,{status:'Em atendimento'},key)).status,200);
  assert.equal((await req('PUT',url,{status:'Concluído'},key)).status,200);
  assert.equal((await req('GET','/painel/api/alertas',undefined,key)).body[0].status,'Concluído');
  assert.equal((await fetch(base+'/painel')).status,200);
  assert.equal((await fetch(base+'/painel/painel.js')).status,200);
});

test('Migração v1 para v2 preserva perfil e cria tabela SOS', () => {
  const dir=mkdtempSync(join(tmpdir(),'meu-ciclo-sos-')); const path=join(dir,'v1.sqlite');
  try {
    const anterior=new DatabaseSync(path);
    anterior.exec(readFileSync(new URL('../src/schema.sql', import.meta.url),'utf8'));
    anterior.prepare('INSERT INTO perfis (usuario,senha_hash,nome,telefone_emergencia,modo_disfarce,notificacoes,tema) VALUES (?,?,?,?,?,?,?)').run('teste.migracao','hash-ficticio','Fictício','00000000000',1,0,'Claro'); anterior.close();
    const db=openDatabase(path);
    try { assert.equal(db.prepare('PRAGMA user_version').get().user_version,2); assert.equal(db.prepare('SELECT usuario FROM perfis').get().usuario,'teste.migracao'); assert.equal(db.prepare('SELECT count(*) AS n FROM alertas_sos').get().n,0); }
    finally { db.close(); }
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
