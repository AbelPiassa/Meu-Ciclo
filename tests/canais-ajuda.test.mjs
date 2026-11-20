import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { test, before } from 'node:test';

let canais;
before(async () => {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const source = await readFile(path.join(dir, '..', 'src', 'utils', 'canaisAjuda.js'), 'utf8');
  canais = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);
});

test('Ligue 180 e Ligue 190 geram o endereço do discador (tel:)', () => {
  assert.equal(canais.enderecoDoDiscador({ numero: 'Ligue 180' }), 'tel:180');
  assert.equal(canais.enderecoDoDiscador({ numero: 'Ligue 190' }), 'tel:190');
});

test('número que não é canal oficial não gera endereço', () => {
  assert.equal(canais.enderecoDoDiscador({ numero: 'Ligue 192' }), '');
  assert.equal(canais.enderecoDoDiscador({ numero: '(11) 99999-9999' }), '');
  assert.equal(canais.enderecoDoDiscador(null), '');
  assert.equal(canais.numeroDoCanal({}), '');
});
