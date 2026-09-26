<div align="center">

# Project Maker

**A [Claude Code](https://claude.ai/code) skill for building software with AI through structured Spec-Driven Development — no vibe coding.**

`discover → init → spec → break → plan → execute → verify → secure → ship`

MIT License · v3.2 · by [@renatodpaula.ai](https://instagram.com/renatodpaula.ai) · [Wiki](https://github.com/renatodpaula/project-maker/wiki)

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
                 + registered agents in .claude/agents/
/spec          → Spec.md (EARS) + context.md                structured requirements        (Medium+)
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

- **Conductor + stage agents.** Your session dispatches one sub-agent per stage (`pm-stage-workhorse` = Sonnet 5 · high; `pm-stage-reasoning` = Fable 5.1 · high in `max`). Each has `model` and `effort` in its frontmatter. The sub-agent runs the mode with `--autopilot` and returns a short status block (`PM_STAGE_RESULT`). The conductor checks that block with one-line sensors (the path exists, the tree is clean, `next` matches `STATE.md`) instead of trusting it.
- **It only stops for you, in two batched screens.**
  - **T0, at the start:** how far to go, push/PR policy, UAT policy, and cost profile.
  - **G1, after `/break`:** suspicious packages, required secrets, and high-risk assumptions.
  - **Other stops:** spec questions, stuck issues, UAT tests that need human eyes, push/PR, and new scope.
  - **Merge is never automatic.**
- **Resumable.** State lives in `.pm-autopilot/ledger.md` (git-excluded), so `/clear`, compaction or a usage-limit cut lose nothing. Run `autopilot resume` afterwards. It re-confirms your push policy in a new session.
- **Safe.** Only the conductor pushes or opens PRs, and it builds those commands itself. The optional guard hook blocks sub-agents from pushing, opening PRs or running destructive git.
- **It uses your usage window faster.** Stages run back to back with no idle time between them. A 3-sprint project takes about one full 5-hour window.

**Setup (optional, once)** — details in `references/autopilot/hooks.md`:
1. **Usage-window brake.** Add the block from *§ Medidor da janela de uso* to your statusline script. It writes `~/.claude/pm-usage.json` (`five_hour`/`seven_day` `used_percentage` + `resets_at`). The conductor then pauses before a stage once you pass the profile threshold (econ 60% · balanced 80% · max 90%), instead of dying mid-stage at the limit.
2. **Push/PR guard.** Copy `scripts/pm-guard.sh` to `.claude/hooks/` and register it as a `PreToolUse` Bash hook in `.claude/settings.local.json` (needs `jq`). Test it with `bash scripts/test-pm-guard.sh` (41 cases).
3. **Permissions.** Use auto mode, or `acceptEdits` plus an allowlist, so a permission prompt doesn't stall a long run.

### Which model per stage (measured)

Every mode was run for real on a frozen fixture across Fable 5.1, Opus 5.5 (xhigh and medium), Sonnet 5 and Haiku 4.5. Quality was scored with blind judges, hidden acceptance tests, 5 planted vulnerabilities and 2 planted bugs. The method and harness are in `evals/model-bench/`; the full report is on the [wiki](https://github.com/renatodpaula/project-maker/wiki/Benchmark-Report-2026-09).

- **Sonnet 5 · high was 1st or 2nd on every stage**, at the lowest cost among the models that got it right. It is the default everywhere.
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

- **Fresh-context sub-agents.** The orchestrator stays lean (under 40k tokens). Heavy work runs in isolated agents that start clean, which defeats context rot.
- **Foreground dispatch.** Sub-agents are always dispatched with `run_in_background: false`, and parallelism comes from several calls in one message. The benchmark caught a headless `/execute` losing 5 background sub-agents when the orchestrator ended its turn.
- **Validator loop.**
  - Every issue is checked by an independent validator: threshold 80, 0/1 gate check, stub and fabrication detection.
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
- **Nyquist rule.** Every acceptance criterion needs an automated sensor. If the test doesn't exist, creating it is the first sub-task.
- **Measured Model Advisor.**
  - The model and effort for each stage come from the benchmark above.
  - `/break` tags each issue with a `Model hint`.
  - Inside `/execute`, flagged issues are auto-dispatched to a stronger model through a per-agent override. No session switching.
- **Handoff Block.**
  - Every mode ends with the **complete next command**, with the real path resolved from disk (never a `[placeholder]`) and the model recommendation in the same box.
  - It is also written to `STATE.md → Next command`, so it survives `/clear`.
- **Native registered agents.**
  - `/init` installs the writers, the validator and the autopilot stage agents into the project's `.claude/agents/`.
  - Tool restrictions are enforced by the harness (the validator has no Write/Edit), and each agent carries its own model and effort.
- **Living docs.** `STATE.md` (volatile), `DECISIONS.md` (append-only), `KNOWLEDGE.md` (cross-sprint lessons), `PRD.md` (living product doc).

### Artifacts it produces

| Where | Files |
|---|---|
| Project root | `brief.md` · `Constitution.md` · `Spec.md` · `context.md` · `PRD.md` · `STATE.md` · `DECISIONS.md` · `KNOWLEDGE.md` · `steering/` |
| `docs/` | `research.md` (with Package Legitimacy Audit) · `data-model.md` · `contracts/` · `sprints/` (with waves) · `issues/` |
| Per sprint | `docs/sprints/SPRINT-NNN-uat.md` · `docs/sprints/SPRINT-NNN-SECURITY.md` |
| `.claude/agents/` | writers, validator, `pm-stage-workhorse`, `pm-stage-reasoning` |
| Autopilot only | `.pm-autopilot/ledger.md` (git-excluded) · PR body/title drafts |

An existing project convention for artifact locations wins, and it's recorded in `steering/structure.md`.

### Installation

Clone straight into your Claude Code skills directory:

```bash
git clone https://github.com/renatodpaula/project-maker ~/.claude/skills/project-maker
```

Restart Claude Code, then use `/project-maker` in any project. To update later, run `git -C ~/.claude/skills/project-maker pull`.

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
scripts/                    pm-guard.sh + its test suite
evals/scenarios.md          skill self-test scenarios
evals/model-bench/          model benchmark harness, hidden tests, results
```

### What's new

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
                 + agentes registrados em .claude/agents/
/spec          → Spec.md (EARS) + context.md                requisitos estruturados        (Medium+)
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

- **Condutor + agentes de etapa.** Sua sessão despacha um sub-agente por etapa (`pm-stage-workhorse` = Sonnet 5 · high; `pm-stage-reasoning` = Fable 5.1 · high no `max`). Cada um tem `model` e `effort` no frontmatter. O sub-agente roda o modo com `--autopilot` e devolve um bloco curto de status (`PM_STAGE_RESULT`). Em vez de confiar nesse bloco, o condutor confere com sensores de 1 linha (o path existe, a árvore está limpa, o `next` bate com o `STATE.md`).
- **Só para por você, em duas telas.**
  - **T0, no início:** até onde ir, política de push/PR, política de UAT e perfil de custo.
  - **G1, depois do `/break`:** pacotes suspeitos, segredos exigidos e suposições de alto risco.
  - **Outras paradas:** perguntas do spec, issue travada, testes de UAT que precisam de olho humano, push/PR e escopo novo.
  - **Merge nunca é automático.**
- **Retomável.** O estado vive em `.pm-autopilot/ledger.md` (fora do git), então `/clear`, compactação ou um corte por limite de uso não perdem nada. Depois, rode `autopilot resume`. Numa sessão nova, ele reconfirma sua política de push.
- **Seguro.** Só o condutor dá push ou abre PR, e ele mesmo monta esses comandos. O guard opcional impede que sub-agentes deem push, abram PR ou rodem git destrutivo.
- **Consome a janela de uso mais rápido.** As etapas rodam uma atrás da outra, sem tempo ocioso. Um projeto de 3 sprints leva mais ou menos uma janela de 5h inteira.

**Setup (opcional, uma vez)** — detalhes em `references/autopilot/hooks.md`:
1. **Freio da janela de uso.** Acrescente ao script da sua statusline o bloco de *§ Medidor da janela de uso*. Ele grava `~/.claude/pm-usage.json` (`used_percentage` e `resets_at` de `five_hour`/`seven_day`). Assim o condutor pausa antes de uma etapa quando você passa do limiar do perfil (econ 60% · balanced 80% · max 90%), em vez de a etapa morrer no meio ao bater o limite.
2. **Guard de push/PR.** Copie `scripts/pm-guard.sh` para `.claude/hooks/` e registre como hook `PreToolUse` de Bash em `.claude/settings.local.json` (precisa de `jq`). Teste com `bash scripts/test-pm-guard.sh` (41 casos).
3. **Permissões.** Use auto mode, ou `acceptEdits` com allowlist, para um prompt de permissão não travar um run longo.

### Qual modelo em cada etapa (medido)

Cada modo foi rodado de verdade, sobre um insumo congelado, com Fable 5.1, Opus 5.5 (xhigh e medium), Sonnet 5 e Haiku 4.5. A qualidade foi medida com juízes cegos, testes de aceitação ocultos, 5 vulnerabilidades plantadas e 2 bugs plantados. Método e harness em `evals/model-bench/`; relatório completo na [wiki](https://github.com/renatodpaula/project-maker/wiki/Benchmark-Report-2026-09).

- **Sonnet 5 · high ficou em 1º ou 2º em todas as etapas**, pelo menor custo entre os modelos que acertaram. É o padrão em tudo.
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

- **Sub-agentes de contexto limpo.** O orquestrador fica enxuto (menos de 40k tokens). O trabalho pesado roda em agentes isolados que começam do zero, o que derrota o context rot.
- **Despacho em foreground.** Sub-agentes sempre saem com `run_in_background: false`, e o paralelismo vem de várias chamadas numa mesma mensagem. O benchmark pegou um `/execute` headless perdendo 5 sub-agentes em background quando o orquestrador encerrou o turno.
- **Loop de validação.**
  - Toda issue é checada por um validator independente: threshold 80, gate check 0/1, detecção de stub e fabricação.
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
- **Regra Nyquist.** Todo critério de aceitação precisa de um sensor automático. Se o teste não existe, criá-lo é a primeira sub-task.
- **Model Advisor medido.**
  - O modelo e o effort de cada etapa vêm do benchmark acima.
  - O `/break` marca cada issue com um `Model hint`.
  - Dentro do `/execute`, as issues marcadas vão para um modelo mais forte via override por agente. Sem trocar de sessão.
- **Bloco de Handoff.**
  - Todo modo termina com o **comando completo do próximo passo**, com o path real resolvido do disco (nunca um `[placeholder]`) e a recomendação de modelo na mesma caixa.
  - O comando também vai para `STATE.md → Next command`, então sobrevive ao `/clear`.
- **Agentes nativos registrados.**
  - O `/init` instala os writers, o validator e os agentes de etapa do autopilot em `.claude/agents/` do projeto.
  - A restrição de ferramentas é garantida pelo harness (o validator não tem Write/Edit), e cada agente carrega seu próprio modelo e effort.
- **Living docs.** `STATE.md` (volátil), `DECISIONS.md` (append-only), `KNOWLEDGE.md` (lições cross-sprint), `PRD.md` (documento vivo do produto).

### Artefatos que produz

| Onde | Arquivos |
|---|---|
| Raiz do projeto | `brief.md` · `Constitution.md` · `Spec.md` · `context.md` · `PRD.md` · `STATE.md` · `DECISIONS.md` · `KNOWLEDGE.md` · `steering/` |
| `docs/` | `research.md` (com Package Legitimacy Audit) · `data-model.md` · `contracts/` · `sprints/` (com waves) · `issues/` |
| Por sprint | `docs/sprints/SPRINT-NNN-uat.md` · `docs/sprints/SPRINT-NNN-SECURITY.md` |
| `.claude/agents/` | writers, validator, `pm-stage-workhorse`, `pm-stage-reasoning` |
| Só no autopilot | `.pm-autopilot/ledger.md` (fora do git) · rascunhos do corpo e do título do PR |

Se o projeto já tem uma convenção para a localização dos artefatos, ela vence e fica registrada em `steering/structure.md`.

### Instalação

Clone direto na pasta de skills do Claude Code:

```bash
git clone https://github.com/renatodpaula/project-maker ~/.claude/skills/project-maker
```

Reinicie o Claude Code e use `/project-maker` em qualquer projeto. Para atualizar depois, rode `git -C ~/.claude/skills/project-maker pull`.

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
scripts/                    pm-guard.sh + suíte de testes
evals/scenarios.md          cenários de auto-teste do skill
evals/model-bench/          harness do benchmark de modelos, testes ocultos, resultados
```

### Novidades

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
