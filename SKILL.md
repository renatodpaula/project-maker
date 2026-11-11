---
name: project-maker
license: MIT
metadata:
  author: Renato de Paula Cardoso <renato@renatodpaula.com.br>
  homepage: https://github.com/renatodpaula/project-maker
  instagram: https://instagram.com/renatodpaula.ai
  version: 3.5.0
description: |
  Workflow Spec-Driven Development para criar projetos ou adicionar features com IA de forma estruturada:
  brief, spec com requisitos verificáveis, sprints e issues, execução com implementer e validator separados,
  UAT, gate de segurança e PR. Use quando o usuário quiser organizar uma ideia de projeto, criar um projeto
  do zero, especificar ou planejar uma feature de porte médio ou maior, quebrar uma spec em issues, executar
  um sprint, validar ou revisar a segurança de uma entrega do workflow, abrir o PR de um sprint, ou perguntar
  qual o próximo passo/comando/modelo de um projeto que já usa o workflow (tem STATE.md ou docs/sprints/).
  Não use para correção pontual ou pergunta avulsa em projeto que não usa o workflow.
  Invocação: /project-maker <modo> [alvo], modos discover, init, spec, break, plan, execute, verify, secure,
  ship, build, pause, resume, autopilot. Frases típicas: "criar projeto", "nova feature", "organizar minha
  ideia", "quebrar em issues", "implementar issue", "executar o sprint", "qual o próximo passo do sprint",
  "qual modelo rodar". O autopilot só com pedido explícito: "autopilot", "piloto automático", "modo
  automático", "rodar as etapas sozinho", "sem precisar dar /clear".
---

# Project Maker

Workflow estruturado de Spec-Driven Development para construir projetos com IA sem vibe coding.

## Escala do problema (auto-sizing)

**Princípio:** a complexidade determina a profundidade, não o contrário. Antes de começar qualquer trabalho, avalie o escopo e aplique apenas o necessário.

| Escopo | O que é | Discover | Init | Spec | Break | Plan | Execute |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| **Small** (`--quick`) | ≤3 arquivos, uma frase | — | — | — | — | ⚠️ inline | ✅ issue isolada |
| **Medium** (`--feature`) | Feature clara, <10 issues, 1 sprint | — | ⚠️ | ✅ breve | ⚠️ inline | ✅ | ✅ sprint único |
| **Large** (`--feature-large`) | Multi-componente, 2-5 sprints | — | ✅ | ✅ completo | ✅ | ✅ | ✅ dual-agent |
| **Complex** (`--epic`) | Ambiguidade, domínio novo | ✅ | ✅ | ✅ + discuss | ✅ + research | ✅ | ✅ + UAT |

**Etapas de fechamento** (após o execute, quando há entrega real):

| Escopo | Verify | Secure | Ship |
|---|:-:|:-:|:-:|
| **Small** (`--quick`) | ⚠️ se user-facing | ⚠️ se toca auth/dados/input | ⚠️ se há remote |
| **Medium** (`--feature`) | ✅ se user-facing | ✅ | ✅ |
| **Large** (`--feature-large`) | ✅ | ✅ | ✅ |
| **Complex** (`--epic`) | ✅ | ✅ | ✅ |

**Legenda:** ✅ obrigatório · ⚠️ condicional/inline · — pulado

**Regras de skip:**
- **Specify e Execute são sempre obrigatórios** — você sempre precisa saber O QUÊ e fazer
- **Discover** só em projeto novo (Complex)
- **Init** pulado se o projeto já tem steering/ e Constitution.md configurados
- **Design inline** (dentro do Spec) quando a mudança é direta — sem decisões arquiteturais, sem padrões novos
- **Break pulado** quando ≤3 passos óbvios — viram steps inline no Execute
- **Discuss** é disparado dentro do Spec **apenas** quando o agente detecta gray areas críticas
- **Interactive UAT** é disparado dentro do Execute **apenas** para features user-facing com comportamento complexo

**Safety valve:** mesmo quando `/break` é pulado, `/execute` SEMPRE começa listando os passos atômicos inline. Se essa lista revelar >5 passos ou dependências complexas, PARE e force criar sprint/issues formais — o Break foi pulado por engano.

**Auto-detecção:** se o usuário não especificou escopo, infira pelo contexto. "mudar um texto" → Small. "nova feature em projeto existente" → Medium. "adicionar módulo de cobrança com Stripe" → Large. "construir o produto do zero" → Complex.

## Fluxo completo

