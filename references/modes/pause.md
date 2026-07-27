# Modo: /pause

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.

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
