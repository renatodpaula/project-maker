# Concerns

> Documentação viva de tech debt, áreas frágeis e pegadinhas do projeto.
> Carregado on-demand: **só quando uma feature toca um arquivo/área listada aqui**.

_Última atualização: YYYY-MM-DD_

---

## Fragile Areas

> Arquivos ou módulos onde mudanças têm alto risco de regressão.

- `path/to/file` — por que é frágil — o que checar quando mexer aqui

---

## Tech Debt

> Dívida técnica conhecida, priorizada.

- **[alta]** descrição — fix sugerido — impacto se não resolver
- **[média]** ...
- **[baixa]** ...

---

## Flagged Dependencies

> Libs/pacotes com problemas conhecidos (bugs, deprecation, licença, performance).

- `package-name` — motivo do flag — alternativa considerada

---

## Known Gotchas

> Comportamentos que surpreendem quem é novo no projeto.

- descrição do comportamento — por que acontece — como lidar

---

## Forbidden Patterns

> Padrões que NÃO devem ser usados neste projeto (aprendidos na prática, não no Constitution.md).

- padrão — por que foi banido — o que usar no lugar
