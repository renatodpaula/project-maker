# Plan: Harness Engineering Upgrade for Project-Maker

**Objetivo:** Elevar o Project-Maker para paridade prática com `tlc-spec-driven` + padrões do `gsd-2` que cabem em formato skill, resolvendo os 6 problemas de agentes sem harness documentados por Anthropic/OpenAI/Fowler (Feb 2026).

**Referências:**
- Vídeo Waldemar Neto — "Spec Driven chegou no limite, Harness Engineering é o próximo passo"
- tlc-spec-driven skill v2.0.0 (Felipe Rodrigues)
- gsd-build/gsd-2 (Pi SDK based harness runtime)

**Entrega:** 3 PRs sequenciais, atômicos e revertíveis.

---

## PR 1 — Fundação Harness (P0)

Resolve os 3 gaps principais do vídeo: amnésia entre sessões, self-declared done, e semente do dual-agent. Estabelece a base que PR 2 e PR 3 assumem.

### 1.1 — `memory-bank/STATE.md` persistente

**Gap coberto:** #3 Amnésia entre sessões
**Inspiração:** tlc-spec-driven `.specs/project/STATE.md`

**Arquivos:**
- Criar `references/state-template.md` (seed)
- Editar `SKILL.md` para carregar STATE.md no início de `/discover`, `/spec`, `/plan`, `/execute`, `/build`

**Schema obrigatório:**
```markdown
# Project State

## Current Session
- Last updated: YYYY-MM-DD HH:MM
- Active feature/issue: [id ou path]
- Next action: [1 linha]

## Decisions (append-only)
- [YYYY-MM-DD] decision — reason

## Blockers
- [id] description — status — owner

## Lessons Learned
- [YYYY-MM-DD] what failed + fix

## Todos
- [ ] ...

## Deferred Ideas
- ...
```

**Done when:**
- `/execute` lê STATE.md antes de começar e escreve no final
- Template existe em `references/state-template.md`
- SKILL.md documenta quando ler e quando atualizar

---

### 1.2 — Gate checks 0/1 por issue

**Gap coberto:** #4 Self-declared done
**Inspiração:** tlc-spec-driven `Gate check result: [pass/fail]`

**Arquivos:**
- Editar `references/issue-template.md` — adicionar seções `Done when`, `Tests`, `Gate`
- Editar `SKILL.md` — `/execute` deve rodar o comando de Gate e bloquear "done" se falhar

**Schema a adicionar em `issue-template.md`:**
```markdown
## Done when
- [ ] comportamento observável 1
- [ ] arquivo X existe com implementação real (não stub)

## Tests
- unit: path/to/test
- integration: path/to/test

## Gate
```bash
npm run lint && npm run test -- path/to/test
```
```

**Regra no SKILL.md:**
- O agente NUNCA pode marcar issue como done sem rodar o Gate
- Gate retorna exit code 0 → done; !=0 → fix e re-run
- Se Gate falhar 3x seguidas → marcar como blocker em STATE.md e parar

**Done when:**
- issue-template.md tem as 3 seções novas
- SKILL.md documenta a regra do Gate
- Exemplo prático no SKILL.md ou em `references/gate-check.md`

---

### 1.3 — `SPEC_DEVIATION` markers

**Gap coberto:** #5 (semente — completo em PR 2)
**Inspiração:** tlc-spec-driven SPEC_DEVIATION reporting

**Arquivos:**
- Editar `references/issue-template.md` — seção `Summary` com campo de deviations
- Editar `SKILL.md` — instrução para flagar qualquer divergência

**Regra:** se o implementador mudou algo que não estava na spec (escopo novo, arquivo extra, dependência nova, API diferente), precisa adicionar em `## Spec Deviations` do summary com:
- O que foi feito diferente
- Por quê
- Impacto

**Done when:**
- Template tem o campo
- SKILL.md instrui explicitamente o implementador a auto-reportar deviations
- Este campo vira input obrigatório do validator no PR 2

---

### 1.4 — Tabela de sub-agent delegation no SKILL.md

**Gap coberto:** Context engineering — o que delegar e como
**Inspiração:** tlc-spec-driven "Sub-Agent Delegation" section

**Arquivos:**
- Editar `SKILL.md` — adicionar seção "Sub-Agent Delegation"

**Conteúdo:**

