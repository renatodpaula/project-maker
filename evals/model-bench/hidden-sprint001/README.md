# Suíte oculta de aceitação: SPRINT-001 (Fundação)

Esta suíte mede, de forma objetiva, o código que diferentes modelos produzem a partir da mesma especificação do SPRINT-001 (golden `05-plan`). O implementador nunca vê estes arquivos.

## Como rodar

```bash
# tudo (os arquivos rodam em paralelo e não dependem de ordem entre si)
PROJECT_ROOT=/caminho/absoluto/do/projeto node --test /…/bench/hidden/sprint001/*.test.mjs

# um arquivo isolado
PROJECT_ROOT=/caminho/absoluto/do/projeto node --test /…/bench/hidden/sprint001/007-json-store.test.mjs
```

- `PROJECT_ROOT` é obrigatório e precisa ser absoluto. Sem ele, cada arquivo falha logo na carga.
- Os testes usam Node ≥ 24 e só os módulos `node:test`, `node:assert/strict`, `node:child_process`, `node:http`/`fetch`, `node:fs` (e `node:fs/promises`), `node:os` e `node:path`. Também usam `node:url`, porque o `pathToFileURL` que a regra de import exige vem de lá. Não usam `node:crypto`: o HMAC esperado na 008 está fixo no teste.
- Os módulos do projeto são importados com `import(pathToFileURL(join(ROOT, 'src/…')).href)`. O servidor sobe com `spawn(process.execPath, [ROOT/src/server.js], { cwd: ROOT })`, em porta livre e com `DATA_FILE` em `mkdtemp(os.tmpdir())`. O `env` é montado à mão, só com `PATH` e as variáveis do teste, e nunca herda o `process.env` inteiro. Cada processo é morto no `after()`.
- Nenhum teste toca `ROOT/data/` nem usa porta fixa. O `001` copia o projeto para um diretório temporário antes de injetar a dependência falsa.
- Em macOS, passar `PROJECT_ROOT` por um caminho com symlink (por exemplo `/tmp/…` → `/private/tmp/…`) exercita de propósito o Gotcha 2 da issue 010: o entrypoint precisa usar `import.meta.main`.

## Regras de autoria

1. Cada `test()` e cada subteste começa com `// fonte: <arquivo>#<trecho>`.
2. Só se afirma o que está escrito nas issues, nos contratos, na Spec ou no data-model: nome de export, assinatura, código HTTP, header, texto obrigatório e comportamento. Quando o detalhe não é fixado, a asserção é tolerante: regex, `includes` ou só a classe do status. Exemplos: o texto do motivo de arquivo inválido (o teste só exige o path e "algum motivo"), o formato da mensagem de porta ocupada (só exige a porta no stderr), `MESSAGES.NOT_FOUND` (aceita "Rota não encontrada" ou "Link não encontrado") e o aviso de token curto (só exige `ADMIN_TOKEN`/`16`).
3. A prioridade é o comportamento observável: CLI via spawn, HTTP real via `fetch` e contratos dos módulos exportados.

## Matriz issue → testes → fonte

Contagem: número de `test()` de topo, mais os subtestes gerados em runtime entre parênteses. Os números batem com o `ℹ tests` do runner.

