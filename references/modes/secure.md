# Modo: /secure

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.

**Argumento:** caminho de um sprint (ou issue em `--quick`).

Gate de segurança escopado ao **diff do sprint**, não ao codebase inteiro. Roda antes do `/ship`. Gera o SECURITY do sprint (`docs/sprints/SPRINT-NNN-SECURITY.md`; em `--quick`, ao lado da issue) — ver `references/security-template.md`. Bloqueia a entrega se houver ameaça aberta.

### Passo 1 — Escopo
```bash
git diff main...sprint/[slug] --stat
```
Carregue as regras de **Segurança da `Constitution.md`** e o `steering/CONCERNS.md` se o diff toca área flagged.

### Passo 2 — Delegar ou checklist
- **Se a skill `security-review` está instalada** (ver tabela Skill Integrations): delegue a ela a revisão do diff da branch. Ela é a fonte primária do veredito. Recomendação de instalação aparece no máx. 1x/sessão.
- **Senão (fallback):** rode o checklist embutido do `references/security-template.md` — input/injection, authn/authz/IDOR, secrets, dependências (cruza com o Package Legitimacy Gate), superfície/erros — escopado ao que o diff mudou. Marque N/A o que o sprint não toca.

### Passo 3 — Registrar
- Cada violação vira linha no `## Threat Model` do SECURITY do sprint, com severidade e mitigação.
- Preencha o frontmatter: `status` (`clean | threats_open | needs_human`) e `threats_open` (contagem).
- Itens que exigem julgamento humano → `needs_human`, peça revisão explícita.

### Passo 4 — Veredito
- `clean` → libera o `/ship`.
- `threats_open > 0` → **bloqueia o /ship**. Crie issues de fix (como no `/verify` Passo 3) ou registre em STATE.md → Blockers.

**Bloco de Handoff (obrigatório — regra Next Command):**
- `clean` → `/project-maker ship [path real do sprint]`
- `threats_open > 0` → `/project-maker execute [path real das issues de fix]`, com nota de uma linha: o `/ship` fica bloqueado até `threats_open: 0`
- `needs_human` → o bloco pede a revisão humana explícita **e** já traz o comando de retomada (`/project-maker secure [path]`) para depois dela

**Quando rodar:** sempre que o sprint tocar auth, dados sensíveis, input externo, uploads, pagamentos, ou superfície de rede. Em `--quick`, só se a mudança toca uma dessas áreas.
