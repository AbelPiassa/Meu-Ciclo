// Testa o cliente real contra um servidor HTTP simulado, sem usar o banco do Abel.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { test, before, after } from 'node:test';

const pasta = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = 'a'.repeat(64);
const perfil = 7;
let lista = [];
let proximoId = 1;
let requisicoes = [];
let api;

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let texto = '';
  for await (const pedaco of req) texto += pedaco;
  const dados = texto ? JSON.parse(texto) : undefined;
  requisicoes.push({ metodo: req.method, url: url.pathname, autorizacao: req.headers.authorization, dados });
  res.setHeader('Content-Type', 'application/json');
  function responder(codigo, corpo) { res.writeHead(codigo); res.end(corpo === undefined ? '' : JSON.stringify(corpo)); }

  if (req.headers.authorization !== `Bearer ${TOKEN}`) return responder(401, { erro: { mensagem: 'Sessão necessária.' } });
  if (url.pathname === '/api/contatos' && req.method === 'GET') return responder(200, lista);
  if (url.pathname === '/api/contatos' && req.method === 'POST') {
    if (dados.id_perfil !== perfil) return responder(422, { erro: { mensagem: 'Perfil incorreto.' } });
    if (!dados.nome) return responder(422, { erro: { mensagem: 'Revise os campos.', campos: [{ campo: 'nome', mensagem: 'Obrigatório.' }] } });
    const item = { ...dados, id_contato: proximoId++ };
    lista.unshift(item);
    return responder(201, item);
  }
  const match = /^\/api\/contatos\/(\d+)$/.exec(url.pathname);
  if (!match) return responder(404, { erro: { mensagem: 'Rota inexistente.' } });
  const id = Number(match[1]);
  const i = lista.findIndex(item => item.id_contato === id);
  if (i < 0) return responder(404, { erro: { mensagem: 'Registro não encontrado.' } });
  if (req.method === 'GET') return responder(200, lista[i]);
  if (req.method === 'PUT') {
    if (dados.id_perfil !== perfil) return responder(422, { erro: { mensagem: 'Perfil incorreto.' } });
    lista[i] = { ...dados, id_contato: id };
    return responder(200, lista[i]);
  }
  if (req.method === 'DELETE') { lista.splice(i, 1); return responder(204); }
  return responder(404, { erro: { mensagem: 'Rota não encontrada.' } });
});

before(async () => {
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${servidor.address().port}/api`;
  const arquivo = await readFile(path.join(pasta, '..', 'src', 'servicos', 'contatosApi.js'), 'utf8');
  api = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(arquivo)}`);
});
after(async () => {
  await new Promise((resolve, reject) => servidor.close(err => err ? reject(err) : resolve()));
});

const contato = {
  nome: 'Ana Teste', telefone: '(11) 99999-9999', relacionamento: 'Amiga',
  alerta_automatico: false, observacoes: '',
};

test('Sem login, não faz nenhuma requisição para listar', async () => {
  await assert.rejects(api.listarContatos(), /Faça login/);
  assert.equal(requisicoes.length, 0);
});
test('Não aceita token ou id_perfil incorretos', () => {
  assert.throws(() => api.configurarSessaoRedeApoio({ token: '123', id_perfil: perfil }), /Token/);
  assert.throws(() => api.configurarSessaoRedeApoio({ token: TOKEN, id_perfil: 0 }), /Perfil/);
});
test('GET lista contatos autenticados com Bearer', async () => {
  api.configurarSessaoRedeApoio({ token: TOKEN, id_perfil: perfil });
  assert.deepEqual(await api.listarContatos(), []);
  assert.equal(requisicoes.at(-1).autorizacao, `Bearer ${TOKEN}`);
  assert.equal(requisicoes.at(-1).url, '/api/contatos');
});
test('POST cadastra contato com id_perfil da sessão, não fixo', async () => {
  const criado = await api.criarContato(contato);
  assert.equal(criado.id_contato, 1);
  assert.equal(criado.id_perfil, perfil);
  assert.equal((await api.listarContatos()).length, 1);
  assert.equal(requisicoes.at(-2).dados.id_perfil, perfil);
});
test('GET /contatos/:id recupera registro', async () => {
  assert.equal((await api.buscarContato(1)).nome, 'Ana Teste');
});
test('PUT envia corpo completo sem id_contato e atualiza', async () => {
  const atualizado = await api.atualizarContato(1, { ...contato, nome: 'Ana Atualizada' });
  assert.equal(atualizado.nome, 'Ana Atualizada');
  assert.equal(atualizado.id_contato, 1);
  assert.equal('id_contato' in requisicoes.at(-1).dados, false);
});
test('DELETE lida com 204 sem tentar ler JSON', async () => {
  assert.equal(await api.excluirContato(1), null);
  assert.deepEqual(await api.listarContatos(), []);
});
test('IDs inválidos são bloqueados antes do fetch', async () => {
  const antes = requisicoes.length;
  assert.throws(() => api.buscarContato('abc'), /ID de contato/);
  assert.throws(() => api.excluirContato('1/../../x'), /ID de contato/);
  assert.equal(requisicoes.length, antes);
});
test('422 mostra mensagem e campo; não informa sucesso', async () => {
  await assert.rejects(api.criarContato({ ...contato, nome: '' }), /nome: Obrigatório/);
});
test('401 expira a sessão e exige novo login', async () => {
  api.configurarSessaoRedeApoio({ token: 'b'.repeat(64), id_perfil: perfil });
  await assert.rejects(api.listarContatos(), /Sessão expirada/);
  const antes = requisicoes.length;
  await assert.rejects(api.listarContatos(), /Faça login/);
  assert.equal(requisicoes.length, antes);
});
test('Logout local apaga token da memória', async () => {
  api.configurarSessaoRedeApoio({ token: TOKEN, id_perfil: perfil });
  api.limparSessaoRedeApoio();
  await assert.rejects(api.listarContatos(), /Faça login/);
});