```
/discover            → brief.md                                (Complex)
/init                → steering/ + Constitution.md +
                        STATE.md + DECISIONS.md + KNOWLEDGE.md  (Medium+)
/spec [new|feature]  → Spec.md com EARS (+ context.md)         (Medium+)
/break [spec]        → research.md + data-model.md + contracts/
                        + sprints/ + issues/ + PRD.md           (Large+)
                       ↑ consome spec OU backlog do PRD — sem
                         nenhum dos dois, o passo é /spec, não /break
/plan [issue|sprint] → issue enriquecida                       (todos)
/execute [sprint]    → orquestra: waves → implementer → validator
                        → reassess → milestone gate → PRD        (todos)
/verify [sprint]     → UAT resumível + cold-start smoke +
                        loop diagnose→fix→re-verify → uat         (user-facing)
/secure [sprint]     → gate de segurança (delega security-review)
                        → SECURITY do sprint                     (auth/dados/input)
/ship [sprint]       → preflight → push → PR com body rico       (quando há remote)
/build [issue]       → atalho: plan + execute (issue isolada)   (Small/Medium)
/pause               → snapshot em STATE.md para próxima sessão (qualquer hora)
/resume              → retoma a partir de STATE.md              (qualquer hora)
/autopilot [alvo]    → condutor: 1 sub-agente por etapa, modelo  (opt-in, Large+)
                        por etapa, para só em decisão humana
```

**Dois jeitos de rodar o mesmo fluxo:**
- **Manual (padrão):** cada modo termina no Bloco de Handoff; você dá `/clear` e cola o próximo comando. Você revisa entre etapas e controla o ritmo de consumo.
- **Autopilot (`/project-maker autopilot`, opt-in):** a sessão vira condutor e roda as etapas em sequência, cada uma num sub-agente com contexto limpo e o modelo/effort da etapa. Para só em decisão real (perguntas de spec, pacotes suspeitos, stuck, UAT, push/PR, escopo novo), concentradas em duas telas: início (T0) e pós-break (G1). Consome a janela de uso mais rápido — use quando o plano tiver folga. Ver `references/modes/autopilot.md`.

**Loop de fechamento (após o sprint passar no milestone gate):** `/verify` (se user-facing) → `/secure` (se toca segurança) → `/ship`. O `/ship` só cria o PR se o milestone gate passou, o `/verify` não tem gaps abertos e o `/secure` não tem ameaças abertas.

**Bloco de Handoff no fim de todo modo:** todo modo termina entregando o **comando completo do próximo passo**, com o path real resolvido do disco (`/project-maker execute docs/sprints/SPRINT-031-resposta-por-whatsapp.md`, nunca `[sprint]`), pronto pra copiar, mais a recomendação de modelo na mesma caixa. O usuário nunca precisa perguntar "qual o comando agora?". Ver regras **Next Command** e **Model Advisor** nas Harness Rules.

**Hierarquia de trabalho:**

```
Projeto → Sprint → Issue
```

- **Projeto** é o produto inteiro (definido em `PRD.md`, `Spec.md`, `steering/`).
- **Sprint** agrupa issues relacionadas com um Goal único e Success Criteria verificáveis.
- **Issue** é a unidade atômica de implementação. **Uma issue tem que caber em uma janela de contexto. Se não cabe, são duas issues.**

`/execute` roda um sprint por vez: para cada issue do sprint, dispara implementer → validator em loop até passar, e ao fim do sprint roda reassess + milestone gate.

**Artefatos persistentes (memory bank do projeto):**

Living docs — lidos no início, atualizados ao longo do trabalho (na raiz):
- `STATE.md` — estado volátil (sessão atual, blockers, todos, handoff) — alto churn
- `DECISIONS.md` — decisões arquiteturais append-only — nunca deletar, baixo churn
- `KNOWLEDGE.md` — patterns, anti-patterns, gotchas reusáveis — cross-sprint
- `PRD.md` — estado vivo do produto com rastreabilidade de issues

Steering (contexto do projeto, estável):
- `steering/product.md` — visão, usuários, propósito do produto
- `steering/structure.md` — estrutura de diretórios, organização, **localização dos artefatos**
- `steering/tech.md` — stack, versões
- `steering/architecture.md` — overview arquitetural, camadas, fluxos (Large/Complex)
- `steering/conventions.md` — naming, padrões de código, anti-padrões (Large/Complex)
- `steering/testing.md` — estratégia, comandos, coverage (Large/Complex)
- `steering/integrations.md` — APIs externas, webhooks, SDKs (Large/Complex)
- `steering/CONCERNS.md` — tech debt, áreas frágeis, gotchas (on-demand)
- `Constitution.md` — princípios não negociáveis (gerado no /init ou /spec new)

Feature/sprint/issue (paths conforme regra **Localização canônica**):
- `brief.md` — ideia inicial estruturada (gerado no /discover)
- `Spec.md` (projeto) ou `docs/specs/FEAT-NNN-[slug]/spec.md` (feature) — requisitos funcionais com acceptance criteria em EARS
- `context.md`, ao lado da spec — decisões do Discuss phase sobre gray areas (condicional)
- `docs/research.md` — pesquisa técnica pré-implementação (com Package Legitimacy Audit quando há pacotes)
- `docs/data-model.md` — entidades, schemas, relacionamentos
- `docs/contracts/` — especificações de API (endpoints, payloads, responses)
- `sprints/` — sprints com Goal, Success Criteria, Issues, Waves, Reassess Notes
- `issues/` — issues de execução geradas pelo /break
- `SPRINT-NNN-uat.md`, ao lado do sprint — script de UAT resumível (condicional, gerado no /verify ou /execute)
- `SPRINT-NNN-SECURITY.md`, ao lado do sprint — resultado do gate de segurança (condicional, gerado no /secure)

