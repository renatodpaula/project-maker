# PR Body Template

> Formato do corpo do Pull Request gerado pelo `/ship`. O corpo é montado **a partir dos artefatos** já existentes no projeto — não invente conteúdo, sintetize do que está em disco.
> Fontes: `docs/sprints/SPRINT-NNN.md` (Goal, Success Criteria), `Spec.md` (REQ-N), `PRD.md` (rastreabilidade), `DECISIONS.md` (decisões do sprint), `Summary` de cada issue, `docs/sprints/SPRINT-NNN-uat.md`/Milestone Gate (verificação), `docs/sprints/SPRINT-NNN-SECURITY.md` (gate de segurança).

Escreva o corpo num arquivo temporário e crie o PR com `gh pr create --body-file` (evita o limite de argumento do shell).

---

```markdown
## Summary

**Sprint NNN: [slug]**
**Goal:** [Goal do sprint, extraído de docs/sprints/SPRINT-NNN.md]
**Status:** Verified ✓

[Um parágrafo sintetizado dos Summary das issues — o que foi construído, em linguagem de produto, não de implementação.]

## Changes

### [issue-id]: [título da issue]
[one-liner do Summary da issue]

**Arquivos-chave:** [Files changed do Summary — só os relevantes]

### [próxima issue]: ...

## Requirements Addressed

> Rastreabilidade REQ-N → Spec.md. Cada REQ que este sprint fecha.

- **REQ-1** — [descrição curta da Spec]
- **REQ-2** — [descrição curta da Spec]

## Verification

- [x] Milestone Validation Gate: pass
- [x] Gate check (lint/test/typecheck) de todas as issues: pass
- [Itens de UAT, se houve uat.md — pass/fail por step relevante]

## Security

> Só aparece se `/secure` rodou. Estado do SECURITY.md.

- [x] Security gate: 0 ameaças abertas (ou: skill `security-review` aprovou)

## Key Decisions

> Decisões arquiteturais deste sprint, extraídas de DECISIONS.md.

- **[decisão]** — [razão em 1 linha]
```

---

## Regras de montagem

- As seções **Summary, Changes, Requirements Addressed, Verification** são obrigatórias (core, ordem fixa).
- **Security** e **Key Decisions** só aparecem se houver conteúdo (SECURITY.md existe / DECISIONS.md tem entradas do sprint). Omita seção vazia.
- Nunca fabrique um REQ ou uma decisão que não esteja nos artefatos. Se um artefato está faltando, registre `[artefato X ausente]` em vez de inventar.
- Título do PR: `Sprint NNN: [slug]` (ou `Milestone vX.Y: [nome]` ao fechar milestone).
