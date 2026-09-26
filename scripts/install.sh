#!/usr/bin/env bash
# project-maker — instala os agentes de etapa do autopilot no nível do usuário (~/.claude/agents/).
# Rode uma vez depois do `git clone` (e de novo após `git pull` que mude references/agents/pm-stage-*.md).
# Por quê: o Claude Code só carrega agentes quando a sessão começa. Agente copiado no meio da sessão
# não fica disponível, e o autopilot cairia no agente genérico, que herda o effort da sessão.
set -eu
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/agents"
mkdir -p "$DEST"
for f in "$SKILL_DIR"/references/agents/pm-stage-*.md; do
  name="$(basename "$f")"
  if [ -f "$DEST/$name" ] && ! cmp -s "$f" "$DEST/$name"; then
    cp "$DEST/$name" "$DEST/$name.bak"
    echo "atualizado: $DEST/$name (backup em $name.bak)"
  elif [ -f "$DEST/$name" ]; then
    echo "já instalado: $DEST/$name"
    continue
  else
    echo "instalado: $DEST/$name"
  fi
  cp "$f" "$DEST/$name"
done
echo "Pronto. Reinicie o Claude Code (ou abra uma sessão nova) para os agentes ficarem disponíveis."
