---
name: project-maker
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

## Escala do problema

Detecte ou pergunte a escala antes de começar. Isso determina quais etapas são obrigatórias:

| Escala | Quando usar | Etapas obrigatórias |
|--------|-------------|---------------------|
| `--quick` | Bug fix, melhoria pequena, tarefa isolada | `/plan` → `/execute` |
| `--feature` | Nova feature em projeto existente (padrão) | `/spec feature` → `/break` → `/plan` → `/execute` |
| `--epic` | Projeto do zero ou sistema completo | `/discover` → `/init` → `/spec new` → `/break` → `/plan` → `/execute` |

Se o usuário não especificou escala, infira pelo contexto. Bug fix → `--quick`. Feature em projeto existente → `--feature`. Projeto novo → `--epic`.

## Fluxo completo

```
/discover           → brief.md                          (--epic, opcional)
/init               → steering/ + Constitution.md        (--epic)
/spec [new|feature] → Spec.md com EARS                  (--feature e --epic)
/break              → research.md + data-model.md
                      + contracts/ + PRD.md + issues/    (--feature e --epic)
/plan [issue]       → issue enriquecida                 (todos)
/execute [issue]    → branch → Phase Gates → agentes
                      → review → verifica → PRD update   (todos)
/build [issue]      → atalho: plan + execute             (todos)
```

**Artefatos persistentes (memory bank do projeto):**
- `steering/product.md` — visão, usuários, propósito do produto
- `steering/structure.md` — convenções de código, estrutura de diretórios
- `steering/tech.md` — stack, versões, decisões arquiteturais
- `Constitution.md` — princípios não negociáveis (gerado no /init ou /spec new)
- `brief.md` — ideia inicial estruturada (gerado no /discover)
- `Spec.md` — requisitos funcionais com acceptance criteria em EARS
- `research.md` — pesquisa técnica pré-implementação
- `data-model.md` — entidades, schemas, relacionamentos
- `contracts/` — especificações de API (endpoints, payloads, responses)
- `PRD.md` — estado vivo do produto com rastreabilidade de issues
- `issues/` — issues de execução geradas pelo /break

Detecte o modo pelo argumento recebido (`$ARGUMENTS`). Se não houver argumento, pergunte qual etapa o usuário quer executar, a escala do problema, e explique o fluxo acima.

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
Gere os 3 arquivos de contexto global do projeto em `steering/`:

`steering/product.md`:
- Visão do produto (1 parágrafo)
- Usuários-alvo e seus principais jobs-to-be-done
- Proposta de valor e diferencial
- Escopo da v1 (o que está IN e o que está explicitamente OUT)

`steering/structure.md`:
- Estrutura de diretórios do projeto (gere a árvore)
- Convenções de nomenclatura (arquivos, variáveis, funções, componentes)
- Padrão de organização por feature ou por camada
- Onde ficam testes, tipos, utilitários

`steering/tech.md`:
- Stack completa com versões (linguagem, framework, banco, ORM, libs principais)
- Decisões arquiteturais já tomadas e o porquê de cada uma
- Ferramentas de build, lint, test e CI/CD
- Integrações externas e seus SDKs

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

**Passo 5 — Issues funcionais** (salvar em `issues/functional/`)
Uma issue por comportamento ou grupo de comportamentos da Spec. Cada issue torna um prototype funcional: conecta ao banco, chama APIs, valida dados, trata erros.

Mesmo header de rastreabilidade da etapa anterior.

**Formato de nome de arquivo:** `[numero]-[slug-do-titulo].md` (ex: `01-pagina-login.md`, `05-submit-form-cadastro.md`)

**Marque issues paralelas com `[P]`** no nome e no PRD: issues sem dependências entre si podem ser executadas em paralelo.

**Passo 6 — PRD.md**
Gere `PRD.md` na raiz como documento vivo do produto:

```markdown
# PRD — [Nome do Projeto]
_Última atualização: [data]_

## Visão geral
[2-3 linhas do que o produto é e para quem — extraído do steering/product.md]

## Épicos
### [Nome do épico]
| Issue | Título | Implementa | Paralelo | Status |
|-------|--------|------------|----------|--------|
| prototype/01 | [título] | REQ-1, REQ-2 | [P] sim/não | 🔲 pendente |
| functional/05 | [título] | REQ-3 | [P] sim/não | 🔲 pendente |
```

