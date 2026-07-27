# Modo: /execute

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.

**Argumento:** caminho de um **sprint** (`docs/sprints/SPRINT-NNN-[slug].md`) ou, em modo `--quick`, de uma issue isolada.

`/execute` é um **orquestrador**. Ele não escreve código diretamente — dispara sub-agents separados para implementar e validar cada issue do sprint, roda reassess ao fim, e aplica o Milestone Validation Gate antes de fechar o sprint.

**Fluxo geral:**

```
/execute SPRINT-NNN
  │
  ├─ Session Loading (STATE, DECISIONS, KNOWLEDGE, Constitution, steering)
  ├─ Para cada WAVE do sprint (na ordem do DAG; ver ## Waves do sprint.md):
  │    ├─ Issues da wave rodam em PARALELO (1 sub-agent por issue [P]):
  │    │    ├─ spawn implementer (sub-agent isolado)
  │    │    ├─ spawn validator (sub-agent separado, lê issue + diff + gate result)
  │    │    ├─ se fail e <3 tentativas → re-dispatch implementer com gaps do validator
  │    │    ├─ se pass → fecha issue
  │    │    └─ se 3 fails → marca blocker, pula
  │    └─ Fim da wave: ORQUESTRADOR serializa escritas em PRD/STATE/DECISIONS/KNOWLEDGE
  ├─ Reassess Phase (4 perguntas, atualiza PRD/DECISIONS/KNOWLEDGE)
  ├─ Milestone Validation Gate (todos os Success Criteria verificados)
  └─ Fecha sprint como done OU pending-review
       → handoff: /verify (se user-facing) → /secure → /ship
```

### Passo 0 — Session Loading (Harness Rules)

- Leia `STATE.md` — onde parou a última sessão, blockers ativos, lessons aplicáveis
- Leia `DECISIONS.md` — decisões arquiteturais relevantes
- Leia `KNOWLEDGE.md` — patterns e anti-patterns aplicáveis
- Leia `Constitution.md` e `steering/` (product, structure, tech)
- Leia o **sprint.md** alvo — Goal, Success Criteria, lista de issues, dependências
- Leia `docs/data-model.md` e contratos relevantes em `docs/contracts/` se o sprint envolver dados/APIs
- Para cada issue do sprint, verifique se está enriquecida (tem seção "Arquivos a criar"). Se alguma não estiver, instrua a rodar `/plan` para ela antes de continuar
- **Se qualquer issue do sprint tocar arquivo/área em `steering/CONCERNS.md`**, carregue o CONCERNS
- **Model Advisor / Routing:** varra o campo `Model hint` das issues do sprint. Se alguma tem hint `Opus/Fable`: (a) se o Agent tool da sessão suporta override de `model`, informe que essas issues serão despachadas em tier de raciocínio automaticamente e siga; (b) se não suporta, avise: "issues X, Y são raciocínio/prompt-heavy — considere trocar de modelo para essas". Não bloqueia (regra Model Advisor).

Marque o sprint como `🔄 in-progress` no PRD.md e no próprio sprint.md.

### Passo 1 — Branch isolada do sprint

```bash
git checkout -b sprint/[slug-do-sprint]
```

Todas as issues do sprint são commitadas nesta mesma branch (1 commit por issue), fechando o sprint com um merge único em main ao final.

### Passo 2 — Loop de implementação por wave

Leia a seção `## Waves` do sprint.md. Execute **wave por wave**, na ordem do DAG. Dentro de uma wave, dispare um sub-agent por issue **em paralelo** (issues `[P]` que não colidem em arquivo). A wave seguinte só começa quando todas as issues da anterior fecharam.

> **Parallel Write Safety:** dentro da wave, sub-agents implementam e retornam resultado, mas **só o orquestrador** escreve em STATE/PRD/DECISIONS/KNOWLEDGE, serializando ao fim da wave (ver Harness Rules). Sub-agent nunca edita living doc direto.

Para cada issue da wave:

**2.1 — Phase Gates constitucionais** (checagem rápida antes de delegar):
- Respeita stack do Constitution.md?
- Alinhada com data-model.md e contracts/?
- Sem features especulativas?
- Inputs validados no servidor, sem secrets expostos?
- Testes serão escritos junto?
- **Nyquist:** todo `Done when` da issue tem um sensor em `Tests`? Se algum está `MISSING`, a primeira sub-task do implementer é criar o teste (scaffold) antes de implementar.
- **Package Legitimacy:** a issue instala pacote? Consulte `## Package Legitimacy Audit` do `docs/research.md`. `[OK]` instala; `[SUS]`/`[ASSUMED]` exigem **checkpoint humano** (mostre o link do registry e confirme antes); `[SLOP]` é **proibido** — pare e reporte, nunca troque o nome em silêncio. Se não há tabela e a issue instala pacote, **bloqueie** e instrua rodar/atualizar o `/break`.

Se algum gate falhar, documente a exceção no Summary da issue antes de prosseguir.

**2.2 — Spawn do implementer** (sub-agent isolado)

Escolha o agente conforme o tipo de arquivo da issue:

