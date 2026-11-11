# Model Advisor — de onde vêm as recomendações

> Parte do skill **project-maker**. O `SKILL.md` traz só a tabela de roteamento e as regras. Este arquivo guarda as medições e os limites delas. Leia quando o usuário perguntar **por que** um modelo é recomendado, pedir custo por etapa ou quiser escolher perfil.

## Limites do que foi medido (leia antes de citar um número)

- **Um fixture só**: encurtador de links em Node, sem dependências, greenfield, sem banco nem framework de UI. Os números não dizem nada sobre brownfield, monorepo, front-end pesado ou stack com muito boilerplate.
- **Uma run por célula** na maior parte da matriz. Os juízes divergiram até 11 pontos no mesmo artefato e o mesmo modelo variou 6 pontos entre rodadas: diferença menor que ~5 pontos é ruído.
- **Efeito teto no `/execute`**: os dois modelos medidos fizeram 88/88 nos testes ocultos, então o teste não separa um do outro.
- **Sem controle**: até a v3.3 ninguém mediu o mesmo fixture **sem** o skill. A config `baseline` de `evals/model-bench/bench.py` existe para isso e ainda não foi rodada. Até lá, o benchmark compara modelos dentro do skill; não prova que o skill ganha de uma sessão comum em plan mode.
- **Versões**: medido em Fable 5.1, Opus 5.5, Sonnet 5/5.5 e Haiku 4.5. Versão mais nova herda o perfil por analogia até alguém remedir.

## Medições e roteamento completo

Cada etapa tem um perfil de trabalho diferente, e rodar o modelo certo muda custo, tempo e qualidade. A recomendação abaixo é **medida, não intuída**: benchmark de 2026-09 (Claude Code 2.1.282) rodando cada modo do skill em 5 configurações sobre o mesmo insumo congelado, com 3 juízes cegos por etapa, testes de aceitação ocultos no `/execute`, 5 vulnerabilidades plantadas no `/secure` e 2 bugs plantados no `/verify`. Método e harness em `evals/model-bench/`. Nomes de modelo mudam — quando sair modelo novo, **remeça** em vez de supor.

**Versão do modelo:** o skill usa os aliases `sonnet`, `opus` e `fable` (frontmatter dos agentes e override por chamada), que o Claude Code resolve para a versão mais recente — modelo novo entra sem editar nada aqui. Os textos de recomendação dizem só "Sonnet"/"Opus"/"Fable"; os números de versão (Sonnet 5, Opus 5.5, Fable 5.1) aparecem apenas nos **resultados do benchmark**, que valem para a versão medida. Versão nova não medida herda o perfil por analogia até alguém remedir (`evals/model-bench/`).

**O que o benchmark mostrou:**
- **Sonnet 5 · effort high** ficou em 1º ou 2º em todas as etapas, pelo menor custo entre os que acertam: spec 90,7/100 (Fable 88,8 na média de 2 runs — 92,9 e 84,6 —, a 4,5× o custo), break 88,5 (Fable 91,5 a 2,7×), execute 88/88 testes ocultos (empate com Opus), secure 5/5 vulnerabilidades (empate) pela metade do custo do Opus e 1/7 do Fable, verify 2/2 bugs com causa-raiz exata.
- **Sonnet 5.5 · high vs medium** (remedida em 2026-10, só discover/init/spec/plan, 1 run por célula, 3 juízes cegos): high 92,4 de média contra 88,1 do medium e 84,1 do Sonnet 5 · high re-rodado no mesmo insumo. O medium custou 30% menos e levou ~60% do tempo, mas perde no init (82 vs 89) e no spec (84,7 vs 93,0); empata com o high em discover e plan. A diferença média (4,3 pontos) fica dentro do ruído de uma run por célula (o próprio Sonnet 5 · high variou 6 pontos entre as rodadas), e o auditor de fidelidade não achou contradição com o dono em nenhum dos dois. **High** segue como padrão; nenhum perfil novo até medir execute em medium. Não cobre break/execute/secure/verify.
- **Effort pesa mais que o modelo.** Opus 5.5 em xhigh custou 2–3× e levou 3–5× mais tempo que em medium, sem ganho consistente (só venceu no init: 95 vs 89 do Sonnet).
- **Opus 5.5 · medium é o mais rápido** (break 13 min vs 20; execute do sprint em ~13 min) **mas perde fidelidade na captura de requisitos**: no spec contrariou uma resposta explícita do usuário e ampliou escopo (76 vs 91).
- **Fable 5.1** só venceu no break (+3 pontos, a 2,7× o custo); no spec teve variância alta entre runs (92,9 e 84,6) e média abaixo do Sonnet.
- **Haiku 4.5 não segue as regras do skill**: no `/plan` marcou `Done when` como cumprido numa issue sem código (46–55/100); spec 44. Só aguenta etapa mecânica (ship).

### Roteamento por etapa

Células = `modelo · effort`. **balanced** é o padrão do modo manual e do autopilot. No autopilot o condutor passa `model` e `effort` da célula em **toda** chamada (regra **Despacho explícito**); `workhorse` (`pm-stage-workhorse`) e `reasoning` (`pm-stage-reasoning`) são só o `subagent_type` preferido quando registrados — sem eles, `general-purpose` com os mesmos `model`/`effort`.

