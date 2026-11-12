# Modo: /spec

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.
> **Com `--autopilot`** (rodando dentro do `/project-maker autopilot`): aplique `references/autopilot/stage-contract.md` — linha `spec` da tabela §2. Pergunta vira decisão no bloco `PM_STAGE_RESULT`; a resposta final é só o bloco.

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
4. Grave as decisões no context da spec — `context.md` na raiz em `/spec new`, `docs/specs/FEAT-NNN-[slug]/context.md` em `/spec feature` (use `references/context-template.md` como base)
5. Liste também `Constraints descobertas` que saíram da conversa e vão virar REQ ou atualizar Constitution.md
6. Se alguma gray area ficou sem resposta e você teve que assumir, registre em `Assumptions não-confirmadas` com o risco explicitado

`context.md` é input obrigatório de `/plan` e `/execute` para a feature.

**Passo 3 — Gerar Spec.md**
Leia `references/spec-template.md` para o formato. **Onde gravar** (regra Localização canônica): `/spec new` → `Spec.md` na raiz; `/spec feature` → `docs/specs/FEAT-NNN-[slug]/spec.md`, numa pasta nova (NNN = linha `next_feat` de `python3 <skill-dir>/scripts/pm.py paths`). Uma feature nunca sobrescreve `Spec.md` nem outra spec. Feature já especificada em arquivo solto (`docs/specs/FEAT-NNN-[slug].md`, layout anterior) continua onde está: edite no lugar, não mova.

- **Overview** — o que é, para quem, qual problema resolve
- **Fora de escopo** — o que esta spec decide não fazer
- **Requisitos** — lista numerada (REQ-1, REQ-2...) de requisitos funcionais, cada um com acceptance criteria em **EARS**. Escolha o padrão que descreve o requisito:
  > Evento: `WHEN [gatilho] the [sistema] SHALL [resposta]`
  > Estado: `WHILE [estado] the [sistema] SHALL [resposta]`
  > Indesejado (erro, abuso, falha externa): `IF [condição] THEN the [sistema] SHALL [resposta]`
  > Sempre válido: `The [sistema] SHALL [resposta]`
  > Exemplo: `IF the token is expired THEN the system SHALL return 401 and not touch the stored link`

  Todo requisito com caminho de erro relevante tem pelo menos um critério do padrão "Indesejado" — é o que mais falta em spec gerada por IA. Critério com número (tempo, tamanho, limite) diz como medir.
- **Superfícies** — por onde o usuário ou outro sistema alcança o produto. Com interface visual: **Páginas** (rota e propósito) e **Componentes** (elementos por página). Sem interface: comandos de CLI, endpoints, funções públicas, jobs — o que existir. Não invente telas para um projeto que não tem.
- **Comportamentos** — caminho feliz + edge cases + erros, usando EARS

Para `/spec feature`: inclua em cada item qual código existente será reutilizado ou modificado.

**Passo 4 — Constitution.md** (apenas em `/spec new` sem /init prévio)
Se não existir `Constitution.md`, gere seguindo as mesmas instruções do `/init` Passo 2 (ver `references/modes/init.md`).

**Passo 5 — Aprovação da spec (modo manual)**
A spec é o contrato de tudo que vem depois: erro aqui se multiplica em issues e código. Antes do handoff, mostre o resumo (Overview em 2 linhas, lista de REQs com 1 linha cada, Fora de escopo, assumptions) e pergunte com `AskUserQuestion`: **Aprovar** · **Ajustar** (o usuário diz o quê; aplique e pergunte de novo) · **Deixar em rascunho**. Grave `Status: approved | draft` no topo da spec. Com `draft`, o comando primário do handoff é retomar a spec, e o `/break` não entra no bloco. (Com `--autopilot` não há pergunta aqui: as decisões críticas já passaram pelo condutor.)

**Ao final:** exiba resumo da spec, liste marcadores `[NEEDS CLARIFICATION]` restantes se houver, e feche com o **Bloco de Handoff** (regra Next Command) — comando completo + modelo na mesma caixa:
> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker break docs/specs/FEAT-012-prompt-caching-provider-agnostic/spec.md
> ```
> **Modelo:** Sonnet · effort high — 88,5/100 no break a 1/3 do custo do Fable (91,5, só no perfil max); Opus · medium se velocidade importa mais.

**O argumento é o path real da spec que você acabou de gravar** — nunca emita `/project-maker break` pelado (regra Next Command 10). Em projeto multi-spec, comando sem alvo faz a sessão seguinte abrir sem saber o que quebrar.

Se restaram marcadores `[NEEDS CLARIFICATION]` sem resolver, o bloco muda: o comando primário passa a ser resolver os marcadores nesta sessão, e o `/break` vira a alternativa rotulada.