Tabela "quando delegar":
| Atividade | Delegar? | Razão |
|---|---|---|
| Research / brownfield mapping | Sim | Output grande, só o resumo importa |
| Implementar uma issue | Sim | File reads + edits consomem contexto |
| Issues paralelas `[P]` | Sim (1 por issue) | Única forma de paralelismo real |
| Planning, validação final | Não | Precisam do contexto acumulado |
| Quick mode / `--quick` | Não | Overhead não compensa |

Contrato de contexto para sub-agents:
- **Recebe:** definição da issue (What/Where/Depends/Reuses/Done when/Tests/Gate), convenções relevantes, TESTING.md, spec/design referenciado
- **NÃO recebe:** outras issues, histórico da conversa, validation reports de outras issues, STATE.md completo

O que sub-agent retorna:
- Status: Complete | Blocked | Partial
- Files changed: [lista]
- Gate check result: pass/fail + counts
- SPEC_DEVIATION markers (se houver)
- Issues encontradas

**Done when:**
- Seção existe em SKILL.md
- `/execute` e `/break` referenciam essa tabela para decidir delegação

---

### 1.5 — Context budget explícito

**Gap coberto:** Context engineering
**Inspiração:** tlc-spec-driven "Context Loading Strategy"

**Arquivos:**
- Editar `SKILL.md` — adicionar seção "Context Loading Strategy"

**Conteúdo:**

Base load (~15k):
- Constitution.md (se existir)
- PRD.md / ROADMAP.md (quando planejando features)
- STATE.md

On-demand load:
- steering/ docs (quando trabalhando em projeto existente)
- steering/CONCERNS.md (só quando feature toca áreas flagged)
- spec.md (só da feature atual)
- issue.md (só da issue atual)

Never load simultaneously:
- Múltiplos specs de feature
- Múltiplos docs de arquitetura
- Arquivos arquivados

Target: <40k tokens de contexto ativo
Reserva: 160k+ para trabalho/raciocínio/output

**Done when:**
- Seção existe em SKILL.md
- Comandos respeitam a regra de base load vs on-demand

---

### 1.6 — Knowledge Verification Chain + anti-fabricação

**Gap coberto:** Alucinação / APIs inventadas
**Inspiração:** tlc-spec-driven "Knowledge Verification Chain"

**Arquivos:**
- Editar `SKILL.md` — adicionar seção "Knowledge Verification"

**Conteúdo:**

Ordem estrita de verificação (nunca pular passos):
1. Codebase — checar código existente e convenções em uso
2. Project docs — README, docs/, comentários, steering/
3. Context7 MCP (se instalado) — resolver library ID e buscar API atual
4. Web search — docs oficiais
5. Flag como incerto — "Não tenho certeza sobre X, aqui está meu raciocínio, mas verifique"

Regras:
- Nunca pular para passo 5 se 1-4 disponíveis
- Passo 5 é SEMPRE flageado como incerto, nunca apresentado como fato
- **NEVER assume or fabricate.** Se não encontrou, diga "não sei". Inventar APIs causa cascata de falhas. Incerteza é sempre preferível a fabricação.

**Done when:**
- Seção existe em SKILL.md
- Regra mencionada em `/spec`, `/plan`, `/execute`

---

### 1.7 — `steering/CONCERNS.md`

**Gap coberto:** Documentação viva de tech debt
**Inspiração:** tlc-spec-driven CONCERNS.md

**Arquivos:**
- Criar `references/concerns-template.md`
- Editar `SKILL.md` — `/discover` e `/init` mencionam criar CONCERNS.md

**Schema:**
```markdown
# Concerns

## Fragile Areas
- path/to/file — why fragile — what to check when touching

## Tech Debt
- [priority] description — suggested fix

## Flagged Dependencies
- package — reason

## Known Gotchas
- behavior that surprises new devs
```

**Regra:** carregar CONCERNS.md só quando uma feature tocar um arquivo/área listado.

**Done when:**
- Template existe
- SKILL.md documenta quando ler
- `/spec` pergunta "esta feature toca alguma área em CONCERNS.md?"

---

### 1.8 — Safety valve no `/build`

**Gap coberto:** #1 One Shot Hero (reforço)
**Inspiração:** tlc-spec-driven safety valve

**Arquivos:**
- Editar `SKILL.md` — seção de `/build`

**Regra:** `/build` (que é plan+execute em uma sessão) SEMPRE começa listando os passos atômicos inline. Se a lista revelar >5 passos ou dependências complexas, PARA e força executar `/break` antes de continuar.