| Etapa | econ | balanced (padrão) | max |
|---|---|---|---|
| discover, init | Sonnet · high | Sonnet · high | discover Sonnet · high · init Opus · xhigh¹ |
| spec | Sonnet · high | Sonnet · high | Sonnet · high |
| break | Sonnet · high | Sonnet · high | Fable · high (`reasoning`) |
| plan | Sonnet · high | Sonnet · high | Sonnet · high |
| execute (orquestrador, implementers, validator) | Sonnet · high | Sonnet · high | Sonnet · high |
| issue com `Model hint: Opus/Fable` | Sonnet (não escala) | Opus · high² | Fable · high |
| 3ª tentativa de uma issue (escalada por falha⁵) | um degrau acima | um degrau acima | um degrau acima |
| verify, secure, ship | Sonnet · high³ | Sonnet · high | Sonnet · high⁴ |
| **Autopilot:** `max_stages` por run | 12 | 30 | 60 |
| **Autopilot:** freio da janela de 5h | 60% | 80% | 90% |

¹ No autopilot: `model: "opus"`, `effort: "xhigh"` por chamada.
² Não medido — o benchmark não teve issue prompt-heavy, e a issue marcada Opus/Fable (storage com concorrência) passou igual em Sonnet. A escalada fica como seguro barato para issue de system prompt, agente ou algoritmo core.
³ No manual, Haiku 4.5 fez um ship aceitável ($0,22 vs $0,33) — só no ship. No autopilot, nunca Haiku (o auto mode de permissões não suporta Haiku).
⁴ Fable achou as mesmas 5/5 vulnerabilidades a 7× o custo.
⁵ `sonnet` → `opus` → `fable`, só na 3ª tentativa do loop de correção (`/execute` 2.4). Não medido: troca uma parada humana por uma tentativa mais forte, e só custa quando a issue já falhou duas vezes.

### Como escolher o perfil

Perfil (`econ | balanced | max`) **não** é o effort do Claude Code (low…max). Ele define três coisas: o modelo/effort de cada etapa (tabela acima), se issue com `Model hint: Opus/Fable` escala, e os freios de consumo do autopilot.

- **econ** — mesmo modelo do balanced (Sonnet · high): o benchmark não achou modelo mais barato que preste (o Haiku fabricou progresso). A economia vem de **não escalar** issue difícil, **pausar em 60%** da janela de 5h (sobra folga para outros trabalhos) e parar em 12 etapas por run (~1 sprint). Use com janela apertada.
- **balanced** (padrão) — qualidade de topo pelo menor custo medido; escala para Opus só nas raras issues marcadas. Use no dia a dia.
- **max** — gasta onde o benchmark mediu ganho, que é pequeno: Fable no break (+3 pontos a 2,7× o custo) e Opus xhigh no init (95 vs 89 a ~5×); ~+$7 por projeto. Use quando a qualidade do planejamento vale o custo.

Projeto de 3 sprints ponta a ponta: econ ~$33 (1 janela, em 2 blocos por pausar em 60%) · balanced ~$33–36 (~1 janela) · max ~$40–43 (~1,2 janela). O execute de um sprint custa ~20% da janela em qualquer perfil. No autopilot o perfil vem de `--profile` ou da tela T0; no manual, a linha **Modelo:** segue o balanced — para max, troque o modelo antes do `/break`.

**Velocidade em vez de custo:** Opus · medium no `/break` e no `/execute` (mesma qualidade no execute, ~35% mais rápido no break, ~2× o preço por token). Não use no `/spec`.

**Nunca:** Haiku em discover, init, spec, break, plan ou execute. Opus em xhigh como padrão — se o seu `modelSettings` deixa Opus em xhigh, rode `/effort medium` ou `high` ao trocar para ele.

### Consumo medido (perfil balanced, projeto do benchmark)

| Etapa | custo em preço de API | ≈ janela de 5h* |
|---|---|---|
| discover · init | $0,2 · $0,4 | ~1% |
| spec | $0,9 | ~3% |
| break | $3,2 | ~10% |
| plan (sprint de 10 issues) | ~$1,5–2,6 | ~5–8% |
| execute (sprint de 10 issues) | ~$6,5 | ~20% |
| verify · secure · ship | $0,3–0,5 cada | ~1–1,5% cada |
| **projeto de 3 sprints, ponta a ponta** | **~$33–36** | **~100–110% (uma janela inteira)** |

\* No plano usado no benchmark, 1% da janela de 5h ≈ $0,33 em preço de API. Outro plano tem outra relação — o freio de janela do autopilot (`references/autopilot/hooks.md`) mostra o seu. Perfil max (Fable no break, Opus xhigh no init): +~$7 por projeto.

**Onde a recomendação aparece:**
- **Modo manual:** na linha `**Modelo:**` do Bloco de Handoff — antes do `/clear`, para a próxima sessão já abrir certo. Formato: `**Modelo:** Sonnet · effort high (\`/model sonnet\`)`. No Passo 0 do `/execute`, também, para a sessão que já está rodando.
- **Autopilot:** o condutor roteia sozinho por esta tabela (coluna do perfil do run).

**Model Routing automático (dentro do `/execute`):** o Agent tool aceita override de `model` por chamada. Issue com `Model hint: Opus/Fable` é despachada com o `model` da linha correspondente da tabela (balanced `opus`, max `fable`, econ `sonnet`); as demais saem com `model: "sonnet"` explícito — nenhuma herda o modelo da sessão. Toda chamada leva também `effort` (regra **Despacho explícito**). **O valor por chamada vence o frontmatter do agente registrado.** O usuário não precisa trocar de modelo no meio do sprint.

Regras:
- **Recomende, não force.** Uma linha no handoff. Se o usuário já escolheu um modelo ou pediu para pular, não repita.
- Cite a ressalva por issue **só se** existir issue com `Model hint` ≠ padrão.
- Nomes de modelo mudam — ancore no perfil (econ/balanced/max) e remeça com `evals/model-bench/` quando sair modelo novo.
- Trigger explícito: se o usuário perguntar "qual modelo rodar?", responda pela tabela para o modo atual/próximo, com o effort.

