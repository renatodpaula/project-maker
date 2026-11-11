#!/usr/bin/env bash
# Testes do scripts/pm-guard.sh. Uso: bash scripts/test-pm-guard.sh  (requer jq). Sai com 1 se algum caso falhar.
set -u
GUARD="$(cd "$(dirname "$0")" && pwd)/pm-guard.sh"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/.pm-autopilot"
ledger() { printf -- '---\nstatus: %s\nconductor_sid: "S1"\n---\n' "$1" > "$T/.pm-autopilot/ledger.md"; }
run() { local out; out=$(printf '%s' "$1" | CLAUDE_PROJECT_DIR="$T" bash "$GUARD"); [ -n "$out" ] && printf '%s' "$out" | jq -r '.hookSpecificOutput.permissionDecision' || echo allow; }
sub()  { jq -cn --arg c "$1" --arg s "${2:-S1}" '{session_id:$s,agent_id:"a1",tool_input:{command:$c}}'; }
main() { jq -cn --arg c "$1" --arg s "${2:-S1}" '{session_id:$s,tool_input:{command:$c}}'; }
fails=0
check() { local r; r=$(run "$2"); if [ "$r" = "$1" ]; then echo "ok    $1  $3"; else echo "FAIL  esperado=$1 obtido=$r  $3"; fails=$((fails+1)); fi; }
ledger running
check deny  "$(sub 'git push -u origin sprint/x')"            "sub: git push"
check deny  "$(sub 'git -C /abs/path push origin x')"         "sub: git -C <dir> push"
check deny  "$(sub 'git -c core.x=1 push')"                   "sub: git -c k=v push"
check deny  "$(sub 'bash -c "git push"')"                     "sub: bash -c"
check deny  "$(sub "sh -c 'git push origin x'")"              "sub: sh -c"
check deny  "$(sub 'x=$(git push origin y)')"                 "sub: \$(...)"
check deny  "$(sub 'cd . && git push')"                       "sub: cd && push"
check deny  "$(sub 'gh -R o/r pr create --title x')"          "sub: gh -R pr create"
check deny  "$(sub 'gh pr edit 3 --base main')"               "sub: gh pr edit"
check deny  "$(sub 'gh api repos/o/r/pulls -X POST -f t=x')"  "sub: gh api POST pulls"
check allow "$(sub 'gh api repos/o/r/pulls')"                 "sub: gh api GET pulls"
check deny  "$(sub 'git merge main')"                         "sub: merge"
check allow "$(sub 'git merge-base main HEAD')"               "sub: merge-base"
check deny  "$(sub 'git stash')"                              "sub: stash"
check deny  "$(sub 'git stash pop')"                          "sub: stash pop"
check allow "$(sub 'git stash list')"                         "sub: stash list"
check deny  "$(sub 'git reset --hard HEAD~1')"                "sub: reset --hard"
check allow "$(sub 'git reset HEAD file.js')"                 "sub: reset (soft)"
check deny  "$(sub 'git checkout -- .')"                      "sub: checkout -- ."
check allow "$(sub 'git checkout -b sprint/x')"               "sub: checkout -b"
check deny  "$(sub 'git branch -D sprint/x')"                 "sub: branch -D"
check allow "$(sub 'git commit -m "fix: git push docs"')"     "sub: commit msg citando push"
check allow "$(sub 'grep -rn "git push" docs/')"              "sub: grep"
check allow "$(sub 'node --test')"                            "sub: testes"
check allow "$(main 'git push -u origin sprint/x')"           "main: push do branch"
check deny  "$(main 'git push --force origin x')"             "main: --force"
check deny  "$(main 'git push origin +sprint/x')"             "main: +refspec"
check deny  "$(main 'git push origin HEAD:main')"             "main: HEAD:main"
check deny  "$(main 'gh pr merge 3 --squash')"                "main: pr merge"
check allow "$(sub 'git push' 'OUTRA')"                       "ledger de outra sessão"
check deny  "$(sub 'git stash save wip')"                     "sub: stash save"
check deny  "$(sub 'git stash -u')"                           "sub: stash -u"
check deny  "$(sub 'git clean -xf')"                          "sub: clean -xf"
check deny  "$(sub 'git clean -d --force')"                   "sub: clean --force"
check deny  "$(sub 'git reset -q --hard HEAD')"               "sub: reset -q --hard"
check deny  "$(sub 'gh api repos/o/r/pulls --method=POST')"   "sub: gh api --method=POST"
check deny  "$(sub 'gh api repos/o/r/pulls --field title=x')" "sub: gh api --field"
check deny  "$(sub "git commit -m 'x; git push'")"            "sub: commit msg com ; git push (falso positivo seguro)"
# formas que a v3.3 deixava passar
check deny  "$(sub '/usr/bin/git push origin x')"             "sub: git por caminho absoluto"
check deny  "$(sub 'env git push')"                           "sub: env git push"
check deny  "$(sub 'FOO=1 git push')"                         "sub: VAR=1 git push"
check deny  "$(sub 'if true; then git push; fi')"             "sub: then git push"
check deny  "$(sub 'for b in x; do git push origin $b; done')" "sub: do git push"
check deny  "$(sub 'time git push')"                          "sub: time git push"
check deny  "$(sub 'echo x | xargs git push')"                "sub: xargs git push"
check deny  "$(sub 'echo x | xargs -n1 git push origin')"     "sub: xargs -n1 git push"
check deny  "$(sub '{ git push; }')"                          "sub: { git push; }"
check deny  "$(sub 'sudo env A=1 git -C . push')"             "sub: prefixos empilhados"
check deny  "$(sub 'git checkout .')"                         "sub: checkout ."
check deny  "$(sub 'git restore .')"                          "sub: restore ."
check allow "$(sub 'git restore --staged src/a.js')"          "sub: restore --staged de um arquivo"
check allow "$(sub 'git checkout sprint/x')"                  "sub: checkout de branch"
check deny  "$(sub 'git update-ref -d refs/heads/x')"         "sub: update-ref -d"
check deny  "$(sub 'git config core.hooksPath /dev/null')"    "sub: core.hooksPath"
check deny  "$(sub 'PM_CONDUCTOR_PUSH=AP-1 git push')"        "sub: token do condutor"
check deny  "$(sub 'rm .git/hooks/pre-push')"                 "sub: apagar o pre-push"
check deny  "$(sub 'npm run deploy')"                         "sub: npm run deploy"
check deny  "$(sub 'npx vercel --prod')"                      "sub: vercel --prod"
check deny  "$(sub 'wrangler deploy')"                        "sub: wrangler deploy"
check deny  "$(sub 'supabase db push')"                       "sub: supabase db push"
check deny  "$(sub 'terraform apply -auto-approve')"          "sub: terraform apply"
check allow "$(sub 'npm run build && npm test')"              "sub: build e teste"
check allow "$(sub 'grep -rn deploy docs/')"                  "sub: grep deploy"
check allow "$(sub 'echo then git status')"                   "sub: then como argumento, sem push"
check allow "$(main 'PM_CONDUCTOR_PUSH=AP-1 git push -u origin sprint/x')" "main: push com token"
check deny  "$(main '/usr/bin/git push --force origin x')"    "main: caminho absoluto --force"
check deny  "$(main 'env git push origin HEAD:main')"         "main: env push para main"
# ledger no formato exato do ledger-template (com comentário na linha do conductor_sid)
printf -- '---\nstatus: running            # comentário\nconductor_sid: "S1"          # $CLAUDE_CODE_SESSION_ID\n---\n' > "$T/.pm-autopilot/ledger.md"
check allow "$(sub 'git push' 'OUTRA')"                       "template: ledger de outra sessão"
check deny  "$(sub 'git push')"                               "template: mesma sessão"
ledger done
check allow "$(sub 'git push')"                               "ledger done"

