<div align="center">

# Project Maker

**A [Claude Code](https://claude.ai/code) skill for building software with AI through structured Spec-Driven Development — no vibe coding.**

`discover → init → spec → break → plan → execute → verify → secure → ship`

MIT License · v3.2 · by [@renatodpaula.ai](https://instagram.com/renatodpaula.ai)

[English](#english) · [Português](#português)

</div>

---

## English

### What it is

Project Maker is a single Claude Code skill that turns an idea into shipped code through **progressive artifacts** instead of one long, drifting conversation. The AI is a partner at every step — researching, planning, implementing, validating — not a blind executor.

It is built on **Harness Engineering**: the model is just the LLM; the harness is everything around it — on-disk state, verification sensors, delegation rules, and gates that make the model's output trustworthy.

### The workflow

```
/discover  → brief.md                              guided brainstorming
/init      → steering/ + Constitution.md           project memory bank
             + STATE.md + DECISIONS.md + KNOWLEDGE.md
/spec      → Spec.md (EARS notation)               structured requirements
/break     → research.md + data-model.md +         decompose into work
             contracts/ + sprints/ + issues/ + PRD.md
/plan      → enriched issue                        research + planning
/execute   → wave-based orchestration              implementer → validator loop
/verify    → resumable UAT                         user-acceptance testing
/secure    → SECURITY.md                           security gate on the diff
/ship      → pull request                          push + rich auto-generated PR
/build     → shortcut: plan + execute              for isolated small issues
/pause /resume → STATE.md snapshot                 cross-session continuity
```

**Hierarchy:** `Project → Sprint → Issue`. An issue must fit in one context window — if it doesn't, it's two issues.

### Adaptive scale

Complexity decides depth, not the other way around. The skill auto-sizes:

| Scope | What it is | Applies |
|---|---|---|
| `--quick` | ≤3 files, one sentence | execute only |
| `--feature` | clear feature, 1 sprint | spec → execute → ship |
| `--feature-large` | multi-component, 2-5 sprints | full loop, dual-agent execute |
| `--epic` | ambiguity, new domain | discover → … → ship + UAT |

### Harness Engineering features

- **Fresh-context subagents** — the orchestrator stays lean (<40k tokens); heavy work runs in isolated agents that start clean. Defeats context rot.
- **Validator loop** — every issue is checked by an independent validator (threshold 80, 0/1 gate check, stub/fabrication detection). Max 3 attempts, then it stops — never fabricates a pass.
- **Wave-based parallelism** — independent issues are grouped into dependency waves and run in parallel, with write-safety (only the orchestrator writes living docs).
- **Package Legitimacy Gate** — every suggested package is tagged `[OK] / [SUS] / [ASSUMED] / [SLOP]`. Hallucinated/suspicious packages trigger a human checkpoint or are blocked outright. Defense against *slopsquatting*.
- **Resumable UAT** — user testing one step at a time, survives `/clear`, auto-injects a **cold-start smoke test**, and runs a diagnose → fix → re-verify loop when issues are found.
- **Security gate** — `/secure` reviews the sprint diff (delegating to the `security-review` skill when available) and blocks `/ship` if threats are open.
- **Nyquist rule** — every acceptance criterion needs an automated sensor; if the test doesn't exist, creating it is the first sub-task.
- **Measured Model Advisor** — the model *and effort* for each stage come from a benchmark (every mode run for real on a frozen fixture, blind judges, hidden tests, planted vulnerabilities/bugs — see `evals/model-bench/`). Default (`balanced`): **Sonnet 5 · high** everywhere; `max` uses Fable 5.1 on break and Opus 5.5 xhigh on init; `econ` never escalates. `/break` tags each issue with a `Model hint`; inside `/execute`, flagged issues are auto-dispatched to a stronger model via per-agent override.
- **Handoff Block** — every mode ends with the **complete next command**, real path resolved from disk (`/project-maker execute docs/sprints/SPRINT-031-whatsapp-reply.md`, never a `[placeholder]`), in a copy-paste code block, with the model recommendation in the same box. You never have to ask "what's the command now?". The command is also written to `STATE.md → Next command`, so it survives `/clear`.
- **Native registered agents** — `/init` installs the skill's specialized agents (writers + validator) into the project's `.claude/agents/`, making them real Claude Code subagents: tool restrictions enforced by the harness (the validator has no Write/Edit — direct file edits are blocked; it keeps Bash to run gate commands) and per-agent default models.
- **Living docs** — `STATE.md` (volatile), `DECISIONS.md` (append-only), `KNOWLEDGE.md` (cross-sprint lessons), `PRD.md` (living product doc).

### Artifacts it produces

`brief.md` · `steering/` · `Constitution.md` · `Spec.md` · `research.md` (with Package Legitimacy Audit) · `data-model.md` · `contracts/` · `sprints/` (with waves) · `issues/` · `PRD.md` · `uat.md` · `SECURITY.md` · `STATE.md` · `DECISIONS.md` · `KNOWLEDGE.md`

### Installation

Clone straight into your Claude Code skills directory:

```bash
git clone https://github.com/renatodpaula/project-maker ~/.claude/skills/project-maker
```

Restart Claude Code, then use `/project-maker` in any project.

### Usage

```
/project-maker
```

The skill detects which stage you're in and explains the next step. Or jump straight to a mode: `/project-maker spec`, `/project-maker execute docs/sprints/SPRINT-001-auth.md`, etc.

**Autopilot (opt-in):** `/project-maker autopilot --until sprint --profile balanced` — your session becomes a conductor that runs each stage in a fresh sub-agent (no manual `/clear`), with the right model per stage, and only stops when it needs you. `/project-maker autopilot status | stop | resume`.

### What's new in v3.2

- **Autopilot mode** (`/project-maker autopilot`, opt-in) — the session becomes a conductor: one fresh-context sub-agent per stage, model/effort routed per stage, a status block (`PM_STAGE_RESULT`) validated by 1-line sensors, and a ledger (`.pm-autopilot/`) that survives `/clear`, compaction and usage-limit resets (`autopilot resume`). It stops only for real decisions, batched into two screens: start (how far, push/PR, UAT, cost profile) and post-break (packages, secrets, risky assumptions). Push/PR are run only by the conductor; an optional `PreToolUse` guard (`scripts/pm-guard.sh`) blocks push/PR/destructive git from sub-agents at the harness level. Manual mode is unchanged and remains the default. Tested end-to-end: break → plan → execute (nested implementer/validator) → verify → secure → ship-prep, with two interruptions and resumes.
- **Measured model routing** — a benchmark of every stage across Fable 5.1, Opus 5.5 (xhigh/medium), Sonnet 5 and Haiku 4.5 replaced the old intuition. Sonnet 5 · high was 1st or 2nd on every stage at the lowest cost among the models that got it right; effort mattered more than model; Haiku fabricated "done" markers. Profiles `econ | balanced | max`, stage agents with `model` + `effort` frontmatter, and a per-stage consumption table (≈% of a 5h usage window).
- **Foreground dispatch** — sub-agents are dispatched with `run_in_background: false` (parallel = several calls in one message). The benchmark caught a headless `/execute` losing 5 background sub-agents when the orchestrator ended its turn.
- **Idempotent `/execute`** — reuses an existing sprint branch, skips already-delivered issues, commits planning and closing docs so the tree ends clean.
- **Usage-window brake** — with a one-line statusline opt-in, the autopilot reads your 5h-window usage and pauses before exhausting it.

### What's new in v3.1

- **Progressive disclosure** — `SKILL.md` shrank from 1216 to ~470 lines and became a router (scale matrix + Harness Rules); each mode's full playbook moved to `references/modes/` and is loaded on demand. ~60% less context per invocation.
- **Canonical artifact locations** — planning artifacts live under `docs/` by default; living docs at the root; UAT/SECURITY reports are per-sprint (`docs/sprints/SPRINT-NNN-uat.md` / `-SECURITY.md`). An existing project convention wins and is recorded in `steering/structure.md`.
- Scoped trigger phrases (fewer false activations), `/build` fallback when `Spec.md` is missing, `--quick` no longer assumes a `PRD.md`, documented per-call model override precedence, and skill self-test scenarios in `evals/`.

### What's new in v3

v3 adapts proven ideas from the broader Spec-Driven Development ecosystem and reimplements them idiomatically as a single skill — no external runtime:

- New modes `/verify`, `/secure`, `/ship` closing the loop from local work to merged PR.
- Package Legitimacy Gate (anti-slopsquatting).
- Resumable UAT with cold-start smoke test and gap-closure loop.
- Wave engine with parallel-write safety + the Nyquist sensor rule.

---

## Português

### O que é

Project Maker é uma skill do Claude Code que transforma uma ideia em código entregue através de **artefatos progressivos**, em vez de uma única conversa longa que vai derivando. A IA é parceira em cada etapa — pesquisando, planejando, implementando, validando — não uma executora cega.

É construída sobre **Harness Engineering**: o modelo é só a LLM; o harness é tudo em volta — estado em disco, sensores de verificação, regras de delegação e gates que tornam a saída do modelo confiável.

### O fluxo

```
/discover  → brief.md                              brainstorming guiado
/init      → steering/ + Constitution.md           memory bank do projeto
             + STATE.md + DECISIONS.md + KNOWLEDGE.md
/spec      → Spec.md (notação EARS)                requisitos estruturados
/break     → research.md + data-model.md +         quebra em trabalho
             contracts/ + sprints/ + issues/ + PRD.md
/plan      → issue enriquecida                     pesquisa + planejamento
/execute   → orquestração por waves                loop implementer → validator
/verify    → UAT resumível                         teste de aceitação do usuário
/secure    → SECURITY.md                           gate de segurança no diff
/ship      → pull request                          push + PR rico automático
/build     → atalho: plan + execute               para issues pequenas isoladas
/pause /resume → snapshot em STATE.md             continuidade entre sessões
```

**Hierarquia:** `Projeto → Sprint → Issue`. Uma issue tem que caber em uma janela de contexto — se não cabe, são duas.

### Escala adaptativa

A complexidade decide a profundidade, não o contrário. A skill se auto-dimensiona:

| Escopo | O que é | Aplica |
|---|---|---|
| `--quick` | ≤3 arquivos, uma frase | só execute |
| `--feature` | feature clara, 1 sprint | spec → execute → ship |
| `--feature-large` | multi-componente, 2-5 sprints | loop completo, execute dual-agent |
| `--epic` | ambiguidade, domínio novo | discover → … → ship + UAT |

### Recursos de Harness Engineering

- **Subagentes de contexto limpo** — o orquestrador fica enxuto (<40k tokens); o trabalho pesado roda em agentes isolados que começam do zero. Derrota o context rot.
- **Loop de validação** — toda issue é checada por um validator independente (threshold 80, gate check 0/1, detecção de stub/fabricação). Máximo 3 tentativas, depois para — nunca fabrica um "pass".
- **Paralelismo por waves** — issues independentes são agrupadas em waves de dependência e rodam em paralelo, com segurança de escrita (só o orquestrador escreve os living docs).
- **Package Legitimacy Gate** — todo pacote sugerido é tagueado `[OK] / [SUS] / [ASSUMED] / [SLOP]`. Pacote alucinado/suspeito dispara checkpoint humano ou é bloqueado. Defesa contra *slopsquatting*.
- **UAT resumível** — teste do usuário um passo por vez, sobrevive a `/clear`, injeta automaticamente um **cold-start smoke test** e roda um loop diagnose → fix → re-verify quando acha problema.
- **Gate de segurança** — `/secure` revisa o diff do sprint (delegando à skill `security-review` quando disponível) e bloqueia o `/ship` se houver ameaça aberta.
- **Regra Nyquist** — todo critério de aceitação precisa de um sensor automático; se o teste não existe, criá-lo é a primeira sub-task.
- **Model Advisor medido** — o modelo *e o effort* de cada etapa vêm de um benchmark (cada modo rodado de verdade sobre um insumo congelado, juízes cegos, testes ocultos, vulnerabilidades e bugs plantados — ver `evals/model-bench/`). Padrão (`balanced`): **Sonnet 5 · high** em tudo; `max` usa Fable 5.1 no break e Opus 5.5 xhigh no init; `econ` nunca escala. O `/break` marca cada issue com um `Model hint`; dentro do `/execute`, as issues marcadas são despachadas num modelo mais forte via override por agente.
- **Bloco de Handoff** — todo modo termina com o **comando completo do próximo passo**, path real resolvido do disco (`/project-maker execute docs/sprints/SPRINT-031-resposta-por-whatsapp.md`, nunca um `[placeholder]`), num bloco de código pronto pra copiar, com a recomendação de modelo na mesma caixa. Você nunca precisa perguntar "qual o comando agora?". O comando também é gravado em `STATE.md → Next command`, então sobrevive ao `/clear`.
- **Agentes nativos registrados** — o `/init` instala os agentes especializados do skill (writers + validator) em `.claude/agents/` do projeto, tornando-os subagentes reais do Claude Code: restrição de ferramentas garantida pelo harness (o validator não tem Write/Edit — edits diretos de arquivo ficam bloqueados; ele mantém Bash para rodar o Gate) e modelo default por agente.
- **Living docs** — `STATE.md` (volátil), `DECISIONS.md` (append-only), `KNOWLEDGE.md` (lições cross-sprint), `PRD.md` (documento vivo do produto).

### Artefatos que produz

`brief.md` · `steering/` · `Constitution.md` · `Spec.md` · `research.md` (com Package Legitimacy Audit) · `data-model.md` · `contracts/` · `sprints/` (com waves) · `issues/` · `PRD.md` · `uat.md` · `SECURITY.md` · `STATE.md` · `DECISIONS.md` · `KNOWLEDGE.md`

### Instalação

Clone direto na pasta de skills do Claude Code:

```bash
git clone https://github.com/renatodpaula/project-maker ~/.claude/skills/project-maker
```

Reinicie o Claude Code e use `/project-maker` em qualquer projeto.

### Uso

```
/project-maker
```

A skill detecta em qual etapa você está e explica o próximo passo. Ou vá direto a um modo: `/project-maker spec`, `/project-maker execute docs/sprints/SPRINT-001-auth.md`, etc.

**Autopilot (opt-in):** `/project-maker autopilot --until sprint --profile balanced` — sua sessão vira um condutor que roda cada etapa num sub-agente com contexto limpo (sem `/clear` manual), com o modelo certo por etapa, e só para quando precisa de você. `/project-maker autopilot status | stop | resume`.

### Novidades da v3.2

- **Modo autopilot** (`/project-maker autopilot`, opt-in) — a sessão vira condutor: um sub-agente com contexto limpo por etapa, modelo/effort roteados por etapa, um bloco de status (`PM_STAGE_RESULT`) validado por sensores de 1 linha, e um ledger (`.pm-autopilot/`) que sobrevive a `/clear`, compactação e reset do limite de uso (`autopilot resume`). Só para em decisão real, concentrada em duas telas: início (até onde, push/PR, UAT, perfil de custo) e pós-break (pacotes, segredos, suposições de risco). Push/PR só pelo condutor; um guard `PreToolUse` opcional (`scripts/pm-guard.sh`) bloqueia push/PR/git destrutivo de sub-agentes no harness. O modo manual não muda e continua o padrão. Testado ponta a ponta: break → plan → execute (implementer/validator aninhados) → verify → secure → ship-prep, com duas interrupções e retomadas.
- **Roteamento de modelo medido** — um benchmark de todas as etapas com Fable 5.1, Opus 5.5 (xhigh/medium), Sonnet 5 e Haiku 4.5 substituiu a intuição. Sonnet 5 · high ficou em 1º ou 2º em todas as etapas pelo menor custo entre os que acertam; o effort pesou mais que o modelo; o Haiku fabricou marcações de "feito". Perfis `econ | balanced | max`, agentes de etapa com `model` + `effort` no frontmatter, e tabela de consumo por etapa (≈% da janela de 5h).
- **Despacho em foreground** — sub-agents saem com `run_in_background: false` (paralelo = várias chamadas numa mensagem). O benchmark pegou um `/execute` headless perdendo 5 sub-agents em background quando o orquestrador encerrou o turno.
- **`/execute` idempotente** — reusa o branch do sprint, pula issues já entregues, commita planning e fechamento para a árvore terminar limpa.
- **Freio da janela de uso** — com um opt-in de 1 linha na statusline, o autopilot lê o uso da janela de 5h e pausa antes de estourar.

### Novidades da v3.1

- **Progressive disclosure** — o `SKILL.md` caiu de 1216 para ~470 linhas e virou um roteador (matriz de escala + Harness Rules); o playbook completo de cada modo foi para `references/modes/` e é carregado sob demanda. ~60% menos contexto por invocação.
- **Localização canônica dos artefatos** — artefatos de planejamento vivem em `docs/` por padrão; living docs na raiz; relatórios de UAT/SECURITY são por sprint (`docs/sprints/SPRINT-NNN-uat.md` / `-SECURITY.md`). Convenção existente do projeto vence e fica registrada em `steering/structure.md`.
- Triggers escopados (menos ativações falsas), fallback do `/build` quando não há `Spec.md`, `--quick` não assume mais `PRD.md`, precedência do override de modelo por chamada documentada, e cenários de auto-teste do skill em `evals/`.

### Novidades da v3

A v3 adapta ideias consagradas do ecossistema de Spec-Driven Development e as reimplementa de forma idiomática como uma única skill — sem runtime externo:

- Modos novos `/verify`, `/secure`, `/ship` fechando o loop do trabalho local até o PR mergeado.
- Package Legitimacy Gate (anti-slopsquatting).
- UAT resumível com cold-start smoke test e loop de fechamento de gaps.
- Wave engine com segurança de escrita paralela + a regra de sensor Nyquist.

---

## Contributing · Contribuindo

Issues and pull requests welcome. Open an issue describing the change before implementing it.
Sugestões e pull requests são bem-vindos. Abra uma issue descrevendo a mudança antes de implementar.

## Author · Autor

**Renato de Paula Cardoso**

- Instagram: [@renatodpaula.ai](https://instagram.com/renatodpaula.ai)
- Email: renato@renatodpaula.com.br
- GitHub: [@renatodpaula](https://github.com/renatodpaula)

## License · Licença

MIT — see [LICENSE](LICENSE).
