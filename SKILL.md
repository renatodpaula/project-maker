---
name: project-maker
author: Renato de Paula Cardoso <renato@renatodpaula.com.br>
homepage: https://github.com/renatodpaula/project-maker
license: MIT
description: |
  Workflow Spec-Driven Development para criar projetos ou adicionar features com IA de forma estruturada.
  Use este skill quando o usuário quiser organizar uma ideia de projeto, fazer brainstorming, criar um
  projeto do zero, planejar uma nova feature, quebrar uma spec em tarefas, pesquisar e planejar uma
  issue, ou executar uma implementação. Sempre use antes de começar qualquer projeto ou feature nova.
  Triggers explícitos: "criar projeto", "nova feature", "quero construir algo", "organizar minha ideia",
  "brainstorming de projeto", "planejar implementação", "quebrar em issues", "implementar issue",
  "/discover", "/init", "/spec", "/break", "/plan", "/execute", "/build".
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
/execute [sprint]    → orquestra: implementer → validator
                        → reassess → milestone gate
                        → UAT → PRD                             (todos)
/build [issue]       → atalho: plan + execute (issue isolada)   (Small/Medium)
/pause               → snapshot em STATE.md para próxima sessão (qualquer hora)
/resume              → retoma a partir de STATE.md              (qualquer hora)
```

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
- `sprints/` — sprints com Goal, Success Criteria, Issues, Reassess Notes
- `issues/` — issues de execução geradas pelo /break
- `uat.md` — script de UAT interativo (condicional, gerado no /execute)

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

**Ao confirmar:** instrua a iniciar nova conversa com `/project-maker init`.

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

- `STATE.md` na raiz — de `references/state-template.md`. Preencher `Current Session` com fase atual (`init`), `Next action` ("iniciar /spec"), demais seções vazias.
- `DECISIONS.md` na raiz — de `references/decisions-template.md`. Deixar vazio; append conforme decisões são tomadas.
- `KNOWLEDGE.md` na raiz — de `references/knowledge-template.md`. Deixar vazio; append conforme patterns/gotchas são descobertos.
- `steering/CONCERNS.md` — de `references/concerns-template.md`. Deixar vazio; preenchido conforme tech debt e áreas frágeis aparecem.

**Ao final:** instrua a iniciar nova conversa com `/project-maker spec new`.

---

## Modo: /spec

**Argumentos:** `new` (projeto do zero) ou `feature` (em projeto existente)

**Passo 1 — Contexto**
- Se existirem `steering/` e `Constitution.md`: leia-os antes de qualquer coisa.
- Se existir `brief.md`: leia-o. Não repita perguntas já respondidas nele.
- Se argumento for `feature`: use o agente `code-explorer` (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/feature-dev/agents/code-explorer.md`) para mapear o codebase existente antes de criar a spec.

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

**Ao final:** exiba resumo da spec, liste marcadores `[NEEDS CLARIFICATION]` restantes se houver, e instrua:
> "Spec gerada. Faça `/clear` e inicie nova conversa com `/project-maker break`."

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
```

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

**Ao final:** liste sprints com suas issues e indicação de paralelismo. Instrua:
> "Artefatos gerados: research.md, data-model.md, contracts/, sprints/, issues/ e PRD.md. Faça `/clear` e inicie nova conversa com `/project-maker execute sprints/SPRINT-001-[slug].md`."

---

## Modo: /plan

**Argumento:** caminho ou nome da issue (ex: `issues/prototype/01-pagina-login.md`)

Leia `Constitution.md` e `steering/` se existirem — definem restrições que devem ser respeitadas no plano.
Leia `data-model.md` e o contrato relevante em `contracts/` se existirem.
Leia a issue completa, incluindo os campos `Implements`, `Depends on` e `Can parallelize with`.

**Passo 1 — Pesquisa interna**
Use o agente `code-explorer` (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/feature-dev/agents/code-explorer.md`) para:
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

**Ao final:** instrua:
> "Issue planejada. Faça `/clear` e inicie nova conversa com `/project-maker execute [caminho-da-issue]`."

---

## Modo: /execute

**Argumento:** caminho de um **sprint** (`sprints/SPRINT-NNN-[slug].md`) ou, em modo `--quick`, de uma issue isolada.

