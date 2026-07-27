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
