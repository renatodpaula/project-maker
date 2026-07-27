# Modo: /plan

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.

**Argumento:** caminho ou nome da issue (ex: `docs/issues/prototype/01-pagina-login.md`)

Leia `Constitution.md` e `steering/` se existirem — definem restrições que devem ser respeitadas no plano.
Leia `docs/data-model.md` e o contrato relevante em `docs/contracts/` se existirem.
Leia a issue completa, incluindo os campos `Implements`, `Depends on` e `Can parallelize with`.

**Passo 1 — Pesquisa interna**
Delegue a um agente de exploração — `code-explorer` (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/feature-dev/agents/code-explorer.md`) se instalado, senão o agente nativo **`Explore`** (read-only) — para:
- Encontrar arquivos existentes relacionados à issue
- Identificar padrões de implementação já usados no projeto
- Detectar código reutilizável (componentes, hooks, utils, tipos)

**Passo 2 — Pesquisa externa**
Use WebSearch/WebFetch para buscar documentação e exemplos das tecnologias envolvidas. Consulte `docs/research.md` se existir — evite duplicar pesquisa já feita.

**Passo 3 — Enriquecer a issue**
Reescreva a issue adicionando:
- **Arquivos a criar**: path completo + responsabilidade de cada um
- **Arquivos a modificar**: path + linha aproximada + o que e por quê
- **Padrões de implementação**: snippets dos padrões encontrados no codebase
- **Acceptance criteria verificáveis**: mapeados dos requisitos EARS da Spec.md
- **Verificação**: comandos reais de teste/lint/typecheck do projeto

Salve sobrescrevendo o arquivo da issue original.

**Ao final:** emita o **Bloco de Handoff** (regra Next Command) com o path real da issue enriquecida e o modelo vindo do `Model hint` do header (Sonnet no padrão, Opus/Fable se o hint indicar):
> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker execute docs/issues/prototype/01-pagina-login.md
> ```
> **Modelo:** Sonnet — issue especificada, execução mecânica.

Se a issue faz parte de um sprint já planejado, o comando primário é o `/execute` do **sprint** (path completo) e o `/execute` da issue isolada vira a alternativa rotulada.
