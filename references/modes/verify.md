# Modo: /verify

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.

**Argumento:** caminho de um sprint (`docs/sprints/SPRINT-NNN-[slug].md`) ou de uma issue em `--quick`.

UAT conduzido — confirma que o que foi construído **funciona da perspectiva do usuário**, no que o validator automático (lógica) não alcança (experiência). Disparado no Passo 4.5 do `/execute` ou manualmente após uma entrega user-facing.

**Filosofia:** *mostre o esperado, pergunte se a realidade bate.* Um teste por vez, resposta em texto livre. Resposta vazia / "ok" / "sim" / "next" = pass. Qualquer outra coisa = issue, com severidade **inferida** da linguagem (nunca pergunte "quão grave?"). Ver `references/uat-template.md`.

### Passo 0 — Session Loading + checar sessão ativa
- Leia STATE.md, Constitution.md, steering relevante.
- Procure o arquivo de UAT do sprint (`docs/sprints/SPRINT-NNN-uat.md`; em `--quick`, ao lado da issue) com `status: testing | partial`. Se existir, **retome** do primeiro teste `pending` (o frontmatter sobrevive a `/clear`). Senão, crie novo.

### Passo 1 — Extrair testes
- Leia os `Summary` das issues do sprint e os `Done when`. Extraia **deliverables observáveis pelo usuário** (não refactors/tipos internos).
- Cada teste = uma ação + um resultado esperado específico.

**Cold-start smoke test (injeção automática).** Se algum arquivo **de código** tocado pelo sprint casa com `server.*`, `app.*`, `index.*`, `main.*`, `migrations/*`, `seed*`, `db/*`, `docker-compose*`, `Dockerfile*` (ignore assets — `.css`, `.svg`, imagens, fontes) → **prepend** o teste de boot frio (Test 0 do template): matar serviço, limpar estado efêmero, subir do zero, query primária retorna dado vivo. Pega bug que só aparece em estado frio e passa em estado quente.

### Passo 2 — Conduzir (um por vez)
- Gere o arquivo de UAT a partir do template, no path do Passo 0. Apresente o teste atual (esperado), aguarde resposta.
- Processe: pass / issue (com severidade inferida + append no `## Gaps` YAML) / skipped / blocked (pré-requisito — não vira gap).
- Escreva no arquivo: ao achar issue, a cada 5 passes, e ao completar. Atualize `Current Test` e `Summary`.

### Passo 3 — Se houver gaps: loop diagnose → fix → re-verify
1. **Diagnose:** para cada gap, dispare um sub-agent que investiga a root cause (lê o diff do sprint + o gap). Preencha `root_cause` no YAML.
2. **Fix issue:** crie uma issue de fix em `docs/issues/functional/` (gap_closure) por root cause, com `Done when` derivado do `truth` do gap e `Gate` real. Linke em `fix_issue`.
3. **Execute:** instrua `/execute` nas issues de fix (`--quick` se isolado, ou nova mini-wave no sprint).
4. **Re-verify:** re-rode só os testes que tinham falhado. Repita no máximo o que o `Stuck Detection` permite (não fique em loop infinito).

### Passo 4 — Fechar
- Sem gaps abertos → `status: complete`, sprint pode seguir para `/secure`/`/ship`.
- Com gaps abertos → registre em STATE.md → Blockers, sprint fica `⏸ pending-review`.

**Bloco de Handoff (obrigatório — regra Next Command):**
- Sem gaps + sprint toca auth/dados/input → `/project-maker secure [path real do sprint]`
- Sem gaps + sem superfície de segurança → `/project-maker ship [path real do sprint]`
- Com gaps → `/project-maker execute [path real das issues de fix]` (recuperação), e cite o re-verify como o passo seguinte

Sempre com o path resolvido do disco, comando sozinho no bloco de código, linha `**Modelo:**` junto.

**Quando NÃO rodar:** sprint só backend/migrations/refactor interno, bugfix pontual, `--quick` sem superfície de usuário. UAT **não substitui** o Milestone Gate — é complementar.
