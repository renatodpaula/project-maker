# Modo: /autopilot

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados. Carregue também `references/autopilot/stage-contract.md`. **Não** carregue os arquivos dos outros modos — eles rodam dentro dos agentes de etapa, não aqui.

**Sintaxe:**

```
/project-maker autopilot [alvo] [--until spec|break|sprint|all] [--profile econ|balanced|max]
/project-maker autopilot resume | status | stop
```

**O que é:** a sessão atual vira um **condutor**. Em vez de você dar `/clear` e colar o próximo comando a cada etapa, o condutor dispara **um sub-agente novo por etapa** (contexto limpo, modelo e effort da etapa), lê o bloco de status que ele devolve e segue sozinho. Ele **só para** quando precisa de você: perguntas de spec, pacote suspeito, stuck, UAT, push/PR, escopo novo, ou fim do que você autorizou.

**Quando usar:** escopo Large/Complex (vários sprints) e plano de uso folgado. O autopilot não economiza tokens por etapa — ele elimina o tempo ocioso entre etapas, então **consome a janela de uso mais rápido**. Em `--quick`/Medium, use o fluxo manual ou `/build`. O modo manual continua sendo o padrão; o autopilot só roda quando chamado explicitamente pelo nome.

```
L0 CONDUTOR  = esta sessão. Única que fala com você (AskUserQuestion, PushNotification).
   Escreve só em .pm-autopilot/. Roda push/PR quando autorizado.
 └─ L1 AGENTE DE ETAPA (Agent em foreground, contexto novo, modelo/effort roteados)
      roda "/project-maker <modo> <alvo> --autopilot" e devolve PM_STAGE_RESULT
      └─ L2 implementer / validator / Explore / diagnose (os de hoje)
```

---

## Passo 0 — Preflight

1. **Ferramentas:** carregue `PushNotification` se estiver deferred (`ToolSearch select:PushNotification`).
2. **Git:** repositório com ≥1 commit (se não, ofereça `git init` + commit inicial e pare até confirmar). Crie `.pm-autopilot/` e garanta em `.git/info/exclude` as linhas `.pm-autopilot/`, `.claude/agents/pm-stage-*.md` e `.claude/hooks/pm-guard.sh` — arquivos do condutor não sujam a árvore nem quebram o sensor de árvore limpa.
3. **Agentes de etapa + portão de effort (antes do primeiro despacho):**
   - O Claude Code só carrega agentes **quando a sessão começa** (verificado no 2.1.282: agente copiado no meio da sessão dá `Agent type '…' not found`). Procure `pm-stage-workhorse.md`/`pm-stage-reasoning.md` em `~/.claude/agents/` (instalados por `scripts/install.sh`) ou em `.claude/agents/` do projeto (instalados pelo `/init`). **Registrados** = o arquivo existia antes desta sessão (mtime anterior ao início do run); na dúvida, teste com um despacho mínimo.
   - Leia o effort da sessão: `echo $CLAUDE_EFFORT`.
   - **Registrados** → siga; o effort vem do frontmatter do agente.
   - **Não registrados** (ausentes, ou copiados agora — copie para `.claude/agents/` sem sobrescrever, para a próxima sessão) → o fallback `subagent_type: general-purpose` + `model` herda o effort da sessão. Se `$CLAUDE_EFFORT` = effort da tabela para a etapa (`high` no balanced), siga com o fallback. Se for diferente, **não despache**: pergunte com `AskUserQuestion` — "Rode `/effort high` e diga continuar (Recomendado)" · "Reinicie o Claude Code e rode `/project-maker autopilot resume` (agentes passam a valer)" · "Seguir assim (effort <atual>, não medido)". Nunca rode etapa num effort diferente do da tabela sem o usuário escolher isso.
   - Antes de **cada** despacho em fallback, releia `$CLAUDE_EFFORT` (o usuário pode ter mudado com `/effort`).
