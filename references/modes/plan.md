# Modo: /plan

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.
> **Com `--autopilot`** (rodando dentro do `/project-maker autopilot`): aplique `references/autopilot/stage-contract.md` — linha `plan` da tabela §2. Pergunta vira decisão no bloco `PM_STAGE_RESULT`; a resposta final é só o bloco.

**Argumento:** caminho ou nome da issue (ex: `docs/issues/prototype/01-pagina-login.md`), **ou** caminho de um sprint (`docs/sprints/SPRINT-NNN-[slug].md`) — nesse caso, rode os Passos 1-3 para cada issue do sprint que ainda não tem `## Arquivos a criar` preenchido, pulando as já enriquecidas, e faça a pesquisa externa (Passo 2) uma vez para o sprint todo.

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

**Ao final:** emita o **Bloco de Handoff** (regra Next Command) com o path real da issue enriquecida e o modelo da sessão de execute (Sonnet · high no padrão — ver Model Advisor); se o `Model hint` do header for `Opus/Fable`, cite na linha `**Ressalva:**` que essa issue é roteada automaticamente:
> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker execute docs/issues/prototype/01-pagina-login.md
> ```
> **Modelo:** Sonnet — issue especificada, execução mecânica.

Se a issue faz parte de um sprint já planejado, o comando primário é o `/execute` do **sprint** (path completo) e o `/execute` da issue isolada vira a alternativa rotulada.
