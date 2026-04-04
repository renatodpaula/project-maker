---
name: project-maker
description: |
  Workflow Spec-Driven Development para criar projetos ou adicionar features com IA de forma estruturada.
  Use este skill quando o usuário quiser organizar uma ideia de projeto, fazer brainstorming, criar um
  projeto do zero, planejar uma nova feature, quebrar uma spec em tarefas, pesquisar e planejar uma
  issue, ou executar uma implementação. Sempre use antes de começar qualquer projeto ou feature nova.
  Triggers explícitos: "criar projeto", "nova feature", "quero construir algo", "organizar minha ideia",
  "brainstorming de projeto", "planejar implementação", "quebrar em issues", "implementar issue",
  "/discover", "/spec", "/break", "/plan", "/execute", "/build".
---

# Project Maker

Workflow estruturado de 6 etapas para construir projetos com IA sem vibe coding.

## Fluxo completo

```
/discover           → brief.md              (opcional — brainstorming guiado)
/spec [new|feature] → Spec.md               → Constitution.md (só em new) → /clear
/break              → PRD.md + issues/      → /clear
/plan [issue]       → issue enriquecida     → /clear
/execute [issue]    → branch isolada → verifica → atualiza PRD.md → propõe merge
/build [issue]      → atalho: plan + execute automático
```

**Artefatos persistentes:**
- `brief.md` — ideia inicial em linguagem estruturada
- `Constitution.md` — princípios não negociáveis do projeto (stack, estilo, arquitetura, segurança)
- `Spec.md` — requisitos funcionais detalhados
- `PRD.md` — estado vivo do produto: o que foi planejado, o que está em progresso, o que foi entregue

Detecte o modo pelo argumento recebido (`$ARGUMENTS`). Se não houver argumento, pergunte qual etapa o usuário quer executar e explique o fluxo acima.

---

## Modo: /discover

**Quando usar:** O usuário tem uma ideia mas ainda não sabe exatamente o que construir.

Conduza uma conversa de brainstorming — **uma pergunta por vez**, não um formulário. Espere a resposta antes de fazer a próxima pergunta. Reflita de volta o que entendeu a cada resposta para confirmar.

Sequência de perguntas:
1. Qual problema você quer resolver? Para quem é?
2. Como seria o fluxo principal — o que o usuário faz do início ao fim?
3. O que é essencial ter na primeira versão? O que pode ficar para depois?
4. Tem alguma restrição técnica? (stack preferida, integrações obrigatórias)
5. Conhece algum produto similar que admira? O que gosta nele?

Após cobrir todas as áreas (ou quando o usuário indicar que está satisfeito):
- Leia `references/brief-template.md` para o formato
- Gere o `brief.md` na raiz do projeto
- Mostre o brief ao usuário e pergunte se quer ajustar algo
- Ao confirmar: instrua a iniciar nova conversa com `/project-maker spec new`

---

## Modo: /spec

**Argumentos:** `new` (projeto do zero) ou `feature` (em projeto existente)

**Passo 1 — Contexto**
- Se existir `brief.md` na raiz: leia-o antes de qualquer coisa. Não repita perguntas já respondidas nele.
- Se argumento for `feature`: use o agente `code-explorer` (em `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/feature-dev/agents/code-explorer.md`) para mapear o codebase existente antes de criar a spec.

**Passo 2 — Perguntas de complemento**
Faça apenas as perguntas que o brief não respondeu ou que o codebase não deixa claro. Foque em:
- Páginas/telas necessárias (se não definidas)
- Comportamentos específicos por componente
- Integrações e dados necessários

**Passo 3 — Gerar Spec.md**
Leia `references/spec-template.md` para o formato. Gere `Spec.md` na raiz com:
- **Overview** — o que é, para quem, qual problema resolve
- **Páginas** — cada tela com rota e propósito
- **Componentes** — cada elemento visual por página
- **Comportamentos** — o que o usuário pode fazer em cada componente (caminho feliz + edge cases + erros)

Para `/spec feature`: inclua em cada item qual código existente será reutilizado ou modificado.

**Passo 4 — Gerar Constitution.md** (apenas em `/spec new`)
Gere `Constitution.md` na raiz com os princípios não negociáveis do projeto:
- **Stack** — linguagens, frameworks e bibliotecas obrigatórias
- **Arquitetura** — padrões estruturais (ex: feature-based, monorepo, serverless)
- **Estilo de código** — convenções de nomenclatura, formatação, organização de arquivos
- **Segurança** — regras inegociáveis (ex: nunca expor secrets, sempre validar inputs no servidor)
- **Performance** — limites aceitáveis (ex: bundle size, tempo de resposta)
- **Qualidade** — cobertura mínima de testes, lint obrigatório antes de merge

> A Constitution.md deve ser lida no início de todos os modos subsequentes (`/break`, `/plan`, `/execute`). Ela define o que nunca pode ser violado.

**Ao final:** exiba um resumo da spec e instrua:
> "Spec e Constitution geradas. Faça `/clear` para limpar o contexto e inicie nova conversa com `/project-maker break`."

---

## Modo: /break

**Pré-requisito:** `Spec.md` deve existir na raiz. Se `Constitution.md` existir, leia-o primeiro.

Leia a Spec.md completa. Leia `references/issue-template.md` para o formato de issue.

**Passo 1 — Issues de prototype** (salvar em `issues/prototype/`)
Uma issue por página. Cada issue descreve apenas a parte visual — layout, componentes, estados visuais (loading, vazio, erro). Sem lógica de negócio, sem chamadas de API.

**Passo 2 — Issues funcionais** (salvar em `issues/functional/`)
Uma issue por comportamento da Spec. Cada issue torna um prototype funcional: conecta ao banco, chama APIs, valida dados, trata erros.

