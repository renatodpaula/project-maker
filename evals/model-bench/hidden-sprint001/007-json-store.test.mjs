// Suíte oculta — SPRINT-001 / Issue 007: src/storage/json-store.js — carga validada, escrita atômica, fila de saves (REQ-2, REQ-33, REQ-34, REQ-35).
// Uso: PROJECT_ROOT=/caminho/absoluto node --test 007-json-store.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as realFs from 'node:fs/promises';
import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.env.PROJECT_ROOT;
assert.ok(ROOT && isAbsolute(ROOT), 'defina PROJECT_ROOT com o caminho absoluto do projeto sob teste');
const storeModule = () => import(pathToFileURL(join(ROOT, 'src/storage/json-store.js')).href);

const LINK_KEYS = ['slug', 'url', 'clicks', 'lastAccessAt', 'active', 'expiresAt', 'createdAt'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'hidden-s001-store-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function makeLink(slug, extra = {}) {
  return {
    slug,
    url: `https://loja.exemplo.com/${slug}?utm_source=whatsapp&utm_campaign=bf`,
    clicks: 0,
    lastAccessAt: null,
    active: true,
    expiresAt: null,
    createdAt: '2026-11-20T12:00:00.000Z',
    ...extra,
  };
}

const VALID_A = makeLink('abc', { clicks: 3, lastAccessAt: '2026-11-28T14:03:11.000Z' });
const VALID_B = makeLink('black-friday', { url: 'http://exemplo.com', active: false, expiresAt: '2026-12-01T02:59:59.000Z', createdAt: '2026-11-21T12:00:00.000Z' });

const pick = (link) => Object.fromEntries(LINK_KEYS.map((k) => [k, link?.[k]]));
const readDoc = (file) => JSON.parse(readFileSync(file, 'utf8'));
const slugsIn = (file) => readDoc(file).links.map((l) => l.slug);

/** Espião sobre node:fs/promises, injetável via createStore({ fs }). */
function makeSpyFs({ renameDelayMs = 15 } = {}) {
  const calls = [];
  const state = { renamesInFlight: 0, maxRenamesInFlight: 0, failNextRename: false };
  const spy = {};
  for (const [name, value] of Object.entries(realFs)) {
    spy[name] = typeof value === 'function'
      ? (...args) => {
          calls.push({ name, args });
          return value(...args);
        }
      : value;
  }
  spy.rename = async (from, to) => {
    calls.push({ name: 'rename', args: [from, to] });
    state.renamesInFlight += 1;
    state.maxRenamesInFlight = Math.max(state.maxRenamesInFlight, state.renamesInFlight);
    try {
      await sleep(renameDelayMs);
      if (state.failNextRename) {
        state.failNextRename = false;
        throw Object.assign(new Error('falha simulada no rename (crash no meio da escrita)'), { code: 'EIO' });
      }
      return await realFs.rename(from, to);
    } finally {
      state.renamesInFlight -= 1;
    }
  };
  return { spy, calls, state };
}

const samePath = (a, b) => resolve(String(a)) === resolve(String(b));
function directWritesTo(calls, filePath) {
  return calls.filter(({ name, args }) => {
    if (!samePath(args[0], filePath)) return false;
    if (['writeFile', 'appendFile', 'truncate', 'copyFile', 'cp'].includes(name)) return true;
    if (name === 'open') return /[wa+]/.test(String(args[1] ?? 'r'));
    return false;
  });
}

test('load() com arquivo ausente cria o diretório pai e o documento inicial {"version":1,"links":[]}', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/007-storage-json-store.md#Caminho feliz "Arquivo ausente → load() cria ... {"version":1,"links":[]} (e o diretório)"; #Arquivos a criar INITIAL_DOCUMENT; Spec.md#REQ-2 (1); docs/data-model.md#3
  const { createStore, INITIAL_DOCUMENT } = await storeModule();
  assert.deepEqual(JSON.parse(JSON.stringify(INITIAL_DOCUMENT)), { version: 1, links: [] });
  const dir = tempDir(t);
  const filePath = join(dir, 'nao', 'existe', 'links.json');
  const store = createStore({ filePath });
  await store.load();
  assert.ok(existsSync(filePath), 'arquivo deveria ter sido criado');
  assert.deepEqual(readDoc(filePath), { version: 1, links: [] });
  assert.equal(existsSync(`${filePath}.tmp`), false, 'nenhum .tmp pode sobrar');
  assert.deepEqual(store.list(), []);
  assert.equal(store.has('abc'), false);
  assert.equal(store.get('abc'), undefined);
});

