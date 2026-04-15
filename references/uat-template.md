# UAT — [Issue ou Sprint]

> Script de User Acceptance Testing para features user-facing. Gerado ao fim do `/execute` quando a feature envolve interação visual/complexa e o validator automático não consegue cobrir 100% do comportamento.
> Executado **pelo usuário**, não pelo agente. O agente registra o resultado.

_Gerado em: YYYY-MM-DD HH:MM_
_Issue/Sprint: [path]_
_Implements: REQ-X, REQ-Y_

---

## Setup

> O que o usuário precisa fazer antes de começar a testar.

1. Garantir que a branch `sprint/[slug]` está rodando localmente
2. `npm run dev` (ou comando equivalente)
3. Abrir [URL]
4. [Qualquer setup adicional — seed de dados, login, etc.]

---

## Test Steps

### Caminho feliz

| # | Ação | Resultado esperado | Resultado real | Status |
|---|---|---|---|---|
| 1 | [ex: clicar em "Login"] | [ex: modal abre com campos email/senha] | _(preenchido pelo usuário)_ | ⬜ |
| 2 | [ex: preencher email válido + senha] | [ex: botão "Entrar" habilita] | | ⬜ |
| 3 | [ex: clicar em "Entrar"] | [ex: redireciona para /dashboard em <2s] | | ⬜ |

### Edge cases

| # | Ação | Resultado esperado | Resultado real | Status |
|---|---|---|---|---|
| 1 | [ex: submeter form com email inválido] | [ex: mensagem "email inválido" aparece inline] | | ⬜ |
| 2 | [ex: senha errada 3x] | [ex: rate limit ativa, mostra mensagem] | | ⬜ |

### Visual polish

| # | Verificação | Status |
|---|---|---|
| 1 | Layout responsivo em mobile (< 640px) | ⬜ |
| 2 | Estados de loading visíveis | ⬜ |
| 3 | Mensagens de erro legíveis | ⬜ |
| 4 | Acessibilidade básica (tab navigation, contraste) | ⬜ |

---

## Report

> Preenchido ao fim do teste.

**Status geral**: pass | fail | partial
**Steps falhados**: [lista de #s]
**Observações do usuário**: [feedback livre]

---

## Action items

> Se houve fails, o agente registra aqui o que precisa fazer e adiciona em `STATE.md → Blockers`.

- [ ] [item 1]
- [ ] [item 2]
