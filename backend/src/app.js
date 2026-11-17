import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { ZodError } from 'zod';
import { createProfileSchema, profileSchema, credentialsSchema, idSchema, resources } from './validation.js';
import { hashPassword, checkPassword, tokenHash, createSession } from './auth.js';

const profileColumns = 'id_perfil,usuario,nome,telefone_emergencia,modo_disfarce,notificacoes,tema';
/** @param {Record<string, import('node:sqlite').SQLOutputValue>} row @param {string[]} booleans */
function serialize(row, booleans) {
  const data = /** @type {Record<string, unknown>} */ ({ ...row });
  for (const key of booleans) data[key] = Boolean(data[key]);
  return data;
}
/** @param {Record<string, unknown>} data */
function sqlValues(data) {
  return Object.values(data).map(value => typeof value === 'boolean' ? Number(value) : /** @type {string | number} */ (value));
}
/** @param {import('express').Response} res @param {number} status @param {string} code @param {string} message */
function fail(res, status, code, message) { return res.status(status).json({ erro: { codigo: code, mensagem: message } }); }

/** @param {import('node:sqlite').DatabaseSync} db @param {{corsOrigins?: string[]}} options */
export function createApp(db, { corsOrigins = [] } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
  app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use(rateLimit({ windowMs: 60000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { erro: { codigo: 'LIMITE', mensagem: 'Aguarde antes de tentar novamente.' } } }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/health', (_req, res) => { db.prepare('SELECT 1').get(); res.json({ status: 'ok' }); });
  const authLimit = rateLimit({ windowMs: 15 * 60000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { erro: { codigo: 'LIMITE', mensagem: 'Limite de autenticação; tente mais tarde.' } } });

  app.post('/api/perfis', authLimit, async (req, res) => {
    const { usuario, senha, ...data } = createProfileSchema.parse(req.body);
    const senha_hash = await hashPassword(senha);
    // Criação e sessão são atômicas. Somente valores passam como parâmetros SQL.
    db.exec('BEGIN IMMEDIATE');
    try {
      const values = { usuario, senha_hash, ...data };
      const keys = Object.keys(values);
      const result = db.prepare(`INSERT INTO perfis (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...sqlValues(values));
      const id = Number(result.lastInsertRowid);
      const session = createSession(db, id);
      const perfil = serialize(db.prepare(`SELECT ${profileColumns} FROM perfis WHERE id_perfil = ?`).get(id), ['modo_disfarce', 'notificacoes']);
      db.exec('COMMIT');
      res.status(201).location(`/api/perfis/${id}`).json({ perfil, ...session });
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  });
  app.post('/api/sessoes', authLimit, async (req, res) => {
    const { usuario, senha } = credentialsSchema.parse(req.body);
    const row = db.prepare('SELECT id_perfil, senha_hash FROM perfis WHERE usuario = ?').get(usuario);
    // Custo semelhante mesmo para usuário inexistente; nunca retornar o hash.
    const valid = await checkPassword(senha, row ? String(row.senha_hash) : `${'0'.repeat(32)}:${'0'.repeat(128)}`);
    if (!row || !valid) return fail(res, 401, 'CREDENCIAIS', 'Usuário ou senha inválidos.');
    return res.json({ id_perfil: Number(row.id_perfil), ...createSession(db, Number(row.id_perfil)) });
  });

  app.use('/api', (req, res, next) => {
    const match = /^Bearer ([a-f0-9]{64})$/.exec(req.get('Authorization') ?? '');
    if (!match) return fail(res, 401, 'SESSAO', 'Sessão necessária.');
    const hash = tokenHash(match[1]);
    const session = db.prepare('SELECT id_perfil FROM sessoes WHERE token_hash = ? AND expira_em > ?').get(hash, Date.now());
    if (!session) return fail(res, 401, 'SESSAO', 'Sessão inválida ou expirada.');
    res.locals.perfilId = Number(session.id_perfil); res.locals.tokenHash = hash;
    next();
  });
  app.delete('/api/sessoes/atual', (_req, res) => {
    db.prepare('DELETE FROM sessoes WHERE token_hash = ?').run(res.locals.tokenHash);
    res.sendStatus(204);
  });
  app.get('/api/perfis', (_req, res) => {
    const row = db.prepare(`SELECT ${profileColumns} FROM perfis WHERE id_perfil = ?`).get(res.locals.perfilId);
    res.json([serialize(row, ['modo_disfarce', 'notificacoes'])]);
  });
  app.use('/api/perfis/:id', (req, res, next) => {
    if (idSchema.parse(req.params.id) !== res.locals.perfilId) return fail(res, 404, 'NAO_ENCONTRADO', 'Perfil não encontrado.');
    next();
  });
  app.get('/api/perfis/:id', (_req, res) => {
    res.json(serialize(db.prepare(`SELECT ${profileColumns} FROM perfis WHERE id_perfil = ?`).get(res.locals.perfilId), ['modo_disfarce', 'notificacoes']));
  });
  app.put('/api/perfis/:id', (req, res) => {
    const data = profileSchema.parse(req.body);
    db.prepare(`UPDATE perfis SET ${Object.keys(data).map(k => `${k} = ?`).join(',')} WHERE id_perfil = ?`).run(...sqlValues(data), res.locals.perfilId);
    res.json(serialize(db.prepare(`SELECT ${profileColumns} FROM perfis WHERE id_perfil = ?`).get(res.locals.perfilId), ['modo_disfarce', 'notificacoes']));
  });
  app.delete('/api/perfis/:id', (_req, res) => {
    db.prepare('DELETE FROM perfis WHERE id_perfil = ?').run(res.locals.perfilId);
    res.sendStatus(204);
  });

  for (const [path, resource] of Object.entries(resources)) {
    const { table, id, schema, booleans } = resource;
    const router = express.Router();
    router.get('/', (req, res) => {
      if (req.query.id_perfil !== undefined && idSchema.parse(req.query.id_perfil) !== res.locals.perfilId) return fail(res, 404, 'NAO_ENCONTRADO', 'Perfil não encontrado.');
      return res.json(db.prepare(`SELECT * FROM ${table} WHERE id_perfil = ? ORDER BY ${id} DESC`).all(res.locals.perfilId).map(row => serialize(row, booleans)));
    });
    router.post('/', (req, res) => {
      const data = schema.parse(req.body);
      if (data.id_perfil !== res.locals.perfilId) return fail(res, 422, 'RELACIONAMENTO', 'id_perfil deve ser o perfil autenticado.');
      const keys = Object.keys(data);
      const result = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...sqlValues(data));
      const row = db.prepare(`SELECT * FROM ${table} WHERE ${id} = ?`).get(Number(result.lastInsertRowid));
      return res.status(201).location(`/api/${path}/${row[id]}`).json(serialize(row, booleans));
    });
    router.use('/:id', (req, res, next) => {
      const recordId = idSchema.parse(req.params.id);
      const row = db.prepare(`SELECT * FROM ${table} WHERE ${id} = ? AND id_perfil = ?`).get(recordId, res.locals.perfilId);
      if (!row) return fail(res, 404, 'NAO_ENCONTRADO', 'Registro não encontrado.');
      res.locals.recordId = recordId; res.locals.row = row; next();
    });
    router.get('/:id', (_req, res) => res.json(serialize(res.locals.row, booleans)));
    router.put('/:id', (req, res) => {
      const data = schema.parse(req.body);
      if (data.id_perfil !== res.locals.perfilId) return fail(res, 422, 'RELACIONAMENTO', 'Não é permitido transferir registros entre perfis.');
      db.prepare(`UPDATE ${table} SET ${Object.keys(data).map(k => `${k} = ?`).join(',')} WHERE ${id} = ? AND id_perfil = ?`).run(...sqlValues(data), res.locals.recordId, res.locals.perfilId);
      return res.json(serialize(db.prepare(`SELECT * FROM ${table} WHERE ${id} = ?`).get(res.locals.recordId), booleans));
    });
    router.delete('/:id', (_req, res) => {
      db.prepare(`DELETE FROM ${table} WHERE ${id} = ? AND id_perfil = ?`).run(res.locals.recordId, res.locals.perfilId);
      res.sendStatus(204);
    });
    app.use(`/api/${path}`, router);
  }
  app.use((_req, res) => fail(res, 404, 'ROTA', 'Rota não encontrada.'));
  /** @type {import('express').ErrorRequestHandler} */
  const errors = (error, _req, res, _next) => {
    if (error instanceof ZodError) return res.status(422).json({ erro: { codigo: 'VALIDACAO', mensagem: 'Revise os campos.', campos: error.issues.map(i => ({ campo: i.path.join('.'), mensagem: i.message })) } });
    if (error.type === 'entity.parse.failed') return fail(res, 400, 'JSON', 'JSON inválido.');
    if (error.type === 'entity.too.large') return fail(res, 413, 'TAMANHO', 'Corpo excede 32 KB.');
    if (error.code === 'ERR_SQLITE_ERROR' && /UNIQUE constraint failed/.test(error.message)) return fail(res, 409, 'CONFLITO', 'Não foi possível criar o perfil com esse usuário.');
    // Não enviar SQL, stack, senha, token ou relato ao cliente/log.
    return fail(res, 500, 'INTERNO', 'Não foi possível concluir a operação.');
  };
  app.use(errors);
  return app;
}
