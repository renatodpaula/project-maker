# Stage Contract — modo `--autopilot`

> Parte do skill **project-maker**. Vale para **agentes de etapa**: sub-agentes que o condutor do `/project-maker autopilot` dispara para rodar um modo (`spec`, `break`, `plan`, `execute`, `verify`, `secure`, `ship`) com a flag `--autopilot`. Quem roda o modo manual ignora este arquivo.

Um agente de etapa **não fala com o humano**: ele não tem AskUserQuestion, e o condutor é o único que conversa. Por isso o modo roda inteiro, persiste tudo em disco e devolve **um bloco de status** que o condutor consegue ler sem abrir artefato nenhum.

---

## 1. Regras gerais (todo modo com `--autopilot`)

1. **Rode o modo normalmente.** Session Loading, Harness Rules, gates, sensores e Spec Deviations valem como no manual. O autopilot muda **só** quem responde as perguntas.
2. **Pergunta vira decisão.** Toda instrução do modo do tipo "pergunte ao usuário" / "aguarde confirmação" / "checkpoint humano" vira um item em `decisions` do bloco (§3). **Antes** de devolver, persista o estado parcial no disco (context.md, STATE.md, uat.md…) — o condutor pode continuar você por mensagem ou disparar um agente novo que retoma do disco.
3. **Baixo risco: assuma e marque.** Ambiguidade que não muda data-model, contracts, Constitution, autorização/segurança nem custo externo → escolha a opção mais conservadora, marque `[AUTOPILOT-ASSUMED: …]` no artefato e siga. **Alto risco: nunca assuma** — vira decisão com `blocking: stage`.
4. **Drene antes de parar.** Se uma decisão bloqueia só parte do trabalho (uma issue, um pacote), termine todo o resto que não depende dela e devolva `partial` com a decisão pendente.
5. **Proibido para agente de etapa** (lista canônica — o `scripts/pm-guard.sh` bloqueia a parte de git/gh no harness): `git push`, `gh pr create|merge|ready|edit`, `gh api` que cria/mergeia PR, qualquer `git merge`, `git branch -D`, `--force`, `git reset --hard`, `git clean -f`, `git stash` (push/pop/drop/apply), `git checkout -- .`, deploy, migration em banco remoto, pedir ou ler valor de segredo. Push/PR são do **condutor** (sessão principal), com a política que o usuário já deu.
6. **Não escreva em `.pm-autopilot/`.** Esse diretório é do condutor.
7. **Handoff vai para o disco, não para a tela.** Grave `Next command` / `Next model` no STATE.md como sempre (regra Next Command), e `Run mode: autopilot` em `Current Session`. A resposta final é **só** o bloco `PM_STAGE_RESULT` — sem Bloco de Handoff em prosa, sem relatório.
8. **Falha de ambiente não conta tentativa.** Serviço fora, porta ocupada, credencial ausente → decisão `kind: env`, sem consumir as 3 tentativas do Stuck Detection.
9. **Parada segura.** Se existir `.pm-autopilot/STOP`, termine a unidade atual (issue/wave), persista e devolva `partial`.
10. **Sub-agents sempre em foreground.** `run_in_background: false` em toda chamada Agent; paralelismo = várias chamadas na mesma mensagem. Você é um sub-agente: se encerrar o turno com filhos em background, eles morrem e o trabalho some.
11. **Árvore limpa ao sair.** Etapas pós-branch (`execute`, `verify`, `secure`) commitam seus artefatos e living docs no branch do sprint. Etapas de planejamento (`spec`, `break`, `plan`) podem deixar mudanças só em paths de planejamento (raiz + `docs/`) — o `/execute` faz o commit `docs(SPRINT-NNN): planning` como primeiro commit do branch.

---

## 2. O que muda por modo

