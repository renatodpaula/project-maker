// Suíte oculta — SPRINT-001 / Issue 006: src/lib/http.js + src/lib/errors.js (REQ-24, REQ-38, tabela código → HTTP).
// Uso: PROJECT_ROOT=/caminho/absoluto node --test 006-http.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.env.PROJECT_ROOT;
assert.ok(ROOT && isAbsolute(ROOT), 'defina PROJECT_ROOT com o caminho absoluto do projeto sob teste');
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const httpLib = () => load('src/lib/http.js');
const errorsLib = () => load('src/lib/errors.js');

const EXPECTED_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN_ORIGIN: 403,
  INVALID_URL: 400,
  INVALID_SLUG: 400,
  SLUG_RESERVED: 400,
  INVALID_EXPIRATION: 400,
  INVALID_BODY: 400,
  SLUG_TAKEN: 409,
  PAYLOAD_TOO_LARGE: 413,
  NOT_FOUND: 404,
  UNSUPPORTED_MEDIA_TYPE: 415,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL: 500,
};

// Textos fixados na Spec ("Mensagem de erro") e nos contratos links-api / admin-pages / public-routes.
const EXPECTED_MESSAGES = {
  UNAUTHORIZED: 'Autenticação necessária',
  FORBIDDEN_ORIGIN: 'Origem não permitida. Verifique BASE_URL.',
  INVALID_URL: 'URL inválida. Use um endereço que comece com http:// ou https://',
  INVALID_SLUG: 'Apelido inválido: use 3 a 32 caracteres com letras minúsculas, números e hífen',
  SLUG_RESERVED: 'Esse apelido é reservado',
  SLUG_TAKEN: 'Esse apelido já está em uso',
  INVALID_EXPIRATION: 'Data de expiração inválida ou no passado',
  INVALID_BODY: 'Corpo da requisição inválido',
  PAYLOAD_TOO_LARGE: 'Corpo da requisição muito grande',
  UNSUPPORTED_MEDIA_TYPE: 'Tipo de conteúdo não suportado',
  INTERNAL: 'Erro interno',
};

/** Sobe um http.Server real em porta efêmera; `handler` recebe (req, res, url). */
async function startServer(t, handler) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    Promise.resolve()
      .then(() => handler(req, res, url))
      .catch((err) => {
        if (!res.headersSent) res.writeHead(599, { 'Content-Type': 'text/plain' });
        if (!res.writableEnded) res.end(`erro no handler de teste: ${err?.message}`);
      });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => {
    server.closeAllConnections?.();
    server.close(() => resolve());
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`timeout (${ms} ms): ${label}`)), ms); }),
  ]).finally(() => clearTimeout(timer));
}

