// Suíte oculta — SPRINT-001 / Issue 010: src/server.js + src/router.js + src/routes/health.js + test/helpers/server.js
// (REQ-1/REQ-2 na subida, REQ-3, REQ-12, REQ-36, REQ-38, REQ-40, NFR-5).
// Uso: PROJECT_ROOT=/caminho/absoluto node --test 010-server.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.env.PROJECT_ROOT;
assert.ok(ROOT && isAbsolute(ROOT), 'defina PROJECT_ROOT com o caminho absoluto do projeto sob teste');
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const SERVER_JS = join(ROOT, 'src/server.js');

const TOKEN = 'token-oculto-bem-longo-123';
const NOT_FOUND_TEXTS = ['Link não encontrado', 'Confira se o endereço está completo.'];
const STACK_LINE = /\n\s+at\s|\bat\s+\S+\s*\(?[^)\s]*:\d+:\d+/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function tempDir(t, prefix = 'hidden-s001-server-') {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`timeout (${ms} ms): ${label}`)), ms); }),
  ]).finally(() => clearTimeout(timer));
}

async function freePort() {
  const probe = http.createServer();
  await new Promise((resolve) => probe.listen(0, resolve));
  const { port } = probe.address();
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

/** Sobe `node src/server.js` com env controlado (nunca herda process.env inteiro). */
function spawnServer(t, env) {
  const child = spawn(process.execPath, [SERVER_JS], {
    cwd: ROOT,
    env: { PATH: process.env.PATH, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const out = { stdout: '', stderr: '' };
  child.stdout.setEncoding('utf8').on('data', (d) => { out.stdout += d; });
  child.stderr.setEncoding('utf8').on('data', (d) => { out.stderr += d; });
  const closed = new Promise((resolve) => child.on('close', (code, signal) => resolve({ code, signal })));
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await closed;
  });
  return { child, out, closed };
}

async function waitForExit(proc, ms = 5_000) {
  return withTimeout(proc.closed, ms, 'o processo deveria ter saído sozinho');
}

/** Espera o servidor responder em algum host de loopback; devolve a base URL que funcionou. */
async function waitReady(proc, port, ms = 5_000) {
  const deadline = Date.now() + ms;
  const candidates = [`http://127.0.0.1:${port}`, `http://[::1]:${port}`];
  let exited = null;
  proc.closed.then((r) => { exited = r; });
  while (Date.now() < deadline) {
    if (exited) throw new Error(`o servidor saiu antes de ficar pronto (code=${exited.code}, signal=${exited.signal})\nstdout:\n${proc.out.stdout}\nstderr:\n${proc.out.stderr}`);
    for (const base of candidates) {
      try {
        const r = await fetch(`${base}/health`, { signal: AbortSignal.timeout(1_000) });
        await r.arrayBuffer();
        return base;
      } catch {
        // ainda não está escutando nesse host
      }
    }
    await sleep(50);
  }
  throw new Error(`o servidor não respondeu em ${ms} ms\nstdout:\n${proc.out.stdout}\nstderr:\n${proc.out.stderr}`);
}

async function waitFor(predicate, ms, label) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await sleep(25);
  }
  assert.fail(`timeout (${ms} ms): ${label}`);
}

function assertHtmlSecurityHeaders(res, label) {
  assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8', `${label}: content-type`);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff', `${label}: nosniff`);
  assert.equal(res.headers.get('x-frame-options'), 'DENY', `${label}: X-Frame-Options`);
  assert.equal(res.headers.get('referrer-policy'), 'no-referrer', `${label}: Referrer-Policy`);
}

function assertJsonHeaders(res, label) {
  assert.match(res.headers.get('content-type') ?? '', /^application\/json;\s*charset=utf-8$/i, `${label}: content-type`);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff', `${label}: nosniff`);
  assert.match(res.headers.get('cache-control') ?? '', /\bno-store\b/, `${label}: Cache-Control no-store`);
}

const pathIncludes = (text, file) => {
  let real = file;
  try { real = realpathSync(file); } catch { /* arquivo pode não existir */ }
  return text.includes(file) || text.includes(real);
};