**Formato de nome de arquivo:** `[numero]-[slug-do-titulo].md` (ex: `01-pagina-login.md`, `05-submit-form-cadastro.md`)

**Passo 3 — Gerar PRD.md**
Gere `PRD.md` na raiz como documento vivo do produto. Formato:

```markdown
# PRD — [Nome do Projeto]
_Última atualização: [data]_

## Visão geral
[2-3 linhas do que o produto é e para quem]

## Épicos
### [Nome do épico]
| Issue | Título | Status |
|-------|--------|--------|
| prototype/01 | [título] | 🔲 pendente |
| functional/05 | [título] | 🔲 pendente |
```

Status possíveis: `🔲 pendente` · `🔄 em progresso` · `✅ entregue`

> O PRD.md é atualizado automaticamente a cada `/execute` concluído.

**Ao final:** liste todas as issues criadas em dois grupos (prototype / functional) e instrua:
> "Issues e PRD gerados. Faça `/clear` e inicie nova conversa com `/project-maker plan issues/prototype/01-[nome].md` para começar pelo primeiro prototype."

---

## Modo: /plan

**Argumento:** caminho ou nome da issue (ex: `issues/prototype/01-pagina-login.md`)

Se `Constitution.md` existir na raiz, leia-o antes de qualquer coisa — ele define restrições que devem ser respeitadas no plano.

Leia a issue completa.

**Passo 1 — Pesquisa interna**
Use o agente `code-explorer` (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/feature-dev/agents/code-explorer.md`) para:
- Encontrar arquivos existentes que se relacionam com a issue
- Identificar padrões de implementação já usados no projeto
- Detectar código reutilizável (componentes, hooks, utils, tipos)

**Passo 2 — Pesquisa externa**
Use WebSearch/WebFetch para buscar:
- Documentação das tecnologias usadas na issue
- Padrões de implementação para o que precisa ser feito
- Exemplos de código quando relevante

**Passo 3 — Enriquecer a issue**
Reescreva a issue adicionando as seções que faltam:
- **Arquivos a criar**: path completo + o que criar em cada um
- **Arquivos a modificar**: path + linha aproximada + o que modificar e por quê
- **Padrões de implementação**: snippets dos padrões encontrados
- **Verificação**: comandos reais de teste/lint/typecheck do projeto

Salve sobrescrevendo o arquivo da issue original.

**Ao final:** instrua:
> "Issue planejada. Faça `/clear` e inicie nova conversa com `/project-maker execute [caminho-da-issue]`."

---

## Modo: /execute

**Argumento:** caminho da issue enriquecida

Se `Constitution.md` existir na raiz, leia-o antes de qualquer coisa — ele define restrições que devem ser respeitadas na implementação.

Leia a issue completa. Verifique se está enriquecida (tem seção "Arquivos a criar/modificar"). Se não estiver, instrua a rodar `/plan` primeiro.

**Passo 1 — Branch isolada**
```bash
git checkout -b issue/[slug-da-issue]
```

**Passo 2 — Identificar agentes necessários**
Com base nos tipos de arquivo da issue, identifique quais agentes usar. Leia os arquivos correspondentes em `references/agents/` para as instruções de cada um. Spawne os agentes em paralelo quando os arquivos forem independentes.

| Tipo de arquivo | Agente |
|-----------------|--------|
| Componentes UI (`.tsx`, `.vue`, `.svelte`) | `references/agents/component-writer.md` |
| Server actions, lógica de servidor | `references/agents/action-writer.md` |
| Hooks de estado/efeito | `references/agents/hook-writer.md` |
| Schema, migrations, modelos | `references/agents/model-writer.md` |
| Rotas de API, endpoints | `references/agents/route-writer.md` |
| Integrações externas | `references/agents/integration-writer.md` |
| Arquivos de teste | `references/agents/test-writer.md` |

**Passo 3 — Quality review**
Após implementação, use o agente `code-reviewer` (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/feature-dev/agents/code-reviewer.md`) nos arquivos criados/modificados.

**Passo 4 — Verificação**
Execute os comandos de verificação da issue (testes, lint, typecheck). Corrija falhas antes de prosseguir.

**Passo 5 — Atualizar PRD.md**
Se `PRD.md` existir na raiz, atualize o status da issue concluída de `🔲 pendente` para `✅ entregue` e atualize a data de "Última atualização".

**Passo 6 — Propor merge**
Mostre o diff (`git diff main`) e pergunte ao usuário:
- Se aprovar: instrua `git checkout main && git merge issue/[slug]`
- Se rejeitar: liste as pendências e aguarde instruções

---

## Modo: /build

**Argumento:** caminho da issue

Atalho que executa `/plan` seguido de `/execute` com transição de contexto gerenciada.

1. Execute o fluxo completo de `/plan` para a issue
2. Ao terminar o plan, continue diretamente para `/execute` sem exigir `/clear` manual — resuma o contexto internamente antes de prosseguir com a execução
3. Útil para issues simples onde o ciclo plan→execute pode ser feito em uma sessão

---

## Referências

- `references/brief-template.md` — formato do brief.md (leia no /discover ao gerar)
- `references/spec-template.md` — formato do Spec.md (leia no /spec ao gerar)
- `references/issue-template.md` — formato de issues (leia no /break ao gerar)
- `references/agents/` — instruções dos agentes especializados (leia no /execute conforme necessário)

**Artefatos gerados no projeto (não são templates):**
- `brief.md` — gerado no /discover
- `Constitution.md` — gerado no /spec new
- `Spec.md` — gerado no /spec
- `PRD.md` — gerado no /break, atualizado no /execute
- `issues/` — gerado no /break
