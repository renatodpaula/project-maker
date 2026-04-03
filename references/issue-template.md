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

## Verificação
> Preenchido pelo /plan com os comandos reais do projeto

- [ ] Testes: `[ex: bun test, npm test, pnpm test]`
- [ ] Tipos: `[ex: tsc --noEmit, bun run typecheck]`
- [ ] Lint: `[ex: bun run lint, eslint .]`
- [ ] Comportamento visual/funcional conforme spec
