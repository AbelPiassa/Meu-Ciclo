import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

/** @param {string} password */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = /** @type {Buffer} */ (await scrypt(password, salt, 64));
  return `${salt}:${hash.toString('hex')}`;
}

/** @param {string} password @param {string} stored */
export async function checkPassword(password, stored) {
  const [salt, encoded] = stored.split(':');
  const hash = /** @type {Buffer} */ (await scrypt(password, salt, 64));
  const expected = Buffer.from(encoded, 'hex');

  return expected.length === hash.length && timingSafeEqual(expected, hash);
}

/** @param {string} token */
export const tokenHash = token => createHash('sha256').update(token).digest('hex');

/** @param {import('node:sqlite').DatabaseSync} db @param {number} id */
export function createSession(db, id) {
  const token = randomBytes(32).toString('hex');
  const expires = Date.now() + 24 * 60 * 60 * 1000;

  db.prepare('DELETE FROM sessoes WHERE expira_em <= ?').run(Date.now());
  db.prepare('INSERT INTO sessoes (token_hash,id_perfil,expira_em) VALUES (?,?,?)').run(
    tokenHash(token),
    id,
    expires
  );

  return { token, expira_em: new Date(expires).toISOString() };
}
