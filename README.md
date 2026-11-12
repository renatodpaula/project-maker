<div align="center">

# Project Maker

**A [Claude Code](https://claude.ai/code) skill for building software with AI through structured Spec-Driven Development — no vibe coding.**

`discover → init → spec → break → plan → execute → verify → secure → ship`

MIT License · v3.5.1 · by [@renatodpaula.ai](https://instagram.com/renatodpaula.ai) · [Wiki](https://github.com/renatodpaula/project-maker/wiki)

[English](#english) · [Português](#português)

</div>

---

## English

### What it is

Project Maker is a single Claude Code skill that turns an idea into shipped code through **progressive artifacts**, instead of one long conversation that drifts. The AI is a partner at every step (researching, planning, implementing, validating), not a blind executor.

It is built on **Harness Engineering**. The model is just the LLM; the harness is everything around it: on-disk state, verification sensors, delegation rules, and gates that make the model's output trustworthy.

### The workflow

```
/discover      → brief.md                                   guided brainstorming           (Complex)
/init          → steering/ + Constitution.md                 project memory bank            (Medium+)
                 + STATE.md + DECISIONS.md + KNOWLEDGE.md
                 + pointer block in CLAUDE.md
/spec          → Spec.md, or docs/specs/FEAT-NNN-slug.md    structured requirements (EARS),  (Medium+)
                 for a feature (+ context)                    approved by you before /break
/break         → docs/research.md + docs/data-model.md      decompose into work            (Large+)
                 + docs/contracts/ + docs/sprints/ (waves)
                 + docs/issues/ (Model hint) + PRD.md
/plan          → enriched issue (or a whole sprint)         research + planning            (all)
/execute       → waves → implementer → validator            orchestration, idempotent      (all)
                 → reassess → milestone gate
/verify        → docs/sprints/SPRINT-NNN-uat.md             resumable UAT + cold start     (user-facing)
/secure        → docs/sprints/SPRINT-NNN-SECURITY.md        security gate on the diff      (auth/data/input)
/ship          → pull request                               push + rich auto-generated PR  (when remote exists)
/build         → shortcut: plan + execute                   isolated small issues          (Small/Medium)
/pause /resume → STATE.md snapshot                          cross-session continuity       (anytime)
/autopilot     → .pm-autopilot/ledger.md                    runs the stages for you        (opt-in, Large+)
```

**Two ways to run the same loop:**
- **Manual (default).** Each mode ends with a **Handoff Block**: the exact next command, with the real path and the recommended model. You `/clear` and paste it. You review between stages and control the pace of consumption.
- **Autopilot (opt-in).** `/project-maker autopilot` turns your session into a conductor. It runs every stage in a fresh sub-agent with the measured model for that stage, so there is no manual `/clear`. It stops only when it needs a decision from you.

**Closing loop.** After a sprint passes the milestone gate, it goes `/verify` (if user-facing) → `/secure` (if it touches auth, data or input) → `/ship`. `/ship` only opens the PR when there are no open UAT gaps and no open threats.

**Hierarchy:** `Project → Sprint → Issue`. An issue must fit in one context window. If it doesn't, it's two issues.

### Adaptive scale

Complexity decides depth, not the other way around. The skill sizes itself automatically:

| Scope | What it is | Stages |
|---|---|---|
| `--quick` | ≤3 files, one sentence | inline plan → execute of one issue |
| `--feature` | clear feature, 1 sprint | spec → plan → execute → verify/secure/ship |
| `--feature-large` | multi-component, 2–5 sprints | init → spec → break → plan → execute → closing loop |
| `--epic` | ambiguity, new domain | discover → … → ship, with Discuss phase and UAT |

### Autopilot

```
/project-maker autopilot [target] [--until spec|break|sprint|all] [--profile econ|balanced|max]
/project-maker autopilot status | stop | resume
```

- **Conductor + stage agents.** Your session dispatches one sub-agent per stage and passes `model` and `effort` on every call (Sonnet · high by default; Fable · high for `/break` in `max`). The `pm-stage-*` agents are optional. The sub-agent runs the mode with `--autopilot` and returns a short status block (`PM_STAGE_RESULT`). The conductor checks that block with sensors instead of trusting it: `scripts/pm.py next` (the handoff command matches `STATE.md`, has no placeholder, every path exists), `pm.py coverage` and `pm.py waves` after `/break`, a clean tree, and the project's test command run twice after each `/execute`.
- **It only stops for you, in two batched screens.**
  - **T0, at the start:** how far to go, push/PR policy, UAT policy, and cost profile.
  - **G1, after `/break`:** suspicious packages, required secrets, and high-risk assumptions.
  - **Other stops:** spec questions, stuck issues, UAT tests that need human eyes, push/PR, and new scope.
  - **Merge is never automatic.**
- **Resumable.** State lives in `.pm-autopilot/ledger.md` (git-excluded), so `/clear`, compaction or a usage-limit cut lose nothing. Run `autopilot resume` afterwards. It re-confirms your push policy in a new session.
- **Safe, in two layers.** Only the conductor pushes or opens PRs, and it builds those commands itself. A git `pre-push` hook refuses any push without the conductor's run token, whatever launched it. A `PreToolUse` guard blocks sub-agents from pushing, opening PRs, running destructive git or the common deploy CLIs. Neither is a sandbox: they stop accidents, and a deploy fired from a project script (`make deploy`) is not covered.
- **It does not redispatch blindly.** A stage reported as `failed` may still be alive. The conductor reads `git log`/`git status` twice before redispatching, has a wait ceiling per stage, and stops abandoned children.
- **It uses your usage window faster.** Stages run back to back with no idle time between them. A 3-sprint project takes about one full 5-hour window.

**Setup (optional, once)** — details in `references/autopilot/hooks.md`:
1. **Usage-window brake.** Add the block from *§ Medidor da janela de uso* to your statusline script. It writes `~/.claude/pm-usage.json` (`five_hour`/`seven_day` `used_percentage` + `resets_at`). The conductor then pauses before a stage once you pass the profile threshold (econ 60% · balanced 80% · max 90%), instead of dying mid-stage at the limit.
2. **Push/PR guard.** Install the `pre-push` hook per project (`cp scripts/pm-pre-push.sh "$(git rev-parse --git-path hooks)/pre-push"`, if none exists). The `PreToolUse` guard is already registered when the skill loads as a plugin (needs `jq`); otherwise copy `scripts/pm-guard.sh` to `.claude/hooks/` and register it in `.claude/settings.local.json`. Test both with `bash scripts/test-pm-guard.sh` (77 cases).
3. **Permissions.** Use auto mode, or `acceptEdits` plus an allowlist, so a permission prompt doesn't stall a long run.

### Which model per stage (measured)

> **Read this first.** The numbers below compare models *inside* the skill, on one small greenfield fixture, mostly one run per cell. No run has yet measured the same input *without* the skill; the `baseline` command in `evals/model-bench/` exists for that and has not been run. See "Lacunas do método" in `evals/model-bench/README.md`.

Every mode was run for real on a frozen fixture across Fable 5.1, Opus 5.5 (xhigh and medium), Sonnet 5 and Haiku 4.5. Quality was scored with blind judges, hidden acceptance tests, 5 planted vulnerabilities and 2 planted bugs. The method and harness are in `evals/model-bench/`; the full report is on the [wiki](https://github.com/renatodpaula/project-maker/wiki/Benchmark-Report-2026-09).

- **Sonnet 5 · high was 1st or 2nd on every stage**, at the lowest cost among the models that got it right. It is the default everywhere.
- **Sonnet 5.5 · high vs medium** (re-measured 2026-10 on discover/init/spec/plan, 1 run per cell, 3 blind judges): high averaged 92.4 vs 88.1 for medium and 84.1 for Sonnet 5 · high re-run on the same input. Medium cost 30% less and took ~60% of the time but scored lower on init (82 vs 89) and spec (84.7 vs 93.0). The average gap (4.3) is within single-run noise, so high stays the default and no speed profile was added. `/break`, `/execute`, `/secure` and `/verify` were not re-measured.
- **Effort mattered more than the model.** Opus 5.5 at xhigh cost 2–3× and took 3–5× longer than at medium, with no consistent gain.
- **Opus 5.5 · medium was the fastest**, but it lost fidelity in the spec: it contradicted an owner's answer.
- **Fable 5.1 only won `/break`**: +3 points at 2.7× the cost.
- **Haiku fabricated "done" markers.**

**Cost profiles** (`--profile`; not the same as Claude Code's effort levels):

| | econ | balanced (default) | max |
|---|---|---|---|
| Model per stage | Sonnet 5 · high everywhere | Sonnet 5 · high everywhere | Fable 5.1 on break, Opus 5.5 xhigh on init, Sonnet elsewhere |
| Issue with `Model hint: Opus/Fable` | not escalated | Opus 5.5 · high | Fable 5.1 · high |
| Autopilot pauses at 5h-window usage | 60% | 80% | 90% |
| Autopilot max stages per run | 12 | 30 | 60 |
| 3-sprint project, end to end | ~$33, split in 2 blocks | ~$33–36, ~1 window | ~$40–43, ~1.2 windows |

- **econ** saves by not escalating and by stopping early, which leaves headroom for your other work. It does not use a weaker model: the benchmark found none worth it.
- **max** buys a small, measured gain.
- Use **balanced** day to day.

Rough cost per stage (balanced, API prices): break ~$3, execute of a 10-issue sprint ~$6.5 (≈20% of a 5h window), verify/secure/ship ~$0.3–0.5 each.

### Harness Engineering features

- **Fresh-context sub-agents.** The orchestrator stays lean. Heavy work runs in isolated agents that start clean, which defeats context rot.
- **Dispatch and wait.** Parallelism comes from several Agent calls in one message. Sub-agents run in the background and report by notification, so no mode closes while a child is still pending. Every call carries an explicit `model` and `effort`, so nothing inherits the session's model.
- **Escalation on failure.** The third attempt at an issue runs one model tier up (`sonnet` → `opus` → `fable`) before a human is asked.
- **Validator loop.**
  - Every issue is checked by an independent validator that **runs the gate itself** and compares `git status` against the files the implementer declared. Pass needs every criterion met (no score to trade off): gate exit 0, no undeclared file, every `Done when` evidenced, tests that prove something (red proof), no stub.
  - Max 3 attempts, then it stops. It never fabricates a pass.
- **Wave-based parallelism.**
  - Independent issues are grouped into dependency waves and run in parallel.
  - Write safety: only the orchestrator writes living docs, and issues in the same wave never touch the same files.
- **Idempotent `/execute`.**
  - Reuses the sprint branch and skips issues that were already delivered.
  - Commits planning docs first and closing docs last, so the tree ends clean.
  - Safe to re-run after any interruption.
- **Package Legitimacy Gate.**
  - Every suggested package is tagged `[OK] / [SUS] / [ASSUMED] / [SLOP]`.
  - Hallucinated or suspicious packages trigger a human checkpoint or are blocked outright.
  - A defense against *slopsquatting*.
- **Resumable UAT.**
  - User testing one step at a time, and it survives `/clear`.
  - Auto-injects a **cold-start smoke test**.
  - Runs a diagnose → fix → re-verify loop when issues are found.
- **Security gate.** `/secure` reviews the sprint diff, delegating to the `security-review` skill when it's available, and blocks `/ship` while threats are open.
- **Nyquist rule and red proof.** Every acceptance criterion needs an automated sensor. If the test doesn't exist, creating it is the first sub-task, and a new test must be seen failing before the implementation.
- **Deterministic sensors (`scripts/pm.py`).** `next` validates the handoff command, `coverage` finds requirements with no issue, `waves` finds same-wave file collisions, `status` reads the project state from disk. Exit codes, not prose rules.
- **Works without a UI.** Prototype issues exist only when the spec has screens; CLI, library and pipeline work goes to a generic implementer. The first sprint is a thin end-to-end slice.
- **Measured Model Advisor.**
  - The model and effort for each stage come from the benchmark above.
  - `/break` tags each issue with a `Model hint`.
  - Inside `/execute`, flagged issues are auto-dispatched to a stronger model through a per-agent override. No session switching.
- **Handoff Block.**
  - Every mode ends with the **complete next command**, with the real path resolved from disk (never a `[placeholder]`) and the model recommendation in the same box.
  - It is also written to `STATE.md → Next command`, so it survives `/clear`, and `pm.py next` checks it before it is shown.
- **Native registered agents.**
  - Loaded as a plugin, the writers, the validator and the stage agents are registered in every project as `project-maker:<name>`. Without the plugin, `/init` copies them into the project's `.claude/agents/`.
  - Tool restrictions are enforced by the harness (the validator has no Write/Edit; it keeps Bash to run the gate), and `model` and `effort` go on every call.
- **Living docs.** `STATE.md` (volatile), `DECISIONS.md` (append-only), `KNOWLEDGE.md` (cross-sprint lessons), `PRD.md` (living product doc).

### Artifacts it produces

| Where | Files |
|---|---|
| Project root | `brief.md` · `Constitution.md` · `Spec.md` · `context.md` · `PRD.md` · `STATE.md` · `DECISIONS.md` · `KNOWLEDGE.md` · `steering/` · a pointer block in `CLAUDE.md` |
| `docs/` | `research.md` (with Package Legitimacy Audit) · `data-model.md` · `contracts/` · `sprints/` (with waves) and `issues/` of the project spec |
| `docs/specs/FEAT-NNN-slug/` | one folder per feature: `spec.md` · `context.md` · `sprints/` · `issues/` |
| Per sprint | `SPRINT-NNN-uat.md` · `SPRINT-NNN-SECURITY.md`, next to the sprint file |
| `.claude/agents/` | writers, validator, `pm-stage-workhorse`, `pm-stage-reasoning` (only without the plugin) |
| Autopilot only | `.pm-autopilot/ledger.md` and `guard.log` (git-excluded) · PR body/title drafts · `.git/hooks/pre-push` |

Both layouts live side by side: projects created before v3.5 keep `docs/sprints/` and `docs/issues/` (and single-file feature specs, `docs/specs/FEAT-NNN-slug.md`), and nothing already written is moved. Sprint numbers are unique across the project. An existing project convention for artifact locations wins, and it's recorded in `steering/structure.md`.

### Installation

Clone straight into your Claude Code skills directory:

```bash
git clone https://github.com/renatodpaula/project-maker ~/.claude/skills/project-maker
```

Restart Claude Code, then use `/project-maker` in any project. To update later, run `git -C ~/.claude/skills/project-maker pull`.

Since v3.4 the repo carries a plugin manifest (`.claude-plugin/plugin.json`), so the same folder loads as the plugin `project-maker@skills-dir` (check with `claude plugin list`). That registers the agents in every project as `project-maker:validator`, `project-maker:component-writer`, … and turns on the autopilot guard hook, with no copy step and no per-project install. The skill name stays `/project-maker`. Install it one way only: either this clone or a marketplace install, not both.

`scripts/install.sh` (stage agents in `~/.claude/agents/`) is only needed on Claude Code versions that don't load a skills-dir plugin. `scripts/pm.py` needs `python3`; the guard needs `jq`.

### Usage

```
/project-maker                                              # detects the stage and explains the next step
/project-maker spec new                                     # or jump straight to a mode
/project-maker execute docs/sprints/SPRINT-001-auth.md
/project-maker autopilot --until sprint --profile balanced  # hands-off, stops only for decisions
```

Ask "which model should I run?" at any time and it answers from the measured table, including the effort.

### Repository layout

```
SKILL.md                    router: scale matrix + Harness Rules + Model Advisor
references/modes/           one playbook per mode (loaded on demand)
references/autopilot/       stage contract, ledger template, hooks (guard + usage brake)
references/agents/          writers, validator, stage agents (Claude Code frontmatter)
references/*-template.md    artifact templates
references/model-advisor.md benchmark numbers, cost per stage, limits of what was measured
references/harness-notes.md harness probes per Claude Code version, lessons from real runs
scripts/pm.py               deterministic sensors: next · status · coverage · waves · paths
scripts/                    pm-guard.sh + pm-pre-push.sh (two-layer guard) · lint-skill.sh · test suites
.claude-plugin/ · hooks/    plugin manifest, marketplace entry, guard hook registration
evals/scenarios.md          skill self-test scenarios
evals/model-bench/          model benchmark harness (with a no-skill baseline), hidden tests, results
```

### What's new

- **v3.5.1** — `pm.py` fixes found by running the modes end to end on toy projects in both layouts: `coverage` no longer reports another spec's requirements as unknown when two specs share `docs/issues/` (it follows each issue's `Spec relacionada`); `waves` and `status` read issues only from the sprint's `## Issues` section, so a `.md` cited in the notes is not an issue; `status` reads the SECURITY state from the file body. 40 test cases.
- **v3.5**
  - **One folder per feature.** `/spec feature` now creates `docs/specs/FEAT-NNN-slug/` with `spec.md`, `context.md`, `sprints/` and `issues/` inside, so a feature's artifacts stop mixing with the others. The project spec (`Spec.md`) keeps `docs/sprints/` and `docs/issues/`.
  - **No migration.** Both layouts are read in the same project. Existing sprints, issues and single-file feature specs stay where they are, and a run in progress resumes untouched.
  - **`pm.py paths [spec]`** returns where that spec's sprints and issues go and the next SPRINT and FEAT numbers, so the model stops computing them.
  - **`pm.py` ignores nested repos.** A clone or worktree inside the project (a `staging/` mirror, for example) no longer adds its sprints and issues to `status`, `next` and `coverage`. `coverage` on a feature folder counts only that folder's issues.
- **v3.4** (checked on Claude Code 2.1.322)
  - **The validator stops trusting the implementer.** It runs the gate itself and checks `git status` against the declared files. The 0–100 score is gone: pass needs every criterion met. New `inconclusive` verdict when a sibling issue's half-written file breaks the gate.
  - **Red proof.** A test created in an issue must be seen failing before the implementation.
  - **`scripts/pm.py`**, deterministic sensors instead of prose rules: `next` validates the handoff command, `coverage` finds requirements with no issue, `waves` finds same-wave file collisions, `status` reads the project state from disk.
  - **Two-layer guard.** A git `pre-push` hook catches pushes from any path (scripts, `python -c`, absolute binary); the `PreToolUse` guard now also catches `env`/`VAR=`/`then`/`xargs`/absolute-path forms, tree-wide `checkout`/`restore`, and common deploy CLIs. 77 test cases.
  - **Zombie agents.** A `failed` notification no longer triggers an immediate redispatch: the conductor reads the disk first, has a wait ceiling, and stops abandoned children.
  - **Plugin manifest.** Agents and the guard hook register themselves; `/init` no longer has to copy agents.
  - **Not web-only anymore.** Prototype issues only when the spec has a UI; a generic implementer for CLI/library/pipeline work; "Superfícies" in the spec template; vertical slice first.
  - **One file per feature spec** (`docs/specs/FEAT-NNN-slug.md`), explicit spec approval before `/break`, EARS with the unwanted-behaviour pattern, a `Requisitos` section the template was missing.
  - **`SKILL.md` under 500 lines.** Benchmark narrative and harness history moved to `references/`. Benchmark limits stated up front, and a no-skill `baseline` command added (not yet run).
  - **CI** runs the sensor, guard and lint suites.

- **v3.3** (checked on Claude Code 2.1.322)
  - **Dispatch and wait** replaces foreground dispatch: `run_in_background` is not in every Agent schema anymore.
  - **Explicit dispatch:** `model` and `effort` on every Agent call. The effort gate is gone and `install.sh` is optional.
  - **Escalation on failure:** attempt 3 of an issue runs one tier up.
  - **Waves without a barrier:** each issue's validator starts when its implementer returns. The orchestrator commits, one issue at a time.
  - **Worktree isolation** for implementers, opt-in in manual mode.
  - **Parallel `/plan`** for a sprint: one sub-agent per issue.
- **v3.2.1**
  - **Effort gate:** the autopilot never runs a stage at an unmeasured effort without asking.
  - **`scripts/install.sh`** installs the stage agents at user level.
  - **Effective effort** logged per stage.
  - **Foreground dispatch** enforced in the call template.
- **v3.2**
  - **Autopilot mode.** Opt-in; manual mode is unchanged.
  - **Measured model routing** with the `econ | balanced | max` profiles.
  - **Stage agents** with `model` and `effort` in their frontmatter.
  - **Foreground dispatch fix.**
  - **Idempotent `/execute`.**
  - **Push/PR guard hook.**
  - **Usage-window brake.**
  - **`evals/model-bench/`.**
- **v3.1**
  - **Progressive disclosure:** `SKILL.md` became a router, and the mode playbooks moved to `references/modes/`, cutting context per invocation by ~60%.
  - **Canonical artifact locations under `docs/`.**
  - **Scoped triggers.**
- **v3**
  - **Closing loop** with `/verify`, `/secure` and `/ship`.
  - **Package Legitimacy Gate.**
  - **Resumable UAT** with a cold-start smoke test.
  - **Wave engine** with parallel-write safety and the Nyquist sensor rule.

Full details for every mode are in the [wiki](https://github.com/renatodpaula/project-maker/wiki).

---

## Português

### O que é

Project Maker é uma skill do Claude Code que transforma uma ideia em código entregue por meio de **artefatos progressivos**, e não de uma única conversa longa que vai derivando. A IA é parceira em cada etapa (pesquisando, planejando, implementando, validando), não uma executora cega.

É construída sobre **Harness Engineering**. O modelo é só a LLM; o harness é tudo em volta: estado em disco, sensores de verificação, regras de delegação e gates que tornam a saída do modelo confiável.

### O fluxo

```
/discover      → brief.md                                   brainstorming guiado           (Complex)
/init          → steering/ + Constitution.md                 memory bank do projeto         (Medium+)
                 + STATE.md + DECISIONS.md + KNOWLEDGE.md
                 + bloco de ponteiro no CLAUDE.md
/spec          → Spec.md, ou docs/specs/FEAT-NNN-slug.md    requisitos estruturados (EARS),  (Medium+)
                 para uma feature (+ context)                 aprovados por você antes do /break
/break         → docs/research.md + docs/data-model.md      quebra em trabalho             (Large+)
                 + docs/contracts/ + docs/sprints/ (waves)
                 + docs/issues/ (Model hint) + PRD.md
/plan          → issue enriquecida (ou o sprint inteiro)     pesquisa + planejamento        (todos)
/execute       → waves → implementer → validator            orquestração, idempotente      (todos)
                 → reassess → milestone gate
/verify        → docs/sprints/SPRINT-NNN-uat.md             UAT resumível + cold start     (user-facing)
/secure        → docs/sprints/SPRINT-NNN-SECURITY.md        gate de segurança no diff      (auth/dados/input)
/ship          → pull request                               push + PR rico automático      (quando há remote)
/build         → atalho: plan + execute                     issues pequenas isoladas       (Small/Medium)
/pause /resume → snapshot em STATE.md                       continuidade entre sessões     (qualquer hora)
/autopilot     → .pm-autopilot/ledger.md                    roda as etapas por você        (opt-in, Large+)
```

**Dois jeitos de rodar o mesmo fluxo:**
- **Manual (padrão).** Cada modo termina com um **Bloco de Handoff**: o comando exato do próximo passo, com o path real e o modelo recomendado. Você dá `/clear` e cola. Você revisa entre as etapas e controla o ritmo de consumo.
- **Autopilot (opt-in).** `/project-maker autopilot` transforma sua sessão num condutor. Ele roda cada etapa num sub-agente com contexto limpo, no modelo medido para aquela etapa, então não há `/clear` manual. Só para quando precisa de uma decisão sua.

**Loop de fechamento.** Depois que um sprint passa no milestone gate, ele segue `/verify` (se user-facing) → `/secure` (se toca auth, dados ou input) → `/ship`. O `/ship` só abre o PR quando não há gaps de UAT nem ameaças abertas.

**Hierarquia:** `Projeto → Sprint → Issue`. Uma issue tem que caber em uma janela de contexto. Se não cabe, são duas.

### Escala adaptativa

A complexidade decide a profundidade, não o contrário. A skill se dimensiona sozinha:

| Escopo | O que é | Etapas |
|---|---|---|
| `--quick` | ≤3 arquivos, uma frase | plan inline → execute de uma issue |
| `--feature` | feature clara, 1 sprint | spec → plan → execute → verify/secure/ship |
| `--feature-large` | multi-componente, 2–5 sprints | init → spec → break → plan → execute → loop de fechamento |
| `--epic` | ambiguidade, domínio novo | discover → … → ship, com fase Discuss e UAT |

### Autopilot

```
/project-maker autopilot [alvo] [--until spec|break|sprint|all] [--profile econ|balanced|max]
/project-maker autopilot status | stop | resume
```

- **Condutor + agentes de etapa.** Sua sessão despacha um sub-agente por etapa e passa `model` e `effort` em toda chamada (Sonnet · high por padrão; Fable · high no `/break` do `max`). Os agentes `pm-stage-*` são opcionais. O sub-agente roda o modo com `--autopilot` e devolve um bloco curto de status (`PM_STAGE_RESULT`). Em vez de confiar nesse bloco, o condutor confere com sensores: `scripts/pm.py next` (o comando do handoff bate com o `STATE.md`, não tem placeholder e todo path existe), `pm.py coverage` e `pm.py waves` depois do `/break`, árvore limpa, e o comando de teste do projeto rodado duas vezes depois de cada `/execute`.
- **Só para por você, em duas telas.**
  - **T0, no início:** até onde ir, política de push/PR, política de UAT e perfil de custo.
  - **G1, depois do `/break`:** pacotes suspeitos, segredos exigidos e suposições de alto risco.
  - **Outras paradas:** perguntas do spec, issue travada, testes de UAT que precisam de olho humano, push/PR e escopo novo.
  - **Merge nunca é automático.**
- **Retomável.** O estado vive em `.pm-autopilot/ledger.md` (fora do git), então `/clear`, compactação ou um corte por limite de uso não perdem nada. Depois, rode `autopilot resume`. Numa sessão nova, ele reconfirma sua política de push.
- **Seguro, em duas camadas.** Só o condutor dá push ou abre PR, e ele mesmo monta esses comandos. Um hook git `pre-push` recusa qualquer push sem o token do run do condutor, venha de onde vier. Um guard `PreToolUse` impede que sub-agentes deem push, abram PR, rodem git destrutivo ou os CLIs de deploy mais comuns. Nenhum dos dois é sandbox: eles param acidente, e deploy disparado por script do projeto (`make deploy`) não está coberto.
- **Não redespacha às cegas.** Uma etapa notificada como `failed` pode continuar viva. O condutor lê `git log`/`git status` duas vezes antes de redespachar, tem teto de espera por etapa e para os filhos abandonados.
- **Consome a janela de uso mais rápido.** As etapas rodam uma atrás da outra, sem tempo ocioso. Um projeto de 3 sprints leva mais ou menos uma janela de 5h inteira.

**Setup (opcional, uma vez)** — detalhes em `references/autopilot/hooks.md`:
1. **Freio da janela de uso.** Acrescente ao script da sua statusline o bloco de *§ Medidor da janela de uso*. Ele grava `~/.claude/pm-usage.json` (`used_percentage` e `resets_at` de `five_hour`/`seven_day`). Assim o condutor pausa antes de uma etapa quando você passa do limiar do perfil (econ 60% · balanced 80% · max 90%), em vez de a etapa morrer no meio ao bater o limite.
2. **Guard de push/PR.** Instale o hook `pre-push` por projeto (`cp scripts/pm-pre-push.sh "$(git rev-parse --git-path hooks)/pre-push"`, se não houver um). O guard `PreToolUse` já vem registrado quando o skill carrega como plugin (precisa de `jq`); senão, copie `scripts/pm-guard.sh` para `.claude/hooks/` e registre em `.claude/settings.local.json`. Teste os dois com `bash scripts/test-pm-guard.sh` (77 casos).
3. **Permissões.** Use auto mode, ou `acceptEdits` com allowlist, para um prompt de permissão não travar um run longo.

### Qual modelo em cada etapa (medido)

> **Leia antes.** Os números abaixo comparam modelos *dentro* do skill, num único fixture pequeno e greenfield, quase sempre com uma run por célula. Nenhuma rodada mediu ainda o mesmo insumo *sem* o skill; o comando `baseline` de `evals/model-bench/` existe para isso e não foi rodado. Veja "Lacunas do método" em `evals/model-bench/README.md`.

Cada modo foi rodado de verdade, sobre um insumo congelado, com Fable 5.1, Opus 5.5 (xhigh e medium), Sonnet 5 e Haiku 4.5. A qualidade foi medida com juízes cegos, testes de aceitação ocultos, 5 vulnerabilidades plantadas e 2 bugs plantados. Método e harness em `evals/model-bench/`; relatório completo na [wiki](https://github.com/renatodpaula/project-maker/wiki/Benchmark-Report-2026-09).

- **Sonnet 5 · high ficou em 1º ou 2º em todas as etapas**, pelo menor custo entre os modelos que acertaram. É o padrão em tudo.
- **Sonnet 5.5 · high vs medium** (remedido em 2026-10 em discover/init/spec/plan, 1 run por célula, 3 juízes cegos): o high fez 92,4 de média contra 88,1 do medium e 84,1 do Sonnet 5 · high re-rodado no mesmo insumo. O medium custou 30% menos e levou ~60% do tempo, mas pontuou menos no init (82 vs 89) e no spec (84,7 vs 93,0). A diferença média (4,3) está dentro do ruído de uma run, então o high segue como padrão e nenhum perfil de velocidade foi criado. `/break`, `/execute`, `/secure` e `/verify` não foram remedidos.
- **O effort pesou mais que o modelo.** Em xhigh, o Opus 5.5 custou 2–3× e demorou 3–5× mais do que em medium, sem ganho consistente.
- **Opus 5.5 · medium foi o mais rápido**, mas perdeu fidelidade no spec: contrariou uma resposta do dono.
- **Fable 5.1 só venceu no `/break`**: +3 pontos a 2,7× o custo.
- **O Haiku fabricou marcações de "feito".**

**Perfis de custo** (`--profile`; não é o mesmo que o effort do Claude Code):

| | econ | balanced (padrão) | max |
|---|---|---|---|
| Modelo por etapa | Sonnet 5 · high em tudo | Sonnet 5 · high em tudo | Fable 5.1 no break, Opus 5.5 xhigh no init, Sonnet no resto |
| Issue com `Model hint: Opus/Fable` | não escala | Opus 5.5 · high | Fable 5.1 · high |
| Autopilot pausa com a janela de 5h em | 60% | 80% | 90% |
| Autopilot: máx. de etapas por run | 12 | 30 | 60 |
| Projeto de 3 sprints, ponta a ponta | ~$33, em 2 blocos | ~$33–36, ~1 janela | ~$40–43, ~1,2 janela |

- O **econ** economiza por não escalar e por parar mais cedo, o que deixa folga para seus outros trabalhos. Ele não usa modelo mais fraco: o benchmark não achou nenhum que valesse.
- O **max** compra um ganho pequeno e medido.
- No dia a dia, use **balanced**.

Custo aproximado por etapa (balanced, preço de API): break ~$3; execute de um sprint de 10 issues ~$6,5 (≈20% de uma janela de 5h); verify, secure e ship ~$0,3–0,5 cada.

### Recursos de Harness Engineering

- **Sub-agentes de contexto limpo.** O orquestrador fica enxuto. O trabalho pesado roda em agentes isolados que começam do zero, o que derrota o context rot.
- **Despacho e espera.** O paralelismo vem de várias chamadas Agent numa mesma mensagem. Os sub-agentes rodam em background e respondem por notificação, então nenhum modo fecha com filho pendente. Toda chamada leva `model` e `effort` explícitos, e nada herda o modelo da sessão.
- **Escalada por falha.** A terceira tentativa de uma issue roda um tier de modelo acima (`sonnet` → `opus` → `fable`) antes de chamar o humano.
- **Loop de validação.**
  - Toda issue é checada por um validator independente que **roda o Gate ele mesmo** e compara o `git status` com os arquivos que o implementer declarou. Pass exige todos os critérios (não há nota para compensar): Gate com exit 0, nenhum arquivo não declarado, todo `Done when` com evidência, testes que provam algo (red proof), sem stub.
  - Máximo de 3 tentativas; depois ele para. Nunca fabrica um "pass".
- **Paralelismo por waves.**
  - Issues independentes são agrupadas em waves de dependência e rodam em paralelo.
  - Segurança de escrita: só o orquestrador escreve os living docs, e issues da mesma wave nunca tocam os mesmos arquivos.
- **`/execute` idempotente.**
  - Reusa o branch do sprint e pula as issues já entregues.
  - Commita primeiro o planning e por último o fechamento, então a árvore termina limpa.
  - Pode ser rodado de novo depois de qualquer interrupção.
- **Package Legitimacy Gate.**
  - Todo pacote sugerido é marcado `[OK] / [SUS] / [ASSUMED] / [SLOP]`.
  - Pacote alucinado ou suspeito dispara checkpoint humano ou é bloqueado.
  - É uma defesa contra *slopsquatting*.
- **UAT resumível.**
  - Teste do usuário um passo por vez, que sobrevive a `/clear`.
  - Injeta automaticamente um **cold-start smoke test**.
  - Roda um loop diagnose → fix → re-verify quando acha problema.
- **Gate de segurança.** O `/secure` revisa o diff do sprint, delegando à skill `security-review` quando ela está disponível, e bloqueia o `/ship` enquanto houver ameaça aberta.
- **Regra Nyquist e red proof.** Todo critério de aceitação precisa de um sensor automático. Se o teste não existe, criá-lo é a primeira sub-task, e teste novo tem que ser visto falhando antes da implementação.
- **Sensores determinísticos (`scripts/pm.py`).** `next` valida o comando do handoff, `coverage` acha requisito sem issue, `waves` acha colisão de arquivo na mesma wave, `status` lê o estado do projeto do disco. Código de saída, não regra em prosa.
- **Funciona sem interface.** Issue de prototype só existe quando a spec tem telas; CLI, biblioteca e pipeline vão para um implementer genérico. O primeiro sprint é uma fatia fina de ponta a ponta.
- **Model Advisor medido.**
  - O modelo e o effort de cada etapa vêm do benchmark acima.
  - O `/break` marca cada issue com um `Model hint`.
  - Dentro do `/execute`, as issues marcadas vão para um modelo mais forte via override por agente. Sem trocar de sessão.
- **Bloco de Handoff.**
  - Todo modo termina com o **comando completo do próximo passo**, com o path real resolvido do disco (nunca um `[placeholder]`) e a recomendação de modelo na mesma caixa.
  - O comando também vai para `STATE.md → Next command`, então sobrevive ao `/clear`, e o `pm.py next` confere antes de ele aparecer.
- **Agentes nativos registrados.**
  - Carregado como plugin, os writers, o validator e os agentes de etapa ficam registrados em todo projeto como `project-maker:<nome>`. Sem o plugin, o `/init` copia para `.claude/agents/` do projeto.
  - A restrição de ferramentas é garantida pelo harness (o validator não tem Write/Edit; mantém o Bash para rodar o Gate), e `model` e `effort` vão em toda chamada.
- **Living docs.** `STATE.md` (volátil), `DECISIONS.md` (append-only), `KNOWLEDGE.md` (lições cross-sprint), `PRD.md` (documento vivo do produto).

### Artefatos que produz

| Onde | Arquivos |
|---|---|
| Raiz do projeto | `brief.md` · `Constitution.md` · `Spec.md` · `context.md` · `PRD.md` · `STATE.md` · `DECISIONS.md` · `KNOWLEDGE.md` · `steering/` · um bloco de ponteiro no `CLAUDE.md` |
| `docs/` | `research.md` (com Package Legitimacy Audit) · `data-model.md` · `contracts/` · `sprints/` (com waves) e `issues/` da spec do projeto |
| `docs/specs/FEAT-NNN-slug/` | uma pasta por feature: `spec.md` · `context.md` · `sprints/` · `issues/` |
| Por sprint | `SPRINT-NNN-uat.md` · `SPRINT-NNN-SECURITY.md`, ao lado do arquivo do sprint |
| `.claude/agents/` | writers, validator, `pm-stage-workhorse`, `pm-stage-reasoning` (só sem o plugin) |
| Só no autopilot | `.pm-autopilot/ledger.md` e `guard.log` (fora do git) · rascunhos do corpo e do título do PR · `.git/hooks/pre-push` |

Os dois layouts convivem: projeto criado antes da v3.5 continua com `docs/sprints/` e `docs/issues/` (e com spec de feature em arquivo solto, `docs/specs/FEAT-NNN-slug.md`), e nada que já foi gravado muda de lugar. O número do sprint é único no projeto inteiro. Se o projeto já tem uma convenção para a localização dos artefatos, ela vence e fica registrada em `steering/structure.md`.

### Instalação

Clone direto na pasta de skills do Claude Code:

```bash
git clone https://github.com/renatodpaula/project-maker ~/.claude/skills/project-maker
```

Reinicie o Claude Code e use `/project-maker` em qualquer projeto. Para atualizar depois, rode `git -C ~/.claude/skills/project-maker pull`.

Desde a v3.4 o repositório traz um manifesto de plugin (`.claude-plugin/plugin.json`), então a mesma pasta carrega como o plugin `project-maker@skills-dir` (confira com `claude plugin list`). Isso registra os agentes em todo projeto como `project-maker:validator`, `project-maker:component-writer`, … e liga o hook do guard do autopilot, sem cópia e sem instalação por projeto. O nome do skill continua `/project-maker`. Instale de um jeito só: este clone ou pelo marketplace, não os dois.

O `scripts/install.sh` (agentes de etapa em `~/.claude/agents/`) só é necessário em versões do Claude Code que não carregam plugin da pasta de skills. O `scripts/pm.py` precisa de `python3`; o guard precisa de `jq`.

### Uso

```
/project-maker                                              # detecta a etapa e explica o próximo passo
/project-maker spec new                                     # ou vá direto a um modo
/project-maker execute docs/sprints/SPRINT-001-auth.md
/project-maker autopilot --until sprint --profile balanced  # automático, só para em decisões
```

Pergunte "qual modelo rodar?" a qualquer momento e a skill responde pela tabela medida, já com o effort.

### Estrutura do repositório

```
SKILL.md                    roteador: matriz de escala + Harness Rules + Model Advisor
references/modes/           um playbook por modo (carregado sob demanda)
references/autopilot/       contrato de etapa, template do ledger, hooks (guard + freio de uso)
references/agents/          writers, validator, agentes de etapa (frontmatter Claude Code)
references/*-template.md    templates dos artefatos
references/model-advisor.md números do benchmark, custo por etapa, limites do que foi medido
references/harness-notes.md sondas do harness por versão do Claude Code, lições de runs reais
scripts/pm.py               sensores determinísticos: next · status · coverage · waves · paths
scripts/                    pm-guard.sh + pm-pre-push.sh (guard em duas camadas) · lint-skill.sh · suítes
.claude-plugin/ · hooks/    manifesto de plugin, entrada de marketplace, registro do hook do guard
evals/scenarios.md          cenários de auto-teste do skill
evals/model-bench/          harness do benchmark (com controle sem skill), testes ocultos, resultados
```

### Novidades

- **v3.5.1** — correções no `pm.py` achadas rodando os modos de ponta a ponta em projetos-brinquedo nos dois layouts: o `coverage` deixa de acusar como inexistente o requisito de outra spec quando duas specs dividem `docs/issues/` (segue a `Spec relacionada` de cada issue); `waves` e `status` leem as issues só da seção `## Issues` do sprint, e um `.md` citado nas notas não vira issue; o `status` lê o estado do SECURITY no corpo do arquivo. 40 casos de teste.
- **v3.5**
  - **Uma pasta por feature.** O `/spec feature` passa a criar `docs/specs/FEAT-NNN-slug/` com `spec.md`, `context.md`, `sprints/` e `issues/` dentro, e os artefatos de uma feature deixam de se misturar com os das outras. A spec do projeto (`Spec.md`) continua com `docs/sprints/` e `docs/issues/`.
  - **Sem migração.** Os dois layouts são lidos no mesmo projeto. Sprints, issues e specs de feature em arquivo solto ficam onde estão, e um run em andamento retoma sem mudança.
  - **`pm.py paths [spec]`** devolve onde gravar os sprints e as issues daquela spec e os próximos números de SPRINT e FEAT, e o modelo para de calcular isso.
  - **O `pm.py` ignora repositório aninhado.** Um clone ou worktree dentro do projeto (um espelho em `staging/`, por exemplo) deixa de somar sprints e issues no `status`, no `next` e no `coverage`. O `coverage` de uma pasta de feature conta só as issues dela.
- **v3.4** (conferido no Claude Code 2.1.322)
  - **O validator deixa de confiar no implementer.** Roda o Gate ele mesmo e confere o `git status` contra os arquivos declarados. A nota 0–100 saiu: pass exige todos os critérios. Veredito novo `inconclusive` quando o arquivo pela metade de uma issue irmã quebra o Gate.
  - **Red proof.** Teste criado numa issue tem que ser visto falhando antes da implementação.
  - **`scripts/pm.py`**, sensores determinísticos no lugar de regra em prosa: `next` valida o comando do handoff, `coverage` acha requisito sem issue, `waves` acha colisão de arquivo na mesma wave, `status` lê o estado do projeto do disco.
  - **Guard em duas camadas.** Um hook git `pre-push` pega o push vindo de qualquer caminho (script, `python -c`, binário absoluto); o guard `PreToolUse` passa a pegar as formas com `env`/`VAR=`/`then`/`xargs`/caminho absoluto, `checkout`/`restore` da árvore inteira e os CLIs de deploy comuns. 77 casos de teste.
  - **Agentes zumbis.** Notificação `failed` não dispara mais redespacho imediato: o condutor lê o disco antes, tem teto de espera e para os filhos abandonados.
  - **Manifesto de plugin.** Agentes e hook do guard se registram sozinhos; o `/init` não precisa mais copiar agentes.
  - **Não é mais só web.** Issue de prototype só quando a spec tem interface; implementer genérico para CLI, biblioteca e pipeline; "Superfícies" no template da spec; fatia vertical primeiro.
  - **Um arquivo por spec de feature** (`docs/specs/FEAT-NNN-slug.md`), aprovação explícita da spec antes do `/break`, EARS com o padrão de comportamento indesejado, e a seção `Requisitos` que faltava no template.
  - **`SKILL.md` abaixo de 500 linhas.** Narrativa do benchmark e histórico do harness foram para `references/`. Limites do benchmark ditos de saída, e um comando `baseline` sem skill (ainda não rodado).
  - **CI** roda as suítes dos sensores, do guard e do lint.

- **v3.3** (conferido no Claude Code 2.1.322)
  - **Despacho e espera** substitui o despacho em foreground: `run_in_background` não está mais em todo schema da Agent.
  - **Despacho explícito:** `model` e `effort` em toda chamada Agent. O portão de effort saiu e o `install.sh` virou opcional.
  - **Escalada por falha:** a tentativa 3 de uma issue roda um tier acima.
  - **Waves sem barreira:** o validator de cada issue sai quando o implementer dela volta. O orquestrador commita, uma issue por vez.
  - **Worktree isolada** para implementers, opt-in no modo manual.
  - **`/plan` de sprint em paralelo:** um sub-agent por issue.
- **v3.2.1**
  - **Portão de effort:** o autopilot nunca roda uma etapa num effort não medido sem perguntar.
  - **`scripts/install.sh`** instala os agentes de etapa no nível do usuário.
  - **Effort efetivo** registrado por etapa.
  - **Despacho em foreground** forçado no template da chamada.
- **v3.2**
  - **Modo autopilot.** Opt-in; o modo manual não muda.
  - **Roteamento de modelo medido,** com os perfis `econ | balanced | max`.
  - **Agentes de etapa** com `model` e `effort` no frontmatter.
  - **Correção do despacho em foreground.**
  - **`/execute` idempotente.**
  - **Hook guard de push/PR.**
  - **Freio da janela de uso.**
  - **`evals/model-bench/`.**
- **v3.1**
  - **Progressive disclosure:** o `SKILL.md` virou roteador e os playbooks dos modos foram para `references/modes/`, cortando ~60% do contexto por invocação.
  - **Localização canônica dos artefatos em `docs/`.**
  - **Triggers escopados.**
- **v3**
  - **Loop de fechamento** com `/verify`, `/secure` e `/ship`.
  - **Package Legitimacy Gate.**
  - **UAT resumível** com cold-start smoke test.
  - **Wave engine** com segurança de escrita paralela e a regra de sensor Nyquist.

Detalhes completos de cada modo estão na [wiki](https://github.com/renatodpaula/project-maker/wiki).

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
