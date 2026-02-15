# Referência – F3F Skill Gerente

Tabela de delegação (tarefa → skill), ordens multi-skill e regras para evitar conflitos. Fonte de verdade do mapa: [.context/docs/skills-map.md](.context/docs/skills-map.md).

**Onde buscar (centralizado):** Documentação do projeto → `.context/docs/` e [.context/docs/README.md](.context/docs/README.md). Integrações → [.context/docs/PROJECT_INTEGRATIONS.md](.context/docs/PROJECT_INTEGRATIONS.md). Componentes UI → referência da skill F3F-componentes quando disponível. Índice completo: [.context/docs/README.md](.context/docs/README.md).

---

## Tarefa → Skill(s) (delegação rápida)

| Tipo de pedido / tarefa | Skill principal | Outras skills (ordem quando aplicável) |
|--------------------------|-----------------|----------------------------------------|
| Criar/alterar tabelas, RLS, migrations, Supabase | **Supabase / Engenheiro de dados** | Entidades centrais (se for tabela central); Documentação (se alterar fluxo). |
| Login, sessão, perfil, middleware, rotas protegidas | **Auth e Rotas** | Supabase (tabela de perfil); Frontend (telas de login/perfil). |
| Definir/alterar modelo usuário ou entidade principal (ex.: cliente); "uma entidade única" | **Entidades centrais** | Supabase (implementar schema); Backend (services que tocam usuário/entidade). |
| Criar um novo módulo/área no projeto | **Novo módulo** | Orquestra: Organizar → Entidades/Integrações (se necessário) → Supabase → Backend → Frontend → Auth → Documentação. |
| Commit, PR, merge, conflitos, Vercel | **GitHub + Vercel** | Documentação (se mudou scaffolding); QA (testes no PR). |
| Services, repositories, entidades de domínio | **Backend** | Supabase (tipos, acesso via repo); Auth (user_id na sessão). |
| Como módulos/áreas se comunicam; contrato; atualizar doc de integração e vínculos | **Integrações e vínculos** | Mantém [.context/docs/PROJECT_INTEGRATIONS.md](.context/docs/PROJECT_INTEGRATIONS.md). Backend (implementar); Documentação (índice). |
| Atualizar .context/docs, README, ADR, glossário, índice | **Documentação** | — |
| Onde colocar arquivo; estrutura de pastas; mover/reorganizar | **Organizar repositório** | Documentação (se mudar mapa); Limpeza (se também for conteúdo). |
| Código morto, duplicação, refatorar, remover lixo | **Limpeza de código** | Organizar (se for extrair para shared e mover). |
| Páginas, rotas, layouts, componentes de tela | **Frontend** | Componentes (usar campos padronizados); Auth (rotas protegidas). |
| Criar/padronizar componente CPF, telefone, data, moeda, etc. | **Componentes** | Frontend (usa depois). |
| Testes unitários, E2E, edge cases em formulários | **QA / Tester** | — (testa o que Backend/Frontend fizeram). |
| Auditar RLS; dados sensíveis no client; N+1 | **Security & Performance** | Supabase/Backend/Frontend (implementar correções após reporte). |
| Mockup textual, copy, loading/empty, fluxo (antes de codar) | **UX / Designer** | Frontend (implementa depois). |
| Erro, bug, "não funciona"; causa raiz; registrar solução | **Debugger / Especialista em Erros** | QA (regressão); Supabase/Backend/Frontend (se causa for de outra skill). |
| Ideia bruta de negócio, processo novo, dor do usuário | **Consultoria / Analista de Processos** | Entidades/Integrações/UX/Backend/Supabase/Frontend (implementar conforme requisitos). |
| Trazer sistema legado para o F3F; migrar sistema antigo | **Migração e Tradução de Legado** | Mapa de Tradução primeiro; depois Entidades → Supabase → Auth → Backend → UX/Frontend. |

---

## Ordens multi-skill (resumo)

| Cenário | Ordem |
|---------|--------|
| **Modelo de dados / tabelas centrais** | Entidades centrais (define) → Supabase (schema/RLS) → Backend (services/repos). |
| **Novo módulo/área** | Novo módulo (orquestra) → Organizar (scaffold) → [Entidades + Integrações se necessário] → Supabase → Backend → Frontend → Auth → Documentação; QA em paralelo ou após. |
| **Integração entre módulos/áreas** | Integrações (contrato, .context/docs/PROJECT_INTEGRATIONS.md) → Backend (implementar); Supabase se precisar tabelas; Auth se precisar proteger API. |
| **Nova tela / fluxo** | UX (mockup, copy) → [Componentes se faltar campo] → Frontend. |
| **Novo campo reutilizável** | Componentes (definir/registrar) → Frontend (usar). |
| **Auditoria segurança/performance** | Security & Performance (reportar) → Supabase ou Backend ou Frontend (corrigir). |
| **Mudança de estrutura ou novo doc** | Organizar ou Documentação (criar) → Documentação (atualizar índice). |
| **PR / merge** | Build + test (QA); docs atualizados (Documentação); GitHub (commit/PR). |
| **Erro / bug** | Debugger (RCA, corrigir, log) → QA (regressão); Supabase/Backend/Frontend se causa for de outra skill. |
| **Ideia bruta de negócio** | Consultoria (requisitos primeiro) → Entidades/Integrações/UX/Backend/Supabase/Frontend conforme doc. |
| **Migrar sistema legado** | Migração (Mapa de Tradução, desdup) → Entidades → Supabase → Auth → Backend → UX/Frontend. |

---

## Regras de fronteira (não invadir)

- **Supabase:** só esquema, RLS, migrations, MCP. Não services, não telas, não regras de entidades centrais (Entidades centrais define).
- **Backend:** só application layer (services, repos, entidades). Não tabelas/RLS (Supabase), não UI (Frontend).
- **Frontend:** só telas e uso de componentes. Não criar campos padronizados (Componentes), não esquema (Supabase).
- **Auth e Rotas:** só auth, middleware, proteção de rotas. Não esquema de perfil (Supabase), não telas (Frontend).
- **Entidades centrais:** só modelo e regras. Não migrations (Supabase), não código de service (Backend).
- **Integrações:** só contratos e documentação. Não implementar services/rotas (Backend).
- **Organizar:** só onde ficam arquivos. Não conteúdo (Limpeza).
- **Limpeza:** só conteúdo (morto, duplicação). Não onde colocar (Organizar).
- **Documentação:** só índice, quando documentar, ADR, glossário. Não conteúdo técnico das outras skills.
- **Security & Performance:** só auditar e reportar. Não implementar RLS nem correções (Supabase/Backend/Frontend).
- **UX:** só especificar (mockup, copy). Não codificar (Frontend/Componentes).
- **QA:** só testes. Não código de produção.
- **Debugger / Especialista em Erros:** RCA, correção e log; pode delegar implementação. Não substitui QA (regressão).
- **Consultoria / Analista de Processos:** só requisitos. Não implementa (Entidades, Backend, Supabase, Frontend).
- **Migração e Tradução de Legado:** analisa e produz mapa; orquestra. Não implementa schema/services/telas (delega às skills da matriz).

---

## Links

- [.context/docs/skills-map.md](.context/docs/skills-map.md) – lista e "Quando usar cada skill".
- [AGENTS.md](AGENTS.md) – mandato, repo map, PR, testes, docs.
- Skills individuais: `.cursor/skills/<nome-skill>/SKILL.md` e `reference.md`.