test('tabela de códigos: STATUS_BY_CODE com exatamente os 13 códigos da Spec, statusForCode (desconhecido → 500), BODY_LIMIT = 65536; errors.js: DomainError, createError, isDomainError e MESSAGES', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/006-lib-http.md#Arquivos a criar (STATUS_BY_CODE ..., BODY_LIMIT = 65536) e #Done when "cobre os 13 códigos da Spec; desconhecido → 500"; Spec.md#Códigos de erro de domínio → HTTP
  const { STATUS_BY_CODE, statusForCode, BODY_LIMIT } = await httpLib();
  // A issue fixa as 13 chaves e os valores, não a forma: objeto plano ou Map.
  const isMap = STATUS_BY_CODE instanceof Map;
  const tableKeys = isMap ? [...STATUS_BY_CODE.keys()] : Object.keys(STATUS_BY_CODE);
  const tableGet = (code) => (isMap ? STATUS_BY_CODE.get(code) : STATUS_BY_CODE[code]);
  assert.deepEqual([...tableKeys].sort(), Object.keys(EXPECTED_STATUS).sort());
  for (const [code, status] of Object.entries(EXPECTED_STATUS)) {
    assert.equal(tableGet(code), status, `STATUS_BY_CODE.${code}`);
    assert.equal(statusForCode(code), status, `statusForCode('${code}')`);
  }
  assert.equal(statusForCode('X'), 500);
  assert.equal(statusForCode('CODIGO_QUE_NAO_EXISTE'), 500);
  assert.equal(BODY_LIMIT, 65536);

  // errors.js
  // fonte: docs/issues/006-lib-http.md#Erros "DomainError tem code, message (pt-BR) e name = 'DomainError'; isDomainError(err) distingue"; #Arquivos a criar (createError, MESSAGES "textos exatos da seção Mensagem de erro"); docs/contracts/links-api.md#POST erros
  const { DomainError, createError, isDomainError, MESSAGES } = await errorsLib();
  const err = new DomainError('SLUG_TAKEN', 'mensagem própria');
  assert.ok(err instanceof Error);
  assert.equal(err.name, 'DomainError');
  assert.equal(err.code, 'SLUG_TAKEN');
  assert.equal(err.message, 'mensagem própria');

  // Sem mensagem explícita: cai na mensagem padrão em pt-BR do código (ex.: DomainError('PAYLOAD_TOO_LARGE') no readBody).
  const byDefault = new DomainError('PAYLOAD_TOO_LARGE');
  assert.equal(byDefault.code, 'PAYLOAD_TOO_LARGE');
  assert.equal(byDefault.message, MESSAGES.PAYLOAD_TOO_LARGE);

  const created = createError('INVALID_URL');
  assert.ok(created instanceof DomainError);
  assert.equal(created.code, 'INVALID_URL');
  assert.equal(created.message, MESSAGES.INVALID_URL);
  assert.equal(createError('INVALID_BODY', 'Só é possível desativar').message, 'Só é possível desativar');

  assert.equal(isDomainError(err), true);
  assert.equal(isDomainError(created), true);
  assert.equal(isDomainError(new Error('x')), false);
  assert.equal(isDomainError(new TypeError('bug de programação')), false);

  for (const [code, text] of Object.entries(EXPECTED_MESSAGES)) assert.equal(MESSAGES[code], text, `MESSAGES.${code}`);
  assert.ok(['Rota não encontrada', 'Link não encontrado'].includes(MESSAGES.NOT_FOUND), `MESSAGES.NOT_FOUND = ${MESSAGES.NOT_FOUND}`);
  assert.equal(typeof MESSAGES.METHOD_NOT_ALLOWED, 'string');
  assert.ok(MESSAGES.METHOD_NOT_ALLOWED.length > 0);
});

