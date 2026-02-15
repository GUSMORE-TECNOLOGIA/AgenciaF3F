# Referência – Mestre (importar skills em outro projeto)

Checklist e passos para executar tudo o que foi feito no AgenciaF3F quando o pacote de skills é copiado para **outro** projeto.  
**Novas skills no futuro:** adicione uma nova linha na tabela do Catálogo abaixo (nome da skill + o que fazer na importação).

---

## Catálogo de skills – o que fazer em cada uma na importação

Em todas: **trocar o prefixo** (F3F → `<Prefixo>` do novo projeto) em nome da pasta, frontmatter e referências. Além disso, em cada skill:

| Skill | Responsabilidade (resumo) | Na importação: além do prefixo |
|-------|----------------------------|----------------------------------|
| **F3F-gerente** | Orquestra as demais skills; não executa no lugar delas. | Atualizar referências ao skills-map e às outras skills (novo prefixo). Garantir que o novo projeto tenha um `skills-map.md` (ou equivalente) com a lista de skills do **novo** prefixo. |
| **F3F-supabase-data-engineer** | Tabelas, RLS, migrations, MCP Supabase. | Não hardcodar URL/ref. Garantir que SKILL e reference mandem usar PROJECT_INTEGRATIONS e `.env` do **novo** projeto. Aviso de template (uso em outro projeto = substituir refs). |
| **F3F-auth-rotas** | Login, sessão, perfil, rotas protegidas (React Router + AuthContext). | Trocar referências a project-overview e security; manter padrão “nunca admin para dados por usuário”. Se o novo projeto usar outro Auth (não Supabase), descrever o provedor. |
| **F3F-entidades-centrais** | Usuário + entidade principal (ex.: cliente); sempre por ID; sem duplicar. | Ajustar nomes de entidades/tabelas ao novo projeto (ex.: cliente, pessoa, usuário). Referências a project-overview e data-flow; tabela central e FK (ex.: `cliente_id` ou `pessoa_id`) conforme o modelo do novo projeto. |
| **F3F-novo-modulo** | Criar módulo/área: scaffold, rotas, menu, config. | Ajustar script `create-module-full.sh`: paths para `src/modules/`, `src/pages/` (ou a estrutura do novo projeto). Referências a modulos-por-role e submodulos; checklist no reference com paths do novo repo. |
| **F3F-github-vercel** | Commits (Conventional), PR, Vercel. | Fonte de verdade: PROJECT_INTEGRATIONS e `.env`. Placeholders para URL do repo e projeto Vercel do **novo** projeto. Aviso template no reference. |
| **F3F-backend** | Services, repositories, domínio. | Paths: `src/services/`, `src/modules/` (ou equivalente). Script `create-layer.sh`: raiz e paths do novo projeto. Referências a project-overview e à skill Supabase do novo prefixo. |
| **F3F-integracoes-vinculos** | Contratos entre módulos; doc PROJECT_INTEGRATIONS. | Garantir que o nome do doc de integração (PROJECT_INTEGRATIONS.md ou outro) seja o usado no novo projeto; referências entre skills com novo prefixo. |
| **F3F-documentacao** | .context/docs, README, ADRs, glossário, índice. | Caminho do índice (ex.: `.context/docs/README.md` ou `docs/`) conforme o novo repo. Não escrever conteúdo técnico das outras skills. |
| **F3F-organizar-repositorio** | Estrutura de pastas; onde colocar arquivos. | Mapa de diretórios do **novo** projeto (ex.: `src/`, `app/`, etc.) no reference; atualizar exemplos de paths. |
| **F3F-limpeza-codigo** | Código morto, duplicação, refatoração. | Apenas prefixo e paths em `reference.md` (ex.: caminho do script find-dead-code). |
| **F3F-frontend** | Páginas, rotas, layouts (React/Vite). Usa Componentes. | Paths: `src/pages/`, `src/components/`; React Router (não Next). Referências a project-overview e à skill Componentes do novo prefixo. |
| **F3F-componentes** | Componentes reutilizáveis (CPF, telefone, data, moeda). | Paths: `src/components/ui` ou `src/shared/ui` conforme o novo projeto. Script `create-component.sh`: raiz e path de saída. Barrel e referências à skill Frontend do novo prefixo. |
| **F3F-qa-tester** | Jest, RTL, Playwright; cenários e edge cases. | Paths: testes unitários ao lado do código (ex.: `src/services/*.spec.ts`); E2E em `tests/e2e/`. Referências a project-overview, data-flow e à skill Auth do novo prefixo (bypass E2E se houver). |
| **F3F-security-performance** | Auditoria RLS, dados sensíveis, N+1. | Apenas prefixo; referências a security.md e às skills Supabase/Backend do novo prefixo. |
| **F3F-ux-designer** | Mockups textuais, copy, loading/empty. | Apenas prefixo; referências à skill Frontend do novo prefixo. |
| **F3F-debugger-erros** | RCA, troubleshooting-log, regressão. | Caminho do log de erros (ex.: `.context/docs/troubleshooting-log.md`) conforme o novo projeto; prefixo. |
| **F3F-consultoria-processos** | Ponte negócio→sistema; requisitos, fluxos. | Apenas prefixo; remover referências a docs específicos do projeto de origem. |
| **F3F-migracao-legado** | Mapa de Tradução De→Para; orquestra migração. | “Para” = **novo** projeto (não F3F). Matriz no reference: destino = nome do novo projeto; links para Entidades centrais e Supabase do novo prefixo. |