| Modo | Com `--autopilot` |
|---|---|
| `spec` | Passos 1–2.5: explore e **junte** todas as perguntas complementares + gray areas críticas (máx. 8). Grave `context.md` com cada uma como `pending` e devolva `needs_user`. Na continuação (respostas chegam por mensagem ou em "Decisões já respondidas"), aplique, gere a Spec e devolva `done`. Marcador `[NEEDS CLARIFICATION]` que sobrar: crítico → decisão; não crítico → vira `Assumptions não-confirmadas` + `[AUTOPILOT-ASSUMED]`. |
| `break` | Passo 0 com alvo ambíguo → decisão. Ao final, devolva como decisões (`blocking: sprint`) **todos** os itens que precisariam de humano durante o execute: pacotes `[SUS]`/`[ASSUMED]` (uma decisão `multi: true` com todos), `[SLOP]`, variáveis de ambiente/segredos exigidos (kind `secret` — o usuário preenche `.env.local` fora do chat), assumptions de alto risco. Preencha `extra.sprints`. |
| `plan` | Aceita sprint como alvo: enriquece as issues pendentes do sprint, pula as já enriquecidas. Se o contexto apertar, devolva `partial` com as issues que faltam — o condutor redespacha. |
| `execute` | **Idempotente:** se `sprint/[slug]` já existe, `git checkout` nele (sem `-b`); senão crie a partir de `base=` do prompt. Logo após o checkout, se houver mudanças de planejamento não commitadas (raiz + `docs/`), commit `docs(SPRINT-NNN): planning`. Pule issues já entregues (`✅` no PRD/sprint **ou** commit `feat(SPRINT-NNN/<slug>)` no `git log`); diff sujo de issue interrompida conta como tentativa 1. Issue `⏸` cuja decisão veio em "Decisões já respondidas" volta para a fila com tentativas zeradas ("Retentar c/ Opus" → `model: opus`). Pacote sem aprovação no audit → issue vira `⏸ awaiting-human`, decisão `package`, e o resto do DAG segue. Stuck (3 falhas) → decisão `stuck` com as opções, e o resto drena. Milestone gate reprovado só por bookkeeping (PRD/STATE desatualizado) → corrija uma vez; reprovação substantiva → decisão `milestone`. **Pule o Passo 4.5** (não dispare o `/verify` daqui) e siga para o **Passo 5**: feche o sprint como `✅ done` se o gate passou e grave `Next command` = verify (se user-facing), secure ou ship conforme a tabela do Passo 5. Se o verify depois achar gaps, é ele que volta o sprint para `⏸ pending-review`. Commit final `chore(SPRINT-NNN): close` com os living docs (árvore limpa). Checar STOP entre waves. |
| `verify` | O prompt traz `phase=prep` ou `phase=apply` e `uat=<política>`. **prep:** gere o `uat.md`, rode tudo o que é automatizável (cold-start smoke, checks por CLI/HTTP) e marque `auto-pass`. Com `uat=auto-only`, marque os testes de percepção como `skipped` e feche o UAT. Com `uat=per-sprint`, devolva **uma decisão `kind: uat` por teste de percepção** (`header: "Teste N"`, opções Passou / Falhou / Pular, `blocking: sprint`, máx. 8 por bloco — o resto em rodadas seguintes) + `extra.run_cmd`/`extra.url`. Commit `docs(SPRINT-NNN): verify` com o `uat.md` antes de devolver (prep e apply). **apply:** receba as respostas (a descrição literal do usuário em cada "Falhou"), rode diagnose → issue de fix → `/execute` das fixes (1 rodada) → re-verify só dos que falharam. Com gaps abertos ao fim, sprint volta para `⏸ pending-review`. |
| `secure` | O diff é `git diff <base>...sprint/[slug]` com o `base=` do prompt (padrão `main`). Commit `docs(SPRINT-NNN): security` com o SECURITY antes de devolver. `threats_open > 0` → crie as issues de fix, `next` = execute delas (o condutor conta 1 rodada de auto-recuperação). `needs_human` → decisão `security` que bloqueia só o ship daquele sprint. |
| `ship` | **Só preparação.** Preflight completo, corpo do PR em `.pm-autopilot/pr-body-SPRINT-NNN.md` (única exceção à regra 6 — o condutor lê de lá), `gh pr list --head` para não duplicar. Grave também o título em `.pm-autopilot/pr-title-SPRINT-NNN.txt` (1 linha). Devolva **dados**, não comandos: `extra.branch`, `extra.base`, `extra.pr_body` (path) — o condutor monta e roda push/PR ele mesmo. Nunca execute push/PR. |
| `discover`, `init` | `discover` com `--answers <arquivo>`: gere o brief a partir das respostas já coletadas pelo condutor. `init`: rode normal; não sobrescreva agentes existentes. |