`/execute` é um **orquestrador**. Ele não escreve código diretamente — dispara sub-agents separados para implementar e validar cada issue do sprint, roda reassess ao fim, e aplica o Milestone Validation Gate antes de fechar o sprint.

**Fluxo geral:**

```
/execute SPRINT-NNN
  │
  ├─ Session Loading (STATE, DECISIONS, KNOWLEDGE, Constitution, steering)
  ├─ Para cada issue do sprint (respeitando Depends on e [P]):
  │    ├─ spawn implementer (sub-agent isolado)
  │    ├─ spawn validator (sub-agent separado, lê issue + diff + gate result)
  │    ├─ se fail e <3 tentativas → re-dispatch implementer com gaps do validator
  │    ├─ se pass → fecha issue, atualiza PRD + STATE
  │    └─ se 3 fails → marca blocker, pula
  ├─ Reassess Phase (4 perguntas, atualiza PRD/DECISIONS/KNOWLEDGE)
  ├─ Milestone Validation Gate (todos os Success Criteria verificados)
  └─ Fecha sprint como done OU pending-review
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

Marque o sprint como `🔄 in-progress` no PRD.md e no próprio sprint.md.

### Passo 1 — Branch isolada do sprint

```bash
git checkout -b sprint/[slug-do-sprint]
```

Todas as issues do sprint são commitadas nesta mesma branch (1 commit por issue), fechando o sprint com um merge único em main ao final.

### Passo 2 — Loop de implementação por issue

Para cada issue do sprint, na ordem correta (respeitando `Depends on`; issues `[P]` podem rodar em paralelo):

**2.1 — Phase Gates constitucionais** (checagem rápida antes de delegar):
- Respeita stack do Constitution.md?
- Alinhada com data-model.md e contracts/?
- Sem features especulativas?
- Inputs validados no servidor, sem secrets expostos?
- Testes serão escritos junto?

Se algum gate falhar, documente a exceção no Summary da issue antes de prosseguir.

**2.2 — Spawn do implementer** (sub-agent isolado)

Dispare um sub-agent usando o agente apropriado de `references/agents/` conforme o tipo de arquivo da issue:

| Tipo de arquivo | Agente |
|---|---|
| Componentes UI (`.tsx`, `.vue`, `.svelte`) | `references/agents/component-writer.md` |
| Server actions, lógica de servidor | `references/agents/action-writer.md` |
| Hooks de estado/efeito | `references/agents/hook-writer.md` |
| Schema, migrations, modelos | `references/agents/model-writer.md` |
| Rotas de API, endpoints | `references/agents/route-writer.md` |
| Integrações externas | `references/agents/integration-writer.md` |
| Arquivos de teste | `references/agents/test-writer.md` |

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

Dispare `references/agents/validator.md` como sub-agent independente. O validator **nunca** implementa — só avalia.

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

**Fluxo:**
1. Gere `uat.md` na raiz do sprint (ou ao lado da issue, se `--quick`) a partir de `references/uat-template.md`
2. Preencha Setup, Test Steps (caminho feliz + edge cases + visual polish) baseado nos `Done when` das issues do sprint
3. Apresente ao usuário e peça para executar
4. Registre o resultado no próprio `uat.md`
5. Se `pass` → prossiga para Passo 5
6. Se `fail` ou `partial` → registre os steps falhados em `STATE.md → Blockers`, mantenha sprint como `⏸ pending-review`, liste action items

O UAT **não substitui** o Milestone Gate — é complementar, só para features onde a experiência importa.

### Passo 5 — Propor merge do sprint

Se o Milestone Gate passou:

- Marque sprint como `✅ done` em PRD.md e sprint.md (preencha `Fechado em`)
- Mostre `git diff main` consolidado do sprint
- Proponha: `git checkout main && git merge sprint/[slug]`
- Aguarde confirmação do usuário

Se rejeitado pelo usuário, liste pendências, registre em STATE.md → Blockers, marque sprint como `⏸ pending-review` e aguarde instruções.

---

### Modo `--quick`: /execute em issue isolada

Quando a escala for `--quick` (bug fix, mudança pequena), `/execute` aceita uma issue isolada sem sprint:

- Pula o conceito de sprint
- Rodar Passo 0 (Session Loading simplificado — STATE + Constitution), Passo 1 (branch por issue), Passo 2 completo (implementer + validator loop), pula Passo 3 (reassess) e Passo 4 (milestone gate)
- Atualiza STATE/PRD normalmente no Passo 2.5

---

## Modo: /build

**Argumento:** caminho da issue

Atalho que executa `/plan` seguido de `/execute` com transição de contexto gerenciada.

1. Execute o fluxo completo de `/plan` para a issue
2. **Safety valve:** antes de prosseguir para `/execute`, liste os passos atômicos inline. Se a lista revelar **>5 passos** ou **dependências complexas entre arquivos**, PARE: o ciclo plan→execute não cabe em uma sessão. Instrua o usuário a rodar `/break` para subdividir a issue e abortar o `/build`.
3. Se a lista inline tiver ≤5 passos, continue diretamente para `/execute` sem exigir `/clear` manual — resuma o contexto internamente antes de prosseguir
4. `/build` também segue integralmente as Harness Rules: ler STATE.md no início, rodar Gate Check, registrar Spec Deviations, atualizar STATE.md no final

---

## Modo: /pause

**Argumento:** nenhum (opcional: nota de contexto livre)

Encerra a sessão atual de forma explícita, deixando `STATE.md` em condições de ser retomado por outra sessão sem perder contexto.

**Ações:**
1. Atualize `STATE.md → Current Session`:
   - `Last updated`: timestamp agora
   - `Active feature/issue`: path da issue/sprint em progresso
   - `Phase`: fase atual (spec | break | plan | execute | review)
   - `Next action`: 1 linha objetiva do próximo passo
   - `Files in progress`: lista de arquivos abertos/em edição
   - `Session handoff note`: 2-3 linhas explicando onde paramos e o que a próxima sessão precisa saber
2. Se houver blockers ativos novos, adicione em `STATE.md → Blockers`
3. Se o usuário passou uma nota como argumento, inclua-a no handoff note
4. **Não faça commit automático.** Se há trabalho em progresso não-commitado, alerte o usuário e pergunte se quer commit WIP ou stash
5. Resuma em 3-5 bullets para o usuário: onde parou, blockers ativos, próximo passo sugerido, arquivos em aberto

---

## Modo: /resume

**Argumento:** nenhum

Retoma o trabalho a partir do `STATE.md` da última sessão. É a forma correta de voltar a um projeto sem perder contexto.

**Ações:**
1. Leia `STATE.md` completo — especialmente `Current Session`, `Blockers`, `Lessons Learned` recentes
2. Leia `DECISIONS.md` (últimas entradas) e `KNOWLEDGE.md`
3. Leia `Constitution.md` + `steering/` (base load)
4. Leia `PRD.md` para saber status atual dos sprints
5. Abra o artefato indicado em `Active feature/issue` (issue, sprint ou spec)
6. Resuma ao usuário em **5 bullets**:
   - **Onde paramos**: [feature/issue + fase]
   - **O que falta**: [próximo passo + handoff note]
   - **Blockers ativos**: [lista ou "nenhum"]
   - **Arquivos relevantes**: [lista curta]
   - **Próxima ação sugerida**: [comando concreto — ex: `/execute sprints/SPRINT-003-checkout.md`]
7. Pergunte ao usuário:
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
- `references/uat-template.md` — formato do uat.md (leia no /execute quando disparar UAT)
- `references/state-template.md` — formato do STATE.md (leia no /init ao gerar)
- `references/decisions-template.md` — formato do DECISIONS.md (leia no /init ao gerar)
- `references/knowledge-template.md` — formato do KNOWLEDGE.md (leia no /init ao gerar)
- `references/concerns-template.md` — formato do steering/CONCERNS.md (leia no /init ao gerar)
- `references/agents/` — instruções dos agentes especializados (leia no /execute conforme necessário)
- `references/agents/validator.md` — agente de validação independente (usado no loop do /execute)

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
- `sprints/` — gerado no /break, atualizado no /execute (reassess + milestone gate)
- `issues/` — gerado no /break, enriquecido no /plan, fechado no /execute
- `uat.md` — gerado no /execute quando UAT interativo é disparado
- `PRD.md` — gerado no /break, atualizado no /execute
