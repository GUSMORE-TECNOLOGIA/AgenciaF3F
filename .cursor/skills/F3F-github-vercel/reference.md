# Referência – F3F GitHub + Vercel

Convenções de commit, branch strategy, PR e Vercel. **Registro progressivo:** decisões de workflow e configuração adotadas devem ser anotadas aqui.

---

## Repositório e projeto (canonical)

**Usar sempre estes identificadores.** Ao orientar commits, PR, merge ou deploy, referenciar este repositório e este projeto Vercel; não criar ou apontar para outro repo/projeto. Fonte de verdade: [.context/docs/PROJECT_INTEGRATIONS.md](.context/docs/PROJECT_INTEGRATIONS.md) e `.env`.

**Template:** Em uso para outro projeto, substitua refs em PROJECT_INTEGRATIONS.md e `.env` pelos do novo projeto.

| Serviço | Identificador |
|---------|----------------|
| **GitHub** | Preencher: URL do repo (ex.: `https://github.com/<org>/<AgenciaF3F>`). Org e nome do repo conforme o projeto F3F. |
| **Vercel** | Preencher: nome do projeto Vercel, URL de produção (site oficial). Previews: `*-*.vercel.app` por branch/commit. |

Fonte de verdade também em [AGENTS.md](AGENTS.md) (Repository & deployment). Ao configurar Vercel (conectar repo, env vars), usar o repo do projeto; ao falar de "origin", "push", "PR", tratar deste repositório.

---

## Conventional Commits

Formato: `tipo(escopo): descrição` (escopo opcional).

- **Tipos comuns:** `feat` (feature), `fix` (bugfix), `docs` (documentação), `chore` (manutenção, deps, config), `refactor` (refatoração sem mudar comportamento), `test` (testes), `style` (formatação, sem mudança de lógica).
- **Escopo (sugestão F3F):** módulo ou área, ex.: `auth`, `clientes`, `equipe`, `supabase`, `shared`, `frontend`, `backend`.
- **Exemplos:**
  - `feat(auth): login com redirect após sucesso`
  - `fix(clientes): validação de CPF no formulário`
  - `docs: adicionar skill GitHub + Vercel ao skills-map`
  - `chore(deps): atualizar react para 18.x`

Quebra de linha opcional para corpo do commit; primeira linha deve ser ≤72 caracteres quando possível.

---

## Branch strategy (registro progressivo)

Definir e manter aqui as regras adotadas pelo time.

| Item | Convenção atual (preencher/ajustar) |
|------|-------------------------------------|
| **Branch principal (produção)** | `main` – deploy Vercel production. |
| **Branch de desenvolvimento** | Opcional: `develop`; se não houver, features saem de `main`. |
| **Feature** | `feature/nome-curto` ou `feat/nome-curto` (ex.: `feature/auth-login`). |
| **Bugfix** | `fix/nome-curto` ou `fix/issue-123`. |
| **Proteção** | `main` protegida (PR obrigatório, build verde)? A definir no GitHub. |
| **Merge** | Merge commit ou squash? Rebase antes do merge? A definir. |

Ao adotar regras, preencher a tabela e referenciar em [development-workflow.md](.context/docs/development-workflow.md) se existir.

---

## Checklist de PR

Antes de marcar PR como pronto para review:

- [ ] `npm run build` passa.
- [ ] `npm run test` passa (se o projeto tiver script de test).
- [ ] Commits no padrão Conventional Commits.
- [ ] Se houver mudança em banco de dados: a migration foi gerada e as políticas de RLS foram validadas?
- [ ] Se mudou scaffolding ou adicionou doc em `.context/docs/`: índice (README.md de .context/docs) atualizado.
- [ ] Se mudança afeta UI ou comportamento visível: anexar amostra (captura, output CLI) no PR quando útil.
- [ ] Descrição do PR explica o quê e o porquê; link para issue se houver.

**Validação local:** rodar `bash .cursor/skills/F3F-github-vercel/scripts/validate-build.sh` (na raiz do repo) ou usar o comando **/pre-pr** no chat (se existir).

---

## Resolução de conflitos

1. **Atualizar branch:** `git fetch origin` e `git merge origin/main` (ou `git rebase origin/main`) na sua branch.
2. **Conflitos listados:** `git status` mostra arquivos em conflito.
3. **Resolver por arquivo:** abrir cada arquivo, remover marcadores `<<<<<<<`, `=======`, `>>>>>>>`, manter a versão correta (ou mesclar trechos).
4. **Marcar resolvido:** `git add <arquivo>` para cada arquivo resolvido.
5. **Continuar:** se fez merge, `git commit`; se fez rebase, `git rebase --continue`.
6. **Validar:** rodar `npm run build` (e `npm run test` se existir) após resolver tudo.
7. **Push:** se usou rebase, pode ser necessário `git push --force-with-lease` (apenas na **sua** branch de feature, nunca em `main`).

Em dúvida sobre qual código manter, preferir pedir revisão humana em vez de escolher aleatoriamente.

---

## Vercel (registro progressivo)

- **Deploy:** conectado ao repositório GitHub; push na branch principal = deploy de **production**; push em outras branches = deploy de **preview** (URL única por branch/commit).
- **Variáveis de ambiente:** configurar no dashboard Vercel (Project → Settings → Environment Variables). Separar Production / Preview / Development quando necessário. **Nunca** commitar valores de produção; esta skill não altera env sem confirmação.
- **Build:** comando e output directory definidos em configuração do projeto. Projeto F3F usa **Vite**: build `npm run build` (tsc + vite build), output `dist/`. Falha de build: ver logs no Vercel (Deployments → clique no deploy → Build Logs).
- **Decisões de config:** (ex.: Node version, region, rewrites) documentar aqui quando definidas.

| Config / Decisão | Valor ou nota |
|------------------|----------------|
| **Projeto Vercel (nome)** | Preencher conforme projeto F3F. |
| **URL de produção (site oficial)** | Preencher quando houver domínio. |
| Branch de produção | `main`. |
| Build command | `npm run build`. |
| Install command | `npm install` (projeto usa npm). |
| Output directory | `dist` (Vite). |
| **Variável útil** | `VITE_*` para variáveis expostas ao client (Vite); configurar no Vercel sem commitar valores. |

### MCP Vercel (benefícios para o F3F)

Com o MCP Vercel configurado para o time/projeto, agentes podem:

- **Listar projetos e deployments** — confirmar projeto, ver últimos deploys (production vs preview).
- **Ver build logs** — debugar falha de deploy (ex.: `get_deployment_build_logs` por deployment ID ou URL).
- **Ver runtime logs** — erros e `console.log` em produção/preview (api, serverless, edge).
- **Consultar documentação** — `search_vercel_documentation` (ex.: custom domain, env vars, Vite).
- **Deploy via MCP** — `deploy_to_vercel` a partir do estado atual do repo (conforme config do MCP).
- **Acessar URL protegida** — `get_access_to_vercel_url` para link temporário de preview com auth; `web_fetch_vercel_url` para fetch autenticado em deployment protegido.

Fonte de verdade do projeto e domínio: [AGENTS.md](AGENTS.md) e esta seção. Preencher Team ID e Project ID quando o projeto Vercel estiver configurado (útil para chamadas MCP que exigem `projectId`/`teamId`).

---

## Links

- [AGENTS.md](AGENTS.md) – PR & Commit Guidelines.
- [development-workflow.md](.context/docs/development-workflow.md) – branching e contribuição (quando existir).
- [F3F-documentacao](.cursor/skills/F3F-documentacao/SKILL.md) – quando atualizar índice e docs.