| Tipo de arquivo | Agente |
|---|---|
| Componentes UI (`.tsx`, `.vue`, `.svelte`) | `component-writer` |
| Server actions, lógica de servidor | `action-writer` |
| Hooks de estado/efeito | `hook-writer` |
| Schema, migrations, modelos | `model-writer` |
| Rotas de API, endpoints | `route-writer` |
| Integrações externas | `integration-writer` |
| Arquivos de teste | `test-writer` |

**Como despachar (em ordem de preferência):**
1. **Agente registrado** — se o agente existe em `.claude/agents/` do projeto (instalado pelo `/init` Passo 4), dispare via `subagent_type` com o nome da tabela. O frontmatter cuida de tools e model default.
2. **Fallback** — leia `references/agents/[nome].md` do skill e use o conteúdo como prompt de um sub-agent genérico.

**Model Routing (regra Model Advisor):** se a issue tem `Model hint: Opus/Fable` e o Agent tool suporta override de `model`, passe `model: opus` no dispatch **desta issue**. Hint `Sonnet` ou ausente → não passe override (herda o default). Vale para os dois modos de dispatch. O override por chamada **vence** o `model:` do frontmatter do agente registrado — passar `model: opus` num agente com `model: sonnet` funciona.

**Contexto que o implementer recebe** (regras de Sub-Agent Delegation):
- A issue completa (Descrição, Cenários, Done when, Tests, Gate, Arquivos a criar/modificar, Padrões)
- Constitution.md + steering/structure.md + steering/tech.md
- data-model.md e contracts/ relevantes
- CONCERNS.md **só se** a issue toca área flagged
- Spec.md dos REQs que a issue implementa

**Não recebe:** outras issues, STATE.md completo, histórico da conversa, specs de outras features.

**O implementer retorna:**
- Status (Complete | Blocked | Partial)
- Files changed
- Gate check result (exit code + contagens de teste)
- Spec Deviations (lista ou `none`)
- Issues encontradas

**2.3 — Spawn do validator** (sub-agent SEPARADO)

Dispare o `validator` como sub-agent independente — mesma ordem de preferência do 2.2: `subagent_type: validator` se registrado em `.claude/agents/`, senão `references/agents/validator.md` como prompt. O validator **nunca** implementa — só avalia. Registrado, o frontmatter dele não inclui Write/Edit — edits diretos bloqueados pelo harness (o Bash do Gate permanece; ver nota do `/init` Passo 4).

**Contexto que o validator recebe:**
- Issue original (antes da implementação)
- `git diff sprint/[slug]` da issue
- Gate check result reportado pelo implementer
- Spec Deviations reportados pelo implementer
- Spec.md, Constitution.md, steering/, data-model.md, contracts/ relevantes

**Retorna:** Verdict (pass/fail), Score (0-100), Scoring breakdown, Gaps específicos, Deviation review, Recommended action.

**Threshold mínimo: 80.** Score < 80 = fail automático. Gate check != 0 = fail automático (mesmo que score seja alto). Detecção de stub/fabricação = fail automático.

**2.4 — Loop de correção**

- Se validator `pass` → prossiga para 2.5
- Se validator `fail` e tentativas < 3 → re-dispatch do **implementer** passando os Gaps do validator como instruções de correção. Volta para 2.3.
- Se tentativas == 3 → registre em `STATE.md` como blocker com o histórico das 3 tentativas, marque issue como `⏸ blocked` no PRD, pule para a próxima issue

**Limite absoluto: 3 iterações por issue.** Não estender. Quebrar o loop é o comportamento correto — fabricar pass é o errado.

**2.5 — Fechar issue**

- Commit: `git commit -m "feat(SPRINT-NNN/[slug-issue]): [título da issue]"`
- Preencha `## Summary` da issue com Status, Files changed, Gate result, Issues encontradas, Spec Deviations (lista completa ou `none`)
- Se houver deviation que afeta data-model, contracts, ou outras issues do sprint, sinalize e atualize os arquivos afetados nesta mesma sessão
- Atualize `PRD.md` (se existir): status da issue → `✅ entregue`
- Atualize `STATE.md`: current issue → próxima; append blockers/lessons novos
- Se a issue gerou decisão arquitetural nova → append em `DECISIONS.md`
- Se a issue gerou pattern/anti-pattern/gotcha reusável → append em `KNOWLEDGE.md`

Prossiga para a próxima issue do sprint.

### Passo 3 — Reassess Phase

Ao fim de todas as issues do sprint, antes de fechar, execute o reassess. Responda explicitamente às 4 perguntas no campo `## Reassess Notes` do sprint.md:

1. **O que aprendemos neste sprint?** — surpresas, padrões que funcionaram, falhas recorrentes
2. **Alguma issue dos próximos sprints ficou desnecessária?** — se sim, remova do PRD e marque como superseded
3. **Alguma issue nova precisa existir?** — gap descoberto na prática; crie e adicione no sprint apropriado
4. **Alguma decisão arquitetural mudou?** — se sim, append em DECISIONS.md com contexto "decisão anterior X revisada porque Y"

