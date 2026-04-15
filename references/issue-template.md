# Issue: [Título]

**Tipo**: prototype | functional
**Spec relacionada**: `Spec.md`
**Branch**: `issue/[slug-do-titulo]`
**Status**: draft | planned | in-progress | done

## Descrição
[O que precisa ser feito em 2-3 frases objetivas]

---

## Cenários

### Caminho feliz
[O que acontece quando tudo funciona — do trigger ao resultado final]

### Edge cases
- [caso especial 1 — ex: lista vazia, usuário sem permissão]
- [caso especial 2]

### Erros
- [erro 1 — o que mostrar/fazer quando ocorre]
- [erro 2]

---

## Banco de dados
> Preencher apenas se a issue envolver leitura ou escrita de dados

- **Tabela/Collection**: `[nome]`
- **Operação**: criar | ler | atualizar | deletar
- **Campos envolvidos**: [lista]
- **Migration necessária**: sim | não

---

## Dependências externas
> Preencher apenas se a issue usar APIs ou serviços de terceiros

- **Serviço**: [nome — ex: Stripe, Resend, S3]
- **Operação**: [o que será feito]
- **Documentação**: [link se relevante]

---

## Arquivos a criar
> Preenchido pelo /plan

- `path/do/arquivo.tsx` — [o que criar: componente X com props Y, exporte Z]
- `path/do/outro.ts` — [o que criar]

## Arquivos a modificar
> Preenchido pelo /plan

- `path/existente.tsx` — [o que modificar e por quê — seja específico]
- `path/outro.ts` — [o que modificar]

---

## Padrões de implementação
> Preenchido pelo /plan — snippets e referências encontradas na pesquisa

```
[snippet ou descrição do padrão a seguir]
```

---

## Done when
> Critérios mecanicamente verificáveis. Nenhum item abstrato ("deve funcionar bem").
> Preenchido pelo /plan a partir dos requisitos EARS da Spec.md.

- [ ] [comportamento observável 1 — ex: "usuário consegue submeter o form com credenciais válidas e é redirecionado em <2s"]
- [ ] [arquivo X existe com implementação real, não stub]
- [ ] [acceptance criteria REQ-N da Spec atendido]

---

## Tests
> Caminhos dos testes que cobrem esta issue. Preenchido pelo /plan.

- **unit**: `path/to/unit.test.ts`
- **integration**: `path/to/integration.test.ts`
- **e2e** (opcional): `path/to/e2e.spec.ts`

---

## Gate
> Comando shell que retorna 0 para "done", !=0 para "not done". Sensor 0/1 — o agente NUNCA declara a issue como concluída sem rodar isto e obter exit code 0.
> Preenchido pelo /plan com os comandos reais do projeto.

```bash
[ex: npm run lint && npm run test -- path/to/test && npm run typecheck]
```

**Regra:** se o Gate falhar 3x seguidas, pare, marque como blocker em `STATE.md` e peça intervenção.

---

## Summary
> Preenchido pelo /execute ao final. Input obrigatório para o validator (PR 2).

- **Status**: Complete | Blocked | Partial
- **Files changed**: [lista dos arquivos criados/modificados]
- **Gate check result**: pass/fail + contagens de teste
- **Issues encontradas**: [o que foi difícil, o que quase falhou]

### Spec Deviations
> Qualquer coisa feita DIFERENTE da spec/plan original. Preencher mesmo se parecer pequeno.
> Se nada divergiu, escrever `none`.

- **O que foi feito diferente**: [ex: usou lib X ao invés de Y que estava na spec]
- **Por quê**: [razão técnica]
- **Impacto**: [afeta outras issues? atualiza data-model? muda contracts?]
