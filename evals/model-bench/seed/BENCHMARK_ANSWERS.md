# Respostas do usuário (benchmark não-interativo)

> Este arquivo simula as respostas do dono do projeto. Toda vez que o skill mandar perguntar algo, a resposta está aqui. Se não estiver, assuma a opção mais razoável e registre como `[ASSUMIDO: ...]`.

## Ideia inicial

"Quero um encurtador de links interno pra minha agência de marketing. Hoje a gente manda links enormes cheios de UTM pros clientes no WhatsApp e fica feio, e não sabemos quantas pessoas clicaram. Quero algo simples que eu rode num servidor pequeno meu."

## Perguntas do /discover

1. **Problema e para quem?** Links longos com UTM ficam feios e não temos métrica de clique. Usuários: 3 pessoas da equipe interna da agência (criam links). Quem clica são clientes finais / público das campanhas.
2. **Fluxo principal?** Alguém da equipe entra no painel com a senha (token) da agência, cola a URL longa, opcionalmente escolhe um apelido (slug), recebe o link curto (ex: `https://go.agencia.com/black-friday`) e manda no WhatsApp. Quem clica é redirecionado na hora. Depois a equipe abre o painel e vê quantos cliques cada link teve e quando foi o último.
3. **Essencial na v1:** criar link (com slug automático ou personalizado), redirecionar, contar cliques e último acesso, listar links no painel, desativar um link (ele para de redirecionar e mostra página "link desativado"), data de expiração opcional. **Depois (fora da v1):** multiusuário com login individual, domínio customizado por cliente, QR code, geolocalização/analytics avançado, API pública para terceiros.
4. **Restrições técnicas:** Node.js 24, **zero dependências npm** (só biblioteca padrão: `node:http`, `node:fs`, `node:crypto`, `node:test`). Sem banco — persistência em arquivo JSON (`data/links.json`) com escrita atômica. Sem build step, sem framework front-end: painel em HTML renderizado no servidor. Autenticação: um único token de admin vindo da variável de ambiente `ADMIN_TOKEN`. Testes com `node --test`. Porta via `PORT` (padrão 3000).
5. **Produto similar que admira?** Bitly — pela simplicidade de colar e copiar. Não quero nada do resto do Bitly.

## Perguntas complementares do /spec e decisões de gray areas

- **Páginas:** (1) `/admin/login` — formulário com o token; (2) `/admin` — lista de links (slug, destino, cliques, último acesso, status, expira em) + formulário de criação no topo; (3) página pública "link desativado ou expirado" (HTTP 410); (4) página 404 amigável para slug inexistente.
- **Slug automático:** 6 caracteres base62 aleatórios, sem colisão. **Slug personalizado:** `[a-z0-9-]{3,32}`, único, e reservados proibidos: `admin`, `api`, `assets`, `health`.
- **URLs aceitas:** só `http://` e `https://`. Rejeitar `javascript:`, `data:`, `file:` etc. Rejeitar URL que aponte para o próprio encurtador (evitar loop).
- **Redirect:** HTTP 302. Contador de cliques e `lastAccessAt` atualizados a cada redirect bem-sucedido. Não contar cliques em links desativados/expirados.
- **Sessão do painel:** depois do login com o token, cookie `HttpOnly`, `SameSite=Strict`, com valor assinado (HMAC) — nunca o token cru no cookie. Comparação do token em tempo constante.
- **API (para o painel e testes):** JSON em `/api/links` (listar, criar), `/api/links/:slug` (detalhe, desativar via PATCH). Protegida pelo mesmo token (header `Authorization: Bearer <token>`) ou pelo cookie de sessão.
- **Expiração:** opcional, data ISO 8601; depois dela o link se comporta como desativado (410).
- **Concorrência:** um processo só; escrita atômica (escreve em arquivo temporário e renomeia) basta. Sem cluster.
- **Healthcheck:** `GET /health` retorna `{"status":"ok"}`.
- **Idioma da interface:** português do Brasil.

## Checkpoints humanos durante a execução

- Instalar pacote npm: **não autorizado** — o projeto é zero dependências. Se alguma issue pedir pacote, trate como violação da Constitution.
- Push / PR / merge: **não execute**. Em `/ship`, faça dry-run: grave o corpo do PR em `docs/sprints/PR-BODY-<sprint>.md` e registre o comando que rodaria.
- UAT do `/verify`: ver seção abaixo.

## Respostas do UAT (/verify)

Responda "ok" (pass) para todos os testes, **exceto**: qualquer teste que envolva ver o contador de cliques subir depois de acessar um link curto — para esse, a resposta do usuário é: "acessei o link curto 3 vezes pelo navegador, fui redirecionado certinho, mas no painel o contador continua em 0".
