# SECURITY — [Sprint ou Issue]

> Resultado do gate de segurança gerado pelo `/secure`. Escopo: **o diff do sprint atual**, não o codebase inteiro.
> Preferência: delegar à skill `security-review` se instalada. Este arquivo registra o veredito independente da fonte.

_Gerado em: YYYY-MM-DD HH:MM_
_Escopo: `git diff main...sprint/[slug]`_
_Fonte: skill `security-review` | checklist embutido_

---

## Frontmatter de estado

```yaml
status: clean | threats_open | needs_human
threats_open: 0
threats_total: 0
source: security-review | builtin-checklist
```

> `/ship` lê `threats_open`. Se > 0, **bloqueia o PR**.

---

## Threat Model (escopo do sprint)

> Só ameaças tocadas pelo diff deste sprint. Use STRIDE como lente, mas seja concreto.

| ID | Categoria | Onde | Severidade | Status | Mitigação |
|----|-----------|------|------------|--------|-----------|
| T-1 | Injection | `path/file.ts:NN` | high \| med \| low | open \| mitigated \| accepted | [o que fazer / o que foi feito] |
| T-2 | AuthZ/AuthN | ... | | | |

---

## Checklist embutido (fallback quando `security-review` não está instalada)

> Escopado ao diff. Marque N/A o que o sprint não toca. Cada item violado vira uma linha no Threat Model acima.

### Input & dados
- [ ] Todo input externo (body, query, params, headers, uploads) é validado **no servidor**
- [ ] Sem SQL/NoSQL/command injection — queries parametrizadas, sem string concat de input
- [ ] Output encoding / sem XSS em conteúdo renderizado vindo de usuário

### Autenticação & autorização
- [ ] Endpoints novos checam autenticação E autorização (não só "logado", mas "pode isso")
- [ ] Sem IDOR — acesso a recurso valida ownership/tenant
- [ ] Tokens/sessões com expiração e invalidação corretas

### Secrets & config
- [ ] Nenhum secret hardcoded ou commitado (chaves, tokens, senhas, connection strings)
- [ ] Secrets vêm de env/secret manager; `.env` não versionado
- [ ] Sem logging de dados sensíveis (PII, tokens, senhas)

### Dependências
- [ ] Pacotes novos passaram pelo **Package Legitimacy Gate** (sem `[SLOP]`, `[SUS]`/`[ASSUMED]` aprovados)
- [ ] Versões pinadas; sem lockfile órfão

### Superfície & erros
- [ ] Mensagens de erro não vazam stack trace / detalhes internos ao cliente
- [ ] Sem endpoints de debug/admin expostos sem proteção
- [ ] Rate limiting onde faz sentido (login, APIs públicas)
- [ ] Conformidade com as regras de **Segurança da `Constitution.md`**

---

## Veredito

**Status**: clean | threats_open | needs_human
**Resumo**: [1-3 linhas]
**Ação requerida antes do /ship**: [nenhuma | resolver T-1, T-2 | revisão humana de X]
