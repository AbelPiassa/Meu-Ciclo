// Roteiro E2E do Diário de Ocorrências contra a API real. Somente dados fictícios.
const B = 'http://127.0.0.1:3199/api';
const res = []; let n = 0;
const chk = (nome, ok, det = '') => { n++; res.push({ n, nome, ok: !!ok, det }); console.log(`${ok ? 'PASS' : 'FAIL'} ${String(n).padStart(2,'0')} ${nome}${det ? ' — ' + det : ''}`); };
const call = async (m, p, body, tok) => {
  const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch {}
  return { s: r.status, j, h: r.headers };
};
const cad = async (u) => (await call('POST', '/perfis', { usuario: u, senha: 'Apenas-demonstracao-123!', nome: 'Perfil fictício', telefone_emergencia: '00000000000' })).j;
const login = async (u) => (await call('POST', '/sessoes', { usuario: u, senha: 'Apenas-demonstracao-123!' })).j;
const oc = (id, o = {}) => ({ id_perfil: id, data_ocorrencia: '2026-11-01', tipo_ocorrencia: 'Teste acadêmico', descricao_relato: 'Relato inteiramente fictício.', como_se_sentiu: '', nivel_perigo: 'Não informado', acionou_policia: false, ...o });

const A = await cad('teste.alb.a'), Bc = await cad('teste.alb.b');
let tA = A.token, tB = Bc.token; const idA = A.perfil.id_perfil, idB = Bc.perfil.id_perfil;
// CREATE
let r = await call('POST', '/ocorrencias', oc(idA), tA);
chk('POST cria ocorrência (201 + id_ocorrencia + Location)', r.s === 201 && r.j.id_ocorrencia && r.h.get('location'), `status ${r.s}`);
const o1 = r.j.id_ocorrencia;
r = await call('POST', '/ocorrencias', oc(idA, { tipo_ocorrencia: 'Segundo teste', nivel_perigo: 'Alto', acionou_policia: true, como_se_sentiu: 'Teste' }), tA);
chk('POST segunda ocorrência com campos opcionais', r.s === 201 && r.j.nivel_perigo === 'Alto' && r.j.acionou_policia === true);
const o2 = r.j.id_ocorrencia;
// LIST
r = await call('GET', '/ocorrencias', null, tA);
chk('GET lista (2 itens, mais novo primeiro)', r.s === 200 && r.j.length === 2 && r.j[0].id_ocorrencia === o2, `ids ${r.j.map(x=>x.id_ocorrencia)}`);
r = await call('GET', `/ocorrencias/${o1}`, null, tA);
chk('GET por ID', r.s === 200 && r.j.id_ocorrencia === o1 && r.j.data_ocorrencia === '2026-11-01');
// UPDATE
r = await call('PUT', `/ocorrencias/${o1}`, oc(idA, { tipo_ocorrencia: 'Editado', nivel_perigo: 'Médio', descricao_relato: 'Relato fictício editado.' }), tA);
chk('PUT edita (200) e devolve valores novos', r.s === 200 && r.j.tipo_ocorrencia === 'Editado' && r.j.nivel_perigo === 'Médio');
r = await call('GET', `/ocorrencias/${o1}`, null, tA);
chk('Edição persistida (GET após PUT)', r.j.tipo_ocorrencia === 'Editado' && r.j.descricao_relato === 'Relato fictício editado.');
// VALIDATIONS
const inval = [
  ['data inexistente 2026-02-30', oc(idA, { data_ocorrencia: '2026-02-30' })],
  ['data 29/02 em ano não bissexto', oc(idA, { data_ocorrencia: '2027-02-29' })],
  ['data malformada', oc(idA, { data_ocorrencia: '01/11/2026' })],
  ['tipo vazio', oc(idA, { tipo_ocorrencia: '   ' })],
  ['tipo > 100', oc(idA, { tipo_ocorrencia: 'x'.repeat(101) })],
  ['descrição vazia', oc(idA, { descricao_relato: '' })],
  ['descrição > 5000', oc(idA, { descricao_relato: 'x'.repeat(5001) })],
  ['como_se_sentiu > 200', oc(idA, { como_se_sentiu: 'x'.repeat(201) })],
  ['nível de perigo inválido', oc(idA, { nivel_perigo: 'Crítico' })],
  ['campo extra', { ...oc(idA), campo_extra: 1 }],
  ['id_perfil de outra conta', oc(idB)],
  ['acionou_policia não booleano', oc(idA, { acionou_policia: 'sim' })],
];
for (const [nome, body] of inval) { r = await call('POST', '/ocorrencias', body, tA); chk(`Validação rejeita: ${nome}`, r.s === 422, `status ${r.s}`); }
r = await call('POST', '/ocorrencias', oc(idA, { descricao_relato: 'x'.repeat(5000), tipo_ocorrencia: 'y'.repeat(100) }), tA);
chk('Limites exatos (5000/100) são aceitos', r.s === 201); const o3 = r.j?.id_ocorrencia;
r = await call('POST', '/ocorrencias', oc(idA, { data_ocorrencia: '2024-02-29' }), tA);
chk('29/02/2024 (bissexto) aceito', r.s === 201); const o4 = r.j?.id_ocorrencia;
r = await call('PUT', `/ocorrencias/${o1}`, oc(idA, { data_ocorrencia: '2026-13-01' }), tA);
chk('PUT com dado inválido → 422 e registro intacto', r.s === 422 && (await call('GET', `/ocorrencias/${o1}`, null, tA)).j.tipo_ocorrencia === 'Editado');
// AUTH / SESSION
r = await call('GET', '/ocorrencias'); chk('Sem token → 401', r.s === 401);
r = await call('GET', '/ocorrencias', null, 'token-invalido'); chk('Token inválido → 401', r.s === 401);
// ISOLATION
r = await call('POST', '/ocorrencias', oc(idB, { tipo_ocorrencia: 'Da conta B' }), tB); const ob = r.j.id_ocorrencia;
r = await call('GET', '/ocorrencias', null, tB);
chk('Conta B lista só os próprios registros', r.s === 200 && r.j.length === 1 && r.j[0].id_ocorrencia === ob);
r = await call('GET', `/ocorrencias/${o1}`, null, tB); chk('B não lê registro da A (404)', r.s === 404);
r = await call('PUT', `/ocorrencias/${o1}`, oc(idB), tB); chk('B não edita registro da A (404 ou 422)', [404, 422].includes(r.s), `status ${r.s}`);
r = await call('DELETE', `/ocorrencias/${o1}`, null, tB); chk('B não exclui registro da A (404)', r.s === 404);
r = await call('GET', `/ocorrencias?id_perfil=${idA}`, null, tB); chk('Filtro ?id_perfil de outra conta é recusado', r.s !== 200 || r.j.length === 0, `status ${r.s}`);
r = await call('GET', `/ocorrencias/${o1}`, null, tA); chk('Registro da A continua intacto após tentativas da B', r.s === 200 && r.j.tipo_ocorrencia === 'Editado');
// LOGOUT / LOGIN PERSISTENCE
r = await call('DELETE', '/sessoes/atual', null, tA); chk('Logout (DELETE /sessoes/atual) → 204', r.s === 204);
r = await call('GET', '/ocorrencias', null, tA); chk('Token antigo recusado após logout (401)', r.s === 401);
const L = await login('teste.alb.a'); tA = L.token;
chk('Novo login devolve novo token e mesmo id_perfil', L.id_perfil === idA && tA !== A.token);
r = await call('GET', '/ocorrencias', null, tA);
chk('Dados persistem após logout/login', r.s === 200 && r.j.some(x => x.id_ocorrencia === o1 && x.tipo_ocorrencia === 'Editado') && r.j.length === 4, `${r.j.length} registros`);
// DELETE
r = await call('DELETE', `/ocorrencias/${o2}`, null, tA); chk('DELETE → 204 sem corpo', r.s === 204);
r = await call('GET', `/ocorrencias/${o2}`, null, tA); chk('Registro excluído → 404', r.s === 404);
r = await call('DELETE', `/ocorrencias/${o2}`, null, tA); chk('Excluir de novo → 404', r.s === 404);
r = await call('GET', '/ocorrencias', null, tA); chk('Lista reflete a exclusão', r.j.length === 3 && !r.j.some(x => x.id_ocorrencia === o2));
r = await call('GET', '/ocorrencias', null, tB); chk('Exclusão na A não afeta a B', r.j.length === 1);
// Cache headers
r = await call('GET', '/ocorrencias', null, tA); chk('Resposta sem cache (Cache-Control)', /no-store|no-cache/i.test(r.h.get('cache-control') || ''), r.h.get('cache-control'));
console.log(JSON.stringify({ total: n, falhas: res.filter(x => !x.ok).length, ids: { o1, o3, o4, ob, idA, idB } }));
import fs from 'node:fs'; fs.writeFileSync('./resultado_e2e.json', JSON.stringify(res, null, 1));
