# Modo: /discover

> Parte do skill **project-maker**. Pré-requisito: auto-sizing + Harness Rules do SKILL.md já carregados.

**Quando usar:** `--epic`. O usuário tem uma ideia mas ainda não sabe exatamente o que construir.

Conduza uma conversa de brainstorming — **uma pergunta por vez**, não um formulário. Espere a resposta antes de fazer a próxima. Reflita de volta o que entendeu a cada resposta para confirmar.

Sequência de perguntas:
1. Qual problema você quer resolver? Para quem é?
2. Como seria o fluxo principal — o que o usuário faz do início ao fim?
3. O que é essencial ter na primeira versão? O que pode ficar para depois?
4. Tem alguma restrição técnica? (stack preferida, integrações obrigatórias)
5. Conhece algum produto similar que admira? O que gosta nele?

Ao gerar o `brief.md`:
- Leia `references/brief-template.md` para o formato
- Marque com `[NEEDS CLARIFICATION: descrição do que está indefinido]` qualquer ponto que ficou ambíguo ou não foi respondido nas perguntas
- Mostre o brief ao usuário e pergunte se quer ajustar ou resolver os marcadores
- Só instrua a avançar quando não restar marcadores sem resolução

**Ao confirmar:** emita o **Bloco de Handoff** (regra Next Command) com o comando completo:
> **▶ Próximo passo** — `/clear` primeiro, depois:
> ```
> /project-maker init
> ```
> **Modelo:** tier raciocínio (Opus/Fable) — `/init` define steering e Constitution.
