# Documentation Index

Welcome to the repository knowledge base. Start with the project overview, then dive into specific guides as needed.

## Guias e checklists (operacionais)
Guias de setup, deploy, migrações e checklists estão em [guias/](./guias/):
- [APLICAR_MIGRATIONS](./guias/APLICAR_MIGRATIONS.md) · [CRIAR_USUARIO_ADMIN](./guias/CRIAR_USUARIO_ADMIN.md) · [criar_admin_via_dashboard](./guias/criar_admin_via_dashboard.md)
- [VERCEL_DEPLOY](./guias/VERCEL_DEPLOY.md) · [GITHUB_SETUP](./guias/GITHUB_SETUP.md) · [INTEGRACAO_SUPABASE](./guias/INTEGRACAO_SUPABASE.md)
- [FIX_ERRO_431](./guias/FIX_ERRO_431.md) · [SOLUCAO_ERRO_431](./guias/SOLUCAO_ERRO_431.md) · [DEBUG_INSTRUCOES](./guias/DEBUG_INSTRUCOES.md)
- [INSTALAR_DEPENDENCIAS](./guias/INSTALAR_DEPENDENCIAS.md) · [LIMPAR_CHROME](./guias/LIMPAR_CHROME.md)
- [IMPLEMENTACAO_CLIENTES](./guias/IMPLEMENTACAO_CLIENTES.md) · [PLANO_MODULO_CLIENTES](./guias/PLANO_MODULO_CLIENTES.md) · [TESTE_COMPONENTES](./guias/TESTE_COMPONENTES.md)
- [CHECKLIST_INTEGRACAO](./guias/CHECKLIST_INTEGRACAO.md) · [CHECKLIST_ATUALIZACAO_CLIENTES](./guias/CHECKLIST_ATUALIZACAO_CLIENTES.md)

**Comandos e playbooks:** pasta [Commands/](../../Commands/) na raiz do repositório (Git, migrações, segurança).

## Core Guides
- [Fluxo e ciclo de vida do cliente](./fluxo-ciclo-vida-cliente.md) – Verdade do Negócio (processos 1.1–1.5; validar com Arthur).
- [Skills Map (Quando usar cada skill)](./skills-map.md)
- [Plano de varredura e atualização do projeto](./plano-varredura-atualizacao-projeto.md) – ordem das skills para varredura total (organização, docs, limpeza, segurança).
- [Auditoria de segurança e performance](./auditoria-seguranca-performance.md) – relatório RLS, dados sensíveis no client, N+1 (Fase 4).
- [ADR – Evolução de services](./adr-evolucao-services.md) – planejamento (flat vs camadas).
- [Verificação Frontend/Componentes](./verificacao-frontend-componentes.md) – conformidade com componentes padronizados.
- [Verificação QA – Build e testes](./verificacao-qa-build-testes.md) – build e planejamento de testes.
- [Changelog da varredura](./changelog-varredura.md) – o que foi aplicado em cada fase.
- [Project Overview](./project-overview.md)
- [Architecture Notes](./architecture.md)
- [Development Workflow](./development-workflow.md)
- [Testing Strategy](./testing-strategy.md)
- [Glossary & Domain Concepts](./glossary.md)
- [Data Flow & Integrations](./data-flow.md)
- [Security & Compliance Notes](./security.md)
- [Tooling & Productivity Guide](./tooling.md)
- [Q&A Index](./qa/README.md) – getting-started, architecture, features

## Repository Snapshot
- `AGENTS.md` · `README.md` · `CONVENTIONS.md` (raiz)
- `.context/docs/` — documentação e **guias/** (guias operacionais)
- `Commands/` — comandos e playbooks (Git, migrações, segurança)
- `src/` — TypeScript source files and CLI entrypoints
- `supabase/` · `public/` · `package.json` · `tsconfig.json` · `vite.config.ts` · `tailwind.config.js`
- `Estrutura/` · `scripts/` · `index.html`

## Document Map
| Guide | File | Primary Inputs |
| --- | --- | --- |
| Fluxo ciclo de vida cliente | [fluxo-ciclo-vida-cliente.md](./fluxo-ciclo-vida-cliente.md) | Processos 1.1–1.5; validar com Arthur |
| Skills Map | [skills-map.md](./skills-map.md) | Quando usar cada skill F3F |
| Plano de varredura | [plano-varredura-atualizacao-projeto.md](./plano-varredura-atualizacao-projeto.md) | Ordem das skills para varredura |
| Project Overview | [project-overview.md](./project-overview.md) | Roadmap, README, stakeholder notes |
| Architecture Notes | [architecture.md](./architecture.md) | ADRs, service boundaries, dependency graphs |
| Development Workflow | [development-workflow.md](./development-workflow.md) | Branching rules, CI config, contributing guide |
| Testing Strategy | [testing-strategy.md](./testing-strategy.md) | Test configs, CI gates, known flaky suites |
| Glossary & Domain Concepts | [glossary.md](./glossary.md) | Business terminology, user personas, domain rules |
| Data Flow & Integrations | [data-flow.md](./data-flow.md) | System diagrams, integration specs, queue topics |
| Security & Compliance Notes | [security.md](./security.md) | Auth model, secrets management, compliance requirements |
| Tooling & Productivity Guide | [tooling.md](./tooling.md) | CLI scripts, IDE configs, automation workflows |
| Project integrations (Supabase/GitHub/Vercel) | [PROJECT_INTEGRATIONS.md](./PROJECT_INTEGRATIONS.md) | IDs do projeto, aviso template |
| Auditoria segurança/performance | [auditoria-seguranca-performance.md](./auditoria-seguranca-performance.md) | RLS, client-side, N+1 |
| ADR evolução services | [adr-evolucao-services.md](./adr-evolucao-services.md) | Planejamento backend |
| Changelog varredura | [changelog-varredura.md](./changelog-varredura.md) | Resumo das fases aplicadas |