test('matchRoute classifica rotas com a precedência de REQ-12', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/010-server-router-health.md#Caminho feliz (matchRoute('GET', '/abc-123') → { area: 'redirect', slug }; '/admin/login' → { area: 'admin', rest: ['login'] }; '/api/links/x' → { area: 'api', rest: ['links','x'] }) e #Edge cases; Spec.md#REQ-12; docs/contracts/public-routes.md#GET|HEAD /:slug (roteamento)
  const { matchRoute } = await load('src/router.js');

  await t.test('rotas fixas e slug válido', () => {
    // fonte: docs/issues/010-server-router-health.md#Caminho feliz; Spec.md#REQ-12 "primeiro segmento admin|api|assets|health → rota fixa, nunca slug"
    assert.equal(matchRoute('GET', '/').area, 'root');
    assert.equal(matchRoute('GET', '/health').area, 'health');
    assert.equal(matchRoute('GET', '/admin').area, 'admin');
    assert.equal(matchRoute('GET', '/api').area, 'api');
    const admin = matchRoute('GET', '/admin/login');
    assert.equal(admin.area, 'admin');
    assert.deepEqual([...admin.rest], ['login']);
    const api = matchRoute('GET', '/api/links/x');
    assert.equal(api.area, 'api');
    assert.deepEqual([...api.rest], ['links', 'x']);
    const r = matchRoute('GET', '/abc-123');
    assert.equal(r.area, 'redirect');
    assert.equal(r.slug, 'abc-123');
    assert.equal(matchRoute('GET', '/AbC123').slug, 'AbC123', 'slug é case-sensitive, sem normalizar');
    assert.equal(matchRoute('HEAD', '/abc').area, 'redirect');
  });

  await t.test('multi-segmento, favicon, padrão inválido e /assets → not-found', () => {
    // fonte: docs/issues/010-server-router-health.md#Edge cases ("'/assets/x' nunca vira slug; '/assets' → not-found"; "'/a/b', '/favicon.ico', '/abc_def', '/' + 'a'.repeat(33), '/ação' → not-found"); Spec.md#REQ-12
    for (const path of ['/a/b', '/abc-123/extra', '/favicon.ico', '/abc_def', `/${'a'.repeat(33)}`, '/ação', '/a%C3%A7%C3%A3o']) {
      assert.equal(matchRoute('GET', path).area, 'not-found', path);
    }
    // /assets: o que a Spec fixa é "nunca slug" e 404 na v1 (provado via HTTP abaixo); no router puro,
    // tanto `not-found` quanto uma área reservada `assets` (sem handler → 404) são leituras válidas.
    for (const path of ['/assets', '/assets/x', '/assets/app.css']) {
      const { area } = matchRoute('GET', path);
      assert.ok(['not-found', 'assets'].includes(area), `${path}: área ${area} (esperava not-found ou assets, nunca redirect)`);
    }
    assert.equal(matchRoute('GET', `/${'a'.repeat(32)}`).area, 'redirect', '32 caracteres ainda é slug');
  });

  await t.test('query string preservada fora do slug e barras duplas filtradas', () => {
    // fonte: docs/issues/010-server-router-health.md#Edge cases ("'/abc?x=1' → slug abc, query preservada"; "'//abc' → segmentos vazios filtrados → slug abc [ASSUMIDO]") e #Plano Gotcha 1
    const q = matchRoute('GET', '/abc?x=1');
    assert.equal(q.area, 'redirect');
    assert.equal(q.slug, 'abc');
    assert.equal(matchRoute('GET', '/?utm=1').area, 'root');
    assert.equal(matchRoute('GET', '/health?probe=1').area, 'health');
    const dbl = matchRoute('GET', '//abc');
    assert.equal(dbl.area, 'redirect');
    assert.equal(dbl.slug, 'abc');
  });
});