test('sendJson, sendHtml e redirect emitem os headers de REQ-24/REQ-38; sendJson não lança com headersSent', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/006-lib-http.md#Caminho feliz (sendJson 201 + Location; sendHtml com cacheControl; redirect 302/303 com Location + no-store, corpo vazio) e #Edge cases "sendJson com res.headersSent já true → não lança"; Spec.md#REQ-24, #REQ-38
  const { sendJson, sendHtml, redirect } = await httpLib();
  let headersSentThrew = null;
  const base = await startServer(t, (req, res, url) => {
    switch (url.pathname) {
      case '/json': return sendJson(res, 201, { ok: true, texto: 'ação' }, { Location: '/api/links/x' });
      case '/html': return sendHtml(res, 200, '<p>olá</p>', { cacheControl: 'no-store' });
      case '/html-cache': return sendHtml(res, 404, '<p>x</p>', { cacheControl: 'public, max-age=60' });
      case '/r302': return redirect(res, 302, 'https://loja.com/p?utm_source=wa&x=%20y');
      case '/r303': return redirect(res, 303, '/admin?created=abc');
      case '/sent': {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.write('parcial');
        try {
          sendJson(res, 500, { error: 'INTERNAL', message: 'Erro interno' });
          headersSentThrew = false;
        } catch {
          headersSentThrew = true;
        }
        if (!res.writableEnded) res.end();
        return undefined;
      }
      default: res.writeHead(404); return res.end();
    }
  });

  const json = await fetch(`${base}/json`);
  assert.equal(json.status, 201);
  assert.equal(json.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(json.headers.get('x-content-type-options'), 'nosniff');
  assert.match(json.headers.get('cache-control') ?? '', /\bno-store\b/);
  assert.equal(json.headers.get('location'), '/api/links/x');
  assert.deepEqual(await json.json(), { ok: true, texto: 'ação' });

  const page = await fetch(`${base}/html`);
  assert.equal(page.status, 200);
  assert.equal(page.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(page.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(page.headers.get('x-frame-options'), 'DENY');
  assert.equal(page.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(page.headers.get('cache-control'), 'no-store');
  assert.equal(await page.text(), '<p>olá</p>');

  const cached = await fetch(`${base}/html-cache`);
  assert.equal(cached.status, 404);
  assert.equal(cached.headers.get('cache-control'), 'public, max-age=60');
  assert.equal(cached.headers.get('x-frame-options'), 'DENY');
  await cached.arrayBuffer();

  const r302 = await fetch(`${base}/r302`, { redirect: 'manual' });
  assert.equal(r302.status, 302);
  assert.equal(r302.headers.get('location'), 'https://loja.com/p?utm_source=wa&x=%20y');
  assert.match(r302.headers.get('cache-control') ?? '', /\bno-store\b/);
  assert.equal(await r302.text(), '');

  const r303 = await fetch(`${base}/r303`, { redirect: 'manual' });
  assert.equal(r303.status, 303);
  assert.equal(r303.headers.get('location'), '/admin?created=abc');
  assert.match(r303.headers.get('cache-control') ?? '', /\bno-store\b/);
  await r303.arrayBuffer();

  const sent = await fetch(`${base}/sent`);
  assert.equal(sent.status, 200);
  await sent.arrayBuffer();
  assert.equal(headersSentThrew, false, 'sendJson não pode lançar quando os headers já foram enviados');
});

/**
 * Servidor que lê o corpo com readBody(req, { limit }) e registra o resultado por id (?id=…&limit=…).
 * Em erro, segue o padrão documentado no plano: responde (413) com Connection: close e só então destrói a request.
 */
async function startBodyServer(t) {
  const { readBody, statusForCode } = await httpLib();
  const outcomes = new Map();
  const outcome = (id) => {
    if (!outcomes.has(id)) outcomes.set(id, deferred());
    return outcomes.get(id);
  };
  const base = await startServer(t, async (req, res, url) => {
    const id = url.searchParams.get('id');
    const limit = Number(url.searchParams.get('limit'));
    try {
      const body = await readBody(req, { limit });
      outcome(id).resolve({ ok: true, body });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ length: Buffer.byteLength(body) }));
    } catch (err) {
      outcome(id).resolve({ ok: false, err });
      res.writeHead(statusForCode(err?.code), { 'Content-Type': 'application/json', Connection: 'close' });
      res.end(JSON.stringify({ error: err?.code ?? null }), () => req.destroy());
    }
  });
  return { base, outcome };
}