test('load() carrega os links válidos na ordem do arquivo, list() devolve cópia e o .tmp órfão é removido sem tocar no principal', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/007-storage-json-store.md#Caminho feliz ("2 links válidos → get('abc') devolve o link; list() devolve cópia na ordem do arquivo") e #Edge cases (".tmp órfão presente na subida → removido, arquivo principal intacto"); Spec.md#REQ-2 (2), #REQ-33 (2)
  const { createStore } = await storeModule();
  const dir = tempDir(t);
  const filePath = join(dir, 'links.json');
  const original = `${JSON.stringify({ version: 1, links: [VALID_A, VALID_B] }, null, 2)}\n`;
  writeFileSync(filePath, original);
  writeFileSync(`${filePath}.tmp`, '{"version":1,"links":[{"slug":"parc');
  const store = createStore({ filePath });
  await store.load();

  assert.equal(existsSync(`${filePath}.tmp`), false, '.tmp órfão deveria ter sido removido');
  assert.equal(readFileSync(filePath, 'utf8'), original, 'arquivo principal deve ficar byte a byte igual');

  assert.deepEqual(store.list().map((l) => l.slug), ['abc', 'black-friday']);
  assert.deepEqual(pick(store.get('abc')), VALID_A);
  assert.deepEqual(pick(store.get('black-friday')), VALID_B);
  assert.equal(store.has('abc'), true);
  assert.equal(store.has('ABC'), false, 'slug é case-sensitive');
  assert.equal(store.get('zzz'), undefined);

  const copy = store.list();
  copy.push(makeLink('intruso'));
  copy.length = 0;
  assert.equal(store.list().length, 2, 'mexer no array devolvido por list() não pode alterar o store');
});

test('load() recusa documento inválido com o path na mensagem e nunca toca no arquivo', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/007-storage-json-store.md#Erros (JSON inválido, links não-array, sem slug/url, url não-http(s), clicks, active, datas, slug duplicado → rejeita com path e motivo; "O arquivo não é tocado") e #Edge cases (version ≠ 1); Spec.md#REQ-2 (3); docs/data-model.md#1 e #3
  const { createStore } = await storeModule();
  const doc = (links, version = 1) => JSON.stringify({ version, links }, null, 2);
  const { slug: _omitSlug, ...withoutSlug } = VALID_A;
  const { url: _omitUrl, ...withoutUrl } = VALID_A;
  const cases = {
    'JSON quebrado': '{"version":1,"links":[',
    'links não é array': JSON.stringify({ version: 1, links: {} }),
    'link sem slug': doc([withoutSlug]),
    'slug não-string': doc([{ ...VALID_A, slug: 123 }]),
    'link sem url': doc([withoutUrl]),
    'url javascript:': doc([{ ...VALID_A, url: 'javascript:alert(1)' }]),
    'url ftp:': doc([{ ...VALID_A, url: 'ftp://a.b/x' }]),
    'clicks negativo': doc([{ ...VALID_A, clicks: -1 }]),
    'clicks fracionário': doc([{ ...VALID_A, clicks: 1.5 }]),
    'active como string': doc([{ ...VALID_A, active: 'true' }]),
    'lastAccessAt inválida': doc([{ ...VALID_A, lastAccessAt: 'ontem' }]),
    'expiresAt inválida': doc([{ ...VALID_A, expiresAt: 'nunca' }]),
    'createdAt inválida': doc([{ ...VALID_A, createdAt: 'x' }]),
    'slug duplicado': doc([VALID_A, { ...VALID_B, slug: 'abc' }]),
    'version 2': doc([VALID_A], 2),
  };
  for (const [label, content] of Object.entries(cases)) {
    await t.test(label, async (st) => {
      // fonte: docs/issues/007-storage-json-store.md#Plano "Casos de teste" (recusa cada documento inválido sem tocar no arquivo)
      const dir = tempDir(st);
      const filePath = join(dir, 'links.json');
      writeFileSync(filePath, content);
      const before = { mtimeMs: statSync(filePath).mtimeMs, entries: readdirSync(dir).sort() };
      const store = createStore({ filePath });
      // O path pode aparecer como foi passado ou resolvido (realpath — no macOS /var → /private/var).
      const realPath = realpathSync(filePath);
      await assert.rejects(store.load(), (err) => {
        assert.ok(err instanceof Error, 'deve rejeitar com Error');
        const msg = String(err.message);
        assert.ok(msg.includes(filePath) || msg.includes(realPath), `a mensagem deve incluir o path; veio: ${err.message}`);
        assert.ok(msg.length > Math.min(filePath.length, realPath.length), 'a mensagem deve trazer também o motivo');
        return true;
      });
      assert.equal(readFileSync(filePath, 'utf8'), content, 'conteúdo tem de ficar byte a byte igual');
      assert.equal(statSync(filePath).mtimeMs, before.mtimeMs, 'mtime não pode mudar');
      assert.deepEqual(readdirSync(dir).sort(), before.entries, 'nenhum arquivo novo (.tmp etc.) no diretório');
    });
  }
});

