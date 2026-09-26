// Suíte oculta — SPRINT-001 / Issue 004: src/lib/url.js — validação da URL de destino (REQ-4).
// Uso: PROJECT_ROOT=/caminho/absoluto node --test 004-url.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.env.PROJECT_ROOT;
assert.ok(ROOT && isAbsolute(ROOT), 'defina PROJECT_ROOT com o caminho absoluto do projeto sob teste');
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const url = () => load('src/lib/url.js');

const BASE = 'https://go.agencia.com';
const INVALID_MSG = 'URL inválida. Use um endereço que comece com http:// ou https://';
const SELF_LOOP_MSG = 'A URL não pode apontar para o próprio encurtador';

function assertInvalid(result, label, message = INVALID_MSG) {
  assert.equal(result?.ok, false, `${label}: deveria ser rejeitada`);
  assert.equal(result.code, 'INVALID_URL', `${label}: code`);
  assert.equal(result.message, message, `${label}: message`);
}

test('aceita http/https, aplica trim e devolve a URL como recebida (query/UTM byte a byte)', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/004-lib-url.md#Caminho feliz ("query preservada byte a byte após o trim"); #Edge cases (HTTPS://Ex.COM/p ok, armazenada como recebida); Spec.md#REQ-4
  const { validateTargetUrl } = await url();
  const r = validateTargetUrl(' https://loja.com/p?utm_source=wa&utm_campaign=bf ', { baseUrl: BASE });
  assert.equal(r.ok, true);
  assert.equal(r.url, 'https://loja.com/p?utm_source=wa&utm_campaign=bf');
  const raw = 'http://loja.com/a%20b?q=a+b&x=%C3%A7&utm_term=Black%20Friday#topo';
  assert.equal(validateTargetUrl(raw, { baseUrl: BASE }).url, raw);
  const upper = validateTargetUrl('HTTPS://Ex.COM/p', { baseUrl: BASE });
  assert.equal(upper.ok, true);
  assert.equal(upper.url, 'HTTPS://Ex.COM/p');
  assert.equal(validateTargetUrl('\n\thttps://loja.com/x \t', { baseUrl: BASE }).url, 'https://loja.com/x');
});

test('rejeita javascript:, data:, file:, vbscript:, ftp:, mailto: com INVALID_URL e a mensagem exata', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/004-lib-url.md#Erros (6 esquemas → { ok: false, code: 'INVALID_URL', message }); Spec.md#REQ-4; steering/testing.md "javascript: → 400"
  const { validateTargetUrl } = await url();
  for (const raw of ['javascript:alert(1)', 'JavaScript:alert(1)', ' javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd', 'vbscript:x', 'ftp://a.b', 'mailto:a@b']) {
    assertInvalid(validateTargetUrl(raw, { baseUrl: BASE }), raw);
  }
});

test('rejeita self-loop pelo host de BASE_URL (hostname + porta) e aceita porta ou host diferentes', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/004-lib-url.md#Edge cases (localhost:3000 → self-loop; https://localhost/x vs http://localhost:3000 → ok) e #Padrões ("lowercase, porta padrão omitida"); Spec.md#REQ-4
  const { validateTargetUrl } = await url();
  assertInvalid(validateTargetUrl('http://localhost:3000/x', { baseUrl: 'http://localhost:3000' }), 'mesmo host:porta', SELF_LOOP_MSG);
  assertInvalid(validateTargetUrl('https://GO.Agencia.com/promo', { baseUrl: BASE }), 'host em maiúsculas', SELF_LOOP_MSG);
  assertInvalid(validateTargetUrl('https://go.agencia.com:443/x', { baseUrl: BASE }), 'porta padrão explícita', SELF_LOOP_MSG);
  assert.equal(validateTargetUrl('https://localhost/x', { baseUrl: 'http://localhost:3000' }).ok, true);
  assert.equal(validateTargetUrl('http://localhost:3001/x', { baseUrl: 'http://localhost:3000' }).ok, true);
  assert.equal(validateTargetUrl('https://sub.go.agencia.com/x', { baseUrl: BASE }).ok, true);
});

test('limite de 2048 caracteres (após trim): 2048 aceita, 2049 rejeita', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/004-lib-url.md#Edge cases "exatamente 2048 chars → ok; 2049 → INVALID_URL"; #Arquivos a criar MAX_URL_LENGTH = 2048; Spec.md#REQ-4
  const { validateTargetUrl, MAX_URL_LENGTH } = await url();
  assert.equal(MAX_URL_LENGTH, 2048);
  const u2048 = `https://a.co/${'x'.repeat(2048 - 13)}`;
  assert.equal(u2048.length, 2048);
  assert.equal(validateTargetUrl(u2048, { baseUrl: BASE }).ok, true);
  assert.equal(validateTargetUrl(`  ${u2048}  `, { baseUrl: BASE }).url, u2048);
  const r = validateTargetUrl(`${u2048}x`, { baseUrl: BASE });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'INVALID_URL');
});

test('rejeita entradas malformadas e não-string com INVALID_URL, sem lançar', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/004-lib-url.md#Edge cases ("http://" → INVALID_URL; não-string → INVALID_URL; http:/abc e https:example.com → INVALID_URL)
  const { validateTargetUrl } = await url();
  // Strings malformadas: "não parseável" usa a mensagem padrão de INVALID_URL (docs/contracts/links-api.md#POST erros).
  for (const raw of ['http://', '', '   ', 'http:/abc', 'https:example.com', 'loja.com/p', '//loja.com/p']) {
    let r;
    assert.doesNotThrow(() => { r = validateTargetUrl(raw, { baseUrl: BASE }); }, `não deve lançar para ${JSON.stringify(raw)}`);
    assertInvalid(r, JSON.stringify(raw));
  }
  // Não-string: a issue fixa só o código (INVALID_URL), não o texto — exige apenas alguma mensagem.
  for (const raw of [undefined, null, 42, {}]) {
    let r;
    assert.doesNotThrow(() => { r = validateTargetUrl(raw, { baseUrl: BASE }); }, `não deve lançar para ${String(raw)}`);
    assert.equal(r?.ok, false, `${String(raw)}: deveria ser rejeitada`);
    assert.equal(r.code, 'INVALID_URL', `${String(raw)}: code`);
    assert.ok(typeof r.message === 'string' && r.message.length > 0, `${String(raw)}: message`);
  }
});

test('isHttpUrl devolve boolean e ALLOWED_PROTOCOLS é [http:, https:]', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/004-lib-url.md#Arquivos a criar (ALLOWED_PROTOCOLS = ['http:', 'https:'], isHttpUrl(value) boolean)
  const { isHttpUrl, ALLOWED_PROTOCOLS } = await url();
  assert.deepEqual([...ALLOWED_PROTOCOLS].sort(), ['http:', 'https:']);
  for (const v of ['https://a.b/x', 'http://loja.com', 'HTTP://LOJA.COM/p?x=1']) assert.equal(isHttpUrl(v), true, v);
  for (const v of ['javascript:alert(1)', 'ftp://a.b', 'data:text/html,x', 'file:///etc/passwd', '', 'http://']) {
    assert.equal(isHttpUrl(v), false, String(v));
  }
  // Não-string não está fixado na issue (o store valida `url` string antes): só exige que não lance e não aceite.
  for (const v of [42, undefined, null]) {
    let out;
    assert.doesNotThrow(() => { out = isHttpUrl(v); }, `não deve lançar para ${String(v)}`);
    assert.ok(!out, `${String(v)} não é URL http(s)`);
  }
});
