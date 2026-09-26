// Suíte oculta — SPRINT-001 / Issue 009: src/views/{layout,not-found,gone}.js (REQ-13/REQ-14 visuais, REQ-37, NFR-6, NFR-7).
// Uso: PROJECT_ROOT=/caminho/absoluto node --test 009-views.test.mjs
// Status HTTP e headers dessas páginas são verificados via servidor real em 010-server.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.env.PROJECT_ROOT;
assert.ok(ROOT && isAbsolute(ROOT), 'defina PROJECT_ROOT com o caminho absoluto do projeto sob teste');
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

const GONE_TITLE = 'Link desativado ou expirado';
const GONE_TEXT = 'Este link não está mais disponível. Se você recebeu este link da agência, peça um novo.';
const NOT_FOUND_TITLE = 'Link não encontrado';
const NOT_FOUND_TEXT = 'Confira se o endereço está completo.';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const titleRe = (text) => new RegExp(`<title>\\s*${esc(text)} — Encurtador\\s*</title>`);
const h1Re = (text) => new RegExp(`<h1(?:\\s[^>]*)?>\\s*${esc(text)}\\s*</h1>`);
const LOGOUT_FORM = /<form(?=[^>]*\bmethod=["']?post["']?)(?=[^>]*\baction=["']?\/admin\/logout["']?)[^>]*>/i;

function assertHtmlSkeleton(html, label) {
  assert.equal(typeof html, 'string', `${label}: deve devolver string`);
  assert.match(html, /^\s*<!doctype html>/i, `${label}: <!doctype html>`);
  assert.match(html, /<html[^>]*\blang=["']pt-BR["']/, `${label}: <html lang="pt-BR">`);
  assert.match(html, /<meta[^>]*\bcharset=["']?utf-8["']?/i, `${label}: <meta charset="utf-8">`);
  assert.match(html, /<meta[^>]*\bname=["']viewport["']/i, `${label}: meta viewport`);
  assert.match(html, /<style[\s>]/i, `${label}: <style> embutido`);
  assert.doesNotMatch(html, /<link[^>]+rel=["']?stylesheet/i, `${label}: sem CSS externo`);
}

test('renderGone(): página 410 com <title>, <h1> e a frase exata da Spec', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/009-views-publicas-layout-404-410.md#Caminho feliz (<title>Link desativado ou expirado — Encurtador</title>, <h1>…</h1>, frase) e #Done when "doctype, lang=pt-BR, meta charset, viewport e os textos exatos"; docs/contracts/public-routes.md#Páginas de erro públicas; Spec.md#Páginas (Link indisponível)
  const { renderGone } = await load('src/views/gone.js');
  const html = renderGone();
  assertHtmlSkeleton(html, 'renderGone');
  assert.match(html, titleRe(GONE_TITLE));
  assert.match(html, h1Re(GONE_TITLE));
  assert.ok(html.includes(GONE_TEXT), 'frase de orientação da página 410 ausente ou diferente');
});

test('renderNotFound(): página 404 com <title>, <h1> e a frase exata da Spec', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/009-views-publicas-layout-404-410.md#Caminho feliz ("Link não encontrado" e "Confira se o endereço está completo.") e #Done when; docs/contracts/public-routes.md#Páginas de erro públicas (<title> "Link não encontrado — Encurtador"); Spec.md#Páginas (Não encontrado)
  const { renderNotFound } = await load('src/views/not-found.js');
  const html = renderNotFound();
  assertHtmlSkeleton(html, 'renderNotFound');
  assert.match(html, titleRe(NOT_FOUND_TITLE));
  assert.match(html, h1Re(NOT_FOUND_TITLE));
  assert.ok(html.includes(NOT_FOUND_TEXT), 'frase de orientação da página 404 ausente ou diferente');
});

test('páginas públicas: sem parâmetros, sem header do painel, sem link para /admin, sem formulário e sem <script>; acentuação pt-BR correta', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/009-views-publicas-layout-404-410.md#Edge cases ("Páginas públicas não têm link para /admin"; acentos "não", "disponível", "agência", "endereço"), #Plano (renderGone.length === 0; !includes('/admin')) e #Critérios NFR-7 (!includes('<script')); #Done when "404/410 não interpolam nenhum valor"; Spec.md#Componentes (Página 410 e 404: "sem header do painel, sem formulário"), #NFR-6
  // "Sem header do painel" é medido pelo que o define (form de logout e link /admin), não pela tag <header>:
  // a Spec (Componentes → Layout) e a Descrição da issue admitem um <header> só com o nome do app em toda página.
  const { renderGone } = await load('src/views/gone.js');
  const { renderNotFound } = await load('src/views/not-found.js');
  assert.equal(renderGone.length, 0, 'renderGone não recebe parâmetros');
  assert.equal(renderNotFound.length, 0, 'renderNotFound não recebe parâmetros');
  for (const [label, html] of [['410', renderGone()], ['404', renderNotFound()]]) {
    assert.equal(html.includes('/admin'), false, `${label}: não pode revelar /admin`);
    assert.equal(/<form[\s>]/i.test(html), false, `${label}: sem formulário`);
    assert.equal(/<script[\s>]/i.test(html), false, `${label}: sem <script>`);
  }
  const gone = renderGone();
  for (const word of ['não', 'disponível', 'agência']) assert.ok(gone.includes(word), `410: "${word}" com acento`);
  assert.ok(renderNotFound().includes('endereço'), '404: "endereço" com acento');
});

test('renderLayout(): esqueleto HTML, <title> "<título> — Encurtador" escapado, body sem escape dentro de <main>, logout só com authenticated; APP_NAME', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/009-views-publicas-layout-404-410.md#Caminho feliz (authenticated true → <form method="post" action="/admin/logout"> com "Sair"; false → não inclui), #Edge cases ("title passa por escapeHtml"; "body não é escapado"), #Arquivos a criar (renderLayout({ title, body, authenticated = false }), APP_NAME = 'Encurtador') e #Done when; Spec.md#Componentes (Layout), #REQ-37
  const { renderLayout, APP_NAME } = await load('src/views/layout.js');
  assert.equal(APP_NAME, 'Encurtador');

  const authed = renderLayout({ title: 'Links', body: '<p id="conteudo">y</p>', authenticated: true });
  assertHtmlSkeleton(authed, 'layout autenticado');
  assert.match(authed, titleRe('Links'));
  assert.match(authed, /<main(?:\s[^>]*)?>[\s\S]*<p id="conteudo">y<\/p>[\s\S]*<\/main>/, 'body entra cru dentro de <main>');
  assert.match(authed, LOGOUT_FORM, 'form de logout (method="post" action="/admin/logout")');
  assert.match(authed, /Sair/);
  assert.ok(authed.includes('Encurtador'));

  for (const anon of [
    renderLayout({ title: 'Entrar', body: '<p>x</p>', authenticated: false }),
    renderLayout({ title: 'Entrar', body: '<p>x</p>' }),
  ]) {
    assertHtmlSkeleton(anon, 'layout anônimo');
    assert.equal(anon.includes('/admin/logout'), false, 'sem sessão não há form de logout');
  }

  const hostile = renderLayout({ title: `<x> & "y" 'z'`, body: '' });
  assert.ok(hostile.includes('&lt;x&gt; &amp; &quot;y&quot; &#39;z&#39;'), 'title deve passar por escapeHtml');
  assert.equal(hostile.includes('<x>'), false, 'title cru não pode aparecer');
});
