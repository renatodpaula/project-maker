# Sprint [NNN] — [Título]

**Status**: planned | in-progress | pending-review | done
**Depends on**: [Sprint(s) anteriores, ou `none`]
**Blocks**: [Sprint(s) seguintes, ou `none`]
**Criado em**: YYYY-MM-DD
**Fechado em**: YYYY-MM-DD (preencher no fechamento)

---

## Goal

[1 parágrafo do que este sprint entrega. Uma frase do tipo "Ao fim deste sprint, o usuário consegue X".]

---

## Success Criteria

> Critérios mecanicamente verificáveis que definem "sprint completo". Input obrigatório do Milestone Validation Gate.

- [ ] [critério 1 — ex: "todas as issues deste sprint passam no gate check"]
- [ ] [critério 2 — ex: "usuário consegue fazer login e ver dashboard"]
- [ ] [critério 3 — ex: "REQ-1, REQ-2, REQ-3 da Spec.md atendidos com evidência"]

---

## Issues

> Regra de ferro: **uma issue tem que caber em uma janela de contexto. Se não cabe, são duas.**
> Marque paralelismo com `[P]` — issues sem dependências entre si podem rodar em paralelo.

- [ ] `issues/prototype/01-pagina-login.md`
- [ ] `issues/prototype/02-pagina-dashboard.md` [P]
- [ ] `issues/functional/05-submit-login.md`
- [ ] `issues/functional/06-session-check.md` [P]

---

## Implements

> Quais requisitos da Spec.md este sprint entrega. Rastreabilidade obrigatória.

- REQ-1, REQ-2, REQ-3

---

## Reassess Notes

> Preenchido ao final do sprint, durante a fase de reassess. Documenta o que foi aprendido e como isso afeta os próximos sprints.

### O que aprendemos?
- ...

### Alguma issue dos próximos sprints ficou desnecessária?
- ...

### Alguma issue nova precisa existir?
- ...

### Alguma decisão arquitetural mudou?
- ...

---

## Milestone Validation Gate

> Checklist obrigatório antes de marcar o sprint como `done`. Preenchido no fechamento.

- [ ] Todos os Success Criteria acima têm evidência observável
- [ ] Todas as issues do sprint têm Gate check `pass`
- [ ] Todos os Spec Deviations foram revistos e aceitos (ou corrigidos)
- [ ] PRD.md atualizado com o status real das issues
- [ ] DECISIONS.md atualizado com decisões novas relevantes
- [ ] STATE.md limpo de blockers que pertenciam a este sprint

Se qualquer item falhar, sprint fica `pending-review`, **não** `done`.