| Issue | Arquivo | Testes | O que cobre | Fontes principais |
|---|---|---|---|---|
| **001** scaffold | `001-scaffold.test.mjs` | 6 | `package.json` sem `dependencies`/`devDependencies`; ESM, `engines >=24` e scripts `start/dev/test/test:unit/test:integration`; `src/` importa só `node:*` e caminhos relativos (detector próprio: import estático, dinâmico, re-export e `require`); `.nvmrc` 24, `.env.example` com as 4 variáveis, README com "um processo só", `.env` no `.gitignore`; `test/unit/no-deps.test.js` existe e passa; o sensor **falha** numa cópia do projeto com `dependencies` injetada e com `import 'express'` em `src/` (e passa na cópia de controle) | issue 001 (Done when, Erros, Arquivos a criar), Spec NFR-3 e NFR-8 |
| **002** escapeHtml | `002-html.test.mjs` | 5 | as 5 entidades `& < > " '`, incluindo `<script>` no destino; `null`/`undefined` → `''`; não-strings via `String()` (`0`, `false`, objeto); texto sem especiais volta idêntico (acentos preservados); `&amp;` é escapado de novo | issue 002 (Caminho feliz, Edge cases, Done when), Spec REQ-37 |
| **003** slug | `003-slug.test.mjs` | 6 | `RESERVED_SLUGS` exatos e congelados, `AUTO_SLUG_LENGTH` 6, `BASE62_ALPHABET` com 62 caracteres; `generateSlug()` com 6 chars base62 que cobre o alfabeto em 6000 gerações; `randomInt` injetado: `(0, 62)` por posição e sequência determinística; `normalizeSlug` (trim + lower) e `isValidCustomSlug` exatamente `^[a-z0-9-]{3,32}$` sem normalizar (tabela da issue); `isReservedSlug` exato e após normalizar; `ROUTE_SEGMENT_PATTERN` | issue 003 (Arquivos a criar, Cenários, Critérios REQ-5/6/7/12), Spec REQ-5, REQ-6, REQ-7, REQ-12 |
| **004** URL | `004-url.test.mjs` | 6 | http/https aceitos, trim, query/UTM byte a byte, esquema em maiúsculas guardado como recebido; `javascript: data: file: vbscript: ftp: mailto:` → `INVALID_URL` com a mensagem exata; self-loop por host+porta de `BASE_URL` (mensagem exata, host normalizado, `:443` implícito), porta ou host diferente → ok; 2048 aceita e 2049 rejeita (`MAX_URL_LENGTH`); malformadas (`http://`, `http:/abc`, `https:example.com`) e não-string → `INVALID_URL` sem lançar; `isHttpUrl` e `ALLOWED_PROTOCOLS` | issue 004 (Cenários, Erros, Decisão de plano `^https?://`), Spec REQ-4 |
| **005** time | `005-time.test.mjs` | 6 | `TIME_ZONE`; `formatDateTime` → `dd/mm/aaaa HH:mm` em SP (meia-noite `00:00`, fuso parametrizável); `—` para null/undefined/inválido sem lançar; `localDateTimeToUtc` SP → UTC (`10:30` → `13:30Z`, com segundos, virada de ano); DST em `America/New_York`; entradas inválidas (inclui `2026-02-30`, `24:00`) → `null`; resultado igual com `TZ=UTC`, `Asia/Tokyo` e `America/Los_Angeles` (subprocesso) | issue 005 (Cenários, Done when, Gate com TZ), Spec REQ-9 |
| **006** http + errors | `006-http.test.mjs` | 6 | `STATUS_BY_CODE` com exatamente os 13 códigos, `statusForCode` (desconhecido → 500), `BODY_LIMIT`; `DomainError`/`createError`/`isDomainError`, mensagem padrão por código e textos exatos de `MESSAGES`; headers de `sendJson` (201 + `Location`), `sendHtml` (`cacheControl`) e `redirect` 302/303 via servidor real, e `sendJson` não lança com `headersSent`; `readBody` aceita 65536 bytes, UTF-8 íntegro entre chunks e respeita o limite; `readBody` rejeita 70 000 bytes com `DomainError PAYLOAD_TOO_LARGE`, o cliente recebe o 413 do chamador, e um corpo chunked sem fim é rejeitado sem esperar o `end`; `parseJsonBody` só aceita objeto (`INVALID_BODY`); `parseFormBody`, `parseCookies` (sem `=`, `=` interno), `getBearerToken` sem trim e `hasContentType` com charset e caixa | issue 006 (Caminho feliz, Edge cases, Done when, Plano), Spec REQ-24, REQ-38 e tabela de códigos; contratos links-api, admin-pages e public-routes (textos) |
| **007** json-store | `007-json-store.test.mjs` | 6 (+15) | arquivo ausente → cria diretório e `{"version":1,"links":[]}`, com `INITIAL_DOCUMENT`; carga válida na ordem do arquivo, `get/has` case-sensitive, `list()` devolve cópia, `.tmp` órfão removido com o principal byte a byte igual; **15 documentos inválidos** (JSON quebrado, `links` objeto, sem/nº slug, sem url, `javascript:`/`ftp:`, clicks −1/1.5, active string, 3 datas inválidas, slug duplicado, `version 2`) → rejeita com path + motivo, com conteúdo, mtime e diretório intactos; `save()` grava 7 chaves na ordem do data-model, indentação 2, sem `shortUrl`/`status`, sem `.tmp`, e `set()` sozinho não escreve; **concorrência caixa-preta**: 27 saves sem await resolvem, o arquivo final tem todas as mutações e um leitor concorrente nunca vê arquivo parcial ou ausente; **fs injetado**: todo write vai para `<arquivo>.tmp` + `rename`, nunca direto (inclusive o documento inicial), renames nunca sobrepostos, e um rename que falha mantém o arquivo íntegro sem envenenar a fila | issue 007 (Cenários, Erros, Invariantes, Casos de teste, Done when), Spec REQ-2, REQ-33, REQ-34, REQ-35, data-model §1, §3 e §4 |
| **008** config | `008-config.test.mjs` | 6 | defaults (3000, `http://localhost:3000`, `data/links.json` resolvido no cwd, sem avisos), objeto congelado e constantes; `ADMIN_TOKEN` ausente, vazio ou só espaços → "ADMIN_TOKEN é obrigatório", trim, aviso quando < 16 (16 não avisa) sem vazar o token, e o `env` injetado ignora `process.env`; `PORT` 1..65535 (e rejeita `0`, `65536`, `-1`, `abc`, `3000abc`, `1.5`); `BASE_URL` (barra final, default com a porta efetiva, inválida lança) e `DATA_FILE` (relativo ou absoluto); `sessionSecret` = HMAC-SHA256 fixo em Buffer de 32 bytes, ou `Buffer.from(SESSION_SECRET)`; `process.env` só em `src/config.js` | issue 008 (Cenários, Erros, Done when, Gate), Spec REQ-1, REQ-40, data-model Config |
| **009** views públicas | `009-views.test.mjs` | 4 | `renderGone()`: esqueleto (doctype, `lang="pt-BR"`, charset, viewport, `<style>` embutido), `<title>…— Encurtador</title>`, `<h1>` e frase exata; `renderNotFound()` idem; páginas públicas com aridade 0, sem `/admin`, `<form>` ou `<script>` (a tag `<header>` em si não é proibida — ver Decisões), e acentos corretos; `renderLayout`: título escapado no formato `<título> — Encurtador`, body cru em `<main>`, form de logout só com `authenticated: true`, `APP_NAME` | issue 009 (Caminho feliz, Edge cases, Plano, Done when), contrato public-routes (Páginas de erro), Spec Páginas/Componentes, REQ-37, NFR-6, NFR-7 |
| **010** server/router/health | `010-server.test.mjs` | 12 (+10) | `matchRoute`: 3 subtestes (rotas fixas e slug; multi-segmento, favicon, padrão inválido → not-found, e `/assets*` → not-found ou área `assets`, nunca slug; query e `//abc`); `createServer({…, handlers})`: handler síncrono e assíncrono que lançam → 500 HTML "Erro interno" com headers de segurança, `/api` → `500 {"error":"INTERNAL","message":"Erro interno"}`, sem stack nem mensagem na resposta, e o log no stderr sem headers da request; `startTestServer()`: porta efêmera ≠ 3000, `DATA_FILE` em tmp e dentro de `dir`, instâncias isoladas, `readData`, `store`, token `test-token`, `shortBaseUrl`, `stop()`; **spawn ok** com 7 subtestes (cria o `DATA_FILE` ausente; linha no stdout com a porta e o `BASE_URL`; `GET /health` 200 `{"status":"ok"}` + no-store + nosniff sem tocar no arquivo; `POST /health` 405 com `Allow: GET`; `GET /` 302 `/admin` no-store; 8 paths → 404 HTML amigável com headers de segurança; `/api/*` → 404 JSON `NOT_FOUND`; SIGTERM encerra); **falhas de subida** em 7 testes de topo, um spawn cada (sem token e token só com espaços → exit 1 + "ADMIN_TOKEN é obrigatório"; `PORT` inválida → exit 1 + "PORT" no stderr; JSON quebrado e url `javascript:` → exit 1, path no stderr, arquivo intacto; porta ocupada → exit 1 + porta no stderr; token curto sobe com aviso no stderr sem vazar o token); a suíte do próprio projeto (`node --test 'test/**/*.test.js'`) passa | issue 010 (Caminho feliz, Edge cases, Erros, Plano, Done when, Gate), Spec REQ-1, REQ-2, REQ-3, REQ-12, REQ-14, REQ-36, REQ-38, REQ-40, NFR-5, contrato public-routes, SPRINT-001 Success Criteria |

