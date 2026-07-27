---
name: project-maker
author: Renato de Paula Cardoso <renato@renatodpaula.com.br>
homepage: https://github.com/renatodpaula/project-maker
instagram: https://instagram.com/renatodpaula.ai
license: MIT
description: |
  Workflow Spec-Driven Development para criar projetos ou adicionar features com IA de forma estruturada.
  Use este skill quando o usuário quiser organizar uma ideia de projeto, fazer brainstorming, criar um
  projeto do zero, planejar uma nova feature, quebrar uma spec em tarefas, pesquisar e planejar uma
  issue, ou executar uma implementação. Sempre use antes de começar qualquer projeto ou feature nova.
  Triggers explícitos: "criar projeto", "nova feature", "quero construir algo", "organizar minha ideia",
  "brainstorming de projeto", "planejar implementação", "quebrar em issues", "implementar issue",
  "validar feature", "testar feature", "revisar segurança", "criar PR", "abrir pull request",
  "qual modelo rodar", "recomendar modelo", "que modelo uso",
  "qual o próximo passo do projeto", "qual o próximo passo do sprint", "qual o comando do próximo passo",
  "como continuo o sprint", "como continuo o projeto",
  "/discover", "/init", "/spec", "/break", "/plan", "/execute", "/verify", "/secure", "/ship", "/build".
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
/break               → research.md + data-model.md + contracts/
                        + sprints/ + issues/ + PRD.md           (Large+)
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
```

**Loop de fechamento (após o sprint passar no milestone gate):** `/verify` (se user-facing) → `/secure` (se toca segurança) → `/ship`. O `/ship` só cria o PR se o milestone gate passou, o `/verify` não tem gaps abertos e o `/secure` não tem ameaças abertas.

**Bloco de Handoff no fim de todo modo:** todo modo termina entregando o **comando completo do próximo passo**, com o path real resolvido do disco (`/project-maker execute docs/sprints/SPRINT-031-resposta-por-whatsapp.md`, nunca `[sprint]`), pronto pra copiar, mais a recomendação de modelo na mesma caixa. O usuário nunca precisa perguntar "qual o comando agora?". Ver regras **Next Command** e **Model Advisor** nas Harness Rules.

**Hierarquia de trabalho (regra de ferro):**

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
- `Spec.md` — requisitos funcionais com acceptance criteria em EARS
- `context.md` — decisões do Discuss phase sobre gray areas (condicional)
- `docs/research.md` — pesquisa técnica pré-implementação (com Package Legitimacy Audit quando há pacotes)
- `docs/data-model.md` — entidades, schemas, relacionamentos
- `docs/contracts/` — especificações de API (endpoints, payloads, responses)
- `docs/sprints/` — sprints com Goal, Success Criteria, Issues, Waves, Reassess Notes
- `docs/issues/` — issues de execução geradas pelo /break
- `docs/sprints/SPRINT-NNN-uat.md` — script de UAT resumível (condicional, gerado no /verify ou /execute)
- `docs/sprints/SPRINT-NNN-SECURITY.md` — resultado do gate de segurança (condicional, gerado no /secure)

---

## Harness Rules (leitura obrigatória antes de qualquer modo)

Este skill segue princípios de **Harness Engineering**: o modelo é só a LLM; o harness é tudo o que fica em volta — instruções, estado em disco, sensores de verificação, regras de delegação. As regras abaixo são inegociáveis.

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

- **Raiz do projeto:** `STATE.md`, `DECISIONS.md`, `KNOWLEDGE.md`, `PRD.md`, `Spec.md`, `Constitution.md`, `brief.md`, `context.md`, `steering/`.
- **`docs/` (padrão):** artefatos de planejamento — `docs/research.md`, `docs/data-model.md`, `docs/contracts/`, `docs/sprints/`, `docs/issues/`.
- **Por sprint:** UAT e SECURITY acompanham o sprint — `docs/sprints/SPRINT-NNN-uat.md`, `docs/sprints/SPRINT-NNN-SECURITY.md`. Em `--quick`, ao lado da issue.

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

Se algum desses arquivos não existir ainda, criá-lo a partir do template correspondente em `references/` na primeira execução que encontrar um projeto inicializado.

### Context Loading Strategy

**Base load (~15k tokens):** Constitution.md, steering/, STATE.md, PRD.md quando relevante.

**On-demand load:**
- `references/modes/[modo].md` — só o modo que vai executar agora
- `steering/CONCERNS.md` — só quando a issue toca área flagged
- `Spec.md` — só da feature ativa
- `docs/data-model.md` + `docs/contracts/` — só quando planejando/implementando algo que envolve dados ou APIs
- `docs/research.md` — só no /plan e /execute da issue que depende dele
- Uma issue por vez

**Never load simultaneously:**
- Múltiplos specs de feature
- Todos os contracts de uma vez
- Issues de outros épicos
- Arquivos arquivados
- Arquivos de modo que não vão rodar nesta sessão

**Target:** <40k tokens de contexto ativo. **Reserva:** 160k+ para trabalho, raciocínio e output. Se passar de 40k, priorize descarregar docs que não são mais necessárias para a task atual.

### Knowledge Verification Chain

Quando for pesquisar, desenhar ou tomar qualquer decisão técnica, siga esta ordem estrita. **Nunca pule passos.**

1. **Codebase** — código existente e convenções já em uso
2. **Project docs** — README, docs/, comentários inline, steering/
3. **Context7 MCP** (se instalado) — resolver library ID e buscar API atual
4. **Web search** — docs oficiais, fontes reputadas, padrões da comunidade
5. **Flag como incerto** — "Não tenho certeza sobre X, aqui está meu raciocínio, mas verifique"

**Regras:**
- Nunca pular para o passo 5 se 1-4 estão disponíveis
- Passo 5 é SEMPRE flageado como incerto, nunca apresentado como fato
- **NEVER assume or fabricate.** Se não encontrou uma resposta, diga "não sei" ou "não achei documentação para isto". Inventar APIs, padrões ou comportamentos causa cascata de falhas no design → tasks → implementação. **Incerteza é sempre preferível a fabricação.**

### Sub-Agent Delegation

Use sub-agents (Task tool ou equivalente) para manter o contexto do agente orquestrador enxuto e habilitar execução paralela. O orquestrador planeja e coordena; sub-agents fazem o trabalho pesado.

| Atividade | Delegar? | Razão |
|---|---|---|
| Research (design, brownfield mapping) | Sim | Output grande, só o resumo importa para o contexto principal |
| Implementar uma issue | Sim | File reads, edits e output de testes consomem contexto |
| Issues paralelas `[P]` | Sim (1 sub-agent por issue) | Única forma de paralelismo real |
| Issues sequenciais | Sim | Mantém artefatos de implementação fora do contexto principal |
| Planning, criação de tasks, validation reports | **Não** | Precisam do contexto acumulado para coerência |
| Tarefas em modo `--quick` | Não | Overhead não compensa |

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

**Agentes registrados vs. prompt-colado:** os agentes de `references/agents/` têm frontmatter Claude Code (`name`, `tools`, `model`). Instalados em `.claude/agents/` do projeto (`/init` Passo 4), viram `subagent_type` nativo — restrição de tools por harness e model default de verdade. Não instalados, o fallback é ler o .md e usar como prompt de sub-agent genérico. Prefira sempre o registrado quando existir.

**Workflow tool (opt-in):** se a sessão tem o Workflow tool e o usuário **pediu explicitamente** orquestração multi-agente (ex: "ultracode", "use um workflow"), as waves do `/execute` podem rodar via `pipeline()` (implementer → validator por issue, sem barrier entre issues). Nunca use Workflow sem esse opt-in — o Agent tool comum cobre o caso padrão.

### Gate Check 0/1 (sensor externo)

Toda issue tem um campo `Gate` com um comando shell. O agente **NUNCA** pode marcar uma issue como done sem:

1. Rodar o comando do Gate
2. Obter exit code **0**
3. Registrar o resultado no `Summary` da issue

Se o Gate falhar:
- Tentar corrigir e rodar de novo
- Máximo **3 tentativas** por issue
- Se falhar 3x: parar, registrar como blocker em `STATE.md` com o erro + última hipótese, pedir intervenção humana. **Nunca fabricar um "pass".**

### Skill Integrations

Este skill coexiste com outros skills instalados no ambiente. Antes de tarefas específicas, **sempre cheque se um skill complementar está instalado** e delegue quando disponível. Mostre recomendação de instalação no máximo **1x por sessão** para não virar ruído.

| Tarefa | Skill preferido (se instalado) | Fallback |
|---|---|---|
| Pesquisa na web, scraping, research | `firecrawl` / `firecrawl-search` / `firecrawl-scrape` | WebSearch / WebFetch |
| Docs de libs atualizados | `Context7` MCP | Web search |
| Exploração de codebase | `codenavi` | agente `code-explorer` + Grep/Glob |
| Diagramas (arquitetura, fluxo, ER) | `mermaid-studio` | mermaid inline em markdown |
| Review de segurança | `security-review` | validator + checklist manual |
| Quando trabalhar com plano explicitamente | `claude-mem:make-plan` + `claude-mem:do` | execução direta |

Checar disponibilidade é barato — se o skill não está instalado, só continue com o fallback. Se o usuário parecer experiente ou já tiver acusado recebimento, pule a recomendação.

### Model Advisor — recomendar modelo antes de cada etapa

Cada modo tem um **perfil de trabalho** diferente — divergência/raciocínio vs. execução mecânica. Rodar o modelo certo economiza custo sem perder qualidade, e sobe qualidade onde ela importa. **Antes de instruir o usuário a abrir uma sessão nova (`/clear` + próximo modo), emita uma recomendação de modelo para a próxima etapa.** Emita também no Passo 0 de `/execute` (para a sessão que já está rodando).

**Por que aqui e não no meio:** trocar de modelo custa uma sessão nova. A recomendação tem que sair **no handoff** — quando o usuário está prestes a `/clear` — para ele já abrir a próxima sessão no modelo certo.

Perfis (nomes atuais como **referência** — use os modelos disponíveis na sessão; o princípio importa mais que a versão exata):

| Tier | Modelos atuais | Sweet spot |
|---|---|---|
| **Raciocínio pesado** | Opus 4.8, Fable 5 | Decisões arquiteturais, trade-offs ambíguos, **prompt-engineering** (system prompts, agentes, DSLs), domínio novo, debugging difícil |
| **Balanceado (workhorse)** | Sonnet 5 | Implementação de issues bem-especificadas, refactors mecânicos, escrita de testes — o grosso do `/execute` |
| **Rápido/barato** | Haiku 4.5 | Edits triviais, lookups, formatação, tarefas de 1-2 arquivos sem raciocínio |

Heurística por modo:

| Modo | Recomendação padrão | Razão |
|---|---|---|
| `/discover`, `/spec` | **Raciocínio** (Opus/Fable) | Ambiguidade alta + captura de requisitos; poucos tokens, mas define tudo downstream |
| `/break` | **Raciocínio** (Opus/Fable) | Pesquisa + decomposição + design de issues é raciocínio puro |
| `/plan` | **Sonnet** | Enriquece uma issue; sobe para Opus/Fable se a issue for arquiteturalmente carregada |
| `/execute` | **Sonnet** (workhorse) | Issues bem-especificadas. **Exceção:** issues com `Model hint` ≠ Sonnet rodam em Opus/Fable — só elas |
| `/verify`, `/secure` | **Sonnet** | Sobe para Opus se a superfície de segurança for crítica |
| `/ship` | **Sonnet/Haiku** | Mecânico |

**Exceção por issue (a ressalva que importa):** issues **prompt-engineering-heavy** (escrever system prompts, projetar agentes/DSLs) ou **raciocínio-heavy** (algoritmo core, decisão arquitetural embutida) merecem tier de raciocínio **mesmo dentro do `/execute`**. Essa sinalização vem do campo `Model hint` que o `/break` grava em cada issue. No handoff para `/execute` (e no Passo 0), leia os hints e cite explicitamente quais issues fogem do padrão.

Formato da recomendação (curto, 1-3 linhas, acionável — nunca um ensaio):
> **Modelo:** abra `/break` em **Fable 5** (ou Opus). Troque para **Sonnet** no `/execute`.
> **Ressalva:** issues R14/R15 (Cluster Creator, Script Engine) são prompt-engineering pesado — mesmo no `/execute`, considere Opus/Fable só nelas. Resto do execute: Sonnet.

**Model Routing automático (dentro do `/execute`):** o Agent tool aceita override de `model` por chamada. Se o harness da sessão suporta isso, a ressalva por issue deixa de ser aviso e vira roteamento: o orquestrador roda em Sonnet e despacha sub-agents com o modelo do `Model hint` da issue — `Opus/Fable` → `model: opus`, padrão → herda a sessão. **O override por chamada vence o `model:` do frontmatter do agente registrado** — passar `model: opus` num agente com `model: sonnet` funciona. O usuário não precisa trocar de modelo no meio do sprint. A recomendação de sessão continua valendo para o **orquestrador** e para modos sem sub-agents (`/spec`, `/break`).

Regras:
- **Recomende, não force.** Uma nota curta no fim do modo. Se o usuário já escolheu um modelo ou pediu para pular, não repita.
- Cite a ressalva por issue **só se** existir issue com `Model hint` ≠ padrão. Sem hints especiais, uma linha basta.
- Nomes de modelo mudam — não hardcode versões antigas. Ancore no **tier** (raciocínio/workhorse/rápido) e nomeie os modelos atuais da sessão.
- Trigger explícito: se o usuário perguntar "qual modelo rodar?" a qualquer momento, aplique esta heurística para o modo atual/próximo e responda direto.

### Next Command — todo modo termina com o comando completo

**Regra dura:** nenhum modo termina sem emitir o **Bloco de Handoff**. Se o usuário precisou perguntar "qual o comando agora?", o modo anterior falhou. O bloco é a **última coisa** da resposta — depois dele não vem mais nada.

Formato (fixo):

````
**▶ Próximo passo** — `/clear` primeiro, depois:

```
/project-maker execute docs/sprints/SPRINT-031-resposta-por-whatsapp.md
```

**Modelo:** Sonnet 5 — o orquestrador só despacha sub-agents.
**Ressalva:** issues 133/134/135 têm `Model hint: Opus/Fable` — roteadas automaticamente.
**Depois:** `/verify` → `/secure` → `/ship`.
````

Regras do bloco:

1. **Caminho real, resolvido do disco.** Nunca emita placeholder — `[slug]`, `NNN`, `[caminho-da-issue]`, `...` no comando final é bug. Use o path exato como o artefato foi gravado, com o diretório real (`docs/sprints/…` se caiu lá, não `sprints/…`). Em dúvida, liste o diretório (`ls`/Glob) **antes** de emitir.
2. **O comando vai sozinho num bloco de código**, uma linha, pronto pra copiar. Sem prosa dentro do bloco, sem `$`, sem comentário.
3. **Um comando primário.** Se existe alternativa legítima (ex.: pular `/verify` porque não é user-facing), liste no máximo **2** extras abaixo, rotuladas, cada uma com o comando completo — nunca uma descrição do comando.
4. **Emita sempre, inclusive quando o modo bloqueou.** Milestone gate reprovou, threats abertas, blocker ativo → o comando do bloco é o de **recuperação** (ex.: `/project-maker execute` nas issues de fix), não o do próximo estágio.
5. **`/clear` só quando muda de sessão.** Modos que continuam na mesma sessão (`/build`, `--quick` encadeado, `/resume`) omitem a linha do clear.
6. **Modelo entra no mesmo bloco.** A recomendação do Model Advisor é a linha `**Modelo:**` — não é uma seção separada nem um parágrafo antes.
7. **Máx. 4 linhas de prosa** (Modelo, Ressalva, Depois, e no máximo uma nota). Bloco é operacional, não relatório. Ressalva só existe se houver `Model hint` fora do padrão.
8. **Trigger explícito:** se o usuário perguntar "qual o comando?" / "e agora?" a qualquer momento, responda com o Bloco de Handoff do estado atual — leia STATE.md se precisar resolver o path.

### Stuck Detection

Se durante `/execute` o validator reprovar a mesma issue **3 vezes seguidas**, ou o implementer tentar a mesma fix **2 vezes** sem progresso:

1. **Pare o loop imediatamente.** Não tente uma 4ª/3ª vez.
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
- Automation-first: se o agente **pode** verificar via CLI/API, **deve** — checkpoint humano confirma *depois* da automação, nunca a substitui.

### Parallel Write Safety (waves)

Quando issues `[P]` rodam em paralelo na mesma wave (ver `/execute`):
- **Só o orquestrador escreve** em `STATE.md`, `PRD.md`, `DECISIONS.md`, `KNOWLEDGE.md`. Sub-agents **retornam** o que mudou; o orquestrador serializa as escritas. Sub-agent nunca edita living docs direto (evita race read-modify-write).
- Issues da mesma wave **não podem tocar os mesmos arquivos de código**. Se colidem, vão para waves diferentes ou viram uma issue só.
- Cada sub-agent commita só os arquivos da sua issue.

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
| `/verify` | `references/modes/verify.md` | `references/uat-template.md` |
| `/secure` | `references/modes/secure.md` | `references/security-template.md` |
| `/ship` | `references/modes/ship.md` | `references/pr-body-template.md` |
| `/build` | `references/modes/build.md` | `plan.md` + `execute.md` (roda os dois) |
| `/pause` | `references/modes/pause.md` | — |
| `/resume` | `references/modes/resume.md` | — |

---

## Referências

Modos (passos completos, carregados on-demand):
- `references/modes/` — um arquivo por modo: discover, init, spec, break, plan, execute, verify, secure, ship, build, pause, resume

Templates de artefatos:
- `references/brief-template.md` — formato do brief.md (leia no /discover ao gerar)
- `references/spec-template.md` — formato do Spec.md (leia no /spec ao gerar)
- `references/context-template.md` — formato do context.md (leia no Discuss phase do /spec)
- `references/sprint-template.md` — formato dos sprints (leia no /break ao gerar)
- `references/issue-template.md` — formato de issues (leia no /break, com Done when / Tests / Gate / Summary)
- `references/uat-template.md` — formato do UAT resumível (leia no /verify e no /execute Passo 4.5)
- `references/security-template.md` — formato do SECURITY (leia no /secure ao gerar)
- `references/pr-body-template.md` — formato do corpo do PR (leia no /ship ao montar o PR)
- `references/state-template.md` — formato do STATE.md (leia no /init ao gerar)
- `references/decisions-template.md` — formato do DECISIONS.md (leia no /init ao gerar)
- `references/knowledge-template.md` — formato do KNOWLEDGE.md (leia no /init ao gerar)
- `references/concerns-template.md` — formato do steering/CONCERNS.md (leia no /init ao gerar)

Agentes:
- `references/agents/` — agentes especializados com frontmatter Claude Code; o /init Passo 4 os instala em `.claude/agents/` do projeto (subagent_type nativo); fallback: ler como prompt no /execute
- `references/agents/validator.md` — agente de validação independente (usado no loop do /execute; sem Write/Edit no frontmatter)

Evals:
- `evals/scenarios.md` — cenários de teste do próprio skill (triggering, handoff, auto-sizing)

**Artefatos gerados no projeto** (paths conforme regra **Localização canônica**):
- `brief.md` — gerado no /discover
- `steering/product.md`, `steering/structure.md`, `steering/tech.md` — gerados no /init (sempre)
- `steering/architecture.md`, `conventions.md`, `testing.md`, `integrations.md` — gerados no /init (Large/Complex)
- `steering/CONCERNS.md` — gerado no /init, atualizado conforme tech debt surge
- `Constitution.md` — gerado no /init ou /spec new
- `STATE.md` — gerado no /init, lido no início e atualizado no final de /execute, /build, /pause
- `DECISIONS.md` — gerado no /init, append-only ao tomar decisões arquiteturais
- `KNOWLEDGE.md` — gerado no /init, append-only ao descobrir patterns/gotchas reusáveis
- `Spec.md` — gerado no /spec (com EARS e rastreabilidade REQ-N)
- `context.md` — gerado no /spec quando Discuss phase é disparado
- `docs/research.md` — gerado no /break; inclui `## Package Legitimacy Audit` quando a spec exige instalar pacotes
- `docs/data-model.md` — gerado no /break
- `docs/contracts/` — gerado no /break
- `docs/sprints/` — gerado no /break (com `## Waves`), atualizado no /execute (reassess + milestone gate)
- `docs/issues/` — gerado no /break, enriquecido no /plan, fechado no /execute
- `docs/sprints/SPRINT-NNN-uat.md` — gerado no /verify (ou /execute Passo 4.5); resumível, com cold-start smoke e gaps YAML
- `docs/sprints/SPRINT-NNN-SECURITY.md` — gerado no /secure; threat model + veredito que o /ship lê
- `PRD.md` — gerado no /break, atualizado no /execute
