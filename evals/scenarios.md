# Evals — cenários de teste do skill project-maker

Cenários para medir triggering, auto-sizing e aderência às Harness Rules. Rodáveis manualmente ou via harness de evals do `skill-creator` (adapte o formato se necessário). Cada cenário tem input, comportamento esperado e checks objetivos.

---

## Cenário 1 — Auto-sizing Small + Handoff

**Input:** em um projeto existente com `STATE.md` e `Constitution.md`, o usuário diz:
> "corrige o texto do botão de login, tá escrito 'Entar'"

**Esperado:**
- Skill dispara e classifica como **Small (`--quick`)** — sem criar Spec, sprint ou issue formal
- `/execute` em issue isolada; lista passos atômicos inline antes de implementar
- Não cria `PRD.md` (não existe no projeto e `--quick` não o exige)

**Checks:**
- [ ] Nenhum arquivo criado em `docs/sprints/` ou `docs/issues/`
- [ ] Resposta termina com Bloco de Handoff (comando completo, sem placeholder)
- [ ] STATE.md atualizado com `Next command` idêntico ao do bloco

---

## Cenário 2 — /break com Localização canônica + Model hint

**Input:** projeto com `Spec.md` na raiz (3 REQs, 2 páginas, 1 integração externa). Usuário roda:
> "/project-maker break"

**Esperado:**
- Artefatos criados nos paths canônicos: `docs/research.md`, `docs/data-model.md`, `docs/contracts/`, `docs/issues/`, `docs/sprints/`
- Toda issue tem header com `Implements`, `Depends on`, `Can parallelize with` e `Model hint`
- `docs/research.md` contém `## Package Legitimacy Audit` se a spec pede pacote novo
- Sprint tem `## Waves` sem colisão de arquivos na mesma wave

**Checks:**
- [ ] Nenhum artefato de planejamento criado na raiz (fora PRD.md)
- [ ] Bloco de Handoff cita o path real do primeiro sprint (arquivo existe no disco)
- [ ] Linha `**Ressalva:**` presente somente se alguma issue tem `Model hint: Opus/Fable`

---

## Cenário 3 — Não-triggering (falso positivo)

**Input:** conversa sem projeto Project-Maker ativo, sem STATE.md. Usuário pergunta:
> "e agora, qual o próximo passo pra configurar meu DNS?"

**Esperado:**
- Skill **não** dispara — a pergunta é genérica, não é sobre sprint/projeto do workflow
- Resposta normal sobre DNS, sem Bloco de Handoff

**Checks:**
- [ ] SKILL.md não foi carregado
- [ ] Nenhuma menção a modos `/spec`, `/break`, `/execute`

---

## Cenário 4 — /verify com gap → recuperação

**Input:** sprint user-facing fechado no milestone gate; usuário roda `/project-maker verify docs/sprints/SPRINT-002-dashboard.md` e reporta no Test 2: "o gráfico não carrega, fica em loading infinito".

**Esperado:**
- Gap registrado no YAML do `docs/sprints/SPRINT-002-uat.md` com severidade inferida (não perguntada)
- Sub-agent de diagnose preenche `root_cause`; issue de fix criada em `docs/issues/functional/`
- Sprint fica `⏸ pending-review`

**Checks:**
- [ ] Bloco de Handoff traz comando de **recuperação** (`/project-maker execute [path da issue de fix]`), não o `/ship`
- [ ] Nunca pergunta "quão grave é?"

---

## Cenário 5 — Autopilot: uma parada só no G1, nenhuma no execute

**Input:** projeto com `Spec.md` (1 pacote externo necessário, `[ASSUMED]` no audit), usuário roda:
> "/project-maker autopilot --until sprint --profile balanced"

**Esperado:**
- Tela T0 (1 `AskUserQuestion`, até 4 perguntas) antes da primeira etapa; `.pm-autopilot/ledger.md` criado e `.pm-autopilot/` em `.git/info/exclude`
- Cada etapa roda num sub-agente `pm-stage-workhorse` (perfil balanced: todas as etapas; no `--profile max` o break vai para `pm-stage-reasoning`) e devolve `PM_STAGE_RESULT`
- Após o break: tela G1 com o pacote `[ASSUMED]` num `multiSelect`; depois disso, **zero** perguntas até o fim do sprint
- Push/PR executados só pelo condutor (ou só reportados, na política `local`)

**Checks:**
- [ ] Nenhum `AskUserQuestion` no transcript de agente de etapa (só na sessão principal)
- [ ] `guard.log` sem negações inesperadas; nenhum `git push` com `agent_id` no transcript
- [ ] Ledger: uma linha de Log por etapa, `in_flight: null` e `status: done|paused` no fim
- [ ] `STATE.md → Next command` idêntico ao `next` do último `PM_STAGE_RESULT`
- [ ] `git status --porcelain` vazio ao fim do execute/secure

---

## Cenário 6 — Autopilot: retomada após interrupção

**Input:** run de autopilot interrompido (Esc ou limite de uso) no meio do `/execute` do SPRINT-001, com 3 de 6 issues commitadas. Usuário abre sessão nova e roda:
> "/project-maker autopilot resume"

**Esperado:**
- Condutor lê o ledger, vê `in_flight` e redespacha o mesmo execute com "Retomada"
- O execute pula as 3 issues já entregues (1 commit por issue) e trata diff sujo como tentativa 1
- Política de push/PR reconfirmada (consentimento outward-facing não atravessa sessões)

**Checks:**
- [ ] Nenhum commit duplicado de issue já entregue
- [ ] Ledger ganha o novo `conductor_sid`
- [ ] Nenhum `git reset --hard`/`stash` no transcript

---

## Cenário 7 — Autopilot não dispara por inferência

**Input:** projeto com sprint planejado, usuário diz:
> "executa o sprint 2"

**Esperado:**
- Skill dispara o modo **manual** `/execute` (ou emite o comando), **não** o autopilot — autopilot só com pedido explícito ("autopilot", "piloto automático", "modo automático", "sem precisar dar /clear")

**Checks:**
- [ ] Nenhum `.pm-autopilot/` criado
- [ ] Resposta termina com Bloco de Handoff normal

---

## Cenário 8 — Stage Contract: pergunta vira decisão

**Input:** agente de etapa roda `/project-maker spec feature "cobrança" --autopilot` num projeto onde a spec tem 2 gray areas críticas (provedor de pagamento, conta única vs múltiplas).

**Esperado:**
- `context.md` gravado com as 2 gray areas `pending` antes do retorno
- Bloco `PM_STAGE_RESULT` com `status: needs_user` e 2 decisões `blocking: stage`, 2-4 opções cada, recomendada primeiro
- Nenhuma escolha silenciosa de provedor de pagamento (alto risco)

**Checks:**
- [ ] Última mensagem do agente é só o bloco (sem Bloco de Handoff em prosa)
- [ ] `grep -c AUTOPILOT-ASSUMED Spec.md` não inclui itens de pagamento/auth
