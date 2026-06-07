# UAT — [Issue ou Sprint]

> Script de User Acceptance Testing para features user-facing. Gerado/atualizado pelo `/verify` (ou pelo Passo 4.5 do `/execute`) quando a feature envolve interação visual/complexa que o validator automático não cobre 100%.
> Executado **pelo usuário**, registrado **pelo agente**. **Um teste por vez.** Filosofia: *"mostre o esperado, pergunte se a realidade bate"* — nunca pergunte severidade, infira da linguagem.

```yaml
---
status: testing | partial | complete
scope: [path do sprint ou issue]
implements: [REQ-X, REQ-Y]
started: YYYY-MM-DD HH:MM
updated: YYYY-MM-DD HH:MM
---
```

> **Resumível:** o `status` no frontmatter sobrevive a `/clear`. Ao retomar, vá ao primeiro teste com `result: pending`. Escreva no arquivo quando: (1) achar um issue, (2) a cada 5 passes, (3) ao completar.

---

## Current Test

> Sobrescrito a cada teste — mostra onde estamos. Em context reset, é daqui que o `/verify` retoma.

```
number: 1
name: [nome do teste atual]
expected: [o que o usuário deve observar]
awaiting: user response
```

---

## Setup

1. Branch `sprint/[slug]` rodando localmente (`npm run dev` ou equivalente)
2. Abrir [URL]
3. [Seed de dados, login, etc.]

---

## Tests

> Cada teste = uma ação do usuário + resultado observável esperado. `result`: pending | pass | issue | skipped | blocked.

### 0. Cold Start Smoke Test
> **Injetado automaticamente** quando o sprint tocou `server.*`, `app.*`, `index.*`, `main.*`, `migrations/*`, `seed*`, `db/*`, `docker-compose*`, `Dockerfile*`. Pega bugs que só aparecem em boot frio (race de startup, seed silencioso falhando, env faltando).

expected: Mate o servidor/serviço. Limpe estado efêmero (DBs temp, caches, lockfiles). Suba a aplicação do zero. Boot sem erro, seed/migration completa, e uma query primária (health check, home, ou API básica) retorna dado vivo.
result: pending

### 1. [Nome do teste]
expected: [comportamento observável]
result: pending

### 2. [Nome do teste]
expected: [comportamento observável]
result: pending

---

## Summary

```
total: N
passed: 0
issues: 0
skipped: 0
blocked: 0
pending: N
```

---

## Gaps

> APPEND quando um teste resulta em `issue`. YAML estruturado — vira input do loop de fechamento de gap (`/verify` → issue de fix → `/execute` → re-verify). `severity` é **inferida**, nunca perguntada.

```yaml
- truth: "[comportamento esperado do teste]"
  status: failed
  reason: "Usuário reportou: [resposta verbatim]"
  severity: blocker | major | minor | cosmetic
  test: N
  root_cause: ""   # preenchido na diagnose
  fix_issue: ""    # preenchido quando a issue de fix é criada
```

[nenhum ainda]

---

## Inferência de severidade

| Usuário diz | Infere |
|---|---|
| "crash", "erro", "exception", "falha total", "quebrou" | blocker |
| "não funciona", "nada acontece", "errado", "faltando" | major |
| "funciona mas...", "lento", "estranho", "pequeno" | minor |
| "cor", "espaçamento", "alinhamento", "está torto" | cosmetic |

Default = **major** se ambíguo. Pass = resposta vazia / "ok" / "sim" / "next". Blocked (servidor/device/build) **não** vira gap — é pré-requisito.
