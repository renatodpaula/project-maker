# Benchmark de modelos por etapa — project-maker

Mede, para cada modo do skill, **qualidade × custo × tempo** de cada modelo/effort, rodando o modo de verdade (`claude -p "/project-maker <modo> …"`) sobre o **mesmo insumo congelado**. É a fonte da tabela **Model Advisor → Roteamento por etapa** do `SKILL.md`.

Rodada de referência: **2026-09-25/26**, Claude Code **2.1.282**.

## Método

1. **Fixture:** encurtador de links interno (Node 24, zero dependências, JSON atômico, painel HTML, token de admin). As respostas do "dono do projeto" ficam em `seed/BENCHMARK_ANSWERS.md`; `seed/benchmark-system.md` torna os modos não-interativos (pergunta → resposta do arquivo).
2. **Cadeia golden:** discover → init → spec → break → plan(sprint) → execute, gravando um snapshot do projeto antes de cada etapa. Toda config de uma etapa parte do **mesmo** snapshot.
3. **Isolamento:** o skill entra como project-skill (`.claude/skills/project-maker`), com `--setting-sources project --strict-mcp-config`. Assim hooks e plugins do usuário não contaminam, e o effort é explícito (`--effort`).
4. **Configs:** Fable 5.1 · high, Opus 5.5 · xhigh, Opus 5.5 · medium, Sonnet 5 · high, Haiku 4.5. Etapas caras usam uma matriz reduzida.
5. **Qualidade:**
   - **Juízes cegos:** 3 por etapa (Opus rubrica, Fable rubrica, Opus auditor de fidelidade), com candidatos anonimizados (`blind.py`).
   - **`/execute`:** testes de aceitação **ocultos** (`hidden-sprint001/`), escritos a partir da spec e revisados adversarialmente contra sobre-especificação.
   - **`/secure`:** 5 vulnerabilidades plantadas num commit "refactor" com os testes correspondentes removidos.
   - **`/verify`:** 2 bugs plantados, um que só o cold-start smoke pega e um relatado pelo usuário no UAT.
6. **Custo:** `total_cost_usd` e `modelUsage` do `claude -p --output-format stream-json`. **Janela de 5h:** `rate_limit_event.unifiedWindows.five_hour.utilization` do mesmo stream.

## Resultados (nota média dos juízes 0–100 · custo em preço de API · tempo)

| Etapa | Fable 5.1 high | Opus 5.5 xhigh | Opus 5.5 medium | Sonnet 5 high | Haiku 4.5 |
|---|---|---|---|---|---|
| discover | 87 · $1,0 · 82s | 79 · $0,64 · 150s | 84 · $0,29 · 32s | **93** · $0,17 · 32s | 65 · $0,07 |
| init | 82 · $2,4 · 330s | **95** · $2,16 · 537s | 88 · $0,87 · 182s | 89 · $0,39 · 136s | 64 · $0,24 |
| spec | 89 (93/85) · $4,2 · 530s | 86 · $3,21 · 842s | 76 · $1,18 · 248s | **91** · $0,91 · 368s | 44 · $0,17 |
| break | **91,5** · $8,58 · 19min | — | 87,4 · $3,98 · **13min** | 88,5 · $3,20 · 20min | — |
| plan (issue simples) | — | — | 85,6 · $0,89 | **86,7** · $0,46 | 45,8 · $0,18 |
| plan (issue difícil) | 90 · $3,39 | — | 84 · $1,32 | **91** · $0,85 | 54,5 · $0,16 |
| execute (sprint, 10 issues) | — | — | **88/88** ocultos · ~$6,6 · ~13min¹ | **88/88** ocultos · ~$6,3 · ~68min¹ | — |
| secure (5 vulns plantadas) | 5/5 · $3,54 · 356s | — | 5/5 · $1,08 · 162s | **5/5** · $0,50 · 104s | — |
| verify (2 bugs plantados) | — | — | 2/2 · $1,15 · 178s | **2/2** · $0,50 · 123s | — |
| ship (dry-run) | — | — | — | ok · $0,33 · 56s | ok · $0,22 · 123s |

¹ Tempo não comparável: a run do Sonnet usou a versão antiga do skill (sub-agents em background, ver abaixo) e sofreu throttling perto do limite de uso.

**Consumo da janela de 5h** (plano da rodada de referência): 1% ≈ $0,33 em preço de API. Um execute de sprint de 10 issues em Sonnet ≈ 20% da janela; um projeto de 3 sprints ponta a ponta (com plan de sprint ~$1,5–2,6 cada) ≈ $33–36, uma janela inteira.

## Achados que mudaram o skill

- **Sonnet 5 · high vira o padrão de todas as etapas** (perfil balanced). O antigo "raciocínio (Opus/Fable) para spec/break" não se sustentou: Fable só venceu no break (+3 pontos a 2,7× o custo) e vai para o perfil max; no spec teve variância alta (92,9 e 84,6) e média abaixo do Sonnet.
- **Effort > modelo.** Opus 5.5 xhigh custou 2–3× e demorou 3–5× mais que medium sem ganho consistente. Opus 5.5 medium foi o mais rápido, mas perdeu fidelidade no spec (contrariou uma resposta explícita, ampliou escopo).
- **Haiku fabrica.** No `/plan` marcou `Done when` como cumprido sem código existir. Fica fora de toda etapa que decide ou escreve código.
- **Bug de harness descoberto:** a ferramenta Agent roda em **background por padrão**. Um `/execute` em sessão headless encerrou o turno "aguardando notificação" e perdeu 5 sub-agents (2 de 10 issues entregues). Virou a regra **Despacho em foreground** (`run_in_background: false`; paralelismo = várias chamadas na mesma mensagem). Depois da correção, o mesmo sprint fechou 7 issues em 8 min.

## Como remedir

```bash
export PM_BENCH_WORK=/tmp/pm-bench          # onde ficam golden/ e runs/
python3 bench.py base                        # snapshot 00-base com o skill do HEAD
# rode a cadeia golden e as matrizes por etapa com run_stage()/run_with_retry() (ver bench.py)
python3 blind.py <etapa>                     # anonimiza os candidatos para os juízes
```

- `bench.py` espera o fim da janela de uso sozinho: sonda a cota a cada 10 min e refaz a etapa.
- `hidden-sprint001/` vale só para o golden desta rodada. Com break golden novo, regenere os testes ocultos a partir das novas issues.
- O benchmark inteiro consumiu ~3 janelas de 5h e ~15 pontos da cota semanal. Rode as etapas caras (break, execute) com matriz reduzida.
