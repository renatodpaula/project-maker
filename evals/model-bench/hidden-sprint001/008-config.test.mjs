// Suíte oculta — SPRINT-001 / Issue 008: src/config.js — variáveis de ambiente, validação, segredo de sessão (REQ-1).
// Uso: PROJECT_ROOT=/caminho/absoluto node --test 008-config.test.mjs
// (O exit 1 + stderr de `node src/server.js` sem ADMIN_TOKEN é provado via spawn em 010-server.test.mjs.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.env.PROJECT_ROOT;
assert.ok(ROOT && isAbsolute(ROOT), 'defina PROJECT_ROOT com o caminho absoluto do projeto sob teste');
const config = () => import(pathToFileURL(join(ROOT, 'src/config.js')).href);

const TOKEN = 'um-token-bem-longo-1234';
// HMAC-SHA256(chave = TOKEN, mensagem = 'link-shortener-session-v1'), calculado fora da suíte (sem node:crypto aqui).
const EXPECTED_DERIVED_SECRET_HEX = '62ea953884ccc16ceb0c56e908483ee492c692df65558643e3131ab71a96ce9a';

function withProcessEnv(vars, fn) {
  const saved = {};
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test('defaults: porta 3000, BASE_URL http://localhost:3000, DATA_FILE data/links.json resolvido no cwd, sem avisos, objeto congelado; constantes exportadas', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/008-config.md#Caminho feliz (loadConfig({ ADMIN_TOKEN }) → port 3000, dataFile <cwd>/data/links.json, baseUrl 'http://localhost:3000', warnings []); #Descrição "Devolve um objeto congelado"; #Arquivos a criar (SESSION_SECRET_LABEL, DEFAULT_PORT, MIN_TOKEN_LENGTH); Spec.md#REQ-1
  const { loadConfig, SESSION_SECRET_LABEL, DEFAULT_PORT, MIN_TOKEN_LENGTH } = await config();
  assert.equal(SESSION_SECRET_LABEL, 'link-shortener-session-v1');
  assert.equal(DEFAULT_PORT, 3000);
  assert.equal(MIN_TOKEN_LENGTH, 16);
  const cfg = loadConfig({ ADMIN_TOKEN: TOKEN });
  assert.equal(cfg.adminToken, TOKEN);
  assert.equal(cfg.port, 3000);
  assert.equal(cfg.baseUrl, 'http://localhost:3000');
  assert.equal(cfg.dataFile, resolve(process.cwd(), 'data/links.json'));
  assert.equal([...cfg.warnings].length, 0);
  assert.ok(Object.isFrozen(cfg), 'o objeto de config deve ser congelado');
});

test('ADMIN_TOKEN: ausente, vazio ou só espaços lança "ADMIN_TOKEN é obrigatório"; aplica trim; < 16 chars sobe com aviso que não vaza o token; env injetado ignora process.env', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/008-config.md#Erros "ADMIN_TOKEN ausente/vazio → lança Error('ADMIN_TOKEN é obrigatório')"; #Edge cases (trim; "só espaços → ausente"; "< 16 chars → sobe, warnings contém ...") e #Done when "nenhuma mensagem contém o token"; #Descrição "process.env ... só como default do parâmetro"; Spec.md#REQ-1, #REQ-40
  const { loadConfig } = await config();
  for (const env of [{}, { ADMIN_TOKEN: '' }, { ADMIN_TOKEN: '   ' }, { ADMIN_TOKEN: '\t \n' }]) {
    assert.throws(() => loadConfig(env), (err) => err instanceof Error && /ADMIN_TOKEN é obrigatório/.test(err.message), JSON.stringify(env));
  }
  // O parâmetro injetado manda: um ADMIN_TOKEN no process.env não pode "vazar" para loadConfig({}).
  withProcessEnv({ ADMIN_TOKEN: 'token-do-process-env-1234567' }, () => {
    assert.throws(() => loadConfig({}), /ADMIN_TOKEN é obrigatório/);
  });

  assert.equal(loadConfig({ ADMIN_TOKEN: `  ${TOKEN}  ` }).adminToken, TOKEN);

  const exactly16 = loadConfig({ ADMIN_TOKEN: 'a'.repeat(16) });
  assert.equal([...exactly16.warnings].length, 0, '16 caracteres não gera aviso');

  const secret = 'zq-segredo7';
  const short = loadConfig({ ADMIN_TOKEN: secret });
  assert.equal(short.adminToken, secret, 'token curto: sobe mesmo assim');
  const warnings = [...short.warnings];
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /ADMIN_TOKEN/);
  assert.match(warnings[0], /16/);
  assert.equal(JSON.stringify(warnings).includes(secret), false, 'o aviso não pode conter o token');
  assert.throws(() => loadConfig({ ADMIN_TOKEN: secret, PORT: 'abc' }), (err) => !String(err.message).includes(secret));
});