**Mestre** não é renomeada; permanece como `Mestre` em qualquer projeto.

**Quando incluir novas skills no futuro:** complemente esta tabela com uma nova linha: coluna 1 = nome da skill (ex.: `F3F-nova-skill`), coluna 2 = responsabilidade em uma linha, coluna 3 = na importação: trocar prefixo + o que mais for específico dessa skill (paths, docs, scripts).

---

## 1. Definir nome/prefixo do novo projeto

- **Exemplos:** `Acme`, `LojaX`, `F3F` (se for outro produto com mesmo prefixo).
- **Uso:** pastas das skills ficarão `Acme-backend`, `Acme-frontend`, etc. Todas as menções a "F3F" ou "AgenciaF3F" nos arquivos serão trocadas por esse nome/prefixo.
- Obter do usuário ou inferir de `package.json` / nome do repo quando possível.

---

## 2. Renomear pastas das skills

| De (exemplo)     | Para (exemplo)   |
|------------------|-------------------|
| `F3F-backend`    | `<Prefixo>-backend` |
| `F3F-frontend`   | `<Prefixo>-frontend` |
| `F3F-componentes`| `<Prefixo>-componentes` |
| … todas as `F3F-*` | … todas as `<Prefixo>-*` |

- **Mestre** permanece como `Mestre` (não renomear).
- **README.md** na raiz de `.cursor/skills/`: atualizar se listar nomes de skills (ex.: referência a F3F-gerente → `<Prefixo>-gerente`).

---

## 3. Substituições em massa (todos os SKILL.md e reference.md)

Aplicar em cada arquivo dentro de `.cursor/skills/<NomeSkill>/`:

| Procurar (exemplo)     | Substituir por        |
|------------------------|------------------------|
| `F3F`                  | `<Prefixo>` (ex.: Acme) |
| `AgenciaF3F`           | Nome completo do novo projeto |
| `.cursor/skills/F3F-`  | `.cursor/skills/<Prefixo>-` |
| `project-overview.md`  | Manter ou ajustar se o novo projeto usar outro nome (ex.: `project-plan.md`) |
| `PROJECT_INTEGRATIONS.md` | Manter; no novo projeto pode ser o mesmo nome ou equivalente em `.context/docs/` |

- Revisar **scripts** (ex.: `create-module-full.sh`, `create-layer.sh`): paths e nomes devem refletir a estrutura do **novo** projeto (ex.: `src/pages/`, `src/modules/`).
- Referências cruzadas entre skills: garantir que links como `.cursor/skills/F3F-backend/` virem `.cursor/skills/<Prefixo>-backend/`.

---

## 4. PROJECT_INTEGRATIONS.md (ou equivalente) no novo projeto

- **Se existir** (ex.: `.context/docs/PROJECT_INTEGRATIONS.md`): garantir que contém o **aviso de template** padrão no topo:
  - *"**Uso como template:** Se este repositório for usado para **outro** projeto ou cliente, substitua aqui e em `.env` todos os refs (Supabase, GitHub, Vercel, domínio e chaves) pelos do novo projeto; caso contrário ferramentas e MCP podem apontar para o projeto errado."*
- **Se não existir:** criar o documento (ou um equivalente) com:
  - Seções para Supabase (URL, project ID, não commitar chaves), GitHub (org/repo), Vercel (projeto, domínio).
  - O aviso de template acima.
  - Instrução de manter chaves em `.env` / `.env.local` e nunca versionadas.

---

## 5. AGENTS.md no novo projeto

Garantir que existe a seção **Repository & deployment** no mesmo padrão usado aqui:

