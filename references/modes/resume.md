# Modo: /resume

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.

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