test('save() grava o formato de REQ-35: 7 chaves na ordem do data-model, indentação 2, sem shortUrl/status, sem .tmp; set() sozinho não persiste', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/007-storage-json-store.md#Caminho feliz "set(link); await save() → ... indentado com 2 espaços, chaves na ordem do data-model, sem shortUrl/status; nenhum .tmp sobra"; Spec.md#REQ-33 (JSON indentado com 2 espaços), #REQ-35; docs/data-model.md#4 "set() só muda memória"
  const { createStore } = await storeModule();
  const dir = tempDir(t);
  const filePath = join(dir, 'links.json');
  const store = createStore({ filePath });
  await store.load();
  const initial = readFileSync(filePath, 'utf8');

  const scrambled = {
    status: 'active',
    createdAt: '2026-11-20T12:00:00.000Z',
    shortUrl: 'https://go.agencia.com/promo',
    active: true,
    url: 'https://loja.exemplo.com/promo?utm_source=whatsapp&utm_campaign=bf&x=%20y',
    expiresAt: '2026-12-01T02:59:59.000Z',
    slug: 'promo',
    lastAccessAt: null,
    clicks: 0,
  };
  store.set(scrambled);
  assert.equal(readFileSync(filePath, 'utf8'), initial, 'set() não pode escrever no disco');

  await store.save();
  const text = readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(text);
  assert.equal(text.trimEnd(), JSON.stringify(parsed, null, 2), 'JSON indentado com 2 espaços');
  assert.deepEqual(Object.keys(parsed), ['version', 'links']);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.links.length, 1);
  assert.deepEqual(Object.keys(parsed.links[0]), LINK_KEYS, 'exatamente as 7 chaves, na ordem do data-model');
  assert.deepEqual(parsed.links[0], pick(scrambled));
  assert.equal(existsSync(`${filePath}.tmp`), false, 'nenhum .tmp pode sobrar');

  // Round-trip: um store novo lê o que foi salvo.
  const again = createStore({ filePath });
  await again.load();
  assert.deepEqual(pick(again.get('promo')), pick(scrambled));
});

test('saves concorrentes: todos resolvem, o arquivo final contém todas as mutações e um leitor nunca vê arquivo parcial', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/007-storage-json-store.md#Edge cases "Dois save() disparados sem await ... ambos resolvem, o conteúdo final reflete as duas mutações"; Spec.md#REQ-33 (DATA_FILE sempre íntegro), #REQ-34 ("dois cliques simultâneos resultem em duas escritas ordenadas ... o segundo save() persiste o estado que inclui o primeiro")
  const { createStore } = await storeModule();
  const dir = tempDir(t);
  const filePath = join(dir, 'links.json');
  const store = createStore({ filePath });
  await store.load();
  for (let i = 0; i < 200; i += 1) store.set(makeLink(`base-${i}`, { url: `https://loja.exemplo.com/${'p'.repeat(200)}/${i}` }));
  await store.save();

  let stop = false;
  let reads = 0;
  const readerErrors = [];
  const reader = (async () => {
    while (!stop) {
      try {
        const doc = JSON.parse(await realFs.readFile(filePath, 'utf8'));
        if (doc.version !== 1 || !Array.isArray(doc.links)) throw new Error('documento sem o formato esperado');
        reads += 1;
      } catch (err) {
        readerErrors.push(err.message);
      }
      await new Promise((r) => setImmediate(r));
    }
  })();

  // Dois cliques: A, save, B, save — sem await entre eles.
  store.set(makeLink('click-a'));
  const p1 = store.save();
  store.set(makeLink('click-b'));
  const p2 = store.save();
  const rest = [];
  for (let i = 0; i < 25; i += 1) {
    store.set(makeLink(`burst-${i}`));
    rest.push(store.save());
  }
  const results = await Promise.allSettled([p1, p2, ...rest]);
  stop = true;
  await reader;

  const rejected = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message);
  assert.deepEqual(rejected, [], 'nenhum save concorrente pode falhar');
  const slugs = new Set(slugsIn(filePath));
  for (const s of ['click-a', 'click-b', ...Array.from({ length: 25 }, (_, i) => `burst-${i}`), 'base-0', 'base-199']) {
    assert.ok(slugs.has(s), `arquivo final sem a mutação ${s}`);
  }
  assert.equal(slugs.size, 227);
  assert.ok(reads > 0, 'o leitor concorrente deveria ter lido o arquivo ao menos uma vez');
  assert.deepEqual(readerErrors, [], 'um leitor concorrente nunca pode ver o DATA_FILE parcial/ausente');
  assert.equal(existsSync(`${filePath}.tmp`), false, 'nenhum .tmp pode sobrar');
});

