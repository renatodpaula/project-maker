# Modo: /plan

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.
> **Com `--autopilot`** (rodando dentro do `/project-maker autopilot`): aplique `references/autopilot/stage-contract.md` — linha `plan` da tabela §2. Pergunta vira decisão no bloco `PM_STAGE_RESULT`; a resposta final é só o bloco.

**Argumento:** caminho ou nome da issue (ex: `docs/issues/prototype/01-pagina-login.md`), **ou** caminho de um sprint (`docs/sprints/SPRINT-NNN-[slug].md`) — nesse caso, siga **Plan de sprint em paralelo** (abaixo): pesquisa externa uma vez, depois um sub-agent por issue pendente.

Leia `Constitution.md` e `steering/` se existirem — definem restrições que devem ser respeitadas no plano.
Leia `docs/data-model.md` e o contrato relevante em `docs/contracts/` se existirem.
Leia a issue completa, incluindo os campos `Implements`, `Depends on` e `Can parallelize with`.

### Plan de sprint em paralelo (alvo = sprint)

1. **Fila:** liste as issues do sprint sem `## Arquivos a criar` preenchido. As já enriquecidas ficam de fora. Fila vazia → vá direto ao Bloco de Handoff.
2. **Pesquisa externa uma vez (Passo 2), pelo orquestrador:** o que o sprint todo precisa de documentação. Grave o resultado em `docs/research.md` (seção `## Plan SPRINT-NNN`) — os sub-agents leem de lá, o prompt leva só o path.
3. **Fan-out:** um sub-agent por issue da fila, todos na **mesma mensagem** (lotes de até 6), `subagent_type: general-purpose` com `model: "sonnet"` e `effort: "high"` explícitos (regra **Despacho explícito**). Cada um roda os Passos 1 e 3 para **a sua** issue e escreve **só** o arquivo dela. Prompt: path da issue, do sprint, de `docs/research.md`, `docs/data-model.md` e do contrato relevante; Constitution e steering. Retorno (≤ 5 linhas): status, arquivos a criar/modificar (só os paths), dúvidas.
4. **Conferência do orquestrador (não delegue):** com as listas de paths devolvidas, cheque (a) duas issues da **mesma wave** tocando o mesmo arquivo → mova uma de wave ou funda, e atualize `## Waves` do sprint; (b) duas issues criando o mesmo utilitário/tipo → aponte uma como dona e a outra como consumidora (`Depends on`). Só o orquestrador escreve em sprint.md, STATE.md e DECISIONS.md.
5. Sub-agent que voltou `Blocked`/`Partial` → 1 redespacho; persistiu → enriqueça essa issue no próprio orquestrador.

Com alvo = **issue isolada**, rode os Passos 1-3 direto, sem fan-out.

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
