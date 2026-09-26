// Suíte oculta — SPRINT-001 / Issue 003: src/lib/slug.js — geração base62, validação, reservados (REQ-5, REQ-6, REQ-7, REQ-12).
// Uso: PROJECT_ROOT=/caminho/absoluto node --test 003-slug.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.env.PROJECT_ROOT;
assert.ok(ROOT && isAbsolute(ROOT), 'defina PROJECT_ROOT com o caminho absoluto do projeto sob teste');
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const slug = () => load('src/lib/slug.js');

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
// Recria a regex sem flag g/y para que .test() não dependa de lastIndex.
const fresh = (re) => new RegExp(re.source, re.flags.replace(/[gy]/g, ''));

test('constantes: RESERVED_SLUGS exatos e congelados, AUTO_SLUG_LENGTH 6, BASE62_ALPHABET com os 62 caracteres', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/003-lib-slug.md#Arquivos a criar (RESERVED_SLUGS congelado ['admin','api','assets','health'], AUTO_SLUG_LENGTH = 6, BASE62_ALPHABET); Spec.md#REQ-7
  const m = await slug();
  assert.deepEqual([...m.RESERVED_SLUGS].sort(), ['admin', 'api', 'assets', 'health']);
  assert.ok(Object.isFrozen(m.RESERVED_SLUGS), 'RESERVED_SLUGS deve ser um array congelado');
  assert.equal(m.AUTO_SLUG_LENGTH, 6);
  // A issue fixa o conteúdo (A-Za-z0-9), não a forma: string ou array de caracteres servem.
  assert.ok(typeof m.BASE62_ALPHABET === 'string' || Array.isArray(m.BASE62_ALPHABET), 'BASE62_ALPHABET deve ser string ou array');
  assert.equal([...m.BASE62_ALPHABET].length, 62);
  assert.equal([...m.BASE62_ALPHABET].sort().join(''), [...BASE62].sort().join(''));
});

test('generateSlug() devolve sempre 6 caracteres base62 e cobre o alfabeto inteiro em 6000 gerações', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/003-lib-slug.md#Done when "sempre 6 chars do alfabeto base62"; #Padrões "6000 gerações, cada um dos 62 caracteres aparece"; Spec.md#REQ-5
  const { generateSlug } = await slug();
  const seen = new Set();
  for (let i = 0; i < 6000; i += 1) {
    const s = generateSlug();
    assert.match(s, /^[A-Za-z0-9]{6}$/);
    for (const ch of s) seen.add(ch);
  }
  assert.equal(seen.size, 62, `caracteres nunca gerados: ${[...BASE62].filter((c) => !seen.has(c)).join('')}`);
});

test('generateSlug(randomInt) usa a aleatoriedade injetada: randomInt(0, 62) por posição', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/003-lib-slug.md#Edge cases "aceita a função de aleatoriedade por injeção"; #Caminho feliz "crypto.randomInt(0, 62) por posição"; #Plano (sequência 0, 1, 61, 26, 52, 35)
  const { generateSlug, BASE62_ALPHABET } = await slug();
  const seq = [0, 1, 61, 26, 52, 35];
  const calls = [];
  const fake = (...args) => {
    calls.push(args);
    return seq[calls.length - 1];
  };
  const out = generateSlug(fake);
  assert.equal(out, seq.map((i) => BASE62_ALPHABET[i]).join(''));
  assert.equal(calls.length, 6, 'uma chamada por posição');
  for (const args of calls) {
    const [min, max] = args.length >= 2 ? args : [0, args[0]];
    assert.equal(min, 0);
    assert.equal(max, 62);
  }
});

test('normalizeSlug aplica trim + lowercase; isValidCustomSlug aceita exatamente ^[a-z0-9-]{3,32}$ sem normalizar', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/003-lib-slug.md#Caminho feliz e #Edge cases (tabela ab, 33 chars, a_b, a.b, ação, ABC, abc, a-b, 123, -abc-); #Erros "validações devolvem boolean"; Spec.md#REQ-6
  const { normalizeSlug, isValidCustomSlug, SLUG_PATTERN } = await slug();
  assert.equal(normalizeSlug('  Black-Friday '), 'black-friday');
  assert.equal(normalizeSlug('ABC'), 'abc');
  const valid = ['black-friday', 'abc', 'a-b', '123', '-abc-', 'a'.repeat(32)];
  // Só strings: o tratamento de não-string não está fixado no Done when/cenários (apenas no snippet do plano).
  const invalid = ['ab', 'a'.repeat(33), 'a_b', 'a.b', 'ação', 'ABC', '', ' abc', 'abc '];
  for (const s of valid) {
    assert.equal(isValidCustomSlug(s), true, `deveria aceitar ${JSON.stringify(s)}`);
    assert.equal(fresh(SLUG_PATTERN).test(s), true, `SLUG_PATTERN deveria aceitar ${JSON.stringify(s)}`);
  }
  for (const s of invalid) assert.equal(isValidCustomSlug(s), false, `deveria rejeitar ${JSON.stringify(s)}`);
  assert.equal(fresh(SLUG_PATTERN).test('ABC'), false);
});

test('isReservedSlug é exato e compara após normalizar', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/003-lib-slug.md#Caminho feliz ("admin" → true, "admin2" → false) e #Edge cases ("Admin" → reservado); Spec.md#REQ-7
  const { isReservedSlug } = await slug();
  for (const s of ['admin', 'api', 'assets', 'health', 'Admin', 'HEALTH', '  api ']) {
    assert.equal(isReservedSlug(s), true, `${JSON.stringify(s)} deveria ser reservado`);
  }
  for (const s of ['admin2', 'administrator', 'apis', 'my-admin', 'asset', 'healthz', 'abc']) {
    assert.equal(isReservedSlug(s), false, `${JSON.stringify(s)} não é reservado`);
  }
});

test('ROUTE_SEGMENT_PATTERN aceita [A-Za-z0-9-]{1,32} e rejeita o resto', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/003-lib-slug.md#Critérios REQ-12 (parcial) "aceita abc-123 e AbC123 e rejeita abc_def, favicon.ico, ação, 33 chars e string vazia"; Spec.md#REQ-12
  const { ROUTE_SEGMENT_PATTERN } = await slug();
  const re = fresh(ROUTE_SEGMENT_PATTERN);
  for (const s of ['abc-123', 'AbC123', 'a', 'a'.repeat(32)]) assert.equal(re.test(s), true, `deveria aceitar ${s}`);
  for (const s of ['abc_def', 'favicon.ico', 'ação', 'a'.repeat(33), '', 'a/b']) assert.equal(re.test(s), false, `deveria rejeitar ${JSON.stringify(s)}`);
});