Status: `🔲 pendente` · `🔄 em progresso` · `✅ entregue`

**Ao final:** liste issues por grupo com indicação de paralelismo e instrua:
> "Artefatos gerados: research.md, data-model.md, contracts/, issues/ e PRD.md. Faça `/clear` e inicie nova conversa com `/project-maker plan issues/prototype/01-[nome].md`."

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

**Argumento:** caminho da issue enriquecida

Leia `Constitution.md` e `steering/` se existirem.
Leia `data-model.md` e contratos relevantes em `contracts/` se existirem.
Leia a issue completa. Se não estiver enriquecida (sem seção "Arquivos a criar"), instrua a rodar `/plan` primeiro.

**Passo 1 — Branch isolada**
```bash
git checkout -b issue/[slug-da-issue]
```

**Passo 2 — Phase Gates constitucionais**
Antes de implementar, verifique cada gate. Se algum falhar, documente a exceção com justificativa antes de prosseguir:

```
### Phase -1: Constitutional Gates
- [ ] A implementação respeita a stack definida em Constitution.md?
- [ ] Segue os padrões arquiteturais (sem over-engineering, máx. 3 camadas de abstração)?
- [ ] Está alinhada com data-model.md e contracts/ existentes?
- [ ] Sem features especulativas ("pode ser útil no futuro")?
- [ ] Inputs validados no servidor? Nenhum secret exposto?
- [ ] Testes serão escritos junto com a implementação?
```

**Passo 3 — Identificar agentes necessários**
Com base nos tipos de arquivo da issue, identifique quais agentes usar. Leia os arquivos correspondentes em `references/agents/`. Spawne em paralelo quando os arquivos forem independentes (sem dependência de dados entre si).

| Tipo de arquivo | Agente |
|-----------------|--------|
| Componentes UI (`.tsx`, `.vue`, `.svelte`) | `references/agents/component-writer.md` |
| Server actions, lógica de servidor | `references/agents/action-writer.md` |
| Hooks de estado/efeito | `references/agents/hook-writer.md` |
| Schema, migrations, modelos | `references/agents/model-writer.md` |
| Rotas de API, endpoints | `references/agents/route-writer.md` |
| Integrações externas | `references/agents/integration-writer.md` |
| Arquivos de teste | `references/agents/test-writer.md` |

**Passo 4 — Quality review**
Use o agente `code-reviewer` (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/feature-dev/agents/code-reviewer.md`) nos arquivos criados/modificados.

**Passo 5 — Verificação**
Execute os comandos de verificação da issue (testes, lint, typecheck). Corrija falhas antes de prosseguir. Verifique que os acceptance criteria EARS da issue foram atendidos.

**Passo 6 — Atualizar PRD.md**
Se `PRD.md` existir, atualize:
- Status da issue: `🔲 pendente` → `✅ entregue`
- Data de "Última atualização"

**Passo 7 — Propor merge**
Mostre o diff (`git diff main`) e pergunte ao usuário:
- Se aprovar: instrua `git checkout main && git merge issue/[slug]`
- Se rejeitar: liste pendências e aguarde instruções

---

## Modo: /build

**Argumento:** caminho da issue

Atalho que executa `/plan` seguido de `/execute` com transição de contexto gerenciada.

1. Execute o fluxo completo de `/plan` para a issue
2. Ao terminar, continue diretamente para `/execute` sem exigir `/clear` manual — resuma o contexto internamente antes de prosseguir
3. Útil para issues simples onde o ciclo plan→execute cabe em uma sessão

---

## Referências

- `references/brief-template.md` — formato do brief.md (leia no /discover ao gerar)
- `references/spec-template.md` — formato do Spec.md (leia no /spec ao gerar)
- `references/issue-template.md` — formato de issues (leia no /break ao gerar)
- `references/agents/` — instruções dos agentes especializados (leia no /execute conforme necessário)

**Artefatos gerados no projeto:**
- `brief.md` — gerado no /discover
- `steering/product.md`, `steering/structure.md`, `steering/tech.md` — gerados no /init
- `Constitution.md` — gerado no /init ou /spec new
- `Spec.md` — gerado no /spec (com EARS e rastreabilidade REQ-N)
- `research.md` — gerado no /break
- `data-model.md` — gerado no /break
- `contracts/` — gerado no /break
- `PRD.md` — gerado no /break, atualizado no /execute
- `issues/` — gerado no /break
