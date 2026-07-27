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
  "qual o comando", "qual o próximo passo", "e agora", "como continuo",
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
                        loop diagnose→fix→re-verify → uat.md     (user-facing)
/secure [sprint]     → gate de segurança (delega security-review)
                        → SECURITY.md                            (auth/dados/input)
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

Living docs — lidos no início, atualizados ao longo do trabalho:
- `STATE.md` — estado volátil (sessão atual, blockers, todos, handoff) — alto churn
- `DECISIONS.md` — decisões arquiteturais append-only — nunca deletar, baixo churn
- `KNOWLEDGE.md` — patterns, anti-patterns, gotchas reusáveis — cross-sprint
- `PRD.md` — estado vivo do produto com rastreabilidade de issues

Steering (contexto do projeto, estável):
- `steering/product.md` — visão, usuários, propósito do produto
- `steering/structure.md` — estrutura de diretórios, organização
- `steering/tech.md` — stack, versões
- `steering/architecture.md` — overview arquitetural, camadas, fluxos (Large/Complex)
- `steering/conventions.md` — naming, padrões de código, anti-padrões (Large/Complex)
- `steering/testing.md` — estratégia, comandos, coverage (Large/Complex)
- `steering/integrations.md` — APIs externas, webhooks, SDKs (Large/Complex)
- `steering/CONCERNS.md` — tech debt, áreas frágeis, gotchas (on-demand)
- `Constitution.md` — princípios não negociáveis (gerado no /init ou /spec new)

Feature/sprint/issue:
- `brief.md` — ideia inicial estruturada (gerado no /discover)
- `Spec.md` — requisitos funcionais com acceptance criteria em EARS
- `context.md` — decisões do Discuss phase sobre gray areas (condicional)
- `research.md` — pesquisa técnica pré-implementação
- `data-model.md` — entidades, schemas, relacionamentos
- `contracts/` — especificações de API (endpoints, payloads, responses)
- `sprints/` — sprints com Goal, Success Criteria, Issues, Waves, Reassess Notes
- `issues/` — issues de execução geradas pelo /break
- `uat.md` — script de UAT resumível (condicional, gerado no /verify ou /execute)
- `SECURITY.md` — resultado do gate de segurança (condicional, gerado no /secure)

Detecte o modo pelo argumento recebido (`$ARGUMENTS`). Se não houver argumento, pergunte qual etapa o usuário quer executar, a escala do problema, e explique o fluxo acima.

---

## Harness Rules (leitura obrigatória antes de qualquer modo)

Este skill segue princípios de **Harness Engineering**: o modelo é só a LLM; o harness é tudo o que fica em volta — instruções, estado em disco, sensores de verificação, regras de delegação. As regras abaixo são inegociáveis.

### Living Docs — papéis separados

Três arquivos vivos com churn e propósito diferentes. **Não misturar conteúdo entre eles.**

| Arquivo | Churn | Propósito | Quando atualizar |
|---|---|---|---|
| **STATE.md** | Alto | Estado volátil da sessão — current issue, blockers ativos, todos, handoff note | Ao fim de `/execute`, em `/pause` (PR 3), sempre que detectar blocker |
| **DECISIONS.md** | Baixo | Decisões arquiteturais com contexto/opções/razão/consequências. **Append-only — nunca deleta.** | Ao tomar decisão nova no /spec, /break, /execute. No reassess se uma decisão mudou. |
| **KNOWLEDGE.md** | Médio | Patterns validados, anti-patterns descobertos, gotchas, insights cross-sprint | Ao fim do sprint (reassess phase) quando aprendeu algo reusável |

**Regra:** blockers e lessons da sessão atual vão para STATE.md. Se um blocker revelou um pattern/anti-pattern reusável, ao resolver, mover o aprendizado para KNOWLEDGE.md. Se a solução envolveu uma decisão arquitetural, registrar também em DECISIONS.md.

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
- `steering/CONCERNS.md` — só quando a issue toca área flagged
- `Spec.md` — só da feature ativa
- `data-model.md` + `contracts/` — só quando planejando/implementando algo que envolve dados ou APIs
- `research.md` — só no /plan e /execute da issue que depende dele
- Uma issue por vez

**Never load simultaneously:**
- Múltiplos specs de feature
- Todos os contracts de uma vez
- Issues de outros épicos
- Arquivos arquivados

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

**Model Routing automático (dentro do `/execute`):** o Agent tool aceita override de `model` por chamada. Se o harness da sessão suporta isso, a ressalva por issue deixa de ser aviso e vira roteamento: o orquestrador roda em Sonnet e despacha sub-agents com o modelo do `Model hint` da issue — `Opus/Fable` → `model: opus`, padrão → herda a sessão. O usuário não precisa trocar de modelo no meio do sprint. A recomendação de sessão continua valendo para o **orquestrador** e para modos sem sub-agents (`/spec`, `/break`).

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

Se nada divergiu, escrever `none` explicitamente. Este campo vira input obrigatório do validator (PR 2) e ajuda o reassess phase a atualizar o plano à luz do que foi realmente aprendido.

### Package Legitimacy Gate (defesa anti-slopsquatting)

Modelos **alucinam nomes de pacote** — pesquisa de 2025 documenta ~20% das referências de pacote geradas por IA como nomes que não existem, e atacantes registram esses nomes alucinados de propósito (*slopsquatting*). Um nome alucinado que passa no `npm view` *parece* legítimo: o registry só prova que alguém registrou o nome, não que o pacote faz o que a IA disse.

**Toda recomendação de pacote externo (npm/pip/cargo/etc.) passa por tags de legitimidade.** O `/break` gera a tabela `## Package Legitimacy Audit` em `research.md`; o `/execute` respeita as tags antes de instalar.

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

## Modo: /discover

**Quando usar:** `--epic`. O usuário tem uma ideia mas ainda não sabe exatamente o que construir.

Conduza uma conversa de brainstorming — **uma pergunta por vez**, não um formulário. Espere a resposta antes de fazer a próxima. Reflita de volta o que entendeu a cada resposta para confirmar.

Sequência de perguntas:
1. Qual problema você quer resolver? Para quem é?
2. Como seria o fluxo principal — o que o usuário faz do início ao fim?
3. O que é essencial ter na primeira versão? O que pode ficar para depois?
4. Tem alguma restrição técnica? (stack preferida, integrações obrigatórias)
5. Conhece algum produto similar que admira? O que gosta nele?

Ao gerar o `brief.md`:
- Leia `references/brief-template.md` para o formato
- Marque com `[NEEDS CLARIFICATION: descrição do que está indefinido]` qualquer ponto que ficou ambíguo ou não foi respondido nas perguntas
- Mostre o brief ao usuário e pergunte se quer ajustar ou resolver os marcadores
- Só instrua a avançar quando não restar marcadores sem resolução

