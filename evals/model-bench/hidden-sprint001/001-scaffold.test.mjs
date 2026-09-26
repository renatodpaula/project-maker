// Suíte oculta — SPRINT-001 / Issue 001: scaffold do projeto (package.json, env, README, sensor zero-deps).
// Uso: PROJECT_ROOT=/caminho/absoluto node --test 001-scaffold.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, sep } from 'node:path';

const ROOT = process.env.PROJECT_ROOT;
assert.ok(ROOT && isAbsolute(ROOT), 'defina PROJECT_ROOT com o caminho absoluto do projeto sob teste');

const readText = (root, rel) => readFileSync(join(root, rel), 'utf8');
const readPkg = (root = ROOT) => JSON.parse(readText(root, 'package.json'));

// Detector próprio (independente do sensor do implementador): import estático, dinâmico, re-export e require.
const SPECIFIER = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(?\s*['"]([^'"]+)['"]|\brequire\s*\(\s*['"]([^'"]+)['"]/g;
function forbiddenImports(source) {
  return [...source.matchAll(SPECIFIER)]
    .map((m) => m[1] ?? m[2] ?? m[3])
    .filter((s) => !s.startsWith('node:') && !s.startsWith('./') && !s.startsWith('../'));
}

function listSourceFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((rel) => /\.(?:m|c)?js$/.test(rel));
}

const SKIP_TOP = new Set(['.git', 'node_modules', '.claude', 'data', '.bench']);
function copyProject() {
  // PROJECT_ROOT pode ser um symlink (ex.: /tmp → /private/tmp no macOS): copiar o diretório real,
  // senão o cpSync tenta recriar o symlink em cima do mkdtemp e falha com EEXIST.
  const srcRoot = realpathSync(ROOT);
  const dest = mkdtempSync(join(tmpdir(), 'hidden-s001-scaffold-'));
  cpSync(srcRoot, dest, {
    recursive: true,
    dereference: true,
    filter: (src) => {
      const rel = relative(srcRoot, src);
      return rel === '' || !SKIP_TOP.has(rel.split(sep)[0]);
    },
  });
  return dest;
}

function runNoDepsSensor(cwd) {
  return spawnSync(process.execPath, ['--test', 'test/unit/no-deps.test.js'], {
    cwd,
    env: { PATH: process.env.PATH },
    encoding: 'utf8',
    timeout: 5_000,
  });
}

test('package.json não declara dependencies nem devDependencies', { timeout: 10_000 }, () => {
  // fonte: docs/issues/001-scaffold-do-projeto.md#Done when "nenhuma chave dependencies/devDependencies"; Spec.md#NFR-3
  const pkg = readPkg();
  assert.equal(Object.keys(pkg.dependencies ?? {}).length, 0, 'dependencies deve estar ausente ou vazio');
  assert.equal(Object.keys(pkg.devDependencies ?? {}).length, 0, 'devDependencies deve estar ausente ou vazio');
});

test('package.json é ESM, exige Node >= 24 e expõe os scripts do scaffold', { timeout: 10_000 }, () => {
  // fonte: docs/issues/001-scaffold-do-projeto.md#Done when '"type": "module", engines.node ">=24", scripts start/dev/test/test:unit/test:integration'
  const pkg = readPkg();
  assert.equal(pkg.type, 'module');
  assert.match(String(pkg.engines?.node ?? ''), />=\s*24/);
  for (const name of ['start', 'dev', 'test', 'test:unit', 'test:integration']) {
    assert.equal(typeof pkg.scripts?.[name], 'string', `script "${name}" ausente`);
  }
  assert.match(pkg.scripts.start, /src\/server\.js/);
  assert.match(pkg.scripts.test, /--test/);
});

test('src/ só importa node:* e caminhos relativos (zero dependências)', { timeout: 10_000 }, () => {
  // fonte: Spec.md#NFR-3 "nenhum import fora de node:* e caminhos relativos"; docs/issues/001-scaffold-do-projeto.md#Arquivos a criar (no-deps)
  const srcDir = join(ROOT, 'src');
  assert.ok(existsSync(srcDir), 'diretório src/ ausente');
  const offenders = [];
  for (const rel of listSourceFiles(srcDir)) {
    const bad = forbiddenImports(readFileSync(join(srcDir, rel), 'utf8'));
    if (bad.length) offenders.push(`src/${rel}: ${bad.join(', ')}`);
  }
  assert.deepEqual(offenders, [], `imports proibidos:\n${offenders.join('\n')}`);
});

test('arquivos de scaffold: .nvmrc 24, .env.example com as variáveis, README com "um processo só", .env no .gitignore', { timeout: 10_000 }, () => {
  // fonte: docs/issues/001-scaffold-do-projeto.md#Done when ".nvmrc, .env.example, README.md existem com o conteúdo descrito; .env está no .gitignore"; Spec.md#NFR-8
  assert.match(readText(ROOT, '.nvmrc').trim(), /^v?24(?:\.|$)/);
  const envExample = readText(ROOT, '.env.example');
  for (const key of ['ADMIN_TOKEN', 'PORT', 'BASE_URL', 'DATA_FILE']) {
    assert.match(envExample, new RegExp(`^\\s*${key}=`, 'm'), `.env.example sem ${key}=`);
  }
  assert.match(readText(ROOT, 'README.md'), /um processo só/i, 'README deve avisar "um processo só por DATA_FILE" (NFR-8)');
  // Tolerante: `.env`, `/.env`, `**/.env` ou `.env*` — todos ignoram o arquivo `.env` (a issue só fixa "`.env` está no `.gitignore`").
  assert.match(readText(ROOT, '.gitignore'), /^\/?(?:\*\*\/)?\.env\*?\s*$/m, '.env deve estar no .gitignore');
});

test('o sensor test/unit/no-deps.test.js existe e passa no projeto', { timeout: 10_000 }, () => {
  // fonte: docs/issues/001-scaffold-do-projeto.md#Done when "npm test sai com exit 0 e executa test/unit/no-deps.test.js"; #Gate
  assert.ok(existsSync(join(ROOT, 'test/unit/no-deps.test.js')), 'test/unit/no-deps.test.js ausente');
  const r = runNoDepsSensor(ROOT);
  assert.equal(r.status, 0, `sensor no-deps falhou:\n${r.stdout}\n${r.stderr}`);
});

// Timeout acima de 10 s de propósito: são 3 cópias do projeto + 3 spawns sequenciais de `node --test` (5 s cada, no máximo).
test('o sensor no-deps falha quando surge dependência no package.json ou import de pacote npm em src/', { timeout: 20_000 }, (t) => {
  // fonte: docs/issues/001-scaffold-do-projeto.md#Erros "Se package.json ganhar dependencies ... no-deps.test.js falha"; #Done when (detector acusa import 'express')
  const copies = [];
  t.after(() => { for (const dir of copies) rmSync(dir, { recursive: true, force: true }); });

  // Controle: a cópia intacta passa (senão a verificação abaixo não prova nada).
  const control = copyProject();
  copies.push(control);
  const ok = runNoDepsSensor(control);
  assert.equal(ok.status, 0, `controle: o sensor deveria passar numa cópia intacta:\n${ok.stdout}\n${ok.stderr}`);

  const withDep = copyProject();
  copies.push(withDep);
  const pkg = readPkg(withDep);
  pkg.dependencies = { 'left-pad': '1.3.0' };
  writeFileSync(join(withDep, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
  assert.notEqual(runNoDepsSensor(withDep).status, 0, 'o sensor deveria falhar com "dependencies" no package.json');

  const withImport = copyProject();
  copies.push(withImport);
  mkdirSync(join(withImport, 'src'), { recursive: true });
  writeFileSync(join(withImport, 'src', 'zz-sonda-oculta.js'), "import express from 'express';\nexport default express;\n");
  assert.notEqual(runNoDepsSensor(withImport).status, 0, "o sensor deveria falhar com import de 'express' em src/");
});
