# Modo: /break

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.

**Argumento:** caminho de uma spec (`docs/specs/FEAT-012-....md`), ou nada — neste caso o Passo 0 resolve o alvo.

**Pré-requisito:** existir **alvo** — uma spec não quebrada ou backlog não agendado no `PRD.md`. Leia `Constitution.md` e `steering/` se existirem.

**Paths:** este modo grava tudo no diretório canônico de artefatos (padrão `docs/` — regra **Localização canônica** das Harness Rules). Os paths abaixo usam o padrão; se `steering/structure.md` registrar outro diretório, use o registrado.

### Passo 0 — Resolver o alvo (obrigatório, antes de qualquer outro passo)

Nunca comece a quebrar sem saber **o que** está quebrando. Ordem de precedência:

1. **Argumento recebido** — use o path dado. Se não existir no disco, pare e reporte (não adivinhe spec parecida).
2. **Spec sem sprint** — liste as specs do projeto (`docs/specs/*.md`, ou `Spec.md` na raiz em projeto single-feature) e cruze com o `PRD.md`: qual spec **não** tem sprint correspondente? Se há exatamente uma, é o alvo. Se há mais de uma, pergunte qual (`AskUserQuestion`) listando-as com o REQ count de cada.
3. **Backlog não agendado do `PRD.md`** — a seção `### Backlog não agendado` (ou equivalente) com itens de tech debt/achados de review. Quebrar backlog em sprint é uso legítimo do modo: não gera `Spec.md`, os REQs viram os próprios itens do backlog, e o header de rastreabilidade das issues aponta para a origem do achado em vez de `REQ-N`.
4. **Nada dos três** — **não fique perguntando o que fazer**. O projeto não tem trabalho pendente de decomposição; o próximo passo é **criar** o insumo. Pule direto para o Bloco de Handoff com `/project-maker spec feature "[nome]"` como comando primário (`/project-maker discover` se a ideia ainda é vaga), e diga em uma linha o que foi verificado: specs conferidas contra o PRD, backlog vazio.

Só depois de fixar o alvo, siga para o Passo 1.

Leia a spec-alvo completa (ou os itens do backlog). Leia `references/issue-template.md` para o formato de issue.

**Passo 1 — research.md**
Antes de quebrar em issues, gere `docs/research.md` com:
- **Bibliotecas candidatas**: opções para cada necessidade técnica da spec, com trade-offs e compatibilidade com o stack definido em `steering/tech.md`
- **Padrões de implementação**: como implementar os comportamentos da spec seguindo os padrões do projeto
- **Riscos técnicos**: dependências externas frágeis, integrações complexas, edge cases de performance ou segurança
- **Decisões tomadas**: para cada ponto de escolha, documente a opção escolhida e o motivo

Use WebSearch/WebFetch para pesquisar documentação e compatibilidade quando necessário.

**Package Legitimacy Audit (obrigatório quando a spec exige instalar pacotes).** Para cada pacote candidato, gere a tabela abaixo em `docs/research.md` seguindo a regra **Package Legitimacy Gate** das Harness Rules. Verifique cada um (`npm view` / `pip index versions` / página do registry) antes de taguear:

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
Gere `docs/data-model.md` com:
- Entidades do domínio e seus atributos (com tipos)
- Relacionamentos entre entidades
- Schema de banco de dados ou estrutura de coleções
- Regras de validação e constraints

**Passo 3 — contracts/**
Para cada endpoint ou integração identificada na spec, gere um arquivo em `docs/contracts/[nome].md` com:
- Método e rota (para APIs HTTP)
- Request: headers, params, body (com tipos e exemplos)
- Response: status codes, body de sucesso, body de erro
- Autenticação e autorização necessárias

**Passo 4 — Issues de prototype** (salvar em `docs/issues/prototype/`)
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

**Passo 5 — Issues funcionais** (salvar em `docs/issues/functional/`)
Uma issue por comportamento ou grupo de comportamentos da Spec. Cada issue torna um prototype funcional: conecta ao banco, chama APIs, valida dados, trata erros.

Mesmo header de rastreabilidade da etapa anterior. Mesma regra de ferro.

**Formato de nome de arquivo:** `[numero]-[slug-do-titulo].md` (ex: `01-pagina-login.md`, `05-submit-form-cadastro.md`)

**Marque issues paralelas com `[P]`** no nome e no sprint: issues sem dependências entre si podem ser executadas em paralelo.

**Passo 6 — Sprints** (salvar em `docs/sprints/SPRINT-NNN-[slug].md`)

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