---

## Harness Rules (leitura obrigatória antes de qualquer modo)

Este skill segue princípios de **Harness Engineering**: o modelo é só a LLM; o harness é tudo o que fica em volta — instruções, estado em disco, sensores de verificação, regras de delegação. Cada regra abaixo existe porque a ausência dela já causou uma falha concreta; a razão vem junto.

### Living Docs — papéis separados

Três arquivos vivos com churn e propósito diferentes. **Não misturar conteúdo entre eles.**

| Arquivo | Churn | Propósito | Quando atualizar |
|---|---|---|---|
| **STATE.md** | Alto | Estado volátil da sessão — current issue, blockers ativos, todos, handoff note | Ao fim de `/execute`, em `/pause`, sempre que detectar blocker |
| **DECISIONS.md** | Baixo | Decisões arquiteturais com contexto/opções/razão/consequências. **Append-only — nunca deleta.** | Ao tomar decisão nova no /spec, /break, /execute. No reassess se uma decisão mudou. |
| **KNOWLEDGE.md** | Médio | Patterns validados, anti-patterns descobertos, gotchas, insights cross-sprint | Ao fim do sprint (reassess phase) quando aprendeu algo reusável |

**Regra:** blockers e lessons da sessão atual vão para STATE.md. Se um blocker revelou um pattern/anti-pattern reusável, ao resolver, mover o aprendizado para KNOWLEDGE.md. Se a solução envolveu uma decisão arquitetural, registrar também em DECISIONS.md.

### Localização canônica dos artefatos

Todo artefato tem um lugar único — duas sessões nunca podem criar o mesmo artefato em diretórios diferentes.

- **Raiz do projeto:** `STATE.md`, `DECISIONS.md`, `KNOWLEDGE.md`, `PRD.md`, `Constitution.md`, `brief.md`, `steering/`.
- **Specs:** a spec do projeto (`/spec new`) é `Spec.md` na raiz, com `context.md` ao lado. Cada feature (`/spec feature`) ganha uma pasta, `docs/specs/FEAT-NNN-[slug]/`, com `spec.md` e `context.md` dentro. Uma feature nova nunca sobrescreve `Spec.md` nem a spec de outra feature.
- **Sprints e issues ficam junto da spec que os gerou.** Spec em pasta de feature: `docs/specs/FEAT-NNN-[slug]/sprints/` e `docs/specs/FEAT-NNN-[slug]/issues/`. `Spec.md` da raiz, backlog do PRD ou spec de feature em arquivo solto (`docs/specs/FEAT-NNN-[slug].md`, layout anterior): `docs/sprints/` e `docs/issues/`. Os dois layouts convivem no mesmo projeto e artefato já gravado não muda de lugar: não migre projeto existente. O número do sprint é único no projeto inteiro (branch, commit e ledger usam ele). `python3 <skill-dir>/scripts/pm.py paths [spec]` devolve as duas pastas e os próximos números de SPRINT e FEAT: use a saída em vez de calcular.
- **`docs/` (padrão):** artefatos de planejamento do projeto — `docs/research.md`, `docs/data-model.md`, `docs/contracts/`.
- **Por sprint:** UAT e SECURITY ficam na mesma pasta do arquivo do sprint — `SPRINT-NNN-uat.md`, `SPRINT-NNN-SECURITY.md`. Em `--quick`, ao lado da issue.

**Convenção existente vence:** se o projeto já guarda esses artefatos em outro lugar, siga o que existe e registre a localização em `steering/structure.md` (o `/init` grava; os demais modos leem de lá). Em dúvida, `ls`/Glob antes de criar — **nunca crie um segundo diretório para um artefato que já existe**.

### Session Loading Order

Em **todo comando**, antes de executar qualquer passo:

1. Ler `STATE.md` (se existir) — estado da sessão, blockers, handoff notes
2. Ler `DECISIONS.md` (se existir) — contexto de decisões relevantes ao que vai fazer
3. Ler `KNOWLEDGE.md` (se existir) — patterns e gotchas aplicáveis
4. Ler `Constitution.md` e `steering/` (product, structure, tech) — base load
5. Ler `PRD.md` quando estiver planejando ou trabalhando em feature
6. Carregar `steering/CONCERNS.md` **apenas se** a feature/issue atual tocar um arquivo ou área listada nele
7. Carregar spec/sprint/issue/contract específico sob demanda — nunca preventivamente

**Ao fim de todo `/execute` e `/build`**: atualizar `STATE.md` com o que foi feito, blockers ativos, próximo passo, handoff note. Se tomou decisão arquitetural nova, append em `DECISIONS.md`. Se aprendeu algo reusável, append em `KNOWLEDGE.md`.

**`Next command` do STATE.md**: sempre que gravar `STATE.md`, escreva nos campos `Next command` e `Next model` **exatamente** o comando e o modelo emitidos no Bloco de Handoff — path real, copiável. É o que faz o comando sobreviver ao `/clear`: qualquer sessão nova (ou `/resume`) lê o campo e reemite o bloco sem redescobrir nada.