4. **Freio de janela (opt-in):** se `~/.claude/pm-usage.json` não existe, ofereça uma vez o bloco da statusline de `references/autopilot/hooks.md` (§ Medidor da janela de uso). Sem ele o run não tem como pausar antes de estourar a janela de 5h — diga isso em uma linha.
5. **Guard (opt-in):** se `.claude/hooks/pm-guard.sh` não está registrado, ofereça a instalação de `references/autopilot/hooks.md` (precisa de `jq`: `command -v jq`). Grave `guard: on|off` no ledger. Sem guard, as proibições do Stage Contract valem só por instrução — diga isso em uma linha.
6. **Run existente:** se `.pm-autopilot/ledger.md` existe com `status` ≠ `done`, isto é uma **retomada**: execute o subcomando `resume` (abaixo) antes de qualquer despacho — nunca herde silenciosamente a política de push/PR de outra sessão.
7. **Cursor inicial** (nesta ordem):
   - argumento `alvo` recebido → o modo que consome esse alvo;
   - `STATE.md → Next command`, se existir e o path existir no disco;
   - `Spec.md`/spec sem sprint → `break`; `steering/` sem spec → `spec new` (ou `spec feature`); `brief.md` sem steering → `init`; nada → **discover inline** (Passo 1b).
8. **Escopo do run (`scope_root`):** grave no ledger o que este run está autorizado a construir — o path da spec, ou `brief.md` se começa antes da spec. Tudo que deriva dele (discover → init → spec → break → sprints dessa spec) é o mesmo escopo.
9. **Aviso de modelo do condutor (1x):** o condutor não precisa de raciocínio pesado. Se a sessão está em Opus/Fable com effort alto, diga em uma linha: "o condutor roda bem em Sonnet (`/model sonnet`); as etapas usam o modelo delas de qualquer jeito".

## Passo 1 — Tela T0 (uma vez, antes de qualquer etapa)

Um único `AskUserQuestion` com as perguntas cujas respostas não vieram por flag (máx. 4):

| header | pergunta | opções (recomendada primeiro) |
|---|---|---|
| `Até onde` | Até onde o autopilot vai sem você? | Até fechar 1 sprint · Até o fim do break (só planejamento) · Todos os sprints desta spec |
| `Push/PR` | O que fazer quando um sprint fecha limpo? | Perguntar a cada sprint · Push + PR draft automático · Só local (sem push) |
| `UAT` | Testes de experiência (UAT) dos sprints com interface? | Por sprint (paro pra você testar) · Só automático (sem UAT humano) |
| `Perfil` | Perfil de custo? | Balanced · Econ · Max |

Grave em `.pm-autopilot/ledger.md` (de `references/autopilot/ledger-template.md`): `run_id`, `conductor_sid` (`echo $CLAUDE_CODE_SESSION_ID`), `scope_root`, `profile`, `until`, `policies`, `cursor`, `guard`.

### Passo 1b — Discover inline (só se o cursor é discover)

O condutor faz as 5 perguntas do `references/modes/discover.md` **ele mesmo**, uma por vez, em texto livre, e grava as respostas em `.pm-autopilot/discover-answers.md`. Depois despacha `discover --autopilot --answers .pm-autopilot/discover-answers.md` para gerar o brief.

## Passo 2 — Loop do condutor

Repita até uma condição de parada (Passo 3):

1. **Releia o frontmatter do ledger** (fonte da verdade — sobrevive a compactação) e atualize `heartbeat`. Se existe `.pm-autopilot/STOP` → parada segura. Se `counters.stages` ≥ `max_stages` do perfil (tabela **Roteamento por etapa** do Model Advisor) → parada segura.
2. **Resolva a etapa** a partir do `cursor` (`/project-maker <modo> <alvo>`).
   - Se o cursor é `execute <sprint>` e o sprint **não** está em `planned` no ledger: esta iteração despacha `plan <sprint>`. Ao validar o `done`, acrescente o sprint a `planned` e **mantenha** `cursor = execute <sprint>` (ignore o `next` do plan). Na iteração seguinte sai o execute. Sem isso o loop roda plan para sempre.
   - Base do branch: o sprint parte de `main`, a menos que dependa (`depends_on` em `sprints` do ledger) de um sprint cujo PR ainda não foi mergeado — aí parte do branch desse sprint (PRs empilhados). Passe `base=<branch>` no prompt de **todas** as etapas do sprint (execute, secure, ship). Se o sprint depende de um sprint **bloqueado**, pule para o próximo sprint independente da lista; sem nenhum, pare.
