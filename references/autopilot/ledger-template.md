---
run_id: AP-YYYYMMDD-HHMM
status: running            # running | waiting_user | paused | done | failed
conductor_sid: ""          # $CLAUDE_CODE_SESSION_ID da sessão que conduz
scope_root: Spec.md        # o que este run está autorizado a construir (spec ou brief.md)
profile: balanced          # econ | balanced | max
until: sprint              # spec | break | sprint | all
guard: off                 # on | off — pm-guard.sh instalado?
stage_agents: registered   # registered | fallback — agentes de etapa carregados nesta sessão?
session_effort: high       # $CLAUDE_EFFORT no preflight (relido antes de cada despacho em fallback)
policies:
  ship: ask                # draft-auto | ask | local
  uat: per-sprint          # per-sprint | auto-only
cursor: "/project-maker break Spec.md"      # próximo comando (espelha STATE.md → Next command)
in_flight: null            # {stage, target, ts} gravado ANTES de despachar
planned: []                # sprints já passados pelo plan neste run
sprints: []                # {path, depends_on, user_facing, security, base, branch, pr} — vem do extra.sprints do break
counters: {stages: 0, agents: 0, subagent_tokens: 0, recoveries: {}}
started: YYYY-MM-DD HH:MM
heartbeat: YYYY-MM-DD HH:MM
---

# Autopilot ledger

> Arquivo do **condutor** (`/project-maker autopilot`). Fica em `.pm-autopilot/ledger.md`, fora do git (`.git/info/exclude`). Agentes de etapa nunca escrevem aqui. É a fonte da verdade do run: o condutor relê o frontmatter a cada iteração, então compactação ou `/clear` da sessão não perdem nada — `/project-maker autopilot resume` continua do `cursor`.

## Decision inbox

| id | kind | blocking | pergunta | resposta | aplicada | agent_id | perguntado em |
|----|------|----------|----------|----------|----------|----------|---------------|

## Log

| # | hora | etapa | alvo | agente | modelo · effort efetivo | status | resumo | tokens |
|---|------|-------|------|--------|-------------------------|--------|--------|--------|