**Total:** 63 testes de topo (88 contando os subtestes de runtime).

Cobertura cruzada: o exit 1 com stderr quando falta `ADMIN_TOKEN` (REQ-1, da issue 008) é provado via spawn no `010`, como a própria 008 determina. Os status e headers HTTP das páginas 404 (issue 009) também são provados no `010`.

## Decisões de julgamento (para quem for auditar a suíte)

- **Contratos do plano incluídos.** Entram porque estão escritos nas issues, e não só nos snippets: o parâmetro `fs` injetável do store (007, "Arquivos a criar"), `handlers` extras em `createServer` (010, Plano/Arquivos a criar), `//abc` → slug `abc` (010, Edge cases `[ASSUMIDO]`, em subteste próprio), o prefixo `^https?://` (004, Decisão de plano) e `version ≠ 1` → recusa (007, Edge cases).
- **Deixados de fora por constarem só no snippet ou não serem fixados.** Não-strings em `isValidCustomSlug`; `isDomainError(null)`; `redirect` com status ≠ 302/303 lançando `TypeError`; o texto de `METHOD_NOT_ALLOWED`; `sendText`; a derivação do HMAC a partir do token já com trim; o tempo de subida < 1 s (evita flakiness); a remoção do `.tmp` só depois da validação.
- **Atomicidade medida de dois jeitos.** O teste caixa-preta, com leitor concorrente e 27 saves, não depende de injeção. O teste com espião no `fs` injetado é determinístico, mas depende do contrato de injeção.
- **Porta ocupada.** O teste ocupa a porta em `::`, `0.0.0.0`, `127.0.0.1` e `::1`, porque no macOS um bind em `127.0.0.1` não colide com um listener em `::`.