**`CLAUDE.md` do projeto:** já está no contexto de toda sessão e de todo sub-agent. `Constitution.md` e `steering/` não repetem o que está lá; em conflito, pergunte ao usuário qual vale e corrija o outro. O `/init` deixa no `CLAUDE.md` um ponteiro curto para os artefatos do workflow.

Se algum desses arquivos não existir ainda, criá-lo a partir do template correspondente em `references/` na primeira execução que encontrar um projeto inicializado.

### Context Loading Strategy

**Base load:** Constitution.md, steering/, STATE.md, PRD.md quando relevante.

**On-demand load:**
- `references/modes/[modo].md` — só o modo que vai executar agora
- `steering/CONCERNS.md` — só quando a issue toca área flagged
- A spec — só a da feature ativa
- `docs/data-model.md` + `docs/contracts/` — só quando planejando/implementando algo que envolve dados ou APIs
- `docs/research.md` — só no /plan e /execute da issue que depende dele
- Uma issue por vez

**Não carregue ao mesmo tempo:**
- Múltiplos specs de feature
- Todos os contracts de uma vez
- Issues de outros épicos
- Arquivos arquivados
- Arquivos de modo que não vão rodar nesta sessão

A maior parte da janela fica para trabalho, raciocínio e output. Você não mede tokens: a regra prática é carregar só o que a tarefa atual consome e passar **paths**, não conteúdo, para sub-agents.

### Knowledge Verification Chain

Quando for pesquisar, desenhar ou tomar qualquer decisão técnica, siga esta ordem:

1. **Codebase** — código existente e convenções já em uso
2. **Project docs** — README, docs/, comentários inline, steering/
3. **Context7 MCP** (se instalado) — resolver library ID e buscar API atual
4. **Web search** — docs oficiais, fontes reputadas, padrões da comunidade
5. **Flag como incerto** — "Não tenho certeza sobre X, aqui está meu raciocínio, mas verifique"

**Regras:**
- O passo 5 só vale quando 1-4 não resolveram, e sai marcado como incerto, não como fato.
- Não achou resposta: diga "não sei" ou "não achei documentação para isto". Uma API ou comportamento inventado contamina design, issues e implementação em cascata; incerteza declarada custa uma pergunta.

### Sub-Agent Delegation

Use sub-agents (Task tool ou equivalente) para manter o contexto do agente orquestrador enxuto e habilitar execução paralela. O orquestrador planeja e coordena; sub-agents fazem o trabalho pesado.

| Atividade | Delegar? | Razão |
|---|---|---|
| Research (design, brownfield mapping) | Sim | Output grande, só o resumo importa para o contexto principal |
| Implementar uma issue | Sim | File reads, edits e output de testes consomem contexto |
| Issues paralelas `[P]` | Sim (1 sub-agent por issue) | Única forma de paralelismo real |
| Issues sequenciais | Sim | Mantém artefatos de implementação fora do contexto principal |
| Planning, criação de tasks, validation reports | **Não** | Precisam do contexto acumulado para coerência |
| `/plan` de **sprint** (enriquecer N issues) | Sim (1 sub-agent por issue, em paralelo) | As issues são independentes depois da pesquisa externa única; o orquestrador confere colisões no fim |
| Tarefas em modo `--quick` | Não | Overhead não compensa |

**Despacho e espera.** A ferramenta Agent entrega o resultado por notificação; o agente pode estar em background mesmo sem você pedir.

1. Paralelismo = várias chamadas Agent na mesma mensagem.
2. Se o schema da sua ferramenta Agent tem `run_in_background`, passe `false`. Se não tem, não invente o parâmetro.
3. Espere a notificação de cada sub-agent antes de usar o resultado. Conte: N despachados, N recebidos. Não relate nem valide resultado que ainda não chegou.
4. Nenhum fechamento com filho pendente: o Bloco de Handoff e o `PM_STAGE_RESULT` só saem depois que todos voltaram. Encerrar o turno para aguardar a notificação é o caminho normal.
5. Filho que não volta: antes de dar por morto ou redespachar, olhe o disco (`git log`, `git status`) por alguns minutos. Se há commits ou arquivos mudando, ele está vivo. Ao desistir de um filho, pare-o (TaskStop, se disponível) — um agente abandonado continua gastando.

**Despacho explícito.** Toda chamada Agent do skill leva `model` e `effort` da tabela **Roteamento por etapa**, mesmo com agente registrado. Sem `model`, o agente genérico herda o modelo da sessão; sem `effort`, herda o de quem despachou. Padrão: `model: "sonnet"`, `effort: "high"`.

**Profundidade.** Cadeia máxima: sessão → sub-agent → sub-agent. No autopilot isso é condutor → agente de etapa → implementer/validator, então implementer, validator e os sub-agents do `/plan` não delegam: exploram direto com Grep/Glob/Read.

As sondas e versões por trás destas regras estão em `references/harness-notes.md`.

**Contexto mínimo que cada sub-agent recebe:**
- A definição específica da issue (Descrição, Cenários, Done when, Tests, Gate, Arquivos a criar/modificar, Padrões)
- Convenções relevantes (Constitution.md, steering/structure.md)
- CONCERNS.md se a issue tocar área flagged
- Spec/contract específicos referenciados pela issue