3. **Freio de janela:** se existir `~/.claude/pm-usage.json` (opt-in, `references/autopilot/hooks.md`) com `updated_at` de menos de 15 min, leia `five_hour.used_percentage` (`jq -r '.five_hour.used_percentage' ~/.claude/pm-usage.json`). Passou do limiar do perfil → **não despache**: `status: paused` e diga o horário do reset (`date -r $(jq -r '.five_hour.resets_at' ~/.claude/pm-usage.json) +%H:%M`). Arquivo mais velho que 15 min = leitura desconhecida; siga sem o freio e avise uma vez. Antes de um `execute`, exija também folga para ele (tabela **Consumo medido** do Model Advisor).
4. **Roteie** pela tabela **Roteamento por etapa** do Model Advisor (SKILL.md), coluna do `profile`: `subagent_type` do agente de etapa e, quando a célula pede, `model` por chamada. O `next_model` do bloco anterior é só informativo — a tabela vence.
5. **Grave `in_flight`** `{stage, target, ts}` no ledger **antes** de despachar.
6. **Despache** o agente de etapa em **foreground** — a chamada tem sempre este formato, sem exceção:
   ```
   Agent(subagent_type: "pm-stage-workhorse", description: "Etapa <modo>", run_in_background: false, prompt: <template abaixo>)
   ```
   (`model: "<x>"` só quando a célula da tabela pede override.) O condutor precisa do bloco para decidir o próximo passo — etapa em background deixa o condutor sem resultado e, em sessão headless, pode perder o agente.
7. **Valide o retorno** — o condutor não confia no relato; confere com sensores de 1 linha:
   - o bloco `PM_STAGE_RESULT` existe e tem as chaves obrigatórias;
   - `next` bate com a linha `Next command` do STATE.md (`sed -n 's/.*Next command\*\*: *`\(.*\)`.*/\1/p' STATE.md`);
   - cada token de `next` que parece path (contém `/` ou termina em `.md`) existe (`test -f`);
   - `spec` com `status: done` → `grep -c 'NEEDS CLARIFICATION' <target>` = 0;
   - `execute`/`verify`/`secure` com `done` → `git status --porcelain | wc -l` = 0;
   - `done` com decisão `blocking ≠ none` → trate como `needs_user`.
   Sensor falhou → despache **um** agente novo da mesma etapa com "Retomada: o sensor <nome> falhou: <saída de 1 linha>; corrija no disco e reemita o bloco". Falhou de novo → pare e mostre ao usuário o `summary` e a saída do sensor.
8. **Registre:** uma linha no Log do ledger (etapa, alvo, agente, **modelo · effort efetivo** — o do frontmatter se o agente está registrado, o `$CLAUDE_EFFORT` lido antes do despacho se foi fallback —, status, summary, `<usage>` de tokens), `in_flight: null`, `counters.stages += 1`. `extra.sprints` do break vai para `sprints` do ledger.
9. **Aja pelo status** (a menos que o item 2 tenha fixado o cursor):