**Ao confirmar:** emita o **Bloco de Handoff** (regra Next Command) com o comando completo:
> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker init
> ```
> **Modelo:** tier raciocínio (Opus/Fable) — `/init` define steering e Constitution.

---

## Modo: /init

**Quando usar:** `--epic`. Cria o memory bank do projeto antes da spec.

Se `brief.md` existir, leia-o. Se `Constitution.md` já existir, leia-o também.

**Passo 1 — Steering files**

Gere os arquivos de contexto global em `steering/`. Escopo Medium gera os 4 essenciais (product, structure, tech, CONCERNS). Escopos Large/Complex geram os 7 completos (adiciona architecture, conventions, testing, integrations) — equivale ao brownfield mapping do tlc-spec-driven.

**Essenciais (sempre gerados):**

`steering/product.md`:
- Visão do produto (1 parágrafo)
- Usuários-alvo e seus principais jobs-to-be-done
- Proposta de valor e diferencial
- Escopo da v1 (o que está IN e o que está explicitamente OUT)

`steering/structure.md`:
- Estrutura de diretórios do projeto (gere a árvore)
- Padrão de organização por feature ou por camada
- Onde ficam testes, tipos, utilitários

`steering/tech.md`:
- Stack completa com versões (linguagem, framework, banco, ORM, libs principais)
- Ferramentas de build, lint, test e CI/CD
- Decisões arquiteturais resumidas (contexto completo vai em `DECISIONS.md`)

**Complementares (Large/Complex):**

`steering/architecture.md`:
- Overview arquitetural (camadas, módulos principais, diagrama)
- Fluxos críticos (ex: request → response, auth, cache)
- Pontos de extensão

`steering/conventions.md`:
- Convenções de nomenclatura (arquivos, variáveis, funções, componentes)
- Padrões de código (imports, exports, error handling)
- Estilo de commits, PRs, branches
- Anti-padrões específicos do time

`steering/testing.md`:
- Estratégia de testes (unit, integration, e2e, visual)
- Comandos reais de cada tipo (vira input dos campos `Gate` das issues)
- Onde ficam os testes
- Coverage mínimo aceitável

`steering/integrations.md`:
- APIs externas usadas (nome, versão, auth method)
- Webhooks recebidos ou emitidos
- SDKs e suas versões
- Serviços de infra (DB, cache, queue, storage, observability)

**Passo 2 — Constitution.md**
Gere `Constitution.md` na raiz com princípios não negociáveis:
- **Stack** — linguagens, frameworks e bibliotecas obrigatórias (sem exceções)
- **Arquitetura** — padrões estruturais obrigatórios
- **Estilo de código** — convenções de nomenclatura, formatação, organização
- **Segurança** — regras inegociáveis (ex: nunca expor secrets, sempre validar no servidor)
- **Performance** — limites aceitáveis (ex: bundle size, tempo de resposta)
- **Qualidade** — cobertura mínima de testes, lint obrigatório antes de merge
- **Anti-padrões** — o que nunca fazer neste projeto

> A Constitution.md e os steering files devem ser lidos no início de todos os modos subsequentes. Eles definem o que nunca pode ser violado.

**Passo 3 — Living docs e CONCERNS.md**
Gere os arquivos vivos de harness a partir dos templates em `references/`:

- `STATE.md` na raiz — de `references/state-template.md`. Preencher `Current Session` com fase atual (`init`), `Next action` ("iniciar /spec"), `Next command` (`/project-maker spec new`) e `Next model` (raciocínio), demais seções vazias.
- `DECISIONS.md` na raiz — de `references/decisions-template.md`. Deixar vazio; append conforme decisões são tomadas.
- `KNOWLEDGE.md` na raiz — de `references/knowledge-template.md`. Deixar vazio; append conforme patterns/gotchas são descobertos.
- `steering/CONCERNS.md` — de `references/concerns-template.md`. Deixar vazio; preenchido conforme tech debt e áreas frágeis aparecem.

**Passo 4 — Registrar agentes do skill no projeto**

Copie os agentes de `references/agents/` do skill para `.claude/agents/` do projeto:

```bash
mkdir -p .claude/agents && cp [skill-dir]/references/agents/*.md .claude/agents/
```

Isso registra os writers (component, action, hook, model, route, integration, test) e o validator como **agentes nativos do Claude Code**. Efeitos:
- O `/execute` pode despachar via `subagent_type` (ex: `component-writer`) em vez de colar o .md como prompt
- O frontmatter passa a valer de verdade: `tools:` restringe ferramentas por harness (o validator **não tem** Write/Edit — "nunca implementa" vira garantia mecânica, não promessa de prompt) e `model:` define o modelo default do agente
- Se já existir um agente com o mesmo nome em `.claude/agents/`, **não sobrescreva** — avise e pule

Se o usuário recusar ou o projeto não quiser os agentes, tudo continua funcionando no modo fallback (ler o .md e usar como prompt de sub-agent genérico).

**Ao final:** emita o **Bloco de Handoff** (regra Next Command) com o comando completo — `spec new` em projeto novo, `spec feature "[nome]"` se o init foi rodado em projeto existente:
> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker spec new
> ```
> **Modelo:** tier raciocínio (Opus/Fable) — captura de requisitos define tudo downstream.

---

## Modo: /spec

**Argumentos:** `new` (projeto do zero) ou `feature` (em projeto existente)

**Passo 1 — Contexto**
- Se existirem `steering/` e `Constitution.md`: leia-os antes de qualquer coisa.
- Se existir `brief.md`: leia-o. Não repita perguntas já respondidas nele.
- Se argumento for `feature`: mapeie o codebase existente antes de criar a spec, delegando a um agente de exploração. Preferência: agente `code-explorer` (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/feature-dev/agents/code-explorer.md`) se instalado; senão o agente nativo **`Explore`** (read-only, sempre disponível).

**Passo 2 — Perguntas de complemento**
Faça apenas as perguntas que o brief não respondeu ou que o codebase não deixa claro:
- Páginas/telas necessárias (se não definidas)
- Comportamentos específicos por componente
- Integrações e dados necessários

Marque `[NEEDS CLARIFICATION: descrição]` para qualquer ponto que permanecer ambíguo após as respostas. Não avance para o próximo passo se restar marcadores críticos sem resolução — peça ao usuário que resolva primeiro.

**Passo 2.5 — Discuss phase (condicional, disparado automaticamente)**

Se durante os Passos 1-2 você detectar **gray areas críticas** — decisões técnicas onde várias opções são legítimas e o brief/steering/codebase não resolve — dispare o Discuss phase antes de gerar a Spec.

**O que conta como gray area crítica:**
- Trade-off entre duas libs ou abordagens onde cada uma tem implicações arquiteturais diferentes
- Ambiguidade de UX que muda o data-model (ex: "usuário tem uma conta ou várias?")
- Escolha de síncrono vs assíncrono para um fluxo core
- Autorização/permissões não definidas

**O que NÃO conta:**
- Detalhes de estilo ou naming (resolver por convenção)
- Microdecisões isoladas (resolver no `/plan` com Knowledge Verification Chain)
- Qualquer coisa que o steering já responde

**Fluxo do Discuss:**
1. Liste as gray areas detectadas (máximo 5 por rodada — mais que isso é sinal de brief insuficiente)
2. Para cada gray area, apresente 2-4 opções com trade-offs concretos
3. Pergunte ao usuário **uma por vez**, aguardando resposta antes da próxima
4. Grave as decisões em `context.md` na raiz da feature (use `references/context-template.md` como base)
5. Liste também `Constraints descobertas` que saíram da conversa e vão virar REQ ou atualizar Constitution.md
6. Se alguma gray area ficou sem resposta e você teve que assumir, registre em `Assumptions não-confirmadas` com o risco explicitado

`context.md` é input obrigatório de `/plan` e `/execute` para a feature.

**Passo 3 — Gerar Spec.md**
Leia `references/spec-template.md` para o formato. Gere `Spec.md` na raiz com:

- **Overview** — o que é, para quem, qual problema resolve
- **Requisitos** — lista numerada (REQ-1, REQ-2...) de requisitos funcionais. Cada requisito deve ter acceptance criteria em **EARS notation**:
  > `WHEN [evento ocorre] THEN the [sistema] SHALL [comportamento esperado]`
  > Exemplo: `WHEN a user submits the login form THEN the system SHALL validate credentials and redirect within 2 seconds`
- **Páginas** — cada tela com rota e propósito
- **Componentes** — cada elemento visual por página
- **Comportamentos** — caminho feliz + edge cases + erros, usando EARS

Para `/spec feature`: inclua em cada item qual código existente será reutilizado ou modificado.

**Passo 4 — Constitution.md** (apenas em `/spec new` sem /init prévio)
Se não existir `Constitution.md`, gere seguindo as mesmas instruções do `/init` Passo 2.

**Ao final:** exiba resumo da spec, liste marcadores `[NEEDS CLARIFICATION]` restantes se houver, e feche com o **Bloco de Handoff** (regra Next Command) — comando completo + modelo na mesma caixa:
> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker break
> ```
> **Modelo:** tier raciocínio (Opus/Fable) — pesquisa + decomposição é raciocínio puro.

Se restaram marcadores `[NEEDS CLARIFICATION]` sem resolver, o bloco muda: o comando primário passa a ser resolver os marcadores nesta sessão, e o `/break` vira a alternativa rotulada.

---

## Modo: /break

**Pré-requisito:** `Spec.md` deve existir na raiz. Leia `Constitution.md` e `steering/` se existirem.

Leia a Spec.md completa. Leia `references/issue-template.md` para o formato de issue.

**Passo 1 — research.md**
Antes de quebrar em issues, gere `research.md` com:
- **Bibliotecas candidatas**: opções para cada necessidade técnica da spec, com trade-offs e compatibilidade com o stack definido em `steering/tech.md`
- **Padrões de implementação**: como implementar os comportamentos da spec seguindo os padrões do projeto
- **Riscos técnicos**: dependências externas frágeis, integrações complexas, edge cases de performance ou segurança
- **Decisões tomadas**: para cada ponto de escolha, documente a opção escolhida e o motivo

Use WebSearch/WebFetch para pesquisar documentação e compatibilidade quando necessário.

**Package Legitimacy Audit (obrigatório quando a spec exige instalar pacotes).** Para cada pacote candidato, gere a tabela abaixo em `research.md` seguindo a regra **Package Legitimacy Gate** das Harness Rules. Verifique cada um (`npm view` / `pip index versions` / página do registry) antes de taguear:

```markdown
## Package Legitimacy Audit

| Pacote | Versão | Fonte da recomendação | Verificação | Tag |
|--------|--------|----------------------|-------------|-----|
| zod | ^3.x | codebase + npm view | npmjs.com/package/zod, 30M downloads/sem, repo ativo | [OK] |
| some-lib | ^1.0 | WebSearch | npm view OK mas não verificado direto | [ASSUMED] |
| made-up-pkg | — | sugestão do modelo | npm view: 404 | [SLOP] |
```

Sem esta tabela, o `/execute` **bloqueia** qualquer task de install. Pacote `[SLOP]` é proibido — não invente substituto, reporte.

**Passo 2 — data-model.md**
Gere `data-model.md` com:
- Entidades do domínio e seus atributos (com tipos)
- Relacionamentos entre entidades
- Schema de banco de dados ou estrutura de coleções
- Regras de validação e constraints

**Passo 3 — contracts/**
Para cada endpoint ou integração identificada na spec, gere um arquivo em `contracts/[nome].md` com:
- Método e rota (para APIs HTTP)
- Request: headers, params, body (com tipos e exemplos)
- Response: status codes, body de sucesso, body de erro
- Autenticação e autorização necessárias

**Passo 4 — Issues de prototype** (salvar em `issues/prototype/`)
Uma issue por página da Spec. Cada issue descreve apenas a parte visual — layout, componentes, estados visuais (loading, vazio, erro). Sem lógica de negócio, sem chamadas de API.

No header de cada issue, inclua:
```
Implements: [REQ-X, REQ-Y]  ← números dos requisitos da Spec.md
Depends on: [lista de issues que devem ser concluídas antes]
Can parallelize with: [lista de issues que podem rodar em paralelo]
Model hint: [Sonnet | Opus/Fable]  ← ver Model Advisor
```

**Model hint (obrigatório em toda issue).** Classifique o tier de modelo recomendado para implementar a issue, seguindo a regra **Model Advisor** das Harness Rules:
- **`Sonnet`** (padrão) — issue bem-especificada, implementação direta, refactor mecânico, escrita de teste.
- **`Opus/Fable`** — issue **prompt-engineering-heavy** (escrever system prompts, projetar agentes/DSLs) ou **raciocínio-heavy** (algoritmo core, decisão arquitetural embutida na implementação). Justifique em uma frase por que foge do padrão.

O `/execute` lê esses hints para recomendar quais issues rodar em tier de raciocínio.

**Regra de ferro:** uma issue tem que caber em uma janela de contexto. Se a sua lista de arquivos/comportamentos não cabe claramente, quebre em duas issues.

**Passo 5 — Issues funcionais** (salvar em `issues/functional/`)
Uma issue por comportamento ou grupo de comportamentos da Spec. Cada issue torna um prototype funcional: conecta ao banco, chama APIs, valida dados, trata erros.

Mesmo header de rastreabilidade da etapa anterior. Mesma regra de ferro.

**Formato de nome de arquivo:** `[numero]-[slug-do-titulo].md` (ex: `01-pagina-login.md`, `05-submit-form-cadastro.md`)

**Marque issues paralelas com `[P]`** no nome e no sprint: issues sem dependências entre si podem ser executadas em paralelo.

**Passo 6 — Sprints** (salvar em `sprints/SPRINT-NNN-[slug].md`)

Agrupe as issues em sprints. **Cada sprint é uma unidade de entrega autônoma** com um Goal claro e Success Criteria verificáveis. Leia `references/sprint-template.md` para o formato.

Regras de agrupamento:
- Um sprint deve ter entre 3 e 10 issues (se tem menos, provavelmente é um bugfix isolado; se tem mais, quebre em dois sprints)
- Issues do mesmo sprint compartilham contexto — ex: "sprint de autenticação" junta login, registro, recuperação de senha
- Issues paralelas `[P]` podem coexistir no mesmo sprint
- Um sprint pode depender de outro (`Depends on`), formando DAG
- Cada sprint tem Success Criteria **mecanicamente verificáveis** derivados dos REQs da Spec — esses critérios vão ser usados no Milestone Validation Gate

Exemplo de Success Criterion bom:
- ✅ "usuário cria conta, confirma email e faz login com a nova conta"
- ❌ "autenticação funciona bem"

Nomeie os sprints com numeração + slug: `SPRINT-001-auth.md`, `SPRINT-002-dashboard.md`.

**Wave analysis (dentro de cada sprint).** Antes de fechar o sprint.md, derive os grupos de execução a partir dos `Depends on` das issues e preencha a seção `## Waves` (ver `references/sprint-template.md`):
- Issues sem dependências → Wave 1 (rodam em paralelo).
- Issues que dependem só da Wave 1 → Wave 2. E assim por diante (DAG → waves).
- **Verificação de colisão:** issues na mesma wave não podem tocar os mesmos arquivos. Se duas issues `[P]` colidem em arquivo, separe em waves diferentes ou funda numa issue. Isso é o que torna o paralelismo do `/execute` seguro.

**Passo 7 — PRD.md**
Gere `PRD.md` na raiz como documento vivo do produto, organizado por sprint:

```markdown
# PRD — [Nome do Projeto]
_Última atualização: [data]_

## Visão geral
[2-3 linhas do que o produto é e para quem — extraído do steering/product.md]

## Sprints

### SPRINT-001 — [slug]
**Goal**: [1 frase]
**Status**: 🔲 planned
**Success Criteria**: [resumido em 1 bullet — cheio está no sprint.md]

| Issue | Título | Implementa | Paralelo | Status |
|-------|--------|------------|----------|--------|
| prototype/01 | [título] | REQ-1, REQ-2 | [P] sim/não | 🔲 pendente |
| functional/05 | [título] | REQ-3 | [P] sim/não | 🔲 pendente |

### SPRINT-002 — [slug]
...
```

Status de sprint: `🔲 planned` · `🔄 in-progress` · `⏸ pending-review` · `✅ done`
Status de issue: `🔲 pendente` · `🔄 em progresso` · `⏸ blocked` · `✅ entregue`

**Ao final:** liste sprints com suas issues e indicação de paralelismo, cite os artefatos gerados (research.md, data-model.md, contracts/, sprints/, issues/, PRD.md) e feche com o **Bloco de Handoff** (regra Next Command).

Antes de emitir, **resolva o path real do primeiro sprint** — use o nome de arquivo exato como foi gravado, com o diretório real. Varra os `Model hint` das issues desse sprint: se alguma for `Opus/Fable`, cite os números na linha `**Ressalva:**`; se nenhuma for, omita a linha.

> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker execute docs/sprints/SPRINT-001-onboarding.md
> ```
> **Modelo:** Sonnet — o orquestrador só despacha sub-agents.
> **Ressalva:** issues 12/14 têm `Model hint: Opus/Fable` — roteadas automaticamente.
> **Depois:** `/verify` → `/secure` → `/ship`.

---

## Modo: /plan

**Argumento:** caminho ou nome da issue (ex: `issues/prototype/01-pagina-login.md`)

Leia `Constitution.md` e `steering/` se existirem — definem restrições que devem ser respeitadas no plano.
Leia `data-model.md` e o contrato relevante em `contracts/` se existirem.
Leia a issue completa, incluindo os campos `Implements`, `Depends on` e `Can parallelize with`.

**Passo 1 — Pesquisa interna**
Delegue a um agente de exploração — `code-explorer` (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/feature-dev/agents/code-explorer.md`) se instalado, senão o agente nativo **`Explore`** (read-only) — para:
- Encontrar arquivos existentes relacionados à issue
- Identificar padrões de implementação já usados no projeto
- Detectar código reutilizável (componentes, hooks, utils, tipos)

**Passo 2 — Pesquisa externa**
Use WebSearch/WebFetch para buscar documentação e exemplos das tecnologias envolvidas. Consulte `research.md` se existir — evite duplicar pesquisa já feita.

**Passo 3 — Enriquecer a issue**
Reescreva a issue adicionando:
- **Arquivos a criar**: path completo + responsabilidade de cada um
- **Arquivos a modificar**: path + linha aproximada + o que e por quê
- **Padrões de implementação**: snippets dos padrões encontrados no codebase
- **Acceptance criteria verificáveis**: mapeados dos requisitos EARS da Spec.md
- **Verificação**: comandos reais de teste/lint/typecheck do projeto

Salve sobrescrevendo o arquivo da issue original.

**Ao final:** emita o **Bloco de Handoff** (regra Next Command) com o path real da issue enriquecida e o modelo vindo do `Model hint` do header (Sonnet no padrão, Opus/Fable se o hint indicar):
> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker execute issues/prototype/01-pagina-login.md
> ```
> **Modelo:** Sonnet — issue especificada, execução mecânica.

Se a issue faz parte de um sprint já planejado, o comando primário é o `/execute` do **sprint** (path completo) e o `/execute` da issue isolada vira a alternativa rotulada.

---

## Modo: /execute

**Argumento:** caminho de um **sprint** (`sprints/SPRINT-NNN-[slug].md`) ou, em modo `--quick`, de uma issue isolada.

`/execute` é um **orquestrador**. Ele não escreve código diretamente — dispara sub-agents separados para implementar e validar cada issue do sprint, roda reassess ao fim, e aplica o Milestone Validation Gate antes de fechar o sprint.

**Fluxo geral:**

```
/execute SPRINT-NNN
  │
  ├─ Session Loading (STATE, DECISIONS, KNOWLEDGE, Constitution, steering)
  ├─ Para cada WAVE do sprint (na ordem do DAG; ver ## Waves do sprint.md):
  │    ├─ Issues da wave rodam em PARALELO (1 sub-agent por issue [P]):
  │    │    ├─ spawn implementer (sub-agent isolado)
  │    │    ├─ spawn validator (sub-agent separado, lê issue + diff + gate result)
  │    │    ├─ se fail e <3 tentativas → re-dispatch implementer com gaps do validator
  │    │    ├─ se pass → fecha issue
  │    │    └─ se 3 fails → marca blocker, pula
  │    └─ Fim da wave: ORQUESTRADOR serializa escritas em PRD/STATE/DECISIONS/KNOWLEDGE
  ├─ Reassess Phase (4 perguntas, atualiza PRD/DECISIONS/KNOWLEDGE)
  ├─ Milestone Validation Gate (todos os Success Criteria verificados)
  └─ Fecha sprint como done OU pending-review
       → handoff: /verify (se user-facing) → /secure → /ship
```

### Passo 0 — Session Loading (Harness Rules)

- Leia `STATE.md` — onde parou a última sessão, blockers ativos, lessons aplicáveis
- Leia `DECISIONS.md` — decisões arquiteturais relevantes
- Leia `KNOWLEDGE.md` — patterns e anti-patterns aplicáveis
- Leia `Constitution.md` e `steering/` (product, structure, tech)
- Leia o **sprint.md** alvo — Goal, Success Criteria, lista de issues, dependências
- Leia `data-model.md` e contratos relevantes em `contracts/` se o sprint envolver dados/APIs
- Para cada issue do sprint, verifique se está enriquecida (tem seção "Arquivos a criar"). Se alguma não estiver, instrua a rodar `/plan` para ela antes de continuar
- **Se qualquer issue do sprint tocar arquivo/área em `steering/CONCERNS.md`**, carregue o CONCERNS
- **Model Advisor / Routing:** varra o campo `Model hint` das issues do sprint. Se alguma tem hint `Opus/Fable`: (a) se o Agent tool da sessão suporta override de `model`, informe que essas issues serão despachadas em tier de raciocínio automaticamente e siga; (b) se não suporta, avise: "issues X, Y são raciocínio/prompt-heavy — considere trocar de modelo para essas". Não bloqueia (regra Model Advisor).

Marque o sprint como `🔄 in-progress` no PRD.md e no próprio sprint.md.

### Passo 1 — Branch isolada do sprint

```bash
git checkout -b sprint/[slug-do-sprint]
```

Todas as issues do sprint são commitadas nesta mesma branch (1 commit por issue), fechando o sprint com um merge único em main ao final.

### Passo 2 — Loop de implementação por wave

Leia a seção `## Waves` do sprint.md. Execute **wave por wave**, na ordem do DAG. Dentro de uma wave, dispare um sub-agent por issue **em paralelo** (issues `[P]` que não colidem em arquivo). A wave seguinte só começa quando todas as issues da anterior fecharam.

> **Parallel Write Safety:** dentro da wave, sub-agents implementam e retornam resultado, mas **só o orquestrador** escreve em STATE/PRD/DECISIONS/KNOWLEDGE, serializando ao fim da wave (ver Harness Rules). Sub-agent nunca edita living doc direto.

Para cada issue da wave:

**2.1 — Phase Gates constitucionais** (checagem rápida antes de delegar):
- Respeita stack do Constitution.md?
- Alinhada com data-model.md e contracts/?
- Sem features especulativas?
- Inputs validados no servidor, sem secrets expostos?
- Testes serão escritos junto?
- **Nyquist:** todo `Done when` da issue tem um sensor em `Tests`? Se algum está `MISSING`, a primeira sub-task do implementer é criar o teste (scaffold) antes de implementar.
- **Package Legitimacy:** a issue instala pacote? Consulte `## Package Legitimacy Audit` do `research.md`. `[OK]` instala; `[SUS]`/`[ASSUMED]` exigem **checkpoint humano** (mostre o link do registry e confirme antes); `[SLOP]` é **proibido** — pare e reporte, nunca troque o nome em silêncio. Se não há tabela e a issue instala pacote, **bloqueie** e instrua rodar/atualizar o `/break`.

Se algum gate falhar, documente a exceção no Summary da issue antes de prosseguir.

**2.2 — Spawn do implementer** (sub-agent isolado)

Escolha o agente conforme o tipo de arquivo da issue:

| Tipo de arquivo | Agente |
|---|---|
| Componentes UI (`.tsx`, `.vue`, `.svelte`) | `component-writer` |
| Server actions, lógica de servidor | `action-writer` |
| Hooks de estado/efeito | `hook-writer` |
| Schema, migrations, modelos | `model-writer` |
| Rotas de API, endpoints | `route-writer` |
| Integrações externas | `integration-writer` |
| Arquivos de teste | `test-writer` |

**Como despachar (em ordem de preferência):**
1. **Agente registrado** — se o agente existe em `.claude/agents/` do projeto (instalado pelo `/init` Passo 4), dispare via `subagent_type` com o nome da tabela. O frontmatter cuida de tools e model default.
2. **Fallback** — leia `references/agents/[nome].md` do skill e use o conteúdo como prompt de um sub-agent genérico.

**Model Routing (regra Model Advisor):** se a issue tem `Model hint: Opus/Fable` e o Agent tool suporta override de `model`, passe `model: opus` no dispatch **desta issue**. Hint `Sonnet` ou ausente → não passe override (herda o default). Vale para os dois modos de dispatch.

**Contexto que o implementer recebe** (regras de Sub-Agent Delegation):
- A issue completa (Descrição, Cenários, Done when, Tests, Gate, Arquivos a criar/modificar, Padrões)
- Constitution.md + steering/structure.md + steering/tech.md
- data-model.md e contracts/ relevantes
- CONCERNS.md **só se** a issue toca área flagged
- Spec.md dos REQs que a issue implementa

**Não recebe:** outras issues, STATE.md completo, histórico da conversa, specs de outras features.

**O implementer retorna:**
- Status (Complete | Blocked | Partial)
- Files changed
- Gate check result (exit code + contagens de teste)
- Spec Deviations (lista ou `none`)
- Issues encontradas

**2.3 — Spawn do validator** (sub-agent SEPARADO)

Dispare o `validator` como sub-agent independente — mesma ordem de preferência do 2.2: `subagent_type: validator` se registrado em `.claude/agents/`, senão `references/agents/validator.md` como prompt. O validator **nunca** implementa — só avalia. Registrado, isso é garantia mecânica: o frontmatter dele não inclui Write/Edit.

**Contexto que o validator recebe:**
- Issue original (antes da implementação)
- `git diff sprint/[slug]` da issue
- Gate check result reportado pelo implementer
- Spec Deviations reportados pelo implementer
- Spec.md, Constitution.md, steering/, data-model.md, contracts/ relevantes

**Retorna:** Verdict (pass/fail), Score (0-100), Scoring breakdown, Gaps específicos, Deviation review, Recommended action.

**Threshold mínimo: 80.** Score < 80 = fail automático. Gate check != 0 = fail automático (mesmo que score seja alto). Detecção de stub/fabricação = fail automático.

**2.4 — Loop de correção**

- Se validator `pass` → prossiga para 2.5
- Se validator `fail` e tentativas < 3 → re-dispatch do **implementer** passando os Gaps do validator como instruções de correção. Volta para 2.3.
- Se tentativas == 3 → registre em `STATE.md` como blocker com o histórico das 3 tentativas, marque issue como `⏸ blocked` no PRD, pule para a próxima issue

**Limite absoluto: 3 iterações por issue.** Não estender. Quebrar o loop é o comportamento correto — fabricar pass é o errado.

**2.5 — Fechar issue**

- Commit: `git commit -m "feat(SPRINT-NNN/[slug-issue]): [título da issue]"`
- Preencha `## Summary` da issue com Status, Files changed, Gate result, Issues encontradas, Spec Deviations (lista completa ou `none`)
- Se houver deviation que afeta data-model, contracts, ou outras issues do sprint, sinalize e atualize os arquivos afetados nesta mesma sessão
- Atualize `PRD.md`: status da issue → `✅ entregue`
- Atualize `STATE.md`: current issue → próxima; append blockers/lessons novos
- Se a issue gerou decisão arquitetural nova → append em `DECISIONS.md`
- Se a issue gerou pattern/anti-pattern/gotcha reusável → append em `KNOWLEDGE.md`

Prossiga para a próxima issue do sprint.

### Passo 3 — Reassess Phase

Ao fim de todas as issues do sprint, antes de fechar, execute o reassess. Responda explicitamente às 4 perguntas no campo `## Reassess Notes` do sprint.md:

1. **O que aprendemos neste sprint?** — surpresas, padrões que funcionaram, falhas recorrentes
2. **Alguma issue dos próximos sprints ficou desnecessária?** — se sim, remova do PRD e marque como superseded
3. **Alguma issue nova precisa existir?** — gap descoberto na prática; crie e adicione no sprint apropriado
4. **Alguma decisão arquitetural mudou?** — se sim, append em DECISIONS.md com contexto "decisão anterior X revisada porque Y"

Atualize PRD.md, os sprint.md afetados, DECISIONS.md e KNOWLEDGE.md conforme as respostas.

### Passo 4 — Milestone Validation Gate

Antes de marcar o sprint como `✅ done`, rode o checklist do `## Milestone Validation Gate` do sprint.md:

- [ ] Todos os Success Criteria têm evidência observável (não "deve funcionar" — **mostre**)
- [ ] Todas as issues do sprint têm Gate check `pass` registrado no Summary
- [ ] Todos os Spec Deviations foram revistos e aceitos ou corrigidos
- [ ] PRD.md reflete status real
- [ ] DECISIONS.md atualizado se houve decisões novas
- [ ] STATE.md limpo dos blockers que pertenciam a este sprint

**Regra:** se **qualquer** item falhar, o sprint fica `⏸ pending-review`, **não** `done`. Liste os itens que falharam em STATE.md → Blockers e pare. Fabricar um "done" é exatamente o gap #4 do vídeo — proibido.

### Passo 4.5 — Interactive UAT (condicional)

Dispare UAT interativo **apenas** se o sprint entrega uma feature user-facing com comportamento visual/complexo que o validator automático não cobre 100%. Gate check + validator já cobrem lógica, mas não cobrem *experiência*.

**Quando disparar:**
- Sprint inclui issues de `prototype/` (UI)
- Sprint entrega um fluxo end-to-end que o usuário final vai usar
- Há interações que dependem de percepção humana (animations, spacing, tom de voz dos erros)

**Quando NÃO disparar:**
- Sprint só toca backend, migrations, refactor interno
- Sprint é um bugfix pontual
- Escopo é `--quick`

**Fluxo:** dispare o modo `/verify` (ver `## Modo: /verify`) passando o sprint atual. Ele gera o `uat.md` resumível, injeta o cold-start smoke test quando aplicável, conduz o teste um a um, e — se houver gaps — roda o loop diagnose→fix→re-verify. Em `--quick`, gere o `uat.md` ao lado da issue.

- Se `/verify` retorna **sem gaps** → prossiga para Passo 5.
- Se retorna **com gaps** → o `/verify` já criou as issues de fix; mantenha o sprint `⏸ pending-review` até as fixes passarem no re-verify.

O UAT **não substitui** o Milestone Gate — é complementar, só para features onde a experiência importa.

### Passo 5 — Fechar sprint e entregar

Se o Milestone Gate passou:

- Marque sprint como `✅ done` em PRD.md e sprint.md (preencha `Fechado em`)
- Atualize STATE.md (current → próximo sprint, blockers limpos)
- Encaminhe para o **loop de fechamento**, na ordem aplicável:
  1. `/verify [sprint]` — se o sprint é user-facing (já disparado no Passo 4.5; se pulou lá, é aqui)
  2. `/secure [sprint]` — se o sprint tocou auth, dados, input externo ou superfície de rede
  3. `/ship [sprint]` — push + PR com body rico (quando há remote configurado)

Se **não há remote** (projeto local), o `/ship` cai no fallback de merge local: mostre `git diff main`, proponha `git checkout main && git merge sprint/[slug]`, aguarde confirmação.

Se o Milestone Gate **não** passou: liste pendências, registre em STATE.md → Blockers, marque sprint como `⏸ pending-review` e aguarde instruções. Não encaminhe para ship.

**Bloco de Handoff (obrigatório — regra Next Command).** Feche a resposta com o comando completo do próximo estágio do loop de fechamento, **path real resolvido**, nunca uma descrição do que rodar:

> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker verify docs/sprints/SPRINT-031-resposta-por-whatsapp.md
> ```
> **Modelo:** Sonnet — UAT conduzido, sem raciocínio pesado.
> **Depois:** `/secure` → `/ship`.

Qual comando entra no bloco, por estado:

| Estado ao fechar | Comando primário |
|---|---|
| Gate passou + sprint user-facing | `/project-maker verify [path do sprint]` |
| Gate passou + não user-facing + toca auth/dados/input | `/project-maker secure [path do sprint]` |
| Gate passou + verify/secure já limpos ou N/A | `/project-maker ship [path do sprint]` |
| Gate passou + há próximo sprint e nada a fechar | `/project-maker execute [path do próximo sprint]` |
| Gate **não** passou / blocker ativo | `/project-maker execute [path das issues de fix]` — comando de recuperação, não do próximo estágio |

Cite na linha `**Depois:**` o resto da cadeia, para o usuário ver quantos passos faltam.

---

### Modo `--quick`: /execute em issue isolada

Quando a escala for `--quick` (bug fix, mudança pequena), `/execute` aceita uma issue isolada sem sprint:

- Pula o conceito de sprint
- Rodar Passo 0 (Session Loading simplificado — STATE + Constitution), Passo 1 (branch por issue), Passo 2 completo (implementer + validator loop), pula Passo 3 (reassess) e Passo 4 (milestone gate)
- Atualiza STATE/PRD normalmente no Passo 2.5

---

## Modo: /verify

**Argumento:** caminho de um sprint (`sprints/SPRINT-NNN-[slug].md`) ou de uma issue em `--quick`.

UAT conduzido — confirma que o que foi construído **funciona da perspectiva do usuário**, no que o validator automático (lógica) não alcança (experiência). Disparado no Passo 4.5 do `/execute` ou manualmente após uma entrega user-facing.

**Filosofia:** *mostre o esperado, pergunte se a realidade bate.* Um teste por vez, resposta em texto livre. Resposta vazia / "ok" / "sim" / "next" = pass. Qualquer outra coisa = issue, com severidade **inferida** da linguagem (nunca pergunte "quão grave?"). Ver `references/uat-template.md`.

### Passo 0 — Session Loading + checar sessão ativa
- Leia STATE.md, Constitution.md, steering relevante.
- Procure `uat.md` com `status: testing | partial` para o sprint. Se existir, **retome** do primeiro teste `pending` (o frontmatter sobrevive a `/clear`). Senão, crie novo.

### Passo 1 — Extrair testes
- Leia os `Summary` das issues do sprint e os `Done when`. Extraia **deliverables observáveis pelo usuário** (não refactors/tipos internos).
- Cada teste = uma ação + um resultado esperado específico.

**Cold-start smoke test (injeção automática).** Se algum arquivo tocado pelo sprint casa com `server.*`, `app.*`, `index.*`, `main.*`, `migrations/*`, `seed*`, `db/*`, `docker-compose*`, `Dockerfile*` → **prepend** o teste de boot frio (Test 0 do template): matar serviço, limpar estado efêmero, subir do zero, query primária retorna dado vivo. Pega bug que só aparece em estado frio e passa em estado quente.

### Passo 2 — Conduzir (um por vez)
- Gere `uat.md` a partir do template. Apresente o teste atual (esperado), aguarde resposta.
- Processe: pass / issue (com severidade inferida + append no `## Gaps` YAML) / skipped / blocked (pré-requisito — não vira gap).
- Escreva no arquivo: ao achar issue, a cada 5 passes, e ao completar. Atualize `Current Test` e `Summary`.

### Passo 3 — Se houver gaps: loop diagnose → fix → re-verify
1. **Diagnose:** para cada gap, dispare um sub-agent que investiga a root cause (lê o diff do sprint + o gap). Preencha `root_cause` no YAML.
2. **Fix issue:** crie uma issue de fix em `issues/functional/` (gap_closure) por root cause, com `Done when` derivado do `truth` do gap e `Gate` real. Linke em `fix_issue`.
3. **Execute:** instrua `/execute` nas issues de fix (`--quick` se isolado, ou nova mini-wave no sprint).
4. **Re-verify:** re-rode só os testes que tinham falhado. Repita no máximo o que o `Stuck Detection` permite (não fique em loop infinito).

### Passo 4 — Fechar
- Sem gaps abertos → `status: complete`, sprint pode seguir para `/secure`/`/ship`.
- Com gaps abertos → registre em STATE.md → Blockers, sprint fica `⏸ pending-review`.

**Bloco de Handoff (obrigatório — regra Next Command):**
- Sem gaps + sprint toca auth/dados/input → `/project-maker secure [path real do sprint]`
- Sem gaps + sem superfície de segurança → `/project-maker ship [path real do sprint]`
- Com gaps → `/project-maker execute [path real das issues de fix]` (recuperação), e cite o re-verify como o passo seguinte

Sempre com o path resolvido do disco, comando sozinho no bloco de código, linha `**Modelo:**` junto.

**Quando NÃO rodar:** sprint só backend/migrations/refactor interno, bugfix pontual, `--quick` sem superfície de usuário. UAT **não substitui** o Milestone Gate — é complementar.

---

## Modo: /secure

**Argumento:** caminho de um sprint (ou issue em `--quick`).

Gate de segurança escopado ao **diff do sprint**, não ao codebase inteiro. Roda antes do `/ship`. Gera `SECURITY.md` (ver `references/security-template.md`). É o equivalente ao `secure-phase` do gsd: bloqueia a entrega se houver ameaça aberta.

### Passo 1 — Escopo
```bash
git diff main...sprint/[slug] --stat
```
Carregue as regras de **Segurança da `Constitution.md`** e o `steering/CONCERNS.md` se o diff toca área flagged.

### Passo 2 — Delegar ou checklist
- **Se a skill `security-review` está instalada** (ver tabela Skill Integrations): delegue a ela a revisão do diff da branch. Ela é a fonte primária do veredito. Recomendação de instalação aparece no máx. 1x/sessão.
- **Senão (fallback):** rode o checklist embutido do `references/security-template.md` — input/injection, authn/authz/IDOR, secrets, dependências (cruza com o Package Legitimacy Gate), superfície/erros — escopado ao que o diff mudou. Marque N/A o que o sprint não toca.

### Passo 3 — Registrar
- Cada violação vira linha no `## Threat Model` do SECURITY.md, com severidade e mitigação.
- Preencha o frontmatter: `status` (`clean | threats_open | needs_human`) e `threats_open` (contagem).
- Itens que exigem julgamento humano → `needs_human`, peça revisão explícita.

### Passo 4 — Veredito
- `clean` → libera o `/ship`.
- `threats_open > 0` → **bloqueia o /ship**. Crie issues de fix (como no `/verify` Passo 3) ou registre em STATE.md → Blockers.

**Bloco de Handoff (obrigatório — regra Next Command):**
- `clean` → `/project-maker ship [path real do sprint]`
- `threats_open > 0` → `/project-maker execute [path real das issues de fix]`, com nota de uma linha: o `/ship` fica bloqueado até `threats_open: 0`
- `needs_human` → o bloco pede a revisão humana explícita **e** já traz o comando de retomada (`/project-maker secure [path]`) para depois dela

**Quando rodar:** sempre que o sprint tocar auth, dados sensíveis, input externo, uploads, pagamentos, ou superfície de rede. Em `--quick`, só se a mudança toca uma dessas áreas.

---

## Modo: /ship

**Argumento:** caminho de um sprint (ou `milestone vX.Y` ao fechar milestone).

Ponte entre "trabalho completo localmente" e "PR aberto". Push da branch + PR com body rico montado dos artefatos. **Fecha o loop** spec → execute → verify → secure → ship. Ver `references/pr-body-template.md`.

### Passo 1 — Preflight gate (bloqueia se qualquer item falhar)
1. **Milestone Gate passou?** Sprint está `✅ done` no PRD.md? Senão → pare, rode `/execute` até fechar.
2. **Verify sem gaps?** Se há `uat.md` para o sprint, `status: complete` e `## Gaps` vazio? Senão → rode `/verify`.
3. **Secure limpo?** Se há `SECURITY.md`, `threats_open: 0`? Senão → rode `/secure` e resolva.
4. **Working tree limpo?** `git status --short` vazio? Senão → peça commit ou stash.
5. **Branch correta?** Está em `sprint/[slug]`, não em `main`? Senão → avise.
6. **Remote + gh?** `git remote -v` tem origin E `gh auth status` ok? Se **não há remote** → caia no fallback de merge local (Passo 5b). Se há remote mas `gh` não autenticado → instrua `gh auth login` (sugira `! gh auth login`) e pare.

### Passo 2 — Push
```bash
git push -u origin sprint/[slug]
```

### Passo 3 — Montar PR body
Monte o corpo a partir dos artefatos seguindo `references/pr-body-template.md`: **Summary** (Goal do sprint + síntese dos Summary), **Changes** (por issue), **Requirements Addressed** (REQ-N → Spec.md), **Verification** (Milestone Gate + UAT), **Security** (se SECURITY.md existe), **Key Decisions** (DECISIONS.md do sprint). Nunca fabrique REQ/decisão — sintetize do disco; marque `[artefato ausente]` se faltar.

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

---

## Modo: /build

**Argumento:** caminho da issue

Atalho que executa `/plan` seguido de `/execute` com transição de contexto gerenciada.

1. Execute o fluxo completo de `/plan` para a issue
2. **Safety valve:** antes de prosseguir para `/execute`, liste os passos atômicos inline. Se a lista revelar **>5 passos** ou **dependências complexas entre arquivos**, PARE: o ciclo plan→execute não cabe em uma sessão. Instrua o usuário a rodar `/break` para subdividir a issue e abortar o `/build`.
3. Se a lista inline tiver ≤5 passos, continue diretamente para `/execute` sem exigir `/clear` manual — resuma o contexto internamente antes de prosseguir
4. `/build` também segue integralmente as Harness Rules: ler STATE.md no início, rodar Gate Check (com Nyquist + Package Legitimacy), registrar Spec Deviations, atualizar STATE.md no final
5. Ao concluir: emita o **Bloco de Handoff** (regra Next Command) com o comando completo do próximo estágio — `/project-maker verify [path real]` se user-facing, `/project-maker secure [path real]` se tocou segurança, `/project-maker ship [path real]` se há remote (ou o merge local no fallback). Como `/build` roda tudo numa sessão só, **omita a linha do `/clear`** se o próximo passo continua aqui; inclua se o próximo estágio pede sessão nova

---

## Modo: /pause

**Argumento:** nenhum (opcional: nota de contexto livre)

Encerra a sessão atual de forma explícita, deixando `STATE.md` em condições de ser retomado por outra sessão sem perder contexto.

**Ações:**
1. Atualize `STATE.md → Current Session`:
   - `Last updated`: timestamp agora
   - `Active feature/issue`: path da issue/sprint em progresso
   - `Phase`: fase atual (spec | break | plan | execute | verify | secure | ship | review)
   - `Next action`: 1 linha objetiva do próximo passo
   - `Next command`: comando completo e copiável, path real (o mesmo do Bloco de Handoff)
   - `Next model`: tier/modelo recomendado para esse comando
   - `Files in progress`: lista de arquivos abertos/em edição
   - `Session handoff note`: 2-3 linhas explicando onde paramos e o que a próxima sessão precisa saber
2. Se houver blockers ativos novos, adicione em `STATE.md → Blockers`
3. Se o usuário passou uma nota como argumento, inclua-a no handoff note
4. **Não faça commit automático.** Se há trabalho em progresso não-commitado, alerte o usuário e pergunte se quer commit WIP ou stash
5. Resuma em 3-5 bullets para o usuário: onde parou, blockers ativos, próximo passo sugerido, arquivos em aberto
6. Feche com o **Bloco de Handoff** (regra Next Command): o comando exato para retomar depois — `/project-maker resume` — **mais** o comando que virá em seguida, com path real, para a próxima sessão não precisar redescobrir. Grave esse mesmo comando no `Next command` do STATE.md

---

## Modo: /resume

**Argumento:** nenhum

Retoma o trabalho a partir do `STATE.md` da última sessão. É a forma correta de voltar a um projeto sem perder contexto.

**Ações:**
1. Leia `STATE.md` completo — especialmente `Current Session` (incluindo `Next command` / `Next model`), `Blockers`, `Lessons Learned` recentes
2. Leia `DECISIONS.md` (últimas entradas) e `KNOWLEDGE.md`
3. Leia `Constitution.md` + `steering/` (base load)
4. Leia `PRD.md` para saber status atual dos sprints
5. Abra o artefato indicado em `Active feature/issue` (issue, sprint ou spec)
6. Resuma ao usuário em **5 bullets**:
   - **Onde paramos**: [feature/issue + fase]
   - **O que falta**: [próximo passo + handoff note]
   - **Blockers ativos**: [lista ou "nenhum"]
   - **Arquivos relevantes**: [lista curta]
   - **Próxima ação sugerida**: veja o bloco abaixo
7. Feche com o **Bloco de Handoff** (regra Next Command) — comando completo, path real resolvido do disco (confirme que o arquivo existe antes de citar), sem linha de `/clear` (o `/resume` já está na sessão nova):
   > **▶ Próximo passo**
   > ```
   > /project-maker execute docs/sprints/SPRINT-003-checkout.md
   > ```
   > **Modelo:** Sonnet — orquestrador.
8. Pergunte ao usuário:
   - "Quer continuar de onde paramos?" → prossiga
   - "Ou mudar de direção?" → escute e ajuste

`/resume` **não** executa automaticamente o próximo passo. Sempre aguarda confirmação do usuário antes de rodar qualquer comando.

---

## Referências

- `references/brief-template.md` — formato do brief.md (leia no /discover ao gerar)
- `references/spec-template.md` — formato do Spec.md (leia no /spec ao gerar)
- `references/context-template.md` — formato do context.md (leia no Discuss phase do /spec)
- `references/sprint-template.md` — formato dos sprints (leia no /break ao gerar)
- `references/issue-template.md` — formato de issues (leia no /break, com Done when / Tests / Gate / Summary)
- `references/uat-template.md` — formato do uat.md resumível (leia no /verify e no /execute Passo 4.5)
- `references/security-template.md` — formato do SECURITY.md (leia no /secure ao gerar)
- `references/pr-body-template.md` — formato do corpo do PR (leia no /ship ao montar o PR)
- `references/state-template.md` — formato do STATE.md (leia no /init ao gerar)
- `references/decisions-template.md` — formato do DECISIONS.md (leia no /init ao gerar)
- `references/knowledge-template.md` — formato do KNOWLEDGE.md (leia no /init ao gerar)
- `references/concerns-template.md` — formato do steering/CONCERNS.md (leia no /init ao gerar)
- `references/agents/` — agentes especializados com frontmatter Claude Code; o /init Passo 4 os instala em `.claude/agents/` do projeto (subagent_type nativo); fallback: ler como prompt no /execute
- `references/agents/validator.md` — agente de validação independente (usado no loop do /execute; sem Write/Edit no frontmatter)

**Artefatos gerados no projeto:**
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
- `research.md` — gerado no /break
- `data-model.md` — gerado no /break
- `contracts/` — gerado no /break
- `research.md` — inclui `## Package Legitimacy Audit` quando a spec exige instalar pacotes
- `sprints/` — gerado no /break (com `## Waves`), atualizado no /execute (reassess + milestone gate)
- `issues/` — gerado no /break, enriquecido no /plan, fechado no /execute
- `uat.md` — gerado no /verify (ou /execute Passo 4.5); resumível, com cold-start smoke e gaps YAML
- `SECURITY.md` — gerado no /secure; threat model + veredito que o /ship lê
- `PRD.md` — gerado no /break, atualizado no /execute