test('createServer: erro inesperado num handler vira 500 sem stack (HTML fora de /api, JSON em /api) e o log no stderr não traz headers da request', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/010-server-router-health.md#Erros ("Handler lança erro inesperado → 500 (JSON em /api*, HTML genérico 'Erro interno' nas demais), console.error(err.message) sem headers da request, sem stack") e #Plano (createServer({ store, config, now, handlers }) aceita handlers extras); Spec.md#REQ-3, #REQ-38, #REQ-40; docs/contracts/public-routes.md#Erros não tratados
  const { createServer } = await load('src/server.js');
  const dir = tempDir(t);
  const store = {
    load: async () => {},
    save: async () => {},
    get: () => undefined,
    has: () => false,
    set: () => {},
    list: () => [],
    filePath: join(dir, 'links.json'),
  };
  const config = Object.freeze({
    adminToken: TOKEN,
    port: 0,
    dataFile: join(dir, 'links.json'),
    baseUrl: 'http://short.test',
    sessionSecret: Buffer.alloc(32, 7),
    warnings: Object.freeze([]),
  });
  const server = createServer({
    store,
    config,
    now: () => new Date('2026-11-20T12:00:00.000Z'),
    handlers: {
      health: () => { throw new Error('boom-sincrono'); },
      root: async () => { throw new Error('boom-assincrono'); },
      api: () => { throw new Error('boom-api'); },
    },
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { server.closeAllConnections?.(); server.close(() => resolve()); }));
  const base = `http://127.0.0.1:${server.address().port}`;

  const secretHeaders = {
    Authorization: 'Bearer sekret-bearer-value',
    Cookie: 'session=sekret-cookie-value',
    'X-Hidden-Probe': 'sekret-header-value',
  };
  let captured = '';
  const originalWrite = process.stderr.write;
  process.stderr.write = function capture(chunk, ...rest) {
    captured += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    return originalWrite.call(this, chunk, ...rest);
  };
  let htmlSync;
  let htmlAsync;
  let api;
  try {
    htmlSync = await fetch(`${base}/health`, { headers: secretHeaders });
    htmlSync = { res: htmlSync, body: await htmlSync.text() };
    htmlAsync = await fetch(`${base}/`, { headers: secretHeaders, redirect: 'manual' });
    htmlAsync = { res: htmlAsync, body: await htmlAsync.text() };
    api = await fetch(`${base}/api/links`, { headers: secretHeaders });
    api = { res: api, body: await api.text() };
    await new Promise((r) => setImmediate(r));
    await sleep(20);
  } finally {
    process.stderr.write = originalWrite;
  }

  for (const [label, { res, body }] of [['handler síncrono', htmlSync], ['handler assíncrono', htmlAsync]]) {
    assert.equal(res.status, 500, `${label}: status`);
    assertHtmlSecurityHeaders(res, label);
    assert.ok(body.includes('Erro interno'), `${label}: página genérica "Erro interno"`);
    assert.equal(body.includes('boom'), false, `${label}: mensagem do erro não pode vazar na resposta`);
    assert.doesNotMatch(body, STACK_LINE, `${label}: sem stack trace na resposta`);
  }

  assert.equal(api.res.status, 500);
  assertJsonHeaders(api.res, '/api 500');
  assert.deepEqual(JSON.parse(api.body), { error: 'INTERNAL', message: 'Erro interno' });

  assert.ok(captured.includes('boom-sincrono'), 'o erro deve ser registrado no stderr');
  assert.equal(/sekret-/.test(captured), false, 'o log de erro não pode conter headers da request');
});

