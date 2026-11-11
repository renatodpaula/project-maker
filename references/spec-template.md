# Spec: [Nome do Projeto/Feature]

> Gerado via /spec em [data]. Usado como input para /break.

**Status**: draft | approved
> `approved` só depois do Passo 5 do /spec (aprovação explícita do usuário). O /break parte de spec aprovada.

## Overview
[Descrição em 2-3 parágrafos: o que é, para quem, qual problema resolve]

## Fora de escopo
- [o que esta spec decide não fazer, e por quê em meia linha]

---

## Requisitos

> Numeração estável: REQ-N não é renumerado depois que existe issue apontando para ele.
> Acceptance criteria em EARS — evento (`WHEN … the system SHALL …`), estado (`WHILE …`), indesejado (`IF … THEN the system SHALL …`), sempre válido (`The system SHALL …`).

### REQ-1 — [nome curto]
[1 frase do que o usuário/sistema precisa]
- WHEN [gatilho] the [sistema] SHALL [resposta observável]
- IF [erro, abuso ou falha externa] THEN the [sistema] SHALL [resposta]

### REQ-2 — [nome curto]
- ...

---

## Superfícies

> Com interface visual: preencha Páginas e Componentes. Sem interface (CLI, biblioteca, API, job): apague as duas seções e liste aqui comandos, endpoints, funções públicas ou jobs, com entrada e saída.

## Páginas

### [Nome da Página]
- **Rota**: `/caminho`
- **Propósito**: [o que o usuário faz aqui]
- **Acesso**: público | autenticado | admin

### [Nome da Página 2]
- **Rota**: `/caminho`
- **Propósito**: [o que o usuário faz aqui]
- **Acesso**: público | autenticado | admin

---

## Componentes

### [Nome do Componente] — [Página onde aparece]
- **Tipo**: form | card | lista | tabela | modal | nav | sidebar | etc.
- **Campos/Elementos**: [lista de campos ou elementos visuais]
- **Estados**: default | loading | vazio | erro | sucesso
- **Código existente a reutilizar**: [se feature em projeto existente]

---

## Comportamentos

### [Nome do Comportamento]
- **Trigger**: [o que o usuário faz — ex: clica em "Salvar", submete o form]
- **Componente**: [em qual componente acontece]
- **Caminho feliz**: [o que acontece quando tudo funciona]
- **Edge cases**: [casos especiais — ex: campo vazio, usuário não autenticado]
- **Erros**: [o que mostrar quando algo falha]
- **Dados necessários**: [quais dados são lidos ou gravados]

### [Nome do Comportamento 2]
- **Trigger**: ...
- **Componente**: ...
- **Caminho feliz**: ...
- **Edge cases**: ...
- **Erros**: ...
- **Dados necessários**: ...
