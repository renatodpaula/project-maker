# Hooks do autopilot (opt-in)

> Parte do skill **project-maker**. Opcional: o autopilot funciona sem hooks — as proibições do Stage Contract já estão no prompt de cada agente de etapa. O hook transforma a regra "agente de etapa nunca faz push/PR/reset" de **instrução** em **bloqueio do harness**.

## Guard de push/PR/destrutivos — `scripts/pm-guard.sh`

**O que faz:** hook `PreToolUse` no `Bash`. Só age quando há run ativo **desta sessão**: `.pm-autopilot/ledger.md` com `status: running|waiting_user|paused` e `conductor_sid` igual ao `session_id` do hook (sub-agentes herdam o `session_id` da sessão principal). Ledger antigo de outra sessão não trava trabalho manual.

| Quem chama | Negado |
|---|---|
| Sub-agente (input do hook traz `agent_id`) | a lista canônica da regra 5 do `stage-contract.md`: `git push`, `gh pr create/merge/ready/edit`, `gh api` de escrita em pulls/merges, qualquer `git merge`, `git branch -D`, `git reset --hard`, `git clean -f`, `git stash` (qualquer forma exceto `stash list`/`stash show`), `git checkout -- .` |
| Sessão principal (condutor) | `gh pr merge`, `git push --force`/`-f`, refspec com `+`, push direto para `main`/`master` |

O casamento é por **posição de comando** (início, depois de `;` `&&` `|` `(` `$(`, ou dentro de `bash -c`/`sh -c`/`eval`) e ignora opções globais do git (`git -C <dir> push` é pego). Texto entre aspas numa mensagem de commit ou argumento de `grep` normalmente não dispara; se contiver separador de comando (`-m 'x; git push'`), dispara — falso positivo no sentido seguro. Cada negação vai para `.pm-autopilot/guard.log`. Requer `jq` — sem ele, o guard **nega** Bash de sub-agente durante o run (falha fechada) e avisa.

**Verificado em Claude Code 2.1.282:** o input de hook traz `agent_id` e `agent_type` quando o Bash roda num sub-agente e não traz na sessão principal; o `session_id` é o mesmo nos dois. Suíte de 41 casos (`bash scripts/test-pm-guard.sh`) (push via `-C`, `bash -c`, `$(…)`, commit message, `merge-base`, `stash list`, ledger de outra sessão) passou.

**Instalação** (o condutor oferece no preflight e só grava com a sua aprovação — `settings.local.json` não é commitado):

```bash
mkdir -p .claude/hooks && cp <skill-dir>/scripts/pm-guard.sh .claude/hooks/ && chmod +x .claude/hooks/pm-guard.sh
```

Em `.claude/settings.local.json`, faça o merge (não sobrescreva hooks existentes):

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [ { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/pm-guard.sh" } ] }
    ]
  }
}
```

## Medidor da janela de uso (statusline → arquivo)

O Claude Code entrega à **statusline** o uso do plano: `.rate_limits.five_hour.used_percentage`, `.rate_limits.five_hour.resets_at`, `.rate_limits.seven_day.*`. O condutor do autopilot não recebe isso diretamente — mas se a sua statusline gravar esse trecho num arquivo, ele lê antes de cada etapa e **pausa antes de estourar a janela** (em vez de a etapa morrer no meio com "You've hit your session limit").

Acrescente ao seu script de statusline (ele já recebe o JSON em stdin, aqui como `$input`):

```bash
echo "$input" | jq -c '.rate_limits // empty' > ~/.claude/pm-usage.json 2>/dev/null
```

Sem o arquivo, o autopilot segue sem esse freio (os tetos de etapas do perfil continuam valendo).

## Permissões

Um prompt de permissão no meio de um agente de etapa **para o run** até você responder — é seguro, mas quebra o "sem você". Antes de um run longo, escolha um:

- **Auto mode** (`/permissions` ou `--permission-mode auto`) — o classificador aprova ações rotineiras e bloqueia as arriscadas. Não funciona com Haiku (o autopilot não usa Haiku em etapa que escreve).
- **acceptEdits + allowlist** em `.claude/settings.local.json` para os comandos do projeto (`node --test`, `npm test`, `git add`, `git commit`, `git checkout -b`…).

Evite `bypassPermissions` fora de sandbox: com ele o guard acima é a única barreira contra push acidental.
