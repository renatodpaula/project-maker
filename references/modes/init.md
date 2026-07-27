# Modo: /init

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.

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
- **Onde vivem os artefatos do workflow** (regra **Localização canônica** das Harness Rules): diretório de `sprints/`, `issues/`, `contracts/`, research/data-model — padrão `docs/`, ou a convenção que o projeto já usa. Os demais modos leem daqui.

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
- O frontmatter passa a valer de verdade: `tools:` restringe ferramentas por harness (o validator **não tem** Write/Edit — edits diretos ficam bloqueados pelo harness; ele mantém Bash para rodar o Gate, então o shell ainda pode escrever arquivo — para endurecer de verdade, restrinja o Bash do validator a comandos de teste nas permission rules do projeto) e `model:` define o modelo default do agente
- Se já existir um agente com o mesmo nome em `.claude/agents/`, **não sobrescreva** — avise e pule

Se o usuário recusar ou o projeto não quiser os agentes, tudo continua funcionando no modo fallback (ler o .md e usar como prompt de sub-agent genérico).

**Ao final:** emita o **Bloco de Handoff** (regra Next Command) com o comando completo — `spec new` em projeto novo, `spec feature "[nome]"` se o init foi rodado em projeto existente:
> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker spec new
> ```
> **Modelo:** tier raciocínio (Opus/Fable) — captura de requisitos define tudo downstream.