**Done when:**
- SKILL.md documenta a regra
- `/build` lista passos antes de executar

---

### Checklist manual PR 1

- [ ] Criar feature fake pequena e testar `/spec` → `/break` → `/execute`
- [ ] Verificar STATE.md é lido e atualizado
- [ ] Verificar que Gate check falho bloqueia "done"
- [ ] Verificar que SPEC_DEVIATION aparece no summary se houver
- [ ] Verificar que context budget não estoura 40k em uma issue simples
- [ ] Verificar que `/build` com 8 passos força `/break`

---

## PR 2 — Dual-Agent + Sprints (P1)

Eleva de "skill com harness" para "skill preparada para builds autônomos longos". Este PR é onde mora a maior parte do valor de engenharia.

### 2.1 — Hierarquia 3 níveis: Projeto → Sprint → Issue

**Inspiração:** gsd-2 Milestone → Slice → Task

**Arquivos:**
- Editar `SKILL.md` — introduzir conceito de Sprint entre spec e issue
- Editar `references/spec-template.md` — seção de Sprints
- Novo diretório conceitual: `memory-bank/sprints/SPRINT-NNN.md`

**Regra de ferro (gsd-2):** *"uma issue tem que caber em uma janela de contexto. Se não cabe, são duas issues."*

**Schema de Sprint:**
```markdown
# Sprint NNN — [título]

## Goal
- [1 parágrafo do que o sprint entrega]

## Success Criteria
- [critério 1 mecanicamente verificável]
- [critério 2]

## Issues
- [ ] NNN-001-xxx.md
- [ ] NNN-002-xxx.md [P]

## Dependencies
- Depends on: Sprint NNN-1
- Blocks: Sprint NNN+1

## Reassess Notes
- (preenchido ao final do sprint)
```

**Mudanças em comandos:**
- `/break` agora gera Sprints + Issues (não só issues soltas)
- `/plan` trabalha em escopo de Sprint, não projeto inteiro
- `/execute` roda um Sprint de cada vez

**Done when:**
- Conceito documentado
- spec-template.md inclui breakdown em sprints
- `/break` gera arquivos de sprint

---

### 2.2 — Dual-agent real: implementer + validator

**Gap coberto:** #5 Um processo só (completo)
**Inspiração:** Waldemar PBQ + gsd-2 validation gate

**Arquivos:**
- Editar `SKILL.md` — `/execute` vira orquestrador
- Criar `references/agents/validator.md`
- Editar `references/agents/` existentes para serem chamados como sub-agents implementadores

**Fluxo novo de `/execute` por issue:**

1. **Orquestrador** lê issue + STATE.md + CONCERNS.md relevante
2. Dispara **implementer** (sub-agent isolado, contexto mínimo conforme PR 1 item 4)
3. Implementer retorna: files changed, gate result, SPEC_DEVIATION markers, status
4. Dispara **validator** (sub-agent separado, instruções abaixo) passando: issue original, diff, gate result, deviations
5. Validator retorna score (0-100) + lista de gaps + pass/fail (threshold mínimo: 80)
6. Se fail → orquestrador re-dispatch implementer com o feedback do validator (max 3 iterações)
7. Se pass → atualiza STATE.md + fecha issue
8. Se 3 falhas → marca blocker em STATE.md e pula

**validator.md contém:**
- Missão: só validar, nunca implementar
- Input: issue.md, diff do implementer, gate result, deviations
- Checklist: cada item de "Done when" da issue × diff real; spec compliance; convention compliance; regressões óbvias
- Output: score numérico + gaps específicos + verdict

**Princípio:** validator NUNCA edita código. Se quiser sugerir fix, devolve ao orquestrador que re-dispara implementer.

**Done when:**
- validator.md existe
- `/execute` documenta o loop orquestrador → implementer → validator
- Threshold mínimo documentado
- Limite de iterações documentado

---

### 2.3 — Reassess phase pós-sprint

**Gap coberto:** #6 Sloppy acumulado
**Inspiração:** gsd-2 reassess phase

**Arquivos:**
- Editar `SKILL.md` — adicionar fase de reassess após sprint

**Fluxo:** ao fim de cada sprint:
1. Ler PRD.md + SPRINT.md + summaries das issues do sprint
2. Responder 4 perguntas:
   - O que aprendemos?
   - Alguma issue dos próximos sprints ficou desnecessária?
   - Alguma issue nova precisa existir?
   - Alguma decisão arquitetural mudou?
