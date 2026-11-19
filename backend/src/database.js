import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/** @param {string} path */
export function openDatabase(path) {
  if (path !== ':memory:') {
    mkdirSync(dirname(resolve(path)), { recursive: true });
  }

  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');

  const version = Number(db.prepare('PRAGMA user_version').get()?.user_version);

  if (version > 1) {
    db.close();
    throw new Error('Banco tem versão mais recente que esta API.');
  }

  if (version === 0) {
    db.exec('BEGIN IMMEDIATE');

    try {
      db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      db.close();
      throw error;
    }
  }

  return db;
}
