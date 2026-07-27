# Modo: /ship

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.

**Argumento:** caminho de um sprint (ou `milestone vX.Y` ao fechar milestone).

Ponte entre "trabalho completo localmente" e "PR aberto". Push da branch + PR com body rico montado dos artefatos. **Fecha o loop** spec → execute → verify → secure → ship. Ver `references/pr-body-template.md`.

### Passo 1 — Preflight gate (bloqueia se qualquer item falhar)
1. **Milestone Gate passou?** Sprint está `✅ done` no PRD.md? Senão → pare, rode `/execute` até fechar.
2. **Verify sem gaps?** Se há UAT para o sprint (`docs/sprints/SPRINT-NNN-uat.md`), `status: complete` e `## Gaps` vazio? Senão → rode `/verify`.
3. **Secure limpo?** Se há SECURITY para o sprint (`docs/sprints/SPRINT-NNN-SECURITY.md`), `threats_open: 0`? Senão → rode `/secure` e resolva.
4. **Working tree limpo?** `git status --short` vazio? Senão → peça commit ou stash.
5. **Branch correta?** Está em `sprint/[slug]`, não em `main`? Senão → avise.
6. **Remote + gh?** `git remote -v` tem origin E `gh auth status` ok? Se **não há remote** → caia no fallback de merge local (Passo 5b). Se há remote mas `gh` não autenticado → instrua `gh auth login` (sugira `! gh auth login`) e pare.

### Passo 2 — Push
```bash
git push -u origin sprint/[slug]
```

### Passo 3 — Montar PR body
Monte o corpo a partir dos artefatos seguindo `references/pr-body-template.md`: **Summary** (Goal do sprint + síntese dos Summary), **Changes** (por issue), **Requirements Addressed** (REQ-N → Spec.md), **Verification** (Milestone Gate + UAT), **Security** (se o SECURITY do sprint existe), **Key Decisions** (DECISIONS.md do sprint). Nunca fabrique REQ/decisão — sintetize do disco; marque `[artefato ausente]` se faltar.

### Passo 4 — Criar PR
```bash
# corpo num temp file evita limite de arg do shell
gh pr create --title "Sprint NNN: [slug]" --body-file "$PR_BODY_FILE" --base main
```
Adicione `--draft` se o usuário pediu.

### Passo 5 — Review opcional + tracking
- Pergunte (AskUserQuestion): pular review / self-review (mostre `url/files`) / pedir review de alguém (`gh pr edit N --add-reviewer`). Se a skill `code-review` está disponível, ofereça rodá-la no diff.
- Atualize STATE.md: `Status → Sprint NNN shipped — PR #N`.
- Reporte número e URL do PR + próximos passos (revisar, mergear quando CI passar).
- **Bloco de Handoff (obrigatório — regra Next Command):** o comando primário é o próximo sprint com **path real** — `/project-maker execute docs/sprints/SPRINT-032-[slug real].md`. Se não há próximo sprint, o comando é `/project-maker break` (novo ciclo) ou `/project-maker pause`. Inclua, como alternativa rotulada, o comando de merge do PR (`gh pr merge N --squash`) quando a CI já estiver verde.

### Passo 5b — Fallback sem remote
Sem origin: mostre `git diff main` consolidado, proponha `git checkout main && git merge sprint/[slug]`, aguarde confirmação. Registre no STATE.md.

**Confirmação:** push e abertura de PR são ações outward-facing — confirme com o usuário antes de criar o PR, a menos que ele já tenha autorizado explicitamente nesta sessão.
