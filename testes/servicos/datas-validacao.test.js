import test from "node:test";
import assert from "node:assert/strict";
import { brParaIso, isoParaBr, hojeIso } from "../../src/utils/datasApi.js";
import { validarOcorrencia, LIMITE_DESCRICAO } from "../../src/utils/validacaoOcorrencia.js";

const AGORA = new Date(2026, 10, 17, 12, 0, 0); // 17/11/2026, horário local

test("conversão DD/MM/AAAA <-> AAAA-MM-DD", () => {
  assert.equal(brParaIso("01/11/2026"), "2026-11-01");
  assert.equal(isoParaBr("2026-11-01"), "01/11/2026");
  assert.equal(brParaIso("1/11/2026"), null);
  assert.equal(brParaIso(""), null);
  assert.equal(isoParaBr("2026-1-1"), "");
  assert.equal(isoParaBr(undefined), "");
});

test("hojeIso usa a data local, sem desvio de UTC", () => {
  // 23:59 local de 17/11 continua sendo 17/11, mesmo que em UTC já seja o dia seguinte.
  assert.equal(hojeIso(new Date(2026, 10, 17, 23, 59, 59)), "2026-11-17");
  assert.equal(hojeIso(new Date(2026, 0, 5, 0, 0, 1)), "2026-01-05");
});

test("campos obrigatórios", () => {
  for (const campos of [
    { data: "", descricao: "x" },
    { data: "01/11/2026", descricao: "" },
    { data: "01/11/2026", descricao: "   \n  " },
    { data: undefined, descricao: undefined },
  ]) {
    const r = validarOcorrencia(campos, AGORA);
    assert.equal(r.valido, false);
    assert.equal(r.mensagem, "Preencha a data e a descrição da ocorrência.");
  }
});

test("datas inexistentes ou malformadas são rejeitadas", () => {
  for (const data of ["31/02/2026", "29/02/2025", "00/10/2026", "15/13/2026", "1/1/2026", "2026-11-01", "ab/cd/efgh"]) {
    const r = validarOcorrencia({ data, descricao: "x" }, AGORA);
    assert.equal(r.valido, false, data);
    assert.equal(r.mensagem, "Informe uma data válida no formato DD/MM/AAAA.", data);
  }
});

test("29/02 só é válido em ano bissexto", () => {
  assert.equal(validarOcorrencia({ data: "29/02/2024", descricao: "x" }, AGORA).valido, true);
  assert.equal(validarOcorrencia({ data: "29/02/2025", descricao: "x" }, AGORA).valido, false);
});

test("data futura é rejeitada; hoje e passado são aceitos", () => {
  assert.equal(validarOcorrencia({ data: "17/11/2026", descricao: "x" }, AGORA).valido, true);
  assert.equal(validarOcorrencia({ data: "01/01/2000", descricao: "x" }, AGORA).valido, true);
  const futuro = validarOcorrencia({ data: "18/11/2026", descricao: "x" }, AGORA);
  assert.equal(futuro.valido, false);
  assert.match(futuro.mensagem, /futuro/);
});

test("ano anterior a 1900 é rejeitado", () => {
  const r = validarOcorrencia({ data: "01/01/1899", descricao: "x" }, AGORA);
  assert.equal(r.valido, false);
  assert.match(r.mensagem, /1900/);
});

test("limite de descrição igual ao do backend (5000)", () => {
  assert.equal(LIMITE_DESCRICAO, 5000);
  assert.equal(validarOcorrencia({ data: "01/11/2026", descricao: "a".repeat(5000) }, AGORA).valido, true);
  assert.equal(validarOcorrencia({ data: "01/11/2026", descricao: "a".repeat(5001) }, AGORA).valido, false);
  // espaços nas pontas não contam (o backend também faz trim)
  assert.equal(validarOcorrencia({ data: "01/11/2026", descricao: `  ${"a".repeat(5000)}  ` }, AGORA).valido, true);
});