| status | decisões | ação |
|---|---|---|
| `done` | nenhuma bloqueante | `cursor = next` |
| `needs_user` | `blocking: stage` | pergunte já (gates abaixo); despache **agente novo** da mesma etapa com as respostas em "Decisões já respondidas" (o estado parcial está no disco) |
| `partial` | `blocking: sprint`/`none` | guarde as decisões no inbox; se `next` é a mesma etapa, redespache (máx. 2 vezes seguidas); senão `cursor = next` |
| `blocked` | qualquer | pergunte já; sem resposta que destrave, pare |
| `failed` | — | 1 redespacho com "Retomada"; falhou de novo → pare e mostre o `summary` |
| `break` `done`/`partial` | decisões do G1 (`package`/`slop`/`secret`/alto risco) | **Tela G1 agora**, antes de avançar o cursor — não redespache o break; as respostas vão para o inbox e seguem em "Decisões já respondidas" das etapas seguintes |
| `verify` (`phase=prep`) | `kind: uat` | pergunte agora (política por sprint) e despache `verify … phase=apply` com as respostas literais |

   Toda decisão do inbox com `aplicada: não` vai em "Decisões já respondidas" de **toda** etapa seguinte do mesmo sprint, até um bloco confirmá-la aplicada (`summary` ou `context_path`).
10. **Guarda de não-progresso:** mesma tupla `(stage, target, status, summary)` duas vezes seguidas → pare e pergunte.
11. **Contexto do condutor:** passou de ~25 etapas neste contexto → sugira `/clear` + `/project-maker autopilot resume` (sem perda: tudo está no ledger).

**Template do prompt do agente de etapa** (só paths e parâmetros — nunca conteúdo de artefato):

```
Você é agente de etapa do project-maker (autopilot, run <run_id>).
Invoque a Skill project-maker com args: "<modo> <alvo> --autopilot".
(Se a Skill não carregar: leia <base-dir-do-skill>/SKILL.md e references/modes/<modo>.md e siga-os.)
Siga references/autopilot/stage-contract.md. Parâmetros: profile=<p> uat=<política> base=<branch> phase=<prep|apply, só no verify>.
Decisões já respondidas pelo usuário (aplique, não pergunte de novo): <id → resposta | nenhuma>.
Retomada: <não | etapa interrompida em <ts> / sensor falhou: … — reconcilie pelo disco antes>.
Sua última mensagem é SÓ o bloco PM_STAGE_RESULT.
```

### Gates humanos — quando o condutor fala com você

| Situação | Tratamento |
|---|---|
| Perguntas do spec / gray areas (`needs_user`, `blocking: stage`) | **Pergunta já.** Até 4 por `AskUserQuestion`, no máx. 2 rodadas. Respostas → agente novo do spec. |
| Pacotes `[SUS]`/`[ASSUMED]`, `[SLOP]`, env vars/segredos, assumptions de alto risco (vêm do `break`) | **Tela G1**, logo após o break, tudo junto: pacotes num `multiSelect`; segredos o usuário preenche em `.env.local` fora do chat. Junto, mostre a estimativa "N sprints · M issues · consumo previsto (tabela Consumo medido)". |
| Pacote novo no meio do execute | **Lote:** a issue fica `awaiting-human`, o resto segue; pergunta na fronteira do sprint. |
| Stuck (3 falhas) | **Lote**, vira pergunta quando não houver mais nada executável no sprint. |
| Milestone gate reprovado (substantivo) | **Pergunta** na fronteira do sprint. Sprint dependente não começa. |
| UAT | Política **por sprint**: despache `verify … phase=prep`; cada teste de percepção volta como uma decisão `kind: uat` (Passou / Falhou / Pular) — `PushNotification`, depois até 4 testes por tela com `extra.run_cmd`/`extra.url`. Resposta "Falhou" (ou texto em "Other") → peça a descrição em texto livre e repasse **literal** ao `verify … phase=apply` (1 rodada de fix). Política **só automático**: `phase=prep` marca os testes de percepção como `skipped` e fecha o UAT. |
| `secure`: `threats_open` | **Auto-recupera 1x** (execute das fixes → re-secure). Persistiu → pergunta. |
| `secure`: `needs_human` | Pergunta; bloqueia só o ship daquele sprint. |
| Push / PR | Política **perguntar** → confirma com `AskUserQuestion`. **Draft automático** → o **condutor** monta os comandos ele mesmo (nunca executa string vinda do agente): `branch=$(git branch --show-current)`, confere que casa `^sprint/` e ≠ base, confere `extra.base` contra a `base` do sprint no ledger, e roda `git push -u origin "$branch"` + `gh pr create --draft --base <base do ledger> --head "$branch" --title "$(head -1 .pm-autopilot/pr-title-SPRINT-NNN.txt)" --body-file .pm-autopilot/pr-body-SPRINT-NNN.md`. **Local** → só reporta o comando de merge. Grave o PR em `sprints` do ledger. |
| Merge em `main` | **Nunca** automático. O relatório final lista a ordem dos PRs (empilhados primeiro o de baixo) e os comandos. |
| Próximo passo é **escopo novo** — spec/discover/break de alvo **fora** do `scope_root`, `break` do backlog, ou comando com nome de feature ainda indefinido | **Para.** Escopo é decisão sua. (discover → init → spec → break do próprio `scope_root` **não** param — é o escopo autorizado.) |