test('com fs injetado: toda escrita vai para <arquivo>.tmp + rename, renames nunca se sobrepõem, e um rename que falha não corrompe o arquivo nem envenena a fila', { timeout: 10_000 }, async (t) => {
  // fonte: docs/issues/007-storage-json-store.md#Arquivos a criar "createStore({ filePath, fs = fsPromises }) (fs injetável só para o teste de serialização)"; #Edge cases ("espião em rename prova que as chamadas foram sequenciais"; "save() após um save() que falhou continua funcionando"); #Plano Invariantes 1-3 e casos de teste ("injetar fs.rename que falha 1x"); Spec.md#REQ-33, #REQ-34
  const { createStore } = await storeModule();
  const dir = tempDir(t);
  const filePath = join(dir, 'links.json');
  const tmpPath = `${filePath}.tmp`;
  const { spy, calls, state } = makeSpyFs();
  const store = createStore({ filePath, fs: spy });

  await store.load(); // arquivo ausente: o documento inicial também passa por tmp + rename
  assert.deepEqual(readDoc(filePath), { version: 1, links: [] });

  store.set(makeLink('a'));
  const p1 = store.save();
  store.set(makeLink('b'));
  const p2 = store.save();
  store.set(makeLink('c'));
  const p3 = store.save();
  await Promise.all([p1, p2, p3]);

  const renames = calls.filter((c) => c.name === 'rename');
  assert.ok(renames.length >= 3, `esperava rename no load e nos saves; houve ${renames.length} (o fs injetado precisa ser usado)`);
  for (const { args } of renames) {
    assert.ok(samePath(args[0], tmpPath), `rename deveria partir de ${tmpPath}, partiu de ${args[0]}`);
    assert.ok(samePath(args[1], filePath), `rename deveria chegar em ${filePath}, chegou em ${args[1]}`);
  }
  assert.equal(state.maxRenamesInFlight, 1, 'renames concorrentes (cruzados) detectados');
  assert.deepEqual(directWritesTo(calls, filePath).map((c) => c.name), [], 'nunca escrever direto no DATA_FILE');
  assert.deepEqual(slugsIn(filePath), ['a', 'b', 'c']);

  // Crash simulado no rename: o save falha, o DATA_FILE continua com o estado anterior completo.
  const before = readFileSync(filePath, 'utf8');
  state.failNextRename = true;
  store.set(makeLink('d'));
  await assert.rejects(store.save(), 'o save cujo rename falhou deve rejeitar para quem chamou');
  assert.equal(readFileSync(filePath, 'utf8'), before, 'DATA_FILE tem de permanecer íntegro (estado anterior)');

  // A fila não fica envenenada: o próximo save funciona e inclui tudo que está em memória.
  store.set(makeLink('e'));
  await store.save();
  assert.deepEqual(slugsIn(filePath), ['a', 'b', 'c', 'd', 'e']);
  assert.equal(state.maxRenamesInFlight, 1);

  // Um processo novo sobe normalmente com o arquivo resultante.
  const fresh = createStore({ filePath });
  await fresh.load();
  assert.deepEqual(fresh.list().map((l) => l.slug), ['a', 'b', 'c', 'd', 'e']);
  assert.equal(existsSync(tmpPath), false);
});