**NÃO recebe:** definição de outras issues, histórico acumulado da conversa, STATE.md completo, outros specs.

**O que o sub-agent retorna:**
- **Status**: Complete | Blocked | Partial
- **Files changed**: [lista]
- **Gate check result**: pass/fail + contagens
- **Spec Deviations**: [lista ou `none`]
- **Issues encontradas**: pontos de atrito

O orquestrador usa isso para atualizar STATE.md, PRD.md e decidir o próximo passo.

**Agentes registrados vs. prompt-colado:** os agentes de `references/agents/` têm frontmatter Claude Code (`name`, `tools`, `model`). Instalados em `.claude/agents/` do projeto (`/init` Passo 4), viram `subagent_type` nativo — restrição de tools por harness de verdade (`model` e `effort` vão na chamada — regra **Despacho explícito**). Não instalados, o fallback é ler o .md e usar como prompt de sub-agent genérico. Prefira sempre o registrado quando existir.

**Workflow tool (opt-in):** só com pedido explícito do usuário por orquestração multi-agente. Aí as waves do `/execute` podem rodar via `pipeline()` (implementer → validator por issue). Não use Workflow para o autopilot: na última sonda os agentes de workflow não tinham a ferramenta Agent.

**Agentes de etapa (autopilot):** `pm-stage-workhorse` e `pm-stage-reasoning` são opcionais. Como `model` e `effort` vão em toda chamada, a etapa roda igual com o agente registrado ou com `general-purpose`.

### Gate Check 0/1 (sensor externo)

Toda issue tem um campo `Gate` com um comando shell. Uma issue só fecha quando:

1. O **validator** rodou o comando do Gate ele mesmo (o resultado relatado pelo implementer é alegação, não evidência)
2. Obteve exit code **0**
3. Conferiu `git status` contra os `Files changed` declarados — arquivo alterado e não declarado reprova
4. O resultado foi registrado no `Summary` da issue

Se o Gate falhar:
- Tentar corrigir e rodar de novo
- Máximo **3 tentativas** por issue
- Se falhar 3x: parar, registrar como blocker em `STATE.md` com o erro + última hipótese, pedir intervenção humana. **Nunca fabricar um "pass".**

### Skill Integrations

Antes de uma tarefa da tabela, veja se o skill complementar está instalado e delegue; senão siga com o fallback. Recomende instalação no máximo uma vez por sessão.

| Tarefa | Preferido (se instalado) | Fallback |
|---|---|---|
| Pesquisa na web | `firecrawl` | WebSearch / WebFetch |
| Docs de libs atualizados | `Context7` MCP | Web search |
| Exploração de codebase | agente `code-explorer` (feature-dev) | agente nativo `Explore` + Grep/Glob |
| Diagramas | `mermaid-studio` | mermaid inline em markdown |
| Review de segurança | `security-review` | checklist do `references/security-template.md` |
| Review do diff antes do PR | `code-review` | validator por issue |

### Model Advisor — modelo e effort por etapa

Padrão do skill: **Sonnet · effort high em todas as etapas** (perfil `balanced`). O skill usa os aliases `sonnet`, `opus` e `fable`, que o Claude Code resolve para a versão mais recente. As medições, o custo por etapa, a escolha de perfil e os **limites do benchmark** (um fixture, uma run por célula, sem controle "sem skill") estão em `references/model-advisor.md` — leia antes de justificar uma recomendação com número.

#### Roteamento por etapa

Células = `modelo · effort`. No autopilot o condutor passa `model` e `effort` da célula em toda chamada (regra **Despacho explícito**).

| Etapa | econ | balanced (padrão) | max |
|---|---|---|---|
| discover, spec, plan, verify, secure, ship | Sonnet · high | Sonnet · high | Sonnet · high |
| init | Sonnet · high | Sonnet · high | Opus · xhigh |
| break | Sonnet · high | Sonnet · high | Fable · high |
| execute (orquestrador, implementers, validator) | Sonnet · high | Sonnet · high | Sonnet · high |
| issue com `Model hint: Opus/Fable` | Sonnet (não escala) | Opus · high | Fable · high |
| 3ª tentativa de uma issue (escalada por falha) | um degrau acima | um degrau acima | um degrau acima |
| **Autopilot:** `max_stages` por run | 12 | 30 | 60 |
| **Autopilot:** freio da janela de 5h | 60% | 80% | 90% |

Escalada: `sonnet` → `opus` → `fable`, só na 3ª tentativa do loop de correção (`/execute` 2.4). A escalada por hint e por falha não foram medidas: são seguro barato, não resultado.

Perfil (`econ | balanced | max`) não é o effort do Claude Code. Ele define o modelo/effort de cada etapa, se issue com hint escala, e os freios de consumo do autopilot. No autopilot vem de `--profile` ou da tela T0; no manual, a linha **Modelo:** do handoff segue o `balanced`.