---

## 3. O bloco de retorno — `PM_STAGE_RESULT v1`

A **última mensagem** do agente de etapa é só este bloco (≤ ~1,5k tokens). Detalhe longo fica no disco; o bloco aponta o path.

```yaml
PM_STAGE_RESULT: v1
stage: execute          # discover|init|spec|break|plan|execute|verify-prep|verify-apply|secure|ship-prep
target: docs/sprints/SPRINT-002-agenda.md
status: partial         # done | partial | needs_user | blocked | failed
summary: "6/7 entregues; issue 11 stuck; gate pendente só por ela"   # ≤ 200 chars
next: "/project-maker verify docs/sprints/SPRINT-002-agenda.md"       # idêntico ao Next command gravado no STATE.md
next_model: sonnet      # opus | sonnet | fable (tier para o próximo agente de etapa)
tree: clean             # clean | planning-only | dirty
decisions:              # 0-8 itens; cada um JÁ persistido em context_path
  - id: D-007
    kind: stuck         # gray_area|clarification|package|slop|secret|env|stuck|milestone|uat|security|target
    blocking: sprint    # stage (nada segue sem isso) | sprint (bloqueia o sprint) | none (informativo); G1 do break e uat do verify o condutor pergunta na hora
    header: "Issue 11"  # ≤ 12 chars — vira o chip do AskUserQuestion
    question: "Issue 11 falhou 3x (fuso/DST no expiresAt). Como seguir?"   # ≤ 200 chars
    multi: false        # true = multiSelect (ex.: aprovar vários pacotes)
    options:            # 2-4, recomendada primeiro, com "(Recomendado)" no label
      - {label: "Retentar c/ Opus (Recomendado)", detail: "1 tentativa extra com tier de raciocínio"}
      - {label: "Mandar p/ backlog", detail: "sprint fecha sem ela"}
      - {label: "Pausar p/ eu corrigir", detail: "autopilot para na fronteira"}
    context_path: "STATE.md#blockers"
metrics: {issues_done: 6, issues_blocked: 1, retries: 4, subagents: 19}
extra: {}               # break: {sprints: [{path, depends_on, user_facing, security}]}
                        # verify (prep): {run_cmd, url, auto_passed}
                        # ship-prep: {branch, base, pr_body (path)}
```

**Regras do bloco:**
- `status: done` com decisão `blocking ≠ none` é inválido — use `needs_user` ou `partial`.
- `next` tem que existir no disco (regra Next Command 9/10) e bater com o `Next command` do STATE.md.
- Decisão sem opção fechada razoável (ex.: "qual o nome do produto?") → 2 opções-exemplo + o usuário usa "Other".
- Se não houver nada a perguntar, `decisions: []`.

---

## 4. Critério crítico × não crítico (para a regra 3)

**Crítico (vira decisão, nunca assume):** muda `data-model`, `contracts/` ou `Constitution.md`; envolve autenticação, autorização, dados pessoais ou pagamento; instala pacote não `[OK]`; custo externo (API paga, infra); ação irreversível; escopo novo que o usuário não pediu.

**Não crítico (assume + `[AUTOPILOT-ASSUMED]`):** naming, copy de UI, limites numéricos com default de mercado, ordem de itens, formato de data exibida, detalhes de layout sem impacto em fluxo.