test('PORT: inteiro de 1 a 65535; qualquer outra coisa lança "PORT inválida"', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/008-config.md#Erros "PORT não inteiro ou fora de 1..65535 → lança Error('PORT inválida: use um inteiro entre 1 e 65535')"; #Plano ('3000abc', '1.5', '0', '65536', '-1' → erro); Spec.md#REQ-1
  const { loadConfig } = await config();
  for (const [raw, expected] of [['1', 1], ['8080', 8080], ['65535', 65535]]) {
    assert.equal(loadConfig({ ADMIN_TOKEN: TOKEN, PORT: raw }).port, expected, `PORT=${raw}`);
  }
  // A Spec só exige "mensagem clara"; basta a mensagem citar PORT.
  for (const raw of ['0', '65536', '-1', 'abc', '3000abc', '1.5', '99999']) {
    assert.throws(() => loadConfig({ ADMIN_TOKEN: TOKEN, PORT: raw }), (err) => err instanceof Error && /PORT/.test(err.message), `PORT=${raw}`);
  }
});

test('BASE_URL (barra final removida; default com a porta efetiva; inválida lança) e DATA_FILE (relativo resolvido no cwd, absoluto mantido)', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/008-config.md#Edge cases ("BASE_URL com barra final → removida; ausente → http://localhost:<port> com a porta efetiva"; "DATA_FILE relativo → path.resolve(process.cwd(), …)") e #Erros "BASE_URL não parseável ou sem http(s): → lança Error('BASE_URL inválida …')"; docs/data-model.md#Config
  const { loadConfig } = await config();
  assert.equal(loadConfig({ ADMIN_TOKEN: TOKEN, BASE_URL: 'https://go.agencia.com/' }).baseUrl, 'https://go.agencia.com');
  assert.equal(loadConfig({ ADMIN_TOKEN: TOKEN, BASE_URL: 'https://go.agencia.com' }).baseUrl, 'https://go.agencia.com');
  assert.equal(loadConfig({ ADMIN_TOKEN: TOKEN, PORT: '8080' }).baseUrl, 'http://localhost:8080');
  // O texto exato não é fixado pela Spec; basta a mensagem citar BASE_URL.
  for (const raw of ['ftp://go.agencia.com', 'go.agencia.com', 'não é url']) {
    assert.throws(() => loadConfig({ ADMIN_TOKEN: TOKEN, BASE_URL: raw }), (err) => err instanceof Error && /BASE_URL/.test(err.message), `BASE_URL=${raw}`);
  }
  assert.equal(loadConfig({ ADMIN_TOKEN: TOKEN, DATA_FILE: 'tmp/outro/links.json' }).dataFile, resolve(process.cwd(), 'tmp/outro/links.json'));
  const abs = resolve('/tmp', 'hidden-s001', 'links.json');
  assert.equal(loadConfig({ ADMIN_TOKEN: TOKEN, DATA_FILE: abs }).dataFile, abs);
});

test('sessionSecret: sem SESSION_SECRET é HMAC-SHA256(ADMIN_TOKEN, "link-shortener-session-v1") em Buffer; com SESSION_SECRET é Buffer.from(valor)', { timeout: 10_000 }, async () => {
  // fonte: docs/issues/008-config.md#Caminho feliz ("sessionSecret: <Buffer 32 bytes = HMAC-SHA256(adminToken, 'link-shortener-session-v1')>"), #Edge cases ("SESSION_SECRET definido → Buffer.from(SESSION_SECRET, 'utf8')") e #Done when; Spec.md#REQ-1 (4); docs/data-model.md#Session
  const { loadConfig } = await config();
  const derived = loadConfig({ ADMIN_TOKEN: TOKEN }).sessionSecret;
  assert.ok(Buffer.isBuffer(derived), 'sessionSecret deve ser Buffer');
  assert.equal(derived.length, 32);
  assert.equal(derived.toString('hex'), EXPECTED_DERIVED_SECRET_HEX);

  const explicit = loadConfig({ ADMIN_TOKEN: TOKEN, SESSION_SECRET: 'segredo-de-sessão' }).sessionSecret;
  assert.ok(Buffer.isBuffer(explicit));
  assert.ok(explicit.equals(Buffer.from('segredo-de-sessão', 'utf8')));
});

test('process.env só aparece em src/config.js', { timeout: 10_000 }, () => {
  // fonte: Spec.md#REQ-1 "exclusivamente em src/config.js"; docs/issues/008-config.md#Done when "grep -rn process.env src/ só encontra src/config.js" e #Gate; steering/structure.md "nenhum outro arquivo lê process.env"
  const srcDir = join(ROOT, 'src');
  assert.ok(existsSync(join(srcDir, 'config.js')), 'src/config.js ausente');
  const offenders = readdirSync(srcDir, { recursive: true })
    .map(String)
    .filter((rel) => /\.(?:m|c)?js$/.test(rel))
    .filter((rel) => readFileSync(join(srcDir, rel), 'utf8').includes('process.env'))
    .map((rel) => rel.split('\\').join('/'))
    .filter((rel) => rel !== 'config.js');
  assert.deepEqual(offenders, [], `process.env fora de src/config.js: ${offenders.join(', ')}`);
});