test('test/helpers/server.js: startTestServer() usa porta efêmera e DATA_FILE temporário, grava os links iniciais e para com stop()', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/010-server-router-health.md#Arquivos a criar (startTestServer({ links, now, shortBaseUrl = 'http://short.test', adminToken = 'test-token' }) → { baseUrl, shortBaseUrl, token, dataFile, dir, store, readData(), stop() }) e #Critérios NFR-5 ("dataFile começa com os.tmpdir() e porta ≠ 3000"); Spec.md#NFR-5; steering/testing.md#Regras dos testes
  const { startTestServer } = await load('test/helpers/server.js');
  const link = {
    slug: 'abc123',
    url: 'https://loja.exemplo.com/p?utm_source=wa',
    clicks: 0,
    lastAccessAt: null,
    active: true,
    expiresAt: null,
    createdAt: '2026-11-20T12:00:00.000Z',
  };
  const a = await startTestServer({ links: [link] });
  const b = await startTestServer();
  const stopped = new Set();
  t.after(async () => {
    for (const s of [a, b]) if (!stopped.has(s)) await s.stop();
  });

  assert.equal(a.token, 'test-token');
  assert.equal(a.shortBaseUrl, 'http://short.test');
  const port = new URL(a.baseUrl).port;
  assert.ok(port !== '' && port !== '3000', `porta efêmera esperada, veio ${a.baseUrl}`);
  assert.notEqual(a.baseUrl, b.baseUrl, 'cada servidor de teste tem sua porta');
  assert.notEqual(a.dataFile, b.dataFile, 'cada servidor de teste tem seu DATA_FILE');
  const tmpReal = realpathSync(tmpdir());
  assert.ok(realpathSync(a.dataFile).startsWith(tmpReal + sep), `DATA_FILE fora do tmp: ${a.dataFile}`);
  assert.equal(typeof a.dir, 'string');
  assert.ok(realpathSync(a.dataFile).startsWith(realpathSync(a.dir) + sep), 'DATA_FILE dentro de dir');

  const health = await fetch(`${a.baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });

  const raw = await a.readData();
  const doc = typeof raw === 'string' ? JSON.parse(raw) : raw;
  assert.equal(doc.version, 1);
  assert.deepEqual(doc.links.map((l) => l.slug), ['abc123']);
  assert.equal(a.store.get('abc123')?.url, link.url, 'store exposto já carregado com os links iniciais');

  await a.stop();
  stopped.add(a);
  await assert.rejects(fetch(`${a.baseUrl}/health`, { signal: AbortSignal.timeout(2_000) }), 'depois de stop() o servidor não responde mais');
});

test('node src/server.js sobe de verdade: cria DATA_FILE, loga porta e BASE_URL, serve /health, /, 404 HTML/JSON e encerra com SIGTERM', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/010-server-router-health.md#Caminho feliz, #Edge cases e #Done when ("main() via spawn ... com tudo ok → linha de log com porta e BASE_URL, GET /health 200, processo encerra em SIGTERM"); Spec.md#REQ-2, #REQ-3, #REQ-12, #REQ-36, #REQ-38; docs/contracts/public-routes.md
  const dir = tempDir(t);
  const dataFile = join(dir, 'nao', 'existe', 'links.json');
  const port = await freePort();
  const BASE_URL = 'https://go.hidden-bench.test';
  const proc = spawnServer(t, { ADMIN_TOKEN: TOKEN, PORT: String(port), DATA_FILE: dataFile, BASE_URL });
  const base = await waitReady(proc, port);

  await t.test('cria o DATA_FILE ausente (com diretório) e loga uma linha no stdout com a porta e o BASE_URL', async () => {
    // fonte: Spec.md#REQ-2 (1) "criar o diretório pai e o arquivo com {"version":1,"links":[]} antes de aceitar conexões", #REQ-3 "registrar uma linha no stdout com a porta e o BASE_URL"; docs/issues/010-server-router-health.md#Caminho feliz (log "Encurtador escutando em ... (BASE_URL=...)")
    assert.deepEqual(JSON.parse(readFileSync(dataFile, 'utf8')), { version: 1, links: [] });
    await waitFor(() => proc.out.stdout.split('\n').some((l) => l.includes(String(port)) && l.includes(BASE_URL)), 3_000, 'linha de log com porta e BASE_URL no stdout');
  });

  await t.test('GET /health → 200 {"status":"ok"} com no-store e nosniff, sem tocar no DATA_FILE', async () => {
    // fonte: Spec.md#REQ-36 ("200 com {"status":"ok"} e Cache-Control: no-store, sem autenticação e sem tocar no store"), #REQ-38; docs/contracts/public-routes.md#GET /health
    const before = { mtimeMs: statSync(dataFile).mtimeMs, content: readFileSync(dataFile, 'utf8') };
    for (let i = 0; i < 3; i += 1) {
      const res = await fetch(`${base}/health`);
      assert.equal(res.status, 200);
      assertJsonHeaders(res, 'GET /health');
      assert.deepEqual(await res.json(), { status: 'ok' });
    }
    assert.equal(statSync(dataFile).mtimeMs, before.mtimeMs);
    assert.equal(readFileSync(dataFile, 'utf8'), before.content);
  });

  await t.test('POST /health → 405 JSON com Allow: GET', async () => {
    // fonte: docs/issues/010-server-router-health.md#Edge cases "POST /health → 405 JSON com Allow: GET" e #Done when; docs/contracts/public-routes.md#GET /health ("Outros métodos: 405 JSON com Allow: GET")
    const res = await fetch(`${base}/health`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    assert.equal(res.status, 405);
    assert.match(res.headers.get('allow') ?? '', /\bGET\b/);
    assertJsonHeaders(res, 'POST /health');
    const body = JSON.parse(await res.text());
    assert.equal(typeof body, 'object');
  });

  await t.test('GET / → 302 para /admin com no-store', async () => {
    // fonte: Spec.md#REQ-12 "QUANDO GET / ... 302 para /admin"; docs/contracts/public-routes.md#GET / ("302 Location: /admin, Cache-Control: no-store"); docs/issues/010-server-router-health.md#Done when
    const res = await fetch(`${base}/`, { redirect: 'manual' });
    assert.equal(res.status, 302);
    assert.equal(new URL(res.headers.get('location') ?? '', base).pathname, '/admin');
    assert.match(res.headers.get('cache-control') ?? '', /\bno-store\b/);
    await res.arrayBuffer();
  });

  await t.test('paths sem link, multi-segmento, favicon, padrão inválido e /assets → 404 HTML amigável com headers de segurança', async () => {
    // fonte: Spec.md#REQ-12 ("mais de um segmento, segmento fora de ^[A-Za-z0-9-]{1,32}$ ou /favicon.ico → página 404 amigável"), #REQ-14, #REQ-38, #Páginas (Não encontrado); docs/issues/010-server-router-health.md#Edge cases ("demais → 404 HTML (renderNotFound)")
    for (const path of ['/abc-123', '/a/b', '/favicon.ico', '/abc_def', `/${'a'.repeat(33)}`, '/ação', '/assets', '/assets/x']) {
      const res = await fetch(`${base}${path}`, { redirect: 'manual' });
      assert.equal(res.status, 404, `${path}: status`);
      assertHtmlSecurityHeaders(res, path);
      const html = await res.text();
      for (const text of NOT_FOUND_TEXTS) assert.ok(html.includes(text), `${path}: "${text}"`);
    }
  });

  await t.test('rota /api/* desconhecida → 404 JSON {error: "NOT_FOUND"}', async () => {
    // fonte: docs/issues/010-server-router-health.md#Edge cases "Rota /api/* sem handler → 404 JSON"; Spec.md#Páginas ("Em /api/*, 404 é JSON (NOT_FOUND), não HTML"), #REQ-24, #REQ-38; docs/contracts/links-api.md#Regras gerais (rota /api/* desconhecida, com auth → 404)
    const res = await fetch(`${base}/api/rota-que-nao-existe`, { headers: { Authorization: `Bearer ${TOKEN}` } });
    assert.equal(res.status, 404);
    assertJsonHeaders(res, '/api 404');
    const body = await res.json();
    assert.equal(body.error, 'NOT_FOUND');
    assert.equal(typeof body.message, 'string');
  });

  await t.test('SIGTERM encerra o processo', async () => {
    // fonte: docs/issues/010-server-router-health.md#Done when "processo encerra em SIGTERM"
    proc.child.kill('SIGTERM');
    const { code, signal } = await withTimeout(proc.closed, 3_000, 'o servidor deveria encerrar com SIGTERM');
    assert.ok(code !== null || signal !== null);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Falhas de subida (um spawn por teste, cada um com o próprio orçamento de 10 s).
// fonte: docs/issues/010-server-router-health.md#Erros (ADMIN_TOKEN ausente → stderr "ADMIN_TOKEN é obrigatório", exit 1; arquivo inválido → stderr com path e motivo, exit 1, arquivo intacto; PORT ocupada → mensagem clara + exit 1) e #Edge cases (avisos de config no stderr); Spec.md#REQ-1, #REQ-2 (3), #REQ-40; docs/sprints/SPRINT-001-fundacao.md#Success Criteria
const baseEnv = (dir) => ({ ADMIN_TOKEN: TOKEN, PORT: '0', DATA_FILE: join(dir, 'links.json'), BASE_URL: 'https://go.hidden-bench.test' });

for (const [label, token] of [['ADMIN_TOKEN ausente', undefined], ['ADMIN_TOKEN só com espaços', '   ']]) {
  test(`subida: ${label} → exit 1 + "ADMIN_TOKEN é obrigatório" no stderr`, { timeout: 10_000 }, async (t) => {
    // fonte: Spec.md#REQ-1 "ADMIN_TOKEN ausente ou vazio (só espaços) → stderr 'ADMIN_TOKEN é obrigatório' e exit code 1"; docs/sprints/SPRINT-001-fundacao.md#Success Criteria
    const dir = tempDir(t);
    const env = { ...baseEnv(dir), PORT: String(await freePort()) };
    if (token === undefined) delete env.ADMIN_TOKEN;
    else env.ADMIN_TOKEN = token;
    const proc = spawnServer(t, env);
    const { code } = await waitForExit(proc);
    assert.equal(code, 1, `exit code; stderr:\n${proc.out.stderr}`);
    assert.ok(proc.out.stderr.includes('ADMIN_TOKEN é obrigatório'), `stderr:\n${proc.out.stderr}`);
  });
}

test('subida: PORT inválida → exit 1 com mensagem que cita PORT', { timeout: 10_000 }, async (t) => {
  // fonte: Spec.md#REQ-1 "SE PORT não for inteiro entre 1 e 65535 ENTÃO recusar subir com mensagem clara"; docs/issues/008-config.md#Erros ("PORT inválida ...")
  const dir = tempDir(t);
  const proc = spawnServer(t, { ...baseEnv(dir), PORT: 'abc' });
  const { code } = await waitForExit(proc);
  assert.equal(code, 1, `exit code; stderr:\n${proc.out.stderr}`);
  assert.match(proc.out.stderr, /PORT/);
});

const invalidFiles = {
  'arquivo com JSON quebrado': '{"version":1,"links":[',
  'arquivo com url javascript:': `${JSON.stringify({ version: 1, links: [{ slug: 'abc', url: 'javascript:alert(1)', clicks: 0, lastAccessAt: null, active: true, expiresAt: null, createdAt: '2026-11-20T12:00:00.000Z' }] }, null, 2)}\n`,
};
for (const [label, content] of Object.entries(invalidFiles)) {
  test(`subida: ${label} → exit 1, path no stderr, arquivo intacto`, { timeout: 10_000 }, async (t) => {
    // fonte: Spec.md#REQ-2 (3) "recusar subir, informar no stderr o path do arquivo e o motivo, e sair com exit code 1. Nunca sobrescrever"; docs/issues/010-server-router-health.md#Done when "arquivo inválido → exit 1 + arquivo intacto"
    const dir = tempDir(t);
    const env = { ...baseEnv(dir), PORT: String(await freePort()) };
    writeFileSync(env.DATA_FILE, content);
    const mtimeMs = statSync(env.DATA_FILE).mtimeMs;
    const proc = spawnServer(t, env);
    const { code } = await waitForExit(proc);
    assert.equal(code, 1, `exit code; stderr:\n${proc.out.stderr}`);
    assert.ok(pathIncludes(proc.out.stderr, env.DATA_FILE), `stderr deve citar o path do arquivo:\n${proc.out.stderr}`);
    assert.equal(readFileSync(env.DATA_FILE, 'utf8'), content, 'arquivo inválido não pode ser sobrescrito');
    assert.equal(statSync(env.DATA_FILE).mtimeMs, mtimeMs);
  });
}

test('subida: porta ocupada → exit 1 com a porta no stderr', { timeout: 10_000 }, async (t) => {
  // fonte: Spec.md#Comportamentos (Subir o servidor: "PORT ocupada → erro claro e exit 1"); docs/issues/010-server-router-health.md#Erros ("EADDRINUSE capturado → mensagem clara 'Porta 3000 já está em uso' + exit 1")
  const dir = tempDir(t);
  const first = http.createServer();
  await new Promise((resolve) => first.listen(0, resolve));
  const { port } = first.address();
  const occupiers = [first];
  for (const host of ['0.0.0.0', '127.0.0.1', '::1']) {
    const extra = http.createServer();
    const ok = await new Promise((resolve) => {
      extra.once('error', () => resolve(false));
      extra.listen(port, host, () => resolve(true));
    });
    if (ok) occupiers.push(extra);
  }
  t.after(() => Promise.all(occupiers.map((s) => new Promise((resolve) => s.close(() => resolve())))));
  const proc = spawnServer(t, { ...baseEnv(dir), PORT: String(port) });
  const { code } = await waitForExit(proc);
  assert.equal(code, 1, `exit code; stderr:\n${proc.out.stderr}`);
  assert.ok(proc.out.stderr.includes(String(port)), `stderr deve citar a porta ${port}:\n${proc.out.stderr}`);
});

test('subida: ADMIN_TOKEN curto sobe e avisa no stderr, sem escrever o token', { timeout: 10_000 }, async (t) => {
  // fonte: Spec.md#REQ-1 "SE ADMIN_TOKEN tiver menos de 16 caracteres ENTÃO subir mesmo assim e avisar no stderr", #REQ-40 "NUNCA escrever ADMIN_TOKEN em log"; docs/issues/010-server-router-health.md#Edge cases "Avisos de config (warnings) impressos no stderr"
  const dir = tempDir(t);
  const secret = 'zq-segredo7';
  const port = await freePort();
  const proc = spawnServer(t, { ...baseEnv(dir), ADMIN_TOKEN: secret, PORT: String(port) });
  const base = await waitReady(proc, port);
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  await res.arrayBuffer();
  await waitFor(() => proc.out.stderr.trim().length > 0, 2_000, 'aviso de token curto no stderr');
  assert.match(proc.out.stderr, /ADMIN_TOKEN|16|curto/i);
  await waitFor(() => proc.out.stdout.includes(String(port)), 2_000, 'log de escuta');
  assert.equal(proc.out.stderr.includes(secret), false, 'o token não pode aparecer no stderr');
  assert.equal(proc.out.stdout.includes(secret), false, 'o token não pode aparecer no stdout');
});

// Timeout acima de 10 s de propósito: roda a suíte inteira do implementador (tamanho fora do nosso controle).
test('a suíte do próprio projeto passa: node --test \'test/**/*.test.js\'', { timeout: 30_000 }, () => {
  // fonte: docs/issues/010-server-router-health.md#Done when "Todos os testes do projeto passam" e #Gate; docs/sprints/SPRINT-001-fundacao.md#Success Criteria "node --test 'test/**/*.test.js' verde"; steering/testing.md#Comandos reais
  const env = { PATH: process.env.PATH };
  if (process.env.TMPDIR) env.TMPDIR = process.env.TMPDIR;
  const r = spawnSync(process.execPath, ['--test', 'test/**/*.test.js'], { cwd: ROOT, env, encoding: 'utf8', timeout: 25_000 });
  const tail = `${r.stdout ?? ''}\n${r.stderr ?? ''}`.split('\n').slice(-60).join('\n');
  assert.equal(r.status, 0, `suíte do projeto falhou (status=${r.status}, signal=${r.signal}):\n${tail}`);
  assert.match(r.stdout ?? '', /# pass [1-9]|ℹ pass [1-9]/, 'a suíte deveria executar ao menos um teste');
});
