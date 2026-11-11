#!/usr/bin/env bash
# Testes do scripts/pm.py. Uso: bash scripts/test-pm.sh  (requer python3). Sai com 1 se algum caso falhar.
set -u
PM="$(cd "$(dirname "$0")" && pwd)/pm.py"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
fails=0
# check <exit esperado> <descrição> <args...>
check() {
  local want="$1" desc="$2"; shift 2
  python3 "$PM" --root "$T" "$@" >"$T/.out" 2>&1; local got=$?
  if [ "$got" = "$want" ]; then echo "ok    exit=$got  $desc"; else echo "FAIL  esperado=$want obtido=$got  $desc"; sed 's/^/        /' "$T/.out"; fails=$((fails+1)); fi
}
state() { printf -- '- **Next command**: `%s`\n' "$1" > "$T/STATE.md"; }
issue() { # issue <path> <implements> <arquivo...>
  local p="$T/$1" impl="$2"; shift 2; mkdir -p "$(dirname "$p")"
  { printf '# Issue\n\n**Status**: planned\nImplements: %s\n\n## Arquivos a criar\n> Preenchido pelo /plan\n\n' "$impl"
    for f in "$@"; do printf -- '- `%s` — x\n' "$f"; done; printf '\n---\n\n## Done when\n'; } > "$p"
}
sprint() { # sprint <waves...>
  { printf '# Sprint 001\n\n**Status**: in-progress\n\n## Issues\n\n'
    printf -- '- [ ] `docs/issues/functional/01-a.md`\n- [ ] `docs/issues/functional/02-b.md` [P]\n- [ ] `docs/issues/functional/03-c.md`\n'
    printf '\n## Waves\n\n```\n'; for w in "$@"; do printf '%s\n' "$w"; done; printf '```\n\n## Implements\n'; } > "$T/docs/sprints/SPRINT-001-x.md"
}
mkdir -p "$T/docs/sprints"
printf '# Spec\n\n- REQ-1 a\n- REQ-2 b\n- REQ-3 c\n' > "$T/Spec.md"
issue docs/issues/functional/01-a.md "REQ-1" src/a.js src/shared.js
issue docs/issues/functional/02-b.md "REQ-2" src/b.js
issue docs/issues/functional/03-c.md "REQ-3" src/c.js src/shared.js

# --- next
check 1 "next: sem STATE.md"                         next
state "/project-maker execute docs/sprints/SPRINT-[NNN]-x.md"
check 1 "next: placeholder"                          next
state "/project-maker execute docs/sprints/SPRINT-009-nada.md"
check 1 "next: path inexistente"                     next
sprint "Wave 1 (paralelo): functional/01, functional/02" "Wave 2: functional/03"
state "/project-maker execute docs/sprints/SPRINT-001-x.md"
check 0 "next: comando válido"                       next
check 0 "next: --expect igual"                       next --expect "/project-maker execute docs/sprints/SPRINT-001-x.md"
check 1 "next: --expect diferente"                   next --expect "/project-maker ship docs/sprints/SPRINT-001-x.md"
state '/project-maker spec feature "cobrança [beta]"'
check 0 "next: colchete dentro de aspas não é placeholder" next
state "/project-maker execute"
check 0 "next: sem alvo com um sprint só"            next
cp "$T/docs/sprints/SPRINT-001-x.md" "$T/docs/sprints/SPRINT-002-y.md"
check 1 "next: sem alvo com dois sprints"            next
rm "$T/docs/sprints/SPRINT-002-y.md"
state "npm test"
check 1 "next: comando que não é do skill"           next

# --- status
check 0 "status: lista sprints"                      status

# --- coverage
check 0 "coverage: todos os REQs com issue"          coverage
issue docs/issues/functional/03-c.md "REQ-9" src/c.js
check 1 "coverage: REQ-3 sem issue e REQ-9 inexistente" coverage
issue docs/issues/functional/03-c.md "REQ-3" src/c.js src/shared.js
check 1 "coverage: spec inexistente"                 coverage docs/specs/nada.md

# --- waves
check 0 "waves: 01 e 03 dividem arquivo em waves diferentes" waves docs/sprints/SPRINT-001-x.md
sprint "Wave 1 (paralelo): functional/01, functional/03" "Wave 2: functional/02"
check 1 "waves: colisão de src/shared.js na mesma wave" waves docs/sprints/SPRINT-001-x.md
sprint "Wave 1 (paralelo): functional/01, functional/02"
check 1 "waves: issue 03 fora de qualquer wave"      waves docs/sprints/SPRINT-001-x.md
sprint "Wave 1: functional/01, functional/99"
check 1 "waves: referência que não casa com issue"   waves docs/sprints/SPRINT-001-x.md
printf '# Sprint\n\n**Status**: planned\n' > "$T/docs/sprints/SPRINT-001-x.md"
check 1 "waves: sprint sem seção Waves"              waves docs/sprints/SPRINT-001-x.md

echo "---"; [ "$fails" -eq 0 ] && echo "todos os casos passaram" || { echo "$fails caso(s) falharam"; exit 1; }
