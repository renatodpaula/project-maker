# Modo: /spec

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.

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
Se não existir `Constitution.md`, gere seguindo as mesmas instruções do `/init` Passo 2 (ver `references/modes/init.md`).

**Ao final:** exiba resumo da spec, liste marcadores `[NEEDS CLARIFICATION]` restantes se houver, e feche com o **Bloco de Handoff** (regra Next Command) — comando completo + modelo na mesma caixa:
> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker break docs/specs/FEAT-012-prompt-caching-provider-agnostic.md
> ```
> **Modelo:** tier raciocínio (Opus/Fable) — pesquisa + decomposição é raciocínio puro.

**O argumento é o path real da spec que você acabou de gravar** — nunca emita `/project-maker break` pelado (regra Next Command 10). Em projeto multi-spec, comando sem alvo faz a sessão seguinte abrir sem saber o que quebrar.

Se restaram marcadores `[NEEDS CLARIFICATION]` sem resolver, o bloco muda: o comando primário passa a ser resolver os marcadores nesta sessão, e o `/break` vira a alternativa rotulada.
