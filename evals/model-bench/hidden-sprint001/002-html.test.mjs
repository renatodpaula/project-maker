// Suíte oculta — SPRINT-001 / Issue 002: src/lib/html.js — escapeHtml (REQ-37).
// Uso: PROJECT_ROOT=/caminho/absoluto node --test 002-html.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.env.PROJECT_ROOT;
assert.ok(ROOT && isAbsolute(ROOT), 'defina PROJECT_ROOT com o caminho absoluto do projeto sob teste');
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const html = () => load('src/lib/html.js');

test('escapa & < > " \' com as entidades especificadas', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/002-lib-escape-html.md#Caminho feliz e #Done when "&amp; &lt; &gt; &quot; &#39;"; Spec.md#REQ-37
  const { escapeHtml } = await html();
  assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml("a & b's"), 'a &amp; b&#39;s');
  assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
  assert.equal(escapeHtml('https://x.com/<script>alert(1)</script>'), 'https://x.com/&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('null e undefined viram string vazia', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/002-lib-escape-html.md#Edge cases "null/undefined → ''"
  const { escapeHtml } = await html();
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(), '');
});

test('não-strings são convertidas com String() e escapadas', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/002-lib-escape-html.md#Edge cases "Números e booleans → String(v) escapado"; #Done when "não-strings são convertidos"
  const { escapeHtml } = await html();
  assert.equal(escapeHtml(0), '0');
  assert.equal(escapeHtml(42), '42');
  assert.equal(escapeHtml(false), 'false');
  assert.equal(escapeHtml(true), 'true');
  assert.equal(escapeHtml({ toString: () => '<b>"x"</b>' }), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
});

test('texto sem caracteres especiais volta idêntico (acentos preservados)', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/002-lib-escape-html.md#Edge cases "String sem caracteres especiais → devolvida idêntica"; #Done when "nada mais é alterado"
  const { escapeHtml } = await html();
  for (const s of ['', 'black-friday', 'Olá, ação — disponível ✓ 100%', 'https://loja.com/p?utm_source=wa', 'linha1\nlinha2\t/ = ;']) {
    assert.equal(escapeHtml(s), s);
  }
});

test('entidade já escapada é escapada de novo (sem detecção esperta)', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/002-lib-escape-html.md#Edge cases "&amp; é escapado de novo (&amp;amp;)"
  const { escapeHtml } = await html();
  assert.equal(escapeHtml('&amp;'), '&amp;amp;');
  assert.equal(escapeHtml('&lt;b&gt;'), '&amp;lt;b&amp;gt;');
  assert.equal(escapeHtml(escapeHtml('<')), '&amp;lt;');
});
