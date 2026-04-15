# Decisions

> Append-only register de decisões arquiteturais e técnicas do projeto. **Nunca delete linhas antigas** — só adicione. Baixo churn, alta importância. Este arquivo sobrevive ao projeto.

_Última atualização: YYYY-MM-DD_

---

## Format

Cada entrada segue o mesmo schema:

```
### [YYYY-MM-DD] Título curto da decisão

**Contexto**: o que estava em discussão, qual era o problema
**Opções consideradas**: A, B, C — com trade-offs resumidos
**Decisão**: qual foi escolhida
**Razão**: por quê esta e não as outras
**Consequências**: o que isso implica para o futuro (bom e ruim)
**Referências**: link para issue, sprint, discussão, research.md
```

---

## Decisions

### [YYYY-MM-DD] [exemplo] Usar X em vez de Y

**Contexto**: precisávamos de uma lib para gerenciar estado. Várias opções no ecosistema.
**Opções consideradas**:
- A (Redux) — maturidade, boilerplate alto
- B (Zustand) — simples, menos features
- C (Jotai) — atômico, curva de aprendizado
**Decisão**: Zustand
**Razão**: projeto é simples, time já conhece, boilerplate é bottleneck maior que features avançadas
**Consequências**: não temos devtools tão bons quanto Redux; vamos depender de hooks customizados para padrões complexos
**Referências**: Sprint 001, research.md seção "Estado"
