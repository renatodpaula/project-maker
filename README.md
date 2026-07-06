<div align="center">

# Project Maker

**A [Claude Code](https://claude.ai/code) skill for building software with AI through structured Spec-Driven Development — no vibe coding.**

`discover → init → spec → break → plan → execute → verify → secure → ship`

MIT License · v3.0 · by [@renatodpaula.ai](https://instagram.com/renatodpaula.ai)

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
- **Model Advisor + Routing** — at each mode handoff (before `/clear`), the skill recommends which model to open the next session in: reasoning tier (Opus/Fable) for `/spec` and `/break`, workhorse (Sonnet) for `/execute`. `/break` tags each issue with a `Model hint`; inside `/execute`, prompt-engineering-heavy issues are auto-dispatched to the reasoning tier via per-agent model override — no session switching needed.
- **Native registered agents** — `/init` installs the skill's specialized agents (writers + validator) into the project's `.claude/agents/`, making them real Claude Code subagents: tool restrictions enforced by the harness (the validator physically cannot edit code) and per-agent default models.
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

The skill detects which stage you're in and explains the next step. Or jump straight to a mode: `/project-maker spec`, `/project-maker execute sprints/SPRINT-001-auth.md`, etc.

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
- **Model Advisor + Routing** — em cada handoff de modo (antes do `/clear`), o skill recomenda em qual modelo abrir a próxima sessão: tier de raciocínio (Opus/Fable) para `/spec` e `/break`, workhorse (Sonnet) para `/execute`. O `/break` marca cada issue com um `Model hint`; dentro do `/execute`, issues prompt-engineering-heavy são despachadas automaticamente no tier de raciocínio via override de modelo por agente — sem trocar de sessão.
- **Agentes nativos registrados** — o `/init` instala os agentes especializados do skill (writers + validator) em `.claude/agents/` do projeto, tornando-os subagentes reais do Claude Code: restrição de ferramentas garantida pelo harness (o validator fisicamente não consegue editar código) e modelo default por agente.
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

A skill detecta em qual etapa você está e explica o próximo passo. Ou vá direto a um modo: `/project-maker spec`, `/project-maker execute sprints/SPRINT-001-auth.md`, etc.

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