3. Atualizar PRD.md, próximos sprints, DECISIONS.md
4. Escrever "Reassess Notes" no SPRINT.md

**Done when:**
- Fluxo documentado no SKILL.md
- Executado automaticamente no fim de cada `/execute` de sprint

---

### 2.4 — Milestone validation gate

**Inspiração:** gsd-2 milestone validation gate

**Arquivos:**
- Editar `SKILL.md` — gate antes de fechar sprint

**Regra:** antes de marcar sprint como done, comparar:
- Success Criteria declarados no sprint × resultado real
- Todas issues do sprint têm gate check passando
- Todos SPEC_DEVIATION foram revistos e aceitos ou corrigidos

Se algo falhar → sprint fica "pending review", não "done".

**Done when:**
- Gate documentado
- `/execute` roda gate antes de fechar sprint

---

### 2.5 — Separar DECISIONS.md e KNOWLEDGE.md

**Inspiração:** gsd-2 living docs

**Arquivos:**
- Criar `references/decisions-template.md`
- Criar `references/knowledge-template.md`
- Editar `SKILL.md`

**Diferença de papéis:**
- **STATE.md** — estado volátil (sessão atual, blockers, todos) — alto churn
- **DECISIONS.md** — append-only de decisões arquiteturais com contexto — nunca deleta
- **KNOWLEDGE.md** — lessons learned cross-project, padrões que funcionam, gotchas — baixo churn, alta reusabilidade

**Done when:**
- 3 templates existem
- SKILL.md documenta diferença e quando atualizar cada um

---

### Checklist manual PR 2

- [ ] Criar sprint fake com 3 issues e rodar `/execute`
- [ ] Verificar que implementer e validator rodam em sessões separadas
- [ ] Forçar uma falha para validar o loop de re-dispatch
- [ ] Verificar que reassess atualiza PRD.md
- [ ] Verificar que milestone gate bloqueia fechar sprint incompleto
- [ ] Verificar que DECISIONS.md e KNOWLEDGE.md são atualizados nos momentos certos

---

## PR 3 — Experiência & Polish (P2)

Os detalhes que fazem a skill ser agradável de usar e alcançar ~95% de paridade com tlc.

### 3.1 — Auto-sizing com 4 escopos

**Inspiração:** tlc-spec-driven

**Arquivos:** Editar `SKILL.md` — substituir 3 scales por 4.

**Novo mapeamento:**

| Scope | What | Pipeline |
|---|---|---|
| **Small** | ≤3 arquivos, uma frase | `--quick` (apenas execute) |
| **Medium** | Feature clara, <10 tasks | spec (breve) + execute (tasks inline) |
| **Large** | Multi-componente | spec completo + design + break + execute |
| **Complex** | Ambiguidade, domínio novo | spec + discuss + research + design + break + execute com UAT |

**Regras:**
- Specify e Execute sempre obrigatórios
- Design pulado quando não há decisão arquitetural
- Break pulado quando ≤3 steps óbvios
- Discuss disparado dentro de Specify só se houver gray area

**Done when:**
- SKILL.md tem a nova tabela de escopos
- Regras de skip documentadas

---

### 3.2 — Discuss phase dentro de `/spec`

**Inspiração:** tlc-spec-driven context.md

**Arquivos:**
- Editar `SKILL.md` — `/spec` detecta gray areas
- Criar `references/context-template.md`

**Regra:** se durante `/spec` o agente detectar ambiguidade (ex: "não está claro se X deve ser síncrono ou async", "não sei qual lib usar"), dispara discuss:
1. Lista as questões abertas
2. Pergunta ao usuário
3. Grava respostas em `memory-bank/features/[feature]/context.md`
4. Continua o spec com as decisões

**Done when:**
- Template existe
- `/spec` documenta quando disparar discuss
- context.md é carregado em `/plan` e `/execute`

---

### 3.3 — Session handoff: `/pause` e `/resume`

**Inspiração:** tlc-spec-driven session handoff

**Arquivos:**
- Editar `SKILL.md` — adicionar comandos `/pause` e `/resume`

**`/pause`:**
- Atualiza STATE.md com "Current Session" — última issue, próximo passo, blockers ativos
- Escreve um handoff note explícito para a próxima sessão
- Lista arquivos abertos / em progresso