Atualize PRD.md, os sprint.md afetados, DECISIONS.md e KNOWLEDGE.md conforme as respostas.

### Passo 4 — Milestone Validation Gate

Antes de marcar o sprint como `✅ done`, rode o checklist do `## Milestone Validation Gate` do sprint.md:

- [ ] Todos os Success Criteria têm evidência observável (não "deve funcionar" — **mostre**)
- [ ] Todas as issues do sprint têm Gate check `pass` registrado no Summary
- [ ] Todos os Spec Deviations foram revistos e aceitos ou corrigidos
- [ ] PRD.md reflete status real
- [ ] DECISIONS.md atualizado se houve decisões novas
- [ ] STATE.md limpo dos blockers que pertenciam a este sprint

**Regra:** se **qualquer** item falhar, o sprint fica `⏸ pending-review`, **não** `done`. Liste os itens que falharam em STATE.md → Blockers e pare. Fabricar um "done" é proibido.

### Passo 4.5 — Interactive UAT (condicional)

Dispare UAT interativo **apenas** se o sprint entrega uma feature user-facing com comportamento visual/complexo que o validator automático não cobre 100%. Gate check + validator já cobrem lógica, mas não cobrem *experiência*.

**Quando disparar:**
- Sprint inclui issues de `prototype/` (UI)
- Sprint entrega um fluxo end-to-end que o usuário final vai usar
- Há interações que dependem de percepção humana (animations, spacing, tom de voz dos erros)

**Quando NÃO disparar:**
- Sprint só toca backend, migrations, refactor interno
- Sprint é um bugfix pontual
- Escopo é `--quick`

**Fluxo:** dispare o modo `/verify` (ver `references/modes/verify.md`) passando o sprint atual. Ele gera o UAT resumível (`docs/sprints/SPRINT-NNN-uat.md`), injeta o cold-start smoke test quando aplicável, conduz o teste um a um, e — se houver gaps — roda o loop diagnose→fix→re-verify. Em `--quick`, gere o uat ao lado da issue.

- Se `/verify` retorna **sem gaps** → prossiga para Passo 5.
- Se retorna **com gaps** → o `/verify` já criou as issues de fix; mantenha o sprint `⏸ pending-review` até as fixes passarem no re-verify.

O UAT **não substitui** o Milestone Gate — é complementar, só para features onde a experiência importa.

### Passo 5 — Fechar sprint e entregar

Se o Milestone Gate passou:

- Marque sprint como `✅ done` em PRD.md e sprint.md (preencha `Fechado em`)
- Atualize STATE.md (current → próximo sprint, blockers limpos)
- Encaminhe para o **loop de fechamento**, na ordem aplicável:
  1. `/verify [sprint]` — se o sprint é user-facing (já disparado no Passo 4.5; se pulou lá, é aqui)
  2. `/secure [sprint]` — se o sprint tocou auth, dados, input externo ou superfície de rede
  3. `/ship [sprint]` — push + PR com body rico (quando há remote configurado)

Se **não há remote** (projeto local), o `/ship` cai no fallback de merge local: mostre `git diff main`, proponha `git checkout main && git merge sprint/[slug]`, aguarde confirmação.

Se o Milestone Gate **não** passou: liste pendências, registre em STATE.md → Blockers, marque sprint como `⏸ pending-review` e aguarde instruções. Não encaminhe para ship.

**Bloco de Handoff (obrigatório — regra Next Command).** Feche a resposta com o comando completo do próximo estágio do loop de fechamento, **path real resolvido**, nunca uma descrição do que rodar:

> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker verify docs/sprints/SPRINT-031-resposta-por-whatsapp.md
> ```
> **Modelo:** Sonnet — UAT conduzido, sem raciocínio pesado.
> **Depois:** `/secure` → `/ship`.

Qual comando entra no bloco, por estado:

| Estado ao fechar | Comando primário |
|---|---|
| Gate passou + sprint user-facing | `/project-maker verify [path do sprint]` |
| Gate passou + não user-facing + toca auth/dados/input | `/project-maker secure [path do sprint]` |
| Gate passou + verify/secure já limpos ou N/A | `/project-maker ship [path do sprint]` |
| Gate passou + há próximo sprint e nada a fechar | `/project-maker execute [path do próximo sprint]` |
| Gate **não** passou / blocker ativo | `/project-maker execute [path das issues de fix]` — comando de recuperação, não do próximo estágio |

Cite na linha `**Depois:**` o resto da cadeia, para o usuário ver quantos passos faltam.

---

### Modo `--quick`: /execute em issue isolada

Quando a escala for `--quick` (bug fix, mudança pequena), `/execute` aceita uma issue isolada sem sprint:

- Pula o conceito de sprint
- Rodar Passo 0 (Session Loading simplificado — STATE + Constitution), Passo 1 (branch por issue), Passo 2 completo (implementer + validator loop), pula Passo 3 (reassess) e Passo 4 (milestone gate)
- Atualiza STATE.md normalmente no Passo 2.5; PRD.md **só se existir** (issue isolada sem `/break` prévio não tem PRD — não crie um só para isso)
