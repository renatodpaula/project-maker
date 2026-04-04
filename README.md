# Project Maker

Uma skill de [Claude Code](https://claude.ai/code) para construir projetos e features com IA de forma estruturada, seguindo o workflow de **Spec-Driven Development (SDD)**.

## O que é

Project Maker guia o desenvolvimento do zero à implementação através de artefatos progressivos — da ideia ao código — sem vibe coding. A IA atua como parceira em cada etapa, não como executora cega.

## Fluxo

```
/discover  → brief.md                        (brainstorming guiado)
/init      → steering/ + Constitution.md     (memory bank do projeto)
/spec      → Spec.md com EARS                (requisitos estruturados)
/break     → research.md + data-model.md
             + contracts/ + PRD.md + issues/ (quebra em tarefas)
/plan      → issue enriquecida               (pesquisa e planejamento)
/execute   → implementação por agentes       (execução autônoma)
/build     → atalho: plan + execute
```

A escala é adaptativa: `--quick` para bug fixes, `--feature` para features, `--epic` para projetos novos.

## Instalação

1. Copie a pasta `skills/project-maker/` para `~/.claude/skills/project-maker/`
2. Reinicie o Claude Code
3. Use `/project-maker` em qualquer projeto

Ou clone direto no lugar certo:

```bash
git clone https://github.com/renatodpaula/project-maker ~/.claude/skills/project-maker
```

## Uso

Abra o Claude Code em qualquer projeto e rode:

```
/project-maker
```

A skill detecta automaticamente em qual etapa você está e explica o que fazer.

## Contribuindo

Sugestões, melhorias e pull requests são bem-vindos. Abra uma issue descrevendo o que quer mudar antes de implementar.

## Autor

**Renato de Paula Cardoso**
- Email: renato@renatodpaula.com.br
- GitHub: [@renatodpaula](https://github.com/renatodpaula)

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.
