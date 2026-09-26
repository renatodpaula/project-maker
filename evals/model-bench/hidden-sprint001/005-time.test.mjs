// Suíte oculta — SPRINT-001 / Issue 005: src/lib/time.js — formatação em America/Sao_Paulo e datetime-local → UTC (REQ-9).
// Uso: PROJECT_ROOT=/caminho/absoluto node --test 005-time.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.env.PROJECT_ROOT;
assert.ok(ROOT && isAbsolute(ROOT), 'defina PROJECT_ROOT com o caminho absoluto do projeto sob teste');
const TIME_URL = pathToFileURL(join(ROOT, 'src/lib/time.js')).href;
const time = () => import(TIME_URL);
const EMPTY = '—';

test('TIME_ZONE é America/Sao_Paulo e formatDateTime devolve dd/mm/aaaa HH:mm no fuso', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/005-lib-time.md#Caminho feliz ("2026-12-01T13:30:00.000Z" → "01/12/2026 10:30"); #Arquivos a criar (TIME_ZONE, formatDateTime(isoOrDate, timeZone)); #Plano (meia-noite sai 00:00)
  const { TIME_ZONE, formatDateTime } = await time();
  assert.equal(TIME_ZONE, 'America/Sao_Paulo');
  assert.equal(formatDateTime('2026-12-01T13:30:00.000Z'), '01/12/2026 10:30');
  assert.equal(formatDateTime(new Date('2026-12-01T13:30:00.000Z')), '01/12/2026 10:30');
  assert.equal(formatDateTime('2026-12-01T03:00:00.000Z'), '01/12/2026 00:00');
  assert.equal(formatDateTime('2026-07-04T16:00:00.000Z', 'America/New_York'), '04/07/2026 12:00');
});

test('formatDateTime devolve "—" para null, undefined e datas inválidas, sem lançar', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/005-lib-time.md#Edge cases (null/undefined → '—'; ISO inválido → '—'; new Date('x') → '—')
  const { formatDateTime } = await time();
  for (const v of [null, undefined, 'lixo', new Date('x')]) {
    let out;
    assert.doesNotThrow(() => { out = formatDateTime(v); }, `não deve lançar para ${String(v)}`);
    assert.equal(out, EMPTY, `valor ${String(v)}`);
  }
});

test('localDateTimeToUtc interpreta o datetime-local em São Paulo e devolve Date em UTC', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/005-lib-time.md#Caminho feliz ("2026-12-01T10:30" → 2026-12-01T13:30:00.000Z) e #Edge cases (com segundos → aceito); Spec.md#REQ-9
  const { localDateTimeToUtc } = await time();
  const d = localDateTimeToUtc('2026-12-01T10:30');
  assert.ok(d instanceof Date, 'deve devolver um Date');
  assert.equal(d.toISOString(), '2026-12-01T13:30:00.000Z');
  assert.equal(localDateTimeToUtc('2026-12-01T10:30:15').toISOString(), '2026-12-01T13:30:15.000Z');
  assert.equal(localDateTimeToUtc('2026-12-01T00:00').toISOString(), '2026-12-01T03:00:00.000Z');
  assert.equal(localDateTimeToUtc('2026-12-31T23:30').toISOString(), '2027-01-01T02:30:00.000Z');
});

test('localDateTimeToUtc respeita o fuso parametrizado, inclusive horário de verão (America/New_York)', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/005-lib-time.md#Edge cases "Fuso parametrizável ... America/New_York (2026-07-04T12:00 → 16:00Z)"
  const { localDateTimeToUtc } = await time();
  assert.equal(localDateTimeToUtc('2026-07-04T12:00', 'America/New_York').toISOString(), '2026-07-04T16:00:00.000Z');
  assert.equal(localDateTimeToUtc('2026-01-15T12:00', 'America/New_York').toISOString(), '2026-01-15T17:00:00.000Z');
});

test('localDateTimeToUtc devolve null para entradas inválidas (inclusive datas que Date.UTC normalizaria)', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/005-lib-time.md#Edge cases ('', '2026-12-01', 'abc', '2026-13-40T99:99', '2026-02-30T10:00', '2026-12-01T24:00' → null)
  const { localDateTimeToUtc } = await time();
  for (const v of ['', '2026-12-01', 'abc', '2026-13-40T99:99', '2026-02-30T10:00', '2026-12-01T24:00']) {
    let out;
    assert.doesNotThrow(() => { out = localDateTimeToUtc(v); }, `não deve lançar para ${String(v)}`);
    assert.equal(out, null, `valor ${JSON.stringify(v)}`);
  }
  // Não-string: a issue só fixa "nenhum erro lançado"; aceita null ou undefined.
  for (const v of [undefined, null, 123]) {
    let out;
    assert.doesNotThrow(() => { out = localDateTimeToUtc(v); }, `não deve lançar para ${String(v)}`);
    assert.ok(out === null || out === undefined, `valor ${JSON.stringify(v)} deveria dar null/undefined`);
  }
});

// Timeout acima de 10 s de propósito: 3 subprocessos sequenciais (5 s cada, no máximo).
test('resultados não dependem do TZ do processo (UTC, Asia/Tokyo, America/Los_Angeles)', { timeout: 15_000 }, () => {
  // fonte: docs/issues/005-lib-time.md#Done when "passa em qualquer TZ do processo" e #Gate (TZ=UTC e TZ=Asia/Tokyo)
  const script = `
    const m = await import(${JSON.stringify(TIME_URL)});
    const out = [
      m.formatDateTime('2026-12-01T13:30:00.000Z'),
      m.formatDateTime('2026-12-01T03:00:00.000Z'),
      m.localDateTimeToUtc('2026-12-01T10:30')?.toISOString(),
      m.localDateTimeToUtc('2026-07-04T12:00', 'America/New_York')?.toISOString(),
    ];
    process.stdout.write('@@RESULT@@' + JSON.stringify(out));`;
  const expected = ['01/12/2026 10:30', '01/12/2026 00:00', '2026-12-01T13:30:00.000Z', '2026-07-04T16:00:00.000Z'];
  for (const tz of ['UTC', 'Asia/Tokyo', 'America/Los_Angeles']) {
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      env: { PATH: process.env.PATH, TZ: tz },
      encoding: 'utf8',
      timeout: 5_000,
    });
    assert.equal(r.status, 0, `TZ=${tz}: processo falhou\n${r.stderr}`);
    const payload = r.stdout.slice(r.stdout.indexOf('@@RESULT@@') + '@@RESULT@@'.length);
    assert.deepEqual(JSON.parse(payload), expected, `TZ=${tz}`);
  }
});
