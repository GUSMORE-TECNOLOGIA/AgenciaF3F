---
name: F3F-github-vercel
description: "GitHub and Vercel for F3F (AgenciaF3F). Commits (Conventional Commits), push, PR, merge, branch strategy, conflict resolution; Vercel integration (deploy, preview, env vars). Use when committing/PR, configuring or debugging deploy, or defining branch strategy."
---

# F3F GitHub + Vercel

Responsável por **fluxo Git** (commits, branches, PR, merge), **resolução de conflitos** e **integração Vercel** (deploy, preview, env). Alinha ao [AGENTS.md](AGENTS.md) (PR & Commit Guidelines) e ao [development-workflow.md](.context/docs/development-workflow.md) quando existir. Esta skill **orienta e executa** comandos e passos; não altera secrets ou produção sem confirmação.

## Regra de ouro

- **Commits:** sempre Conventional Commits (`feat(scope): description`); escopo opcional mas recomendado (ex.: `feat(auth): login com redirect`). Esta skill sugere mensagem e valida formato.
- **PR:** antes do merge, rodar `npm run build` (e `npm run test` se existir); documentação e índice atualizados se houver mudança em estrutura ou scaffolding. Anexar amostras (CLI, captura) quando mudança afetar UI/comportamento visível.
- **Branch strategy:** definir e documentar no [reference.md](reference.md); padrão comum é `main` (produção) e branches de feature/fix a partir de `main` ou de `develop` se o time adotar. Esta skill segue a estratégia documentada.
- **Vercel:** deploy automático a partir do repo (branch principal = production; demais = preview). URL de produção e variáveis de ambiente: esta skill orienta onde configurar; **nunca** sobrescrever env de produção sem confirmação explícita.
- **Conflitos:** esta skill guia a resolução (identificar arquivos, manter intenção de ambas as partes, testar após merge); não faz force-push em branch compartilhada sem confirmação.

## Quando usar esta skill

- **Fazer commit:** gerar ou revisar mensagem no padrão Conventional Commits; checar se arquivos sensíveis (`.env`, secrets) não vão no commit.
- **Abrir ou revisar PR:** checklist (build, test se houver, docs); descrição do PR; sugerir título no padrão do projeto.
- **Merge:** garantir que branch está atualizada (rebase ou merge da base); resolver conflitos se houver.
- **Resolver conflitos:** identificar conflitos, orientar resolução por arquivo, lembrar de rodar build (e test) após.
- **Branch strategy:** definir ou consultar regras (ex.: `feature/nome`, `fix/nome`, proteção de `main`); documentar no reference.
- **Vercel:** configurar projeto (conectar repo, branch de produção); variáveis de ambiente (preview vs production); debugar deploy falho (logs, build); entender preview URLs.
- **Revert / desfazer:** reverter commit ou PR com segurança; esta skill indica comandos e impacto.

## Regras

- **Não fazer:** force-push em `main` ou em branch que outros usam; alterar variáveis de ambiente de produção sem confirmação; commitar `.env` ou chaves.
- **Sempre:** Conventional Commits; rodar build (e test quando existir) antes de marcar PR pronto; atualizar `.context/docs/README.md` (e índice) se mudar scaffolding ou adicionar doc.
- **Registro progressivo:** decisões de branch strategy, convenções de PR ou configuração Vercel adotadas devem ser anotadas no [reference.md](reference.md).

## Comandos do Cursor

Para finalizar uma tarefa, utilizar preferencialmente o comando **/commit** (em `.cursor/commands/`) para garantir formatação correta (Conventional Commits, sem emojis, sem mojibakes). Ao concluir uma feature, utilizar o comando **/create-pr** para gerar título e descrição profissionais do PR. Para validar antes do PR, pode-se rodar o script `bash .cursor/skills/F3F-github-vercel/scripts/validate-build.sh` ou o comando **/pre-pr** (se existir).

## Conteúdo do reference.md

O [reference.md](reference.md) contém:

- **Conventional Commits:** formato, tipos (`feat`, `fix`, `docs`, `chore`, etc.), escopo sugerido para o F3F.
- **Branch strategy:** ramos principais, naming (`feature/`, `fix/`), quando fazer merge/rebase.
- **Checklist de PR:** build, test (se houver), docs, descrição, anexos para UI.
- **Resolução de conflitos:** passos, quando pedir ajuda humana.
- **Vercel:** deploy por branch, preview vs production, env vars, onde ver logs; registro de decisões de config.

## Integração com outras skills

- **Documentação (F3F-documentacao):** atualização de índice (`.context/docs/README.md`) e de `development-workflow.md` quando mudar workflow ou estrutura; esta skill aplica as regras de "atualizar docs ao mudar scaffolding".
- **QA / Tester:** PR deve passar em testes quando existirem; esta skill exige build (e test quando configurado) antes do merge; não implementa os testes (skill QA).
- **Limpeza de código / Organizar repositório:** commits e PRs podem agrupar refatoração ou limpeza; mensagem de commit deve refletir (ex.: `refactor(auth): extrair validação para shared`).

## Referência adicional

- Convenções, branch strategy, conflitos e Vercel: [reference.md](reference.md) (neste diretório).
- Diretrizes de PR e commit no projeto: [AGENTS.md](AGENTS.md). Workflow de desenvolvimento: [development-workflow.md](.context/docs/development-workflow.md) (quando existir).
