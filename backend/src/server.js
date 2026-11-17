import { openDatabase } from './database.js';
import { createApp } from './app.js';
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida.');
const db = openDatabase(process.env.DATABASE_PATH ?? './data/meu-ciclo.sqlite');
const app = createApp(db, { corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').map(v => v.trim()).filter(Boolean) });
const server = app.listen(port, process.env.HOST ?? '127.0.0.1', () => {
  console.info(`Meu Ciclo API na porta ${port}. Ambiente acadêmico: apenas dados fictícios.`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
