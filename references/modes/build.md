# Modo: /build

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados. Este modo roda `/plan` + `/execute` — leia também `references/modes/plan.md` e `references/modes/execute.md`.

**Argumento:** caminho da issue

Atalho que executa `/plan` seguido de `/execute` com transição de contexto gerenciada.

1. Execute o fluxo completo de `/plan` para a issue
2. **Safety valve:** antes de prosseguir para `/execute`, liste os passos atômicos inline. Se a lista revelar **>5 passos** ou **dependências complexas entre arquivos**, PARE: o ciclo plan→execute não cabe em uma sessão. Instrua o usuário a rodar `/break` para subdividir a issue e abortar o `/build`. **Se não existe `Spec.md`** (fluxo veio direto de `--quick`, sem spec), o `/break` não roda — o Bloco de Handoff instrui `/project-maker spec feature "[nome]"` primeiro, com o `/break` na linha `**Depois:**`
3. Se a lista inline tiver ≤5 passos, continue diretamente para `/execute` sem exigir `/clear` manual — resuma o contexto internamente antes de prosseguir
4. `/build` também segue integralmente as Harness Rules: ler STATE.md no início, rodar Gate Check (com Nyquist + Package Legitimacy), registrar Spec Deviations, atualizar STATE.md no final
5. Ao concluir: emita o **Bloco de Handoff** (regra Next Command) com o comando completo do próximo estágio — `/project-maker verify [path real]` se user-facing, `/project-maker secure [path real]` se tocou segurança, `/project-maker ship [path real]` se há remote (ou o merge local no fallback). Como `/build` roda tudo numa sessão só, **omita a linha do `/clear`** se o próximo passo continua aqui; inclua se o próximo estágio pede sessão nova