# --- hook git pre-push (scripts/pm-pre-push.sh): roda dentro do git, pega push vindo de qualquer lugar
HOOK="$(cd "$(dirname "$0")" && pwd)/pm-pre-push.sh"
R=$(mktemp -d); O=$(mktemp -d)
git init -q --bare "$O/o.git"
git init -q -b sprint/x "$R" && git -C "$R" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
git -C "$R" remote add origin "$O/o.git"
cp "$HOOK" "$R/.git/hooks/pre-push" && chmod +x "$R/.git/hooks/pre-push"
push() { local want="$1" desc="$2"; shift 2; ( cd "$R" && "$@" ) >/dev/null 2>&1; local got=$?; [ "$got" -ne 0 ] && got=1
  if [ "$got" = "$want" ]; then echo "ok    exit=$got  $desc"; else echo "FAIL  esperado=$want obtido=$got  $desc"; fails=$((fails+1)); fi; }
rledger() { mkdir -p "$R/.pm-autopilot"; printf -- '---\nrun_id: AP-1\nstatus: %s\n---\n' "$1" > "$R/.pm-autopilot/ledger.md"; }
push 0 "pre-push: sem ledger, push livre"                    git push -q origin sprint/x
rledger running
push 1 "pre-push: run ativo, push sem token"                 git push -q origin sprint/x:refs/heads/a
push 1 "pre-push: run ativo, push via python"                python3 -c "import subprocess,sys;sys.exit(subprocess.call(['git','push','-q','origin','sprint/x:refs/heads/b']))"
push 1 "pre-push: token errado"                              env PM_CONDUCTOR_PUSH=AP-9 git push -q origin sprint/x:refs/heads/c
push 0 "pre-push: token do run"                              env PM_CONDUCTOR_PUSH=AP-1 git push -q origin sprint/x:refs/heads/d
push 1 "pre-push: token do run, mas para main"               env PM_CONDUCTOR_PUSH=AP-1 git push -q origin sprint/x:refs/heads/main
rledger done
push 0 "pre-push: run encerrado, push livre"                 git push -q origin sprint/x:refs/heads/e
rm -rf "$R" "$O"

echo "---"; [ "$fails" -eq 0 ] && echo "todos os casos passaram" || { echo "$fails caso(s) falharam"; exit 1; }
