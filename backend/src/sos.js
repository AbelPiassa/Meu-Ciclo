import { timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const tokenValido = (/** @type {string} */ t) => /^[a-f0-9]{64}$/.test(t);
const estados = ['Novo', 'Em atendimento', 'Concluído'];
/** @param {import('express').Response} res @param {number} status @param {string} mensagem */
function falha(res, status, mensagem) {
  return res.status(status).json({ erro: { codigo: 'SOS_DEMO', mensagem } });
}
/** @param {import('express').Application} app @param {import('node:sqlite').DatabaseSync} db @param {string} painelToken */
export function instalarPainel(app, db, painelToken) {
  app.get('/painel', (_req, res) => res.sendFile(fileURLToPath(new URL('../painel/index.html', import.meta.url))));
  app.get('/painel/painel.js', (_req, res) => res.sendFile(fileURLToPath(new URL('../painel/painel.js', import.meta.url))));
  app.get('/painel/painel.css', (_req, res) => res.sendFile(fileURLToPath(new URL('../painel/painel.css', import.meta.url))));
  app.use('/painel/api', (req, res, next) => {
    if (!tokenValido(painelToken)) return falha(res, 503, 'Painel de demonstração desabilitado.');
    const t = /^Bearer ([a-f0-9]{64})$/.exec(req.get('Authorization') ?? '')?.[1];
    if (!t || !timingSafeEqual(Buffer.from(t, 'hex'), Buffer.from(painelToken, 'hex'))) {
      return falha(res, 401, 'Chave de operador inválida.');
    }
    next();
  });
  app.get('/painel/api/alertas', (_req, res) => {
    res.json(db.prepare(`SELECT a.id_alerta, p.usuario AS conta_teste, a.criado_em,
      a.latitude, a.longitude, a.origem, a.status FROM alertas_sos a
      JOIN perfis p ON p.id_perfil = a.id_perfil ORDER BY a.id_alerta DESC`).all());
  });
  app.put('/painel/api/alertas/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!/^\d+$/.test(String(req.params.id)) || !Number.isSafeInteger(id) || id < 1 ||
        !req.body || Object.keys(req.body).length !== 1 || !estados.includes(req.body.status)) {
      return falha(res, 422, 'Revise o ID e o status.');
    }
    const alterado = db.prepare('UPDATE alertas_sos SET status = ? WHERE id_alerta = ?').run(req.body.status, id);
    if (!alterado.changes) return falha(res, 404, 'Alerta não encontrado.');
    return res.json({ id_alerta: id, status: req.body.status });
  });
}
/** @param {import('express').Application} app @param {import('node:sqlite').DatabaseSync} db @param {string} painelToken */
export function instalarSos(app, db, painelToken) {
  // Registrado depois do middleware de sessão do aplicativo.
  app.post('/api/sos', (req, res) => {
    if (!tokenValido(painelToken)) return falha(res, 503, 'SOS de demonstração desabilitado.');
    const id = Number(res.locals.perfilId);
    const perfil = db.prepare('SELECT usuario FROM perfis WHERE id_perfil = ?').get(id);
    if (!perfil || !String(perfil.usuario).startsWith('teste.')) {
      return falha(res, 403, 'Use uma conta fictícia com usuário iniciado por teste.');
    }
    const { latitude, longitude, origem } = req.body ?? {};
    if (!req.body || Object.keys(req.body).length !== 3 ||
        typeof latitude !== 'number' || !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        typeof longitude !== 'number' || !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
        !['simulada', 'dispositivo_teste'].includes(origem)) {
      return falha(res, 422, 'Coordenadas ou origem inválidas.');
    }
    const criado_em = new Date().toISOString();
    const r = db.prepare(`INSERT INTO alertas_sos (id_perfil, criado_em, latitude, longitude, origem)
      VALUES (?, ?, ?, ?, ?)`).run(id, criado_em, latitude, longitude, origem);
    return res.status(201).json({ id_alerta: Number(r.lastInsertRowid), criado_em, status: 'Novo' });
  });
}
