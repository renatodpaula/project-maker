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

printf '# SECURITY\n\n## Frontmatter de estado\n\n```yaml\nthreats_open: 0\n```\n' > "$T/docs/sprints/SPRINT-001-SECURITY.md"
printf -- '---\nstatus: complete\n---\n# UAT\n' > "$T/docs/sprints/SPRINT-001-uat.md"
python3 "$PM" --root "$T" status | grep -q "uat:complete security:0" && echo "ok    saída   status: lê UAT e SECURITY ao lado do sprint" || { echo "FAIL  status não leu uat/security"; fails=$((fails+1)); }
rm "$T/docs/sprints/SPRINT-001-SECURITY.md" "$T/docs/sprints/SPRINT-001-uat.md"

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

# --- layout por feature convivendo com o plano
# out <trecho esperado> <descrição> <args...>: exit 0 e o trecho na saída
out() {
  local want="$1" desc="$2"; shift 2
  if python3 "$PM" --root "$T" "$@" >"$T/.out" 2>&1 && grep -qF -- "$want" "$T/.out"; then echo "ok    saída   $desc"; else echo "FAIL  sem '$want'  $desc"; sed 's/^/        /' "$T/.out"; fails=$((fails+1)); fi
}
sprint "Wave 1 (paralelo): functional/01, functional/02" "Wave 2: functional/03"
F="docs/specs/FEAT-007-cobranca"
mkdir -p "$T/$F/sprints"
printf '# Spec\n\n- REQ-1 x\n- REQ-2 y\n' > "$T/$F/spec.md"
printf '# Context\n\nREQ-5 citado no discuss\n' > "$T/$F/context.md"
issue "$F/issues/functional/01-x.md" "REQ-1" src/x.js
issue "$F/issues/functional/02-y.md" "REQ-2" src/x.js
{ printf '# Sprint 002\n\n**Status**: planned\n\n## Issues\n\n- [ ] `%s/issues/functional/01-x.md`\n- [ ] `%s/issues/functional/02-y.md`\n' "$F" "$F"
  printf '\n## Waves\n\n```\nWave 1: functional/01\nWave 2: functional/02\n```\n'; } > "$T/$F/sprints/SPRINT-002-cobranca.md"
check 0 "coverage: feature só conta as issues da própria pasta"   coverage "$F/spec.md"
check 0 "coverage: layout plano ignora issues de pasta de feature" coverage Spec.md
check 1 "coverage: sem path com duas specs no disco"             coverage
check 0 "waves: sprint dentro da pasta da feature"               waves "$F/sprints/SPRINT-002-cobranca.md"
printf '\n## Reassess Notes\n\n- Segue pendente o REQ-3 da `Spec.md` do projeto.\n' >> "$T/$F/sprints/SPRINT-002-cobranca.md"
check 0 "waves: .md citado fora da seção Issues não é issue"     waves "$F/sprints/SPRINT-002-cobranca.md"
out "issues=2 "             "status: conta só as issues da seção Issues" status
out "sprints: $F/sprints"   "paths: feature grava na própria pasta"   paths "$F/spec.md"
out "issues: $F/issues"     "paths: issues da feature"                paths "$F/spec.md"
out "sprints: docs/sprints" "paths: Spec.md da raiz segue no layout plano" paths Spec.md
out "next_sprint: SPRINT-003" "paths: número de sprint é único no projeto" paths
out "next_feat: FEAT-008"   "paths: próximo FEAT"                     paths
out "$F/sprints/SPRINT-002-cobranca.md" "status: lista sprint de pasta de feature" status
printf '# Spec\n\n- REQ-1 z\n' > "$T/docs/specs/FEAT-003-antiga.md"
printf '# Context\n' > "$T/docs/specs/FEAT-003-antiga.context.md"
out "layout: flat"          "paths: spec de feature em arquivo solto segue no plano" paths docs/specs/FEAT-003-antiga.md
# duas specs no layout plano dividindo docs/issues/: cada issue conta só para a spec que ela declara
issue docs/issues/functional/04-z.md "REQ-1" src/z.js
sed -i.bak 's|^Implements: REQ-1$|**Spec relacionada**: `docs/specs/FEAT-003-antiga.md`\
Implements: REQ-1|' "$T/docs/issues/functional/04-z.md" && rm "$T/docs/issues/functional/04-z.md.bak"
check 0 "coverage: spec solta só conta as issues que a declaram" coverage docs/specs/FEAT-003-antiga.md
check 0 "coverage: Spec.md ignora issue que declara outra spec"  coverage Spec.md
rm "$T/docs/issues/functional/04-z.md"
printf '# Spec\n\n- REQ-7 z\n' > "$T/docs/specs/FEAT-003-antiga.md"
check 1 "coverage: spec solta com REQ sem issue reprova, sem acusar REQ das outras" coverage docs/specs/FEAT-003-antiga.md
check 0 "coverage: issue sem spec declarada não vira REQ inexistente" coverage Spec.md
rm "$T/docs/specs/FEAT-003-antiga.md" "$T/docs/specs/FEAT-003-antiga.context.md"; rm -r "$T/$F"

# --- repo aninhado (clone ou worktree dentro do projeto) não entra na conta
mkdir -p "$T/staging/outro/.git" "$T/staging/outro/docs/sprints" "$T/staging/outro/docs/issues/functional"
cp "$T/docs/sprints/SPRINT-001-x.md" "$T/staging/outro/docs/sprints/SPRINT-150-alheio.md"
issue staging/outro/docs/issues/functional/01-z.md "REQ-77" src/z.js
state "/project-maker execute"
check 0 "next: sprint de repo aninhado não conta"                next
check 0 "coverage: issue de repo aninhado não conta"             coverage
out "next_sprint: SPRINT-002" "paths: numeração ignora repo aninhado" paths
rm -r "$T/staging"

echo "---"; [ "$fails" -eq 0 ] && echo "todos os casos passaram" || { echo "$fails caso(s) falharam"; exit 1; }