**`/resume`:**
- Lê STATE.md
- Resume em 5 bullets: onde paramos, o que falta, blockers, próximo passo, arquivos relevantes
- Pergunta ao usuário se quer continuar de onde parou ou mudar de direção

**Done when:**
- Ambos comandos documentados
- STATE.md tem seção dedicada a handoff

---

### 3.4 — UAT interativo dentro de `/execute`

**Inspiração:** tlc-spec-driven interactive UAT

**Arquivos:**
- Editar `SKILL.md` — `/execute` pode disparar UAT
- Criar `references/uat-template.md`

**Regra:** para features user-facing com comportamento complexo (não bug fix, não config), ao fim do `/execute`:
1. Gera script de UAT (passos que o usuário pode seguir no navegador/app)
2. Apresenta ao usuário
3. Usuário reporta pass/fail por step
4. Se falhou, vira blocker em STATE.md

**Done when:**
- Template existe
- SKILL.md documenta quando disparar

---

### 3.5 — Brownfield completo: 7 docs

**Inspiração:** tlc-spec-driven

**Arquivos:**
- Editar `SKILL.md` — `/discover` gera 7 docs ao invés de 3
- Criar templates faltantes em `references/`

**Docs:**
1. product.md (já existe)
2. structure.md (já existe)
3. tech.md (já existe — renomear para stack.md)
4. **NOVO** architecture.md — overview de arquitetura, camadas, fluxos
5. **NOVO** conventions.md — padrões de código, naming, estilo
6. **NOVO** testing.md — estratégia de testes, comandos, gate commands
7. **NOVO** integrations.md — APIs externas, webhooks, serviços
8. concerns.md (já em PR 1)

**Done when:**
- 7 templates existem
- `/discover` e `/init` geram todos

---

### 3.6 — Skill integration awareness

**Inspiração:** tlc-spec-driven mermaid-studio / codenavi

**Arquivos:**
- Editar `SKILL.md` — seção "Skill Integrations"

**Regra:** antes de tarefas específicas, checar se skills complementares estão instaladas e delegar:
- Diagramas → mermaid-studio (se instalado)
- Exploração de código → codenavi (se instalado)
- Docs de libs → Context7 MCP (se instalado)
- Web research → firecrawl-search (se instalado)

Mostrar recomendação de instalação no máximo 1x por sessão.

**Done when:**
- Seção existe
- Regra de "1x por sessão" documentada

---

### 3.7 — Stuck detection leve

**Inspiração:** gsd-2 stuck detection

**Arquivos:**
- Editar `SKILL.md` — regra no loop do validator

**Regra:** se o validator reprovar a mesma issue 3x seguidas, ou se o implementer tentar a mesma fix 2x:
1. Para o loop
2. Escreve diagnóstico em STATE.md sob "Blockers" com o padrão detectado
3. Pede intervenção humana

**Done when:**
- Regra documentada no `/execute`
- Limite configurável

---

### Checklist manual PR 3

- [ ] Testar feature pequena → sistema seleciona Small → pula pipeline
- [ ] Testar feature ambígua → sistema dispara discuss → grava context.md
- [ ] `/pause` seguido de `/resume` em sessão nova restaura contexto
- [ ] UAT gera script executável e registra resultado
- [ ] `/discover` em projeto brownfield gera 7 docs
- [ ] Forçar stuck 3x → sistema para e pede ajuda

---

## Resumo de cobertura pós-upgrade

| Fase | Vídeo Waldemar | tlc-spec-driven | gsd-2 |
|---|:-:|:-:|:-:|
| Hoje | 2/6 | ~30% | ~15% |
| Após PR 1 | 5/6 | ~65% | ~40% |
| Após PR 2 | 6/6 | ~75% | ~70% |
| Após PR 3 | 6/6 | ~95% | ~75% |

O teto ~75% do gsd-2 é o máximo realista sem virar CLI em TypeScript (cost ledger, lock files, crash forensics e fresh-session-per-task de verdade precisam de runtime).

---

## Ordem de implementação recomendada

1. **PR 1 agora** (1 sessão) — resolve o vídeo em 5/6, base para tudo
2. Testar PR 1 em uma feature real antes de seguir
3. **PR 2** (1 sessão) — fecha o vídeo 6/6, entrega o dual-agent
4. Testar PR 2 em um sprint real
5. **PR 3** (~0.5 sessão) — polish e paridade com tlc

Cada PR é revertível isoladamente. Se algo não funcionar na prática, volta para a fase anterior e ajusta sem perder o resto.
