# Notas de harness — o que foi sondado e em qual versão

> Parte do skill **project-maker**. Registro das sondas que deram origem às regras de despacho do `SKILL.md`. Comportamento de ferramenta muda entre versões do Claude Code: se uma regra de despacho parecer errada na sua versão, refaça a sonda antes de confiar neste arquivo. Os modos não precisam ler isto para rodar.

## Texto das regras até a v3.3 (com as versões em que cada fato foi verificado)

**Despacho e espera (regra dura).** A ferramenta Agent roda os sub-agents em **background** e entrega o resultado por **notificação** (verificado no 2.1.322 em sessão interativa, dentro de sub-agente e em `claude -p`). O parâmetro `run_in_background` só existe em algumas superfícies (visto no `claude -p`; ausente na sessão interativa e dentro de sub-agente), então a regra vale pelo comportamento, não pelo parâmetro:

1. Paralelismo = **várias chamadas Agent na mesma mensagem**.
2. Se o schema da sua ferramenta Agent tem `run_in_background`, passe `false`. Se não tem, não invente o parâmetro.
3. Depois de despachar, **espere a notificação de cada sub-agent** antes de usar o resultado. Nunca relate, suponha nem valide um resultado que ainda não chegou. Conte: N despachados, N recebidos.
4. **Nenhum fechamento com filho pendente.** O Bloco de Handoff (manual) e o `PM_STAGE_RESULT` (agente de etapa) só saem depois que todos voltaram. Encerrar o turno para aguardar a notificação é o caminho normal; emitir o fechamento do modo antes dela é o bug.

Histórico: no 2.1.282 um `/execute` headless terminou com 2 de 10 issues e 5 agentes mortos. No 2.1.322 a sonda (2 filhos com `sleep`, em `claude -p` e dentro de um sub-agente) recebeu os dois resultados.

**Despacho explícito (regra dura).** Toda chamada Agent do skill leva `model` **e** `effort` da tabela **Roteamento por etapa**, mesmo quando o agente é registrado. Sem `model`, o agente genérico herda o modelo da sessão (sessão em Fable = sprint inteiro em Fable); sem `effort`, herda o effort de quem despachou. Padrão quando a tabela não diz outra coisa: `model: "sonnet"`, `effort: "high"`. Verificado no 2.1.322: o `effort` por chamada vence o do frontmatter (agente com `effort: high` despachado com `low` rodou em `low`); `general-purpose` com `model: "sonnet"` + `effort: "medium"` rodou em Sonnet · medium; filho despachado sem `effort` herdou o do pai.

**Profundidade.** Sub-agente de 1º nível tem a ferramenta Agent; o de 2º nível não tem (verificado no 2.1.322, com filho em Haiku). Cadeia máxima: sessão → sub-agent → sub-agent. No autopilot isso é condutor → agente de etapa → implementer/validator, então implementer, validator e os sub-agents do `/plan` **não delegam**: exploram direto com Grep/Glob/Read.


## Lições de runs reais (AI Brain, 2026-10)

- Notificação `failed` por erro de API (`ENOTFOUND`) não prova que o agente morreu: uma etapa notificada como falha continuou trabalhando no mesmo branch por duas horas, em paralelo com a redespachada.
- Sub-agente neto sobrevive à etapa: um implementer de uma etapa que caiu ficou 21 horas num laço de espera e gastou ~675 mil tokens sem commitar.
- Teste com limite de tempo de relógio falha quando a máquina está carregada. Prove custo por medida relativa ou de CPU.
- Viraram regra no `references/modes/autopilot.md` (Passo 2, itens 6 e 9) e no `stage-contract.md` (regras 10 e 11).
