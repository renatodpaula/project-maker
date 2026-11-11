#!/usr/bin/env bash
# Checagens estáticas do próprio skill. Uso: bash scripts/lint-skill.sh. Sai com 1 se alguma falhar.
set -u
cd "$(dirname "$0")/.."
fails=0
bad() { echo "FAIL  $1"; fails=$((fails+1)); }
ok()  { echo "ok    $1"; }

n=$(wc -l < SKILL.md | tr -d ' ')
[ "$n" -lt 500 ] && ok "SKILL.md com $n linhas (<500)" || bad "SKILL.md com $n linhas (limite 500): mova conteúdo para references/"

# todo arquivo citado em SKILL.md e nos modos como references/… ou scripts/… existe
missing=$(grep -ohE '(references|scripts|evals)/[A-Za-z0-9_./-]+\.(md|sh|py)' SKILL.md references/modes/*.md references/autopilot/*.md | sort -u | while read -r f; do [ -e "$f" ] || echo "$f"; done)
[ -z "$missing" ] && ok "todas as referências a arquivos do skill existem" || bad "referência a arquivo inexistente: $(echo $missing)"

# todo modo da tabela tem arquivo, e todo arquivo de modo está na tabela
for f in references/modes/*.md; do m=$(basename "$f" .md); grep -q "references/modes/$m.md" SKILL.md || bad "modo $m não está na tabela do SKILL.md"; done
ok "modos conferidos contra a tabela"

# agentes: frontmatter com name igual ao arquivo, e listados no plugin.json
for f in references/agents/*.md; do
  a=$(basename "$f" .md)
  grep -q "^name: $a$" "$f" || bad "agente $a: name do frontmatter difere do arquivo"
  grep -q "\"./references/agents/$a.md\"" .claude-plugin/plugin.json || bad "agente $a fora do .claude-plugin/plugin.json"
done
ok "agentes conferidos"

# versão única: SKILL.md, plugin.json e README
v=$(sed -n 's/^  version: *//p' SKILL.md | head -1)
grep -q "\"version\": \"$v\"" .claude-plugin/plugin.json || bad "versão do plugin.json difere do SKILL.md ($v)"
grep -q "v$v" README.md || bad "README não cita a versão $v"
ok "versão $v"

# restos conhecidos de versões antigas não voltam
for s in 'tlc-spec-driven' 'documentada pelo vídeo' '(PR 2)' 'Despacho em foreground\*\* (' 'Score < 80'; do
  grep -rqF -- "$s" SKILL.md references && bad "resto de versão antiga: $s"
done
ok "sem restos de versões antigas"

for j in .claude-plugin/plugin.json .claude-plugin/marketplace.json hooks/hooks.json; do python3 -c "import json,sys;json.load(open('$j'))" 2>/dev/null || bad "$j não é JSON válido"; done
ok "manifestos JSON válidos"

echo "---"; [ "$fails" -eq 0 ] && echo "lint ok" || { echo "$fails problema(s)"; exit 1; }