### Revisão adversarial (2026-09-26): asserções relaxadas por não serem estritamente deriváveis

Nenhum teste foi removido; o comportamento fixado pela Spec/issues continua exigido. O que mudou foi só a **forma** aceita:

- **004** — para entradas **não-string** (`undefined`, `null`, `42`, `{}`), `validateTargetUrl` só precisa devolver `ok: false` + `INVALID_URL` + alguma mensagem (a issue fixa o código, não o texto); `isHttpUrl` com não-string só precisa não lançar e não aceitar. Strings malformadas continuam exigindo a mensagem padrão (contrato links-api: "não parseável" → mensagem de INVALID_URL).
- **005** — `localDateTimeToUtc` com **não-string** aceita `null` ou `undefined` (a issue só fixa "nenhum erro lançado"); os seis casos de string inválida continuam exigindo `null`.
- **003 / 006** — `BASE62_ALPHABET` pode ser string ou array de caracteres; `STATUS_BY_CODE` pode ser objeto plano ou `Map` (a issue fixa conteúdo e chaves, não a estrutura); `parseJsonBody` pode ser síncrono ou assíncrono (`await`/`assert.rejects`).
- **008** — mensagens de `PORT`/`BASE_URL` inválidos só precisam citar a variável (`/PORT/`, `/BASE_URL/`); a Spec exige "mensagem clara", o texto completo era só da issue. `ADMIN_TOKEN é obrigatório` continua exato (está na Spec).
- **009** — a tag `<header>` deixou de ser proibida nas páginas 404/410. A Spec (Componentes → Layout: "`<header>` com o nome Encurtador (só nas páginas autenticadas: link Sair …)") e a Descrição da issue 009 admitem um `<header>` só com o nome do app em toda página; "sem header do painel" é medido pelo que o define: nenhum `<form>`, nenhum `/admin`, nenhum `<script>`. Também tolera atributos em qualquer ordem nos `<meta>`.
- **010** — no router puro, `/assets*` aceita área `not-found` **ou** `assets` (a Spec fixa "nunca slug" e 404 na v1, provado via HTTP no mesmo arquivo). As 7 falhas de subida viraram testes de topo, um spawn cada, para cada um ter o próprio orçamento de 10 s.
- **001** — `.gitignore` aceita `.env`, `/.env`, `**/.env` ou `.env*` (a issue fixa "`.env` está no `.gitignore`"). Correção de robustez: `copyProject` agora resolve `realpath(PROJECT_ROOT)` e copia com `dereference` — com `PROJECT_ROOT` via symlink (`/tmp/...`), o `cpSync` antigo falhava com `EEXIST` e reprovava um projeto correto.
- **007** — o path na mensagem de arquivo inválido pode vir como foi passado ou como `realpath` (no macOS, `/var/folders` → `/private/var/folders`), como já acontecia no `010`.
- **Timeouts.** Todo `test()` tem timeout explícito de **10 s**; esperas internas por processo (`waitReady`, `waitForExit`, `spawnSync`) caem para ≤ 5 s. Três exceções, comentadas no código: `001` (3 cópias + 3 spawns sequenciais: 20 s), `005` TZ (3 subprocessos: 15 s) e `010` "suíte do próprio projeto" (roda a suíte inteira do implementador: 30 s).

