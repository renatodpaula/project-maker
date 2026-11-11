#!/usr/bin/env bash
# project-maker autopilot — guard de ações outward-facing/destrutivas (hook PreToolUse, matcher Bash).
#
# Ativo só quando há run de autopilot desta sessão: .pm-autopilot/ledger.md com status
# running|waiting_user|paused e conductor_sid igual ao session_id do hook (sub-agentes herdam o
# session_id da sessão principal). Ledger antigo de outra sessão não trava trabalho manual.
#
# Em SUB-AGENTE (input traz agent_id): nega push, PR (gh pr create/merge/ready/edit, gh api em pulls/merges),
#   qualquer git merge, branch -D, reset --hard, clean -f, stash (push/pop/drop/apply/clear/save), checkout/restore
#   da árvore inteira, update-ref -d, deploy/publish pelos CLIs comuns, e qualquer tentativa de mexer no hook
#   pre-push ou no token do condutor.
# Na sessão principal (condutor): nega gh pr merge, push --force/-f, refspec com "+" e push para main/master.
#
# Limite conhecido: isto casa TEXTO de comando. Push disparado de dentro de um script (python -c, node -e,
# Makefile) não aparece aqui. Quem fecha esse caminho é o hook git scripts/pm-pre-push.sh, que roda dentro
# do próprio git. Instale os dois (references/autopilot/hooks.md).
#
# Instalação opt-in: ver references/autopilot/hooks.md. Requer jq; sem jq, nega Bash de sub-agente durante o
# run (falha fechada) e avisa no stderr.
set -u
input="$(cat)"
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
ledger="$root/.pm-autopilot/ledger.md"
[ -f "$ledger" ] || exit 0
grep -Eq '^status: *(running|waiting_user|paused)' "$ledger" || exit 0

if ! command -v jq >/dev/null 2>&1; then
  case "$input" in
    *'"agent_id"'*)
      echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"autopilot: pm-guard sem jq — instale jq ou desinstale o guard"}}'
      exit 0 ;;
  esac
  echo "pm-guard: jq ausente, guard inativo na sessão principal" >&2
  exit 0
fi

sid="$(printf '%s' "$input" | jq -r '.session_id // empty')"
conductor="$(sed -n -e 's/^conductor_sid: *"\([^"]*\)".*/\1/p' -e 's/^conductor_sid: *\([^" #][^ #]*\).*/\1/p' "$ledger" | head -1)"
[ -n "$conductor" ] && [ -n "$sid" ] && [ "$sid" != "$conductor" ] && exit 0

cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"
agent_id="$(printf '%s' "$input" | jq -r '.agent_id // empty')"
[ -n "$cmd" ] || exit 0

deny() {
  printf '%s %s agent=%s cmd=%s\n' "$(date '+%F %T')" "$1" "${agent_id:-main}" "$cmd" >> "$root/.pm-autopilot/guard.log"
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

# Posição de comando: início, depois de ; & | ( { ` $( , depois de then/do/else/elif/!, ou dentro de
# bash -c / sh -c / eval. Em seguida, qualquer sequência de prefixos que não mudam o comando executado:
# sudo/time/exec/nohup/command/env/xargs (com flags) e atribuições VAR=valor.
START='(^|[;&|({`]|\$\(|(^|[[:space:];])(then|do|else|elif|!)[[:space:]]|(bash|sh|zsh) +-c +["'"'"']?|eval +["'"'"']?)[[:space:]]*'
PREFIX='((sudo|time|exec|nohup|command|env|xargs)( +-[^ ]+)* +|[A-Za-z_][A-Za-z0-9_]*=[^ ]* +)*'
POS="${START}${PREFIX}"
# git por caminho (/usr/bin/git) e com opções globais antes do subcomando: -C <dir>, -c k=v, --git-dir=..., --no-pager
GIT="${POS}([^ ]*/)?git( +(-C +[^ ]+|-c +[^ ]+|--[a-z-]+(=[^ ]+)?))* +"
END='([[:space:]]|$|[;&|)"'"'"'])'
BARE='[[:space:]]*($|[;&|)"'"'"'])'

m() { printf '%s' "$cmd" | grep -Eq "$1"; }

if [ -n "$agent_id" ]; then
  m "${GIT}push${END}" && deny "autopilot: agente de etapa não faz git push (é do condutor)"
  m "${POS}gh( +[^;&|]*)? +pr +(create|merge|ready|edit)${END}" && deny "autopilot: agente de etapa não cria/edita/mergeia PR (é do condutor)"
  m "${POS}gh +api +[^;&|]*(pulls|merges)" && m '(-X|--method)[ =]*(POST|PUT|PATCH)|(^| )(-f|-F|--field|--raw-field|--input)([ =]|$)' && deny "autopilot: gh api de escrita em PR é do condutor"
  m "${GIT}merge${END}" && deny "autopilot: merge é decisão humana"
  m "${GIT}branch +(-D|--delete +--force)${END}" && deny "autopilot: branch -D proibido no stage contract"
  m "${GIT}reset( +[^;&|]*)? +--hard${END}" && deny "autopilot: reset --hard proibido no stage contract"
  m "${GIT}clean( +[^;&|]*)? +(-[a-zA-Z]*f|--force)" && deny "autopilot: clean -f proibido no stage contract"
  m "${GIT}stash${BARE}" && deny "autopilot: stash proibido no stage contract (perde trabalho de outra etapa)"
  m "${GIT}stash +([^;&|]*)" && ! m "${GIT}stash +(list|show)${END}" && deny "autopilot: stash proibido no stage contract (perde trabalho de outra etapa)"
  m "${GIT}checkout( +--)? +\.${END}" && deny "autopilot: checkout da árvore inteira proibido no stage contract"
  m "${GIT}restore( +[^;&|]*)? +\.${END}" && deny "autopilot: restore da árvore inteira proibido no stage contract"
  m "${GIT}update-ref +(-d|--delete)${END}" && deny "autopilot: update-ref -d proibido no stage contract"
  m "${GIT}config( +[^;&|]*)? +core\.hooksPath" && deny "autopilot: agente de etapa não troca core.hooksPath"
  m 'PM_CONDUCTOR_PUSH|hooks/pre-push' && deny "autopilot: token e hook de push são do condutor"
  m "${POS}(npx +|bunx +|pnpm +dlx +)?(vercel|netlify|wrangler|fly|flyctl|firebase|railway)( +[^;&|]*)? +(deploy|publish|up|--prod)${END}" && deny "autopilot: deploy é decisão humana"
  m "${POS}(npm|pnpm|yarn|bun)( +run)? +(deploy|release|publish)${END}" && deny "autopilot: deploy/publish é decisão humana"
  m "${POS}supabase( +[^;&|]*)? +db +push${END}" && deny "autopilot: migration em banco remoto é decisão humana"
  m "${POS}(terraform|tofu|pulumi) +(apply|up|destroy)${END}" && deny "autopilot: mudança de infra é decisão humana"
else
  m "${POS}gh( +[^;&|]*)? +pr +merge${END}" && deny "autopilot: merge de PR é sempre humano"
  m "${GIT}push( +[^;&|]*)? +(--force[a-z-]*|-f)${END}" && deny "autopilot: push --force proibido durante o run"
  m "${GIT}push( +[^;&|]*)? +\+" && deny "autopilot: refspec com + (force) proibido durante o run"
  m "${GIT}push( +[^;&|]*)? +([^ ]*:)?(refs/heads/)?(main|master)${END}" && deny "autopilot: push direto para main/master proibido"
fi
exit 0