test('readBody aceita corpo até o limite: 65536 bytes exatos, UTF-8 íntegro entre chunks, limite customizado', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/006-lib-http.md#Done when "readBody ... aceita 65536"; #Caminho feliz "await readBody(req, { limit: 65536 }) → string UTF-8"; Spec.md#REQ-24
  const { base, outcome } = await startBodyServer(t);

  // 65 536 bytes exatos: aceito.
  const exact = await fetch(`${base}/?id=exact&limit=65536`, { method: 'POST', body: 'a'.repeat(65536) });
  assert.equal(exact.status, 200);
  assert.deepEqual(await exact.json(), { length: 65536 });
  const exactOutcome = await outcome('exact').promise;
  assert.equal(exactOutcome.ok, true);
  assert.equal(exactOutcome.body, 'a'.repeat(65536));

  // UTF-8 multibyte (com deslocamento de 1 byte para caracteres cruzarem a fronteira entre chunks).
  const multibyte = `a${'ç'.repeat(50_000)}`;
  const utf = await fetch(`${base}/?id=utf8&limit=200000`, { method: 'POST', body: multibyte });
  assert.equal(utf.status, 200);
  await utf.arrayBuffer();
  const utfOutcome = await outcome('utf8').promise;
  assert.equal(utfOutcome.ok, true);
  assert.equal(utfOutcome.body, multibyte, 'o corpo precisa voltar como string UTF-8 íntegra');

  // O limite passado é respeitado: 10 bytes com limit 10 → aceito.
  const ten = await fetch(`${base}/?id=ten&limit=10`, { method: 'POST', body: '0123456789' });
  assert.equal(ten.status, 200);
  await ten.arrayBuffer();
  const tenOutcome = await outcome('ten').promise;
  assert.equal(tenOutcome.ok, true);
  assert.equal(tenOutcome.body, '0123456789');
});

test('readBody rejeita acima do limite com DomainError PAYLOAD_TOO_LARGE, sem esperar o fim do corpo e sem confiar em Content-Length; o chamador consegue responder 413', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/006-lib-http.md#Done when "rejeita com PAYLOAD_TOO_LARGE acima de 65536 bytes (teste envia 70 000 bytes)"; #Edge cases "rejeita ... assim que a soma dos chunks passa do limite (não confia em Content-Length), e o chamador responde 413 antes de req.destroy()"; Spec.md#REQ-24 "413 PAYLOAD_TOO_LARGE e encerrar a leitura"
  const { isDomainError } = await errorsLib();
  const { base, outcome } = await startBodyServer(t);

  // Limite customizado: 11 bytes com limit 10 → rejeitado.
  await fetch(`${base}/?id=eleven&limit=10`, { method: 'POST', body: '0123456789X' }).then((r) => r.arrayBuffer()).catch(() => {});
  const eleven = await outcome('eleven').promise;
  assert.equal(eleven.ok, false);
  assert.equal(eleven.err?.code, 'PAYLOAD_TOO_LARGE');

  // 70 000 bytes: DomainError PAYLOAD_TOO_LARGE e o cliente recebe o 413 escrito pelo chamador.
  const big = await fetch(`${base}/?id=big&limit=65536`, { method: 'POST', body: 'b'.repeat(70_000) }).catch((err) => err);
  const bigOutcome = await outcome('big').promise;
  assert.equal(bigOutcome.ok, false);
  assert.equal(bigOutcome.err?.code, 'PAYLOAD_TOO_LARGE');
  assert.equal(isDomainError(bigOutcome.err), true, 'a rejeição deve ser um DomainError');
  assert.ok(big instanceof Response, `o cliente deveria receber a resposta 413 (readBody não pode derrubar o socket antes do chamador responder): ${big?.cause?.code ?? big?.message}`);
  assert.equal(big.status, 413);
  assert.deepEqual(await big.json(), { error: 'PAYLOAD_TOO_LARGE' });

  // Chunked, sem Content-Length e sem terminar o envio: a rejeição tem de sair assim que o total passa do limite.
  const { port } = new URL(base);
  const req = http.request({ host: '127.0.0.1', port, method: 'POST', path: '/?id=chunked&limit=65536', headers: { 'Transfer-Encoding': 'chunked' } });
  req.on('error', () => {});
  req.on('response', (res) => res.resume());
  t.after(() => req.destroy());
  for (let i = 0; i < 7; i += 1) req.write('c'.repeat(10_000));
  const chunked = await withTimeout(outcome('chunked').promise, 4_000, 'readBody deveria rejeitar antes do fim do corpo');
  assert.equal(chunked.ok, false);
  assert.equal(chunked.err?.code, 'PAYLOAD_TOO_LARGE');
});