## Validação feita

- `node --check` em todos os `.test.mjs`: ok (refeito após a revisão adversarial).
- Implementação de referência montada a partir dos snippets das issues, em `bench/hidden-ref/sprint001-impl/` (fora deste diretório, nunca exposta ao implementador): **88/88 pass** após a revisão, rodando cada arquivo isolado ou todos em paralelo (4 execuções), com `PROJECT_ROOT` real e via symlink `/tmp`; `006` repetido 5 vezes e `010` 3 vezes com os timeouts novos sem flakiness; a suíte inteira roda em cerca de 0,7 s.
- Projeto vazio: 63/63 falham rápido (cerca de 0,5 s), sem travar e sem nenhum pass por vacuidade.
- Mutantes da referência, todos detectados:
  - store com escrita direta sem tmp/rename: pego pelo teste caixa-preta em 8 de 8 execuções e pelo fs espião;
  - store sem fila de saves;
  - fila de saves envenenada depois de uma falha;
  - `readBody` que só confere o limite no `end`;
  - `readBody` que decodifica UTF-8 chunk a chunk;
  - `readBody` que destrói o socket sozinho;
  - `getBearerToken` com trim;
  - 500 que vaza `err.message`;
  - log de erro com `req.headers`;
  - `GET /` com 301;
  - avisos de config não impressos;
  - router com `new URL(rawUrl, base)`.