Não use Haiku em etapa que decide ou escreve código (na medição com o 4.5 ele marcou `Done when` como cumprido sem código existir), nem Opus em xhigh como padrão (2–3× o custo sem ganho consistente).

**Model Routing dentro do `/execute`:** issue com `Model hint: Opus/Fable` é despachada com o `model` da linha correspondente; as demais saem com `model: "sonnet"`. Toda chamada leva `model` e `effort`; o valor por chamada vence o frontmatter do agente registrado.

**Onde a recomendação aparece:** no manual, na linha `**Modelo:**` do Bloco de Handoff (formato: `**Modelo:** Sonnet · effort high (\`/model sonnet\`)`). No autopilot, o condutor roteia pela tabela. É recomendação: uma linha, sem repetir se o usuário já escolheu. Se ele perguntar "qual modelo rodar?", responda pela tabela para o modo atual, com o effort.

### Next Command — todo modo termina com o comando completo

Todo modo termina emitindo o **Bloco de Handoff**, como última coisa da resposta. Se o usuário precisou perguntar "qual o comando agora?", o modo anterior falhou.

Formato (fixo):

````
**▶ Próximo passo** — `/clear` primeiro, depois:

```
/project-maker execute docs/sprints/SPRINT-031-resposta-por-whatsapp.md
```

**Modelo:** Sonnet — o orquestrador só despacha sub-agents.
**Ressalva:** issues 133/134/135 têm `Model hint: Opus/Fable` — roteadas automaticamente.
**Depois:** `/verify` → `/secure` → `/ship`.
````

**Sensor antes de emitir.** Depois de gravar `Next command` no `STATE.md`, rode `python3 <skill-dir>/scripts/pm.py next`. Exit 0 imprime o comando validado (sem placeholder, paths existem, alvo presente) — é esse texto que vai no bloco. Exit 1 diz o que está errado em uma linha: corrija o `STATE.md` e rode de novo. `pm.py status` lista sprints, issues, UAT e SECURITY do disco quando você precisar decidir qual é o próximo passo. Sem `python3`, confira à mão pelas regras abaixo.

Regras do bloco:

1. **Caminho real, resolvido do disco**, como o artefato foi gravado (`docs/sprints/…` se caiu lá). Placeholder (`[slug]`, `NNN`, `...`) no comando final é bug — o `pm.py next` reprova.
2. **O comando vai sozinho num bloco de código**, uma linha, pronto pra copiar. Sem prosa dentro do bloco, sem `$`, sem comentário.
3. **Um comando primário.** Se existe alternativa legítima (ex.: pular `/verify` porque não é user-facing), liste no máximo **2** extras abaixo, rotuladas, cada uma com o comando completo — nunca uma descrição do comando.
4. **Emita sempre, inclusive quando o modo bloqueou.** Milestone gate reprovou, threats abertas, blocker ativo → o comando do bloco é o de **recuperação** (ex.: `/project-maker execute` nas issues de fix), não o do próximo estágio.
5. **`/clear` só quando muda de sessão.** Modos que continuam na mesma sessão (`/build`, `--quick` encadeado, `/resume`) omitem a linha do clear.
6. **Modelo entra no mesmo bloco.** A recomendação do Model Advisor é a linha `**Modelo:**` — não é uma seção separada nem um parágrafo antes.
7. **Máx. 4 linhas de prosa** (Modelo, Ressalva, Depois, e no máximo uma nota). Bloco é operacional, não relatório. Ressalva só existe se houver `Model hint` fora do padrão.
8. **Trigger explícito:** se o usuário perguntar "qual o comando?" / "e agora?" a qualquer momento, responda com o Bloco de Handoff do estado atual — leia STATE.md se precisar resolver o path.
9. **O comando tem que ser executável agora.** O artefato que o modo seguinte consome (`/break`: spec ou backlog; `/execute`: sprint/issue; `/verify`, `/secure`, `/ship`: sprint) tem que existir neste momento. Se não existe, o comando primário é o que **cria** o artefato — `/project-maker spec feature "[nome]"` em vez de `/break` sem spec nem backlog.
10. **Modo que aceita alvo sai com o alvo preenchido.** Comando sem argumento só quando o projeto tem exatamente um candidato no disco.
11. **Com `--autopilot`, o bloco não vai para a tela.** O comando continua sendo resolvido com as mesmas regras e gravado no `STATE.md`, mas a resposta final do agente de etapa é o `PM_STAGE_RESULT` (regra **Stage Contract**) — o condutor lê o `next` dele.

### Stage Contract (`--autopilot`)

Quando um modo recebe a flag `--autopilot`, ele está rodando **dentro de um agente de etapa** do `/project-maker autopilot`, sem acesso ao humano. Leia `references/autopilot/stage-contract.md` e aplique, por cima das regras do modo:

1. Toda instrução de perguntar/confirmar vira **decisão** no bloco `PM_STAGE_RESULT`, com o estado parcial persistido em disco antes.
2. Baixo risco: assuma e marque `[AUTOPILOT-ASSUMED: …]`. Alto risco (data-model, contracts, Constitution, auth/dados/pagamento, pacote não `[OK]`, custo externo, escopo novo): nunca assuma.
3. Drene antes de parar: termine o que não depende da decisão.
4. Nunca push, PR, merge, `--force`, `reset --hard`, `clean -f`, `stash`, deploy, nem pedir segredo — isso é do condutor (lista canônica na regra 5 do `stage-contract.md`; o `scripts/pm-guard.sh` opcional bloqueia no harness).
5. `Next command`/`Next model` continuam indo para o STATE.md; a resposta final é **só** o bloco `PM_STAGE_RESULT` (sem Bloco de Handoff em prosa).

Sem a flag, nada disso se aplica — o modo roda como sempre.

### Stuck Detection

Se durante `/execute` o validator reprovar a mesma issue **3 vezes seguidas**, ou o implementer tentar a mesma fix **2 vezes** sem progresso:

1. **Pare o loop imediatamente.** Não tente uma 4ª/3ª vez. (A 3ª tentativa do validator já rodou um degrau de modelo acima — regra **Escalada por falha** do `/execute` 2.4.)
2. Escreva diagnóstico em `STATE.md` → `Blockers` contendo:
   - Issue afetada
   - Padrão detectado (ex: "validator sempre reprova por stub detectado em `service.ts`")
   - Últimas 3 tentativas (ou 2) com os Gaps do validator
   - Hipótese do agente do que está errado
3. Marque issue como `⏸ blocked` no PRD.md e no sprint
4. Peça intervenção humana com contexto explícito: "Estou stuck nesta issue, aqui está o padrão, o que você quer fazer?"

**Nunca** continue tentando com variações menores. Loops infinitos consomem tokens e mascaram problemas de design que só o humano pode resolver.

### Spec Deviations (auto-report)

Se durante a implementação você fizer qualquer coisa diferente do que está na Spec ou no plano da issue — escolheu outra lib, criou um arquivo extra, mudou a assinatura de uma API, adicionou uma dependência — é **obrigatório** registrar em `## Spec Deviations` do Summary da issue:

- O que foi feito diferente
- Por quê (razão técnica concreta)
- Impacto (afeta outras issues? contracts? data-model?)

Se nada divergiu, escrever `none` explicitamente. Este campo vira input obrigatório do validator e ajuda o reassess phase a atualizar o plano à luz do que foi realmente aprendido.

### Package Legitimacy Gate (defesa anti-slopsquatting)

Modelos **alucinam nomes de pacote** — pesquisa de 2025 documenta ~20% das referências de pacote geradas por IA como nomes que não existem, e atacantes registram esses nomes alucinados de propósito (*slopsquatting*). Um nome alucinado que passa no `npm view` *parece* legítimo: o registry só prova que alguém registrou o nome, não que o pacote faz o que a IA disse.

**Toda recomendação de pacote externo (npm/pip/cargo/etc.) passa por tags de legitimidade.** O `/break` gera a tabela `## Package Legitimacy Audit` em `docs/research.md`; o `/execute` respeita as tags antes de instalar.

| Tag | Significa | Ação |
|---|---|---|
| `[OK]` | Verificado direto no registry: existe, downloads consistentes, repo-fonte real, mantido | Instala normalmente |
| `[SUS]` | Suspeito: recém-registrado, poucos downloads, sem repo, nome colado a um pacote popular | **Checkpoint humano** antes de instalar — link do registry + o que checar |
| `[ASSUMED]` | Veio de WebSearch, não verificado direto no registry | **Checkpoint humano** — `npm view`/`pip index`/link e confirmação |
| `[SLOP]` | Não existe / alta confiança de alucinação ou registro malicioso | **Proibido.** Não instala, não substitui em silêncio |

**Regras de ferro:**
- Verificação preferida: `npm view <pkg>` / `pip index versions <pkg>` / página `npmjs.com|pypi.org|crates.io`.
- Pacote de WebSearch é **sempre** `[ASSUMED]`, mesmo que `npm view` funcione — registro ≠ legitimidade.
- Em `[SLOP]`: pare e reporte. **Nunca** invente outro nome de pacote para "resolver" — isso só troca uma alucinação por outra. Peça direção humana.
- Sem ferramenta de verificação disponível? Trate **todo** pacote como `[ASSUMED]` (checkpoint em cada install). Mais estrito de propósito.

### Nyquist — todo critério tem um sensor

Todo critério de `Done when` precisa de um **teste automático que o prova**. Se o teste ainda não existe, criar o teste é a **primeira sub-task** (Wave 0 da issue), antes de implementar. Critério sem sensor não é verificável — e "não verificável" colapsa em "fabricável".

- O campo `Tests` da issue lista os sensores. Sensor faltante = `MISSING — criar primeiro`.
- O campo `Gate` (sensor 0/1) roda esses testes. Gate sem teste real por trás = gate teatral.
- **Red proof:** teste criado na issue tem que ser visto falhando antes da implementação; o implementer devolve o comando e a linha de falha. Teste que nunca falhou não prova nada — pode passar com a função vazia.
- Automation-first: se o agente **pode** verificar via CLI/API, **deve** — checkpoint humano confirma *depois* da automação, nunca a substitui. Vale para o `/verify`: o que um navegador automatizado consegue conferir não vira pergunta ao usuário.

