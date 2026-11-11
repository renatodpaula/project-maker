#!/usr/bin/env bash
# project-maker autopilot — hook git pre-push. Instale em .git/hooks/pre-push (references/autopilot/hooks.md).
#
# Durante um run de autopilot (.pm-autopilot/ledger.md com status running|waiting_user|paused), só passa o
# push que traz PM_CONDUCTOR_PUSH=<run_id do ledger>, e nunca para main/master. O condutor monta o push com
# o token; agente de etapa não tem por que conhecê-lo. Como roda dentro do git, pega push vindo de script,
# Makefile, python -c ou caminho absoluto — o que o pm-guard.sh (que só lê o texto do comando) não vê.
# Fora de um run, não faz nada.
root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
ledger="$root/.pm-autopilot/ledger.md"
[ -f "$ledger" ] || exit 0
grep -Eq '^status: *(running|waiting_user|paused)' "$ledger" || exit 0
run_id="$(sed -n 's/^run_id: *"\{0,1\}\([^" #]*\).*/\1/p' "$ledger" | head -1)"

if [ -z "$run_id" ] || [ "${PM_CONDUCTOR_PUSH:-}" != "$run_id" ]; then
  echo "pm-pre-push: há um run de autopilot ativo ($run_id); push é do condutor." >&2
  echo "  Para empurrar você mesmo: PM_CONDUCTOR_PUSH=$run_id git push …  (ou encerre o run: /project-maker autopilot stop)" >&2
  exit 1
fi
while read -r _local_ref _local_sha remote_ref _remote_sha; do
  case "$remote_ref" in
    refs/heads/main|refs/heads/master)
      echo "pm-pre-push: push para ${remote_ref#refs/heads/} durante o run é proibido (merge é humano)." >&2
      exit 1 ;;
  esac
done
exit 0
