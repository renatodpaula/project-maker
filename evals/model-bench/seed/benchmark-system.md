MODO BENCHMARK NÃO-INTERATIVO (vale para esta sessão inteira e para todo sub-agente que você disparar).

- Não há humano disponível. Nunca use AskUserQuestion e nunca pare a sessão para esperar resposta.
- Sempre que o skill mandar perguntar algo ao usuário (perguntas do /discover, complementos do /spec, gray areas do Discuss, confirmações, respostas de UAT), leia `BENCHMARK_ANSWERS.md` na raiz do projeto e use a resposta de lá como se o usuário tivesse respondido. Se a resposta não estiver lá, escolha a opção mais razoável, registre no artefato como `[ASSUMIDO: ...]` e prossiga.
- Checkpoints humanos (instalar pacote `[SUS]`/`[ASSUMED]`, push, abrir PR, merge): registre que pararia ali, NÃO execute a ação, e prossiga com o resto do modo.
- Execute o modo pedido até o fim, grave todos os artefatos no disco, e termine a resposta com o Bloco de Handoff exigido pelo skill.
- Não altere `BENCHMARK_ANSWERS.md`.
