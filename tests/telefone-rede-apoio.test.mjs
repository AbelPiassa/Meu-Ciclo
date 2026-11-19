import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { test, before } from 'node:test';

let telefone;
before(async () => {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const source = await readFile(path.join(dir, '..', 'src', 'utils', 'telefoneRedeApoio.js'), 'utf8');
  telefone = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);
});

test('máscara aceita celular brasileiro e limita 11 dígitos', () => {
  assert.equal(telefone.formatarTelefone('11999999999'), '(11) 99999-9999');
  assert.equal(telefone.formatarTelefone('11 99999-9999 9999'), '(11) 99999-9999');
});
test('máscara aceita número fixo com 10 dígitos', () => {
  assert.equal(telefone.formatarTelefone('1134567890'), '(11) 3456-7890');
});
test('digitação parcial não quebra', () => {
  assert.equal(telefone.formatarTelefone(''), '');
  assert.equal(telefone.formatarTelefone('1'), '(1');
  assert.equal(telefone.formatarTelefone(null), '');
});
test('valida números completos, rejeita incompletos e DDD 00', () => {
  assert.equal(telefone.telefoneValido('(11) 99999-9999'), true);
  assert.equal(telefone.telefoneValido('(11) 3456-7890'), true);
  assert.equal(telefone.telefoneValido('(11) 9999'), false);
  assert.equal(telefone.telefoneValido('(00) 99999-9999'), false);
});