### Parallel Write Safety (waves)

Quando issues `[P]` rodam em paralelo na mesma wave (ver `/execute`):
- **Só o orquestrador escreve** em `STATE.md`, `PRD.md`, `DECISIONS.md`, `KNOWLEDGE.md`. Sub-agents **retornam** o que mudou; o orquestrador serializa as escritas. Sub-agent nunca edita living docs direto (evita race read-modify-write).
- Issues da mesma wave **não podem tocar os mesmos arquivos de código**. Se colidem, vão para waves diferentes ou viram uma issue só.
- **Sub-agent não commita** quando divide a árvore com outros: o orquestrador commita cada issue depois do `pass` do validator, com `git add` só dos `Files changed` dela (1 commit por issue). O validator recebe o diff restrito a esses paths.
- Exceção: implementer em worktree isolada (opt-in, `/execute` 2.2) commita no próprio worktree e o orquestrador traz o commit para o branch do sprint.

---

## Modos — carregamento on-demand

Detecte o modo pelo argumento recebido (`$ARGUMENTS`). Se não houver argumento, pergunte qual etapa o usuário quer executar, a escala do problema, e explique o fluxo acima.

**Os passos completos de cada modo vivem em `references/modes/` — não aqui. Antes de executar qualquer modo, leia o arquivo correspondente. Não execute um modo de memória.**

| Modo | Instruções | Também carrega |
|---|---|---|
| `/discover` | `references/modes/discover.md` | `references/brief-template.md` |
| `/init` | `references/modes/init.md` | templates de state/decisions/knowledge/concerns |
| `/spec` | `references/modes/spec.md` | `references/spec-template.md` (+ context-template no Discuss) |
| `/break` | `references/modes/break.md` | `references/issue-template.md`, `references/sprint-template.md` |
| `/plan` | `references/modes/plan.md` | — |
| `/execute` | `references/modes/execute.md` | `references/agents/` (no fallback sem agentes registrados) |
| pergunta sobre modelo, custo ou perfil | — | `references/model-advisor.md` |
| `/verify` | `references/modes/verify.md` | `references/uat-template.md` |
| `/secure` | `references/modes/secure.md` | `references/security-template.md` |
| `/ship` | `references/modes/ship.md` | `references/pr-body-template.md` |
| `/build` | `references/modes/build.md` | `plan.md` + `execute.md` (roda os dois) |
| `/pause` | `references/modes/pause.md` | — |
| `/resume` | `references/modes/resume.md` | — |
| `/autopilot` | `references/modes/autopilot.md` | `references/autopilot/stage-contract.md`, `references/autopilot/ledger-template.md` (não carrega os outros modos) |
| qualquer modo com `--autopilot` | o arquivo do modo | `references/autopilot/stage-contract.md` (regra **Stage Contract**) |

---

## Referências

Modos (passos completos, carregados on-demand):
- `references/modes/` — um arquivo por modo: discover, init, spec, break, plan, execute, verify, secure, ship, build, pause, resume, autopilot

Sensores e notas:
- `scripts/pm.py` — sensores determinísticos: `next` (valida o Next command), `status`, `coverage` (REQ → issue), `waves` (colisão de arquivo), `paths` (onde gravar sprints e issues de uma spec)
- `references/model-advisor.md` — medições do benchmark, custo por etapa, escolha de perfil e limites do que foi medido
- `references/harness-notes.md` — sondas de comportamento do harness por versão e lições de runs reais

Autopilot:
- `references/autopilot/stage-contract.md` — contrato dos agentes de etapa (`--autopilot`) e o bloco `PM_STAGE_RESULT`
- `references/autopilot/ledger-template.md` — formato do `.pm-autopilot/ledger.md` do condutor
- `references/autopilot/hooks.md` — hooks opt-in (guard de push/PR) e setup de permissões para runs longos
- `scripts/pm-guard.sh` — hook PreToolUse que bloqueia push/PR/deploy/destrutivos em sub-agentes durante um run
- `scripts/pm-pre-push.sh` — hook git `pre-push`: durante um run, só o push do condutor passa (pega o que o guard não vê)

Templates de artefatos: `references/*-template.md` (brief, spec, context, sprint, issue, uat, security, pr-body, state, decisions, knowledge, concerns). A tabela de modos acima diz qual modo lê qual.

Agentes:
- `references/agents/` — agentes especializados com frontmatter Claude Code; o /init Passo 4 os instala em `.claude/agents/` do projeto (subagent_type nativo); fallback: ler como prompt no /execute
- `references/agents/validator.md` — agente de validação independente (usado no loop do /execute; sem Write/Edit no frontmatter)
- `references/agents/pm-stage-reasoning.md`, `pm-stage-workhorse.md` — agentes de etapa do autopilot (model + effort no frontmatter)

Evals:
- `evals/scenarios.md` — cenários de teste do próprio skill (triggering, handoff, auto-sizing)
- `scripts/test-pm.sh`, `scripts/test-pm-guard.sh` — suítes dos sensores e do guard (rodam no CI)