```markdown
## Repository & deployment

- **Antes de usar MCP Supabase ou alterar banco/deploy:** confira o projeto em [.context/docs/PROJECT_INTEGRATIONS.md](.context/docs/PROJECT_INTEGRATIONS.md) (e `.env`). Use apenas o projeto Supabase/GitHub/Vercel definido para este repositório.
- **Uso como template:** Se este repositório for usado para **outro** projeto ou cliente, substitua em [.context/docs/PROJECT_INTEGRATIONS.md](.context/docs/PROJECT_INTEGRATIONS.md) e em `.env` todos os refs (Supabase, GitHub, Vercel, domínio e chaves) pelos do novo projeto; caso contrário ferramentas e MCP podem apontar para o projeto errado.
```

- Ajustar o caminho de PROJECT_INTEGRATIONS se no novo repo for diferente (ex.: `docs/PROJECT_INTEGRATIONS.md`).
- Se AGENTS.md for gerado automaticamente, garantir que essa seção seja preservada ou injetada pelo processo de import.

---

## 6. Frase de aviso template nos docs que citam Supabase/GitHub/Vercel

Adicionar (ou padronizar) a frase curta abaixo em **todos** os arquivos que contêm URLs/refs de Supabase, GitHub ou Vercel:

- **Frase padrão:**  
  `> **Template:** Em uso para outro projeto, substitua refs em [.context/docs/PROJECT_INTEGRATIONS.md](.context/docs/PROJECT_INTEGRATIONS.md) e \`.env\` pelos do novo projeto.`

**Arquivos que normalmente precisam do aviso (ajustar conforme existência no novo repo):**

- `.context/docs/PROJECT_INTEGRATIONS.md` (ou equivalente)
- `AGENTS.md`
- `VERCEL_DEPLOY.md`
- `GITHUB_SETUP.md`
- `.context/README.md`
- `APLICAR_MIGRATIONS.md`
- `CRIAR_USUARIO_ADMIN.md`
- `criar_admin_via_dashboard.md`
- `.context/docs/EQUIPE_USUARIOS.md`
- `.context/docs/IMPORT_PLANILHA.md`
- `INTEGRACAO_SUPABASE.md`
- `CHECKLIST_INTEGRACAO.md`
- `SOLUCAO_ERRO_431.md`
- `FIX_ERRO_431.md`
- `Commands/SETUP-SEGURANCA.md`
- `.context/docs/reutilizacao-skills-outro-projeto.md` (se existir)
- Skill **GitHub/Vercel** (ex.: `<Prefixo>-github-vercel/reference.md`): referência a PROJECT_INTEGRATIONS como fonte de verdade + aviso template.
- Skill **Supabase** (ex.: `<Prefixo>-supabase-data-engineer/SKILL.md`): aviso de que, em uso como template, refs devem ser substituídos em PROJECT_INTEGRATIONS e .env.

(No novo projeto, alguns desses arquivos podem não existir; aplicar apenas nos que existirem e citarem integrações.)

---

## 7. Validar GitHub, Vercel e Supabase

- **GitHub:** Confirmar que o novo repo tem remote e nome corretos; PROJECT_INTEGRATIONS (ou doc equivalente) deve listar org/repo **deste** projeto, não `GUSMORE-TECNOLOGIA/AgenciaF3F`.
- **Vercel:** Projeto e domínio no doc de integrações e no .env devem ser do **novo** projeto; não usar projeto/domínio do AgenciaF3F.
- **Supabase:** URL e project ref no doc de integrações e em `.env` devem ser do projeto Supabase do **novo** cliente/repo; nunca deixar URL/ref do AgenciaF3F no novo repo.
- **Busca final:** Procurar no repositório por `rhnkffeyspymjpellmnd`, `GUSMORE-TECNOLOGIA/AgenciaF3F`, `agenciaf3f.app` (e outros identificadores do projeto de origem). Substituir ou remover; nenhum arquivo versionado deve apontar para o projeto antigo.

---

## 8. Resumo do que esta skill assegura

| Ação | Descrição |
|------|-----------|
| Renomear skills | `F3F-*` → `<Prefixo>-*` em pastas e referências internas. |
| Adaptar conteúdo | Projeto, paths e links em todos os SKILL.md e reference.md. |
| PROJECT_INTEGRATIONS | Existir no destino com aviso de template; chaves só em .env. |
| AGENTS.md | Seção "Repository & deployment" (conferir integrações + template). |
| Aviso template | Frase padrão em todos os docs que citam Supabase/GitHub/Vercel. |
| Validar refs | Nenhum ref do AgenciaF3F no novo repo; GitHub/Vercel/Supabase do novo projeto. |

Assim que você copiar a pasta de skills para outro projeto e acionar a **Mestre** informando o nome/prefixo do novo projeto, ela fica responsável por executar (ou guiar) todas essas ações.