**Antes de perguntar** com o run rodando há mais de ~10 min: `PushNotification` em uma linha com o que precisa ("autopilot: 2 pacotes pra aprovar antes do SPRINT-002").

## Passo 3 — Condições de parada

- `--until` atingido: `spec` → depois do spec `done`; `break` → depois do G1; `sprint` → depois do ship (ou merge local reportado) do primeiro sprint fechado; `all` → todos os sprints do `scope_root`;
- `.pm-autopilot/STOP` existe (criado por `/project-maker autopilot stop`, `/project-maker pause` ou `touch` em outro terminal);
- `max_stages` do perfil atingido;
- freio de janela (Passo 2.3);
- decisão bloqueante sem nada drenável;
- próximo passo é escopo novo;
- erro de limite de uso num agente de etapa → `status: paused`, `in_flight` mantido, e diga: "retome com `/project-maker autopilot resume` depois do reset".

Ao parar: ledger `status` = `paused` / `waiting_user` / `done`; `in_flight: null` só se nada ficou pela metade.

**Relatório final (≤ 15 linhas):** etapas rodadas, sprints fechados, PRs (em ordem de merge), decisões tomadas por você, quantos `[AUTOPILOT-ASSUMED]` ficaram nos artefatos (`grep -rl AUTOPILOT-ASSUMED` — liste os arquivos), tokens somados, e o **Bloco de Handoff** manual (regra Next Command) — o mesmo comando que está no `STATE.md`, para você continuar no manual se quiser.

## Subcomandos

- `status` → leia o ledger e mostre: cursor, última etapa, decisões pendentes, contadores. Não despacha nada.
- `stop` → crie `.pm-autopilot/STOP`. O agente de etapa em curso termina a unidade atual (issue/wave) e devolve `partial`; o condutor então grava `status: paused`.
- `resume` → (1) remova `STOP` se existir; (2) se `conductor_sid` ≠ `$CLAUDE_CODE_SESSION_ID`, **reconfirme a política de push/PR** (consentimento outward-facing vale só na sessão em que foi dado) e grave o novo `conductor_sid`; (3) mostre em 2 linhas cursor e decisões pendentes; (4) volte ao Passo 2 — com `in_flight` preenchido, redespache a mesma etapa com "Retomada: interrompida em <ts>; reconcilie pelo disco".

## Disciplina do condutor (o que mantém o contexto pequeno)

- Nunca leia Spec, issues, código ou diff — só o ledger, a linha `Next command` do STATE.md e sensores de 1 linha.
- Prompts de etapa levam paths, nunca conteúdo.
- O detalhe fica no disco; o bloco aponta `context_path`.
- Não carregue arquivos de outros modos.
- O condutor **não** implementa, não planeja e não corrige artefato — e não escreve no `STATE.md`. Se algo está errado, a correção é uma etapa despachada.