test('parseJsonBody aceita só objeto JSON plano; o resto vira DomainError INVALID_BODY', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/006-lib-http.md#Edge cases "parseJsonBody('') '{' '[1]' '\"str\"' → DomainError('INVALID_BODY') (só objeto plano é aceito)"; #Done when; Spec.md#REQ-24
  const { parseJsonBody } = await httpLib();
  const { isDomainError } = await errorsLib();
  // `await` tolera implementação síncrona ou assíncrona (a issue fixa o contrato, não a forma).
  assert.deepEqual(await parseJsonBody('{"url":"https://a.b/x","slug":"Black-Friday"}'), { url: 'https://a.b/x', slug: 'Black-Friday' });
  assert.deepEqual(await parseJsonBody('{}'), {});
  assert.deepEqual(await parseJsonBody('{"active":false}'), { active: false });
  for (const raw of ['', '{', '[1]', '"str"', 'null', '42', 'true', 'undefined', "{'a':1}"]) {
    await assert.rejects(
      async () => parseJsonBody(raw),
      (err) => isDomainError(err) && err.code === 'INVALID_BODY',
      `deveria lançar INVALID_BODY para ${JSON.stringify(raw)}`,
    );
  }
});

test('parseFormBody, parseCookies, getBearerToken (sem trim) e hasContentType cobrem os casos de borda', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/006-lib-http.md#Caminho feliz (parseFormBody via URLSearchParams; parseCookies('a=1; session=x.y'); getBearerToken "sem trim" ou null) e #Edge cases (parseCookies(undefined) → {}; cookie sem '=' ignorado; '=' interno preservado; hasContentType com '; charset=utf-8', case-insensitive); docs/contracts/links-api.md "Bearer sem trim()"
  const { parseFormBody, parseCookies, getBearerToken, hasContentType } = await httpLib();

  const form = parseFormBody('url=https%3A%2F%2Floja.com%2Fp%3Futm_source%3Dwa%26x%3D1&slug=Black+Friday&expiresAt=');
  assert.equal(form.url, 'https://loja.com/p?utm_source=wa&x=1');
  assert.equal(form.slug, 'Black Friday');
  assert.equal(form.expiresAt, '');
  assert.equal(parseFormBody('token=a%C3%A7%C3%A3o').token, 'ação');

  const cookies = parseCookies('a=1; session=x.y');
  assert.equal(cookies.a, '1');
  assert.equal(cookies.session, 'x.y');
  assert.equal(Object.keys(parseCookies(undefined)).length, 0);
  const odd = parseCookies('semigual; session=abc==.def=; b=2');
  assert.equal(odd.session, 'abc==.def=', 'split no primeiro "="');
  assert.equal(odd.b, '2');
  assert.equal(Object.hasOwn(odd, 'semigual'), false, 'cookie sem "=" é ignorado');

  const req = (headers) => ({ headers });
  assert.equal(getBearerToken(req({ authorization: 'Bearer abc.def' })), 'abc.def');
  assert.equal(getBearerToken(req({ authorization: 'Bearer  token ' })), ' token ', 'Bearer não pode ser trimado');
  assert.equal(getBearerToken(req({ authorization: 'Basic dXNlcjpwYXNz' })), null);
  assert.equal(getBearerToken(req({})), null);

  assert.equal(hasContentType(req({ 'content-type': 'application/json' }), 'application/json'), true);
  assert.equal(hasContentType(req({ 'content-type': 'application/json; charset=utf-8' }), 'application/json'), true);
  assert.equal(hasContentType(req({ 'content-type': 'Application/JSON; Charset=UTF-8' }), 'application/json'), true);
  assert.equal(hasContentType(req({ 'content-type': 'text/plain' }), 'application/json'), false);
  assert.equal(hasContentType(req({ 'content-type': 'application/x-www-form-urlencoded' }), 'application/json'), false);
  assert.equal(hasContentType(req({ 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' }), 'application/x-www-form-urlencoded'), true);
  assert.equal(hasContentType(req({}), 'application/json'), false);
});
