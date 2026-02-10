# Mapa de skills – AgenciaF3F

Lista das skills do projeto AgenciaF3F (F3F) e quando usar cada uma. Skills ativas no Cursor estão em `.cursor/skills/` (prefixo **F3F-**; durante a migração podem existir pastas `sgt-*` ainda não renomeadas).

---

## Lista de skills

| Skill | Responsabilidade resumida |
|-------|---------------------------|
| **F3F-gerente** | Orquestra as demais skills: direciona tarefa, define ordem multi-skill, evita conflitos. Não executa no lugar das outras. |
| **F3F-supabase-data-engineer** | Tabelas, RLS, migrations, MCP Supabase. Não mexe em services nem em telas. |
| **F3F-auth-rotas** | Login, sessão, perfil, middleware, rotas protegidas vs públicas. Não define esquema de tabelas (Supabase). |
| **F3F-entidades-centrais** | Modelo de usuário e entidade principal do negócio (ex.: cliente); sempre por ID; sem cadastros duplicados. Define o quê; Supabase/Backend implementam. |
| **F3F-novo-modulo** | Criar módulo/área no projeto (scaffold + checklist). Orquestra; delega a Supabase, Backend, Frontend, Auth, Integrações, Documentação. |
| **F3F-github-vercel** | Commits (Conventional), PR, merge, conflitos, branch strategy, Vercel. |
| **F3F-backend** | Services, repositories, entidades de domínio. Não mexe em tabelas/RLS (Supabase) nem em telas (Frontend). |
| **F3F-integracoes-vinculos** | Contratos entre módulos/áreas; documentação em [PROJECT_INTEGRATIONS.md](./PROJECT_INTEGRATIONS.md). Define contratos; Backend implementa. |
| **F3F-documentacao** | .context/docs, README, ADRs, glossário, índice. Não escreve o conteúdo técnico das outras skills. |
| **F3F-organizar-repositorio** | Estrutura de pastas, onde colocar arquivos, mover/reorganizar. Conteúdo do código = Limpeza. |
| **F3F-limpeza-codigo** | Código morto, duplicação, refatoração. Onde os arquivos ficam = Organizar. |
| **F3F-frontend** | Páginas, rotas, layouts, componentes de tela (React/Vite). Usa componentes da skill Componentes; não cria campos padronizados. |
| **F3F-componentes** | Componentes reutilizáveis (CPF, telefone, data, moeda, etc.). Frontend usa; não codifica telas. |
| **F3F-qa-tester** | Cenários de teste, Jest, RTL, Playwright, edge cases. Não implementa código de produção. |
| **F3F-security-performance** | Auditoria RLS, dados sensíveis no client, N+1. Reporta; não implementa RLS nem corrige código. |
| **F3F-ux-designer** | Mockups textuais, copy, loading/empty, fluxo. Define o quê; Frontend implementa. |
| **F3F-debugger-erros** | RCA, troubleshooting-log, regressão (QA). Analisa e corrige erros; registra no log. |
| **F3F-consultoria-processos** | Ponte negócio→sistema; requisitos, campos, fluxos. Primeira para ideia bruta; não implementa. |
| **F3F-migracao-legado** | Analisa legado, gera Mapa de Tradução (De→Para F3F), orquestra migração; desduplicação. Delega às outras skills. |

---

## Quando usar cada skill

| Tipo de pedido / tarefa | Skill principal | Outras (ordem quando aplicável) |
|--------------------------|-----------------|----------------------------------|
| Criar/alterar tabelas, RLS, migrations, Supabase | **Supabase / Engenheiro de dados** | Entidades centrais (se for tabela central); Documentação (se alterar fluxo). |
| Login, sessão, perfil, middleware, rotas protegidas | **Auth e Rotas** | Supabase (tabela de perfil); Frontend (telas de login/perfil). |
| Definir/alterar modelo usuário ou entidade principal (ex.: cliente); "uma entidade única" | **Entidades centrais** | Supabase (implementar schema); Backend (services). |
| Criar um novo módulo/área no projeto | **Novo módulo** | Orquestra: Organizar → Entidades/Integrações (se necessário) → Supabase → Backend → Frontend → Auth → Documentação. |
| Commit, PR, merge, conflitos, Vercel | **GitHub + Vercel** | Documentação (se mudou scaffolding); QA (testes no PR). |
| Services, repositories, entidades de domínio | **Backend** | Supabase (tipos, acesso via repo); Auth (user_id na sessão). |
| Como módulos/áreas se comunicam; contrato; atualizar doc de integração | **Integrações e vínculos** | [PROJECT_INTEGRATIONS.md](./PROJECT_INTEGRATIONS.md). Backend (implementar); Documentação (índice). |
| Atualizar .context/docs, README, ADR, glossário, índice | **Documentação** | — |
| Onde colocar arquivo; estrutura de pastas; mover/reorganizar | **Organizar repositório** | Documentação (se mudar mapa); Limpeza (se também for conteúdo). |
| Código morto, duplicação, refatorar | **Limpeza de código** | Organizar (se for extrair para shared e mover). |
| Páginas, rotas, layouts, componentes de tela | **Frontend** | Componentes (usar campos padronizados); Auth (rotas protegidas). |
| Criar/padronizar componente CPF, telefone, data, moeda, etc. | **Componentes** | Frontend (usa depois). |
| Testes unitários, E2E, edge cases | **QA / Tester** | — |
| Auditar RLS; dados sensíveis no client; N+1 | **Security & Performance** | Supabase/Backend/Frontend (implementar correções após reporte). |
| Mockup textual, copy, loading/empty, fluxo (antes de codar) | **UX / Designer** | Frontend (implementa depois). |
| Erro, bug, "não funciona"; causa raiz; registrar solução | **Debugger / Especialista em Erros** | QA (regressão); Supabase/Backend/Frontend (se causa for de outra skill). |
| Ideia bruta de negócio, processo novo, dor do usuário | **Consultoria / Analista de Processos** | Entidades/Integrações/UX/Backend/Supabase/Frontend (implementar conforme requisitos). |
| Trazer sistema legado para o F3F; migrar sistema antigo | **Migração e Tradução de Legado** | Mapa de Tradução primeiro; depois Entidades → Supabase → Auth → Backend → UX/Frontend. |

---

## Referências

- **AGENTS.md** (raiz): mandato, mapa do repositório, PR e commits, testes, docs.
- **Skill gerente:** [.cursor/skills/F3F-gerente/](.cursor/skills/F3F-gerente/) — orquestração e ordem multi-skill.
- **Índice de documentação:** [.context/docs/README.md](./README.md). Guias operacionais em [.context/docs/guias/](./guias/).
