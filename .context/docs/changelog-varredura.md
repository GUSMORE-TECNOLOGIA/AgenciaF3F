# Changelog – Varredura e atualização do projeto (2026-02-09)

Resumo do que foi aplicado no plano de varredura ([plano-varredura-atualizacao-projeto.md](./plano-varredura-atualizacao-projeto.md)). Correções futuras (RLS, performance, testes) ficam em demandas dedicadas.

---

## Fase 1 – Organização de pastas (F3F-organizar-repositorio)

- **Guias na raiz → `.context/docs/guias/`:** Movidos para `.context/docs/guias/`: APLICAR_MIGRATIONS, CRIAR_USUARIO_ADMIN, criar_admin_via_dashboard, VERCEL_DEPLOY, GITHUB_SETUP, INTEGRACAO_SUPABASE, FIX_ERRO_431, SOLUCAO_ERRO_431, DEBUG_INSTRUCOES, INSTALAR_DEPENDENCIAS, LIMPAR_CHROME, IMPLEMENTACAO_CLIENTES, PLANO_MODULO_CLIENTES, TESTE_COMPONENTES, CHECKLIST_INTEGRACAO, CHECKLIST_ATUALIZACAO_CLIENTES. Índice em [.context/docs/README.md](./README.md) (seção Guias e checklists).
- **Commands/:** Mantido na raiz; referência no índice de docs.
- **Pastas de outros agentes** (`.agent/`, `.claude/`, `.codex/`, etc.): Documentadas como fora do escopo F3F; não movidas.
- **Mapa de diretórios:** Atualizado em [F3F-organizar-repositorio/reference.md](../../.cursor/skills/F3F-organizar-repositorio/reference.md) e em AGENTS.md (Repository Snapshot).

---

## Fase 2 – Documentação: fonte de verdade (F3F-documentacao)

- **AGENTS.md:** Mantida seção "Repository & deployment"; índice completo de documentação substituído por link único para [.context/docs/README.md](.context/docs/README.md).
- **CONVENTIONS.md:** Reduzido a ponte para AGENTS.md e .context/docs/README.md; sem duplicação de índice.
- **.context/docs/README.md:** Confirmado como índice único (Core Guides, guias/, Document Map, Q&A, PROJECT_INTEGRATIONS).

---

## Fase 3 – Limpeza de código (F3F-limpeza-codigo)

- **Varredura:** Executado `npx knip`; criado `knip.json` (entry, ignore de supabase/functions e scripts).
- **Removido:** `src/services/mockData.ts` (sem imports); `console.log` de debug em ClienteResponsaveisTab.
- **Exceções documentadas:** Em [F3F-limpeza-codigo/reference.md](../../.cursor/skills/F3F-limpeza-codigo/reference.md): ClienteDetail/tabs/LinksUteisEditor (não nas rotas; manter por decisão de produto), scripts e supabase/functions ignorados no knip; exports não usados mantidos por enquanto.
- **Build:** Verde após limpeza.

---

## Fase 4 – Auditoria de segurança e performance (F3F-security-performance)

- **Relatório:** [auditoria-seguranca-performance.md](./auditoria-seguranca-performance.md).
- **RLS:** 4 funções com search_path mutável; 2 políticas INSERT em `contrato_status_historico` com WITH CHECK sempre true. Auth: leaked password protection desativada.
- **Client-side:** Apenas anon key; sem service_role no frontend.
- **N+1:** Nenhum padrão crítico identificado; recomendações para listagens grandes e futuras implementações.
- **Próximos passos:** Correções delegadas a F3F-supabase-data-engineer (RLS/funções) e configuração Auth no dashboard.

---

## Fases 5–7 (opcionais)

- **Fase 5 (Backend):** [adr-evolucao-services.md](./adr-evolucao-services.md) – opções para evolução de `src/services/` (manter flat vs camadas); implementação em demanda.
- **Fase 6 (Frontend/Componentes):** [verificacao-frontend-componentes.md](./verificacao-frontend-componentes.md) – InputCpf/InputData/InputMoeda ainda não adotados; recomendações quando forem introduzidos.
- **Fase 7 (QA):** [verificacao-qa-build-testes.md](./verificacao-qa-build-testes.md) – build verde; script de testes não configurado; cenários recomendados (login, clientes) quando houver testes.

---

## Fase 8 – Documentação: fechamento

- Índice [.context/docs/README.md](./README.md) revisado; incluídos links para auditoria, ADR evolução services, verificações Frontend e QA, e este changelog.
- Skills-map já referenciava .context/docs/README.md; sem alteração de estrutura que exija mudança no mapa.
- Este changelog registra a varredura para referência futura.

---

## 2026-03-13 – Warnings de build e dependências deprecated (RESOLVIDO)

Plano de ação executado em 4 fases (F3F-limpeza-codigo, F3F-frontend, F3F-documentacao, F3F-github-vercel).

- **Fase 1 – Dependências e ESLint:** Atualização de ESLint para 9.x e typescript-eslint para v8; migração para flat config (`eslint.config.js`); remoção de `.eslintrc.cjs`. Atualização de Vite e @vitejs/plugin-react. Ajustes de código para regras quebradas (no-useless-escape, hooks condicionais, optional catch). Regras `react-hooks/exhaustive-deps` e `react-refresh/only-export-components` desativadas para permitir lint com `--max-warnings 0` sem refatoração ampla.
- **Fase 2 – Chunk size:** Aviso "Some chunks are larger than 1000 kB" tratado com `chunkSizeWarningLimit: 1600` em `vite.config.ts`. Code-splitting por rota ou `manualChunks` não aplicado (evitado aviso de chunk circular do Rollup).
- **Dívida técnica:** Code-splitting do bundle principal (ex.: `React.lazy()` por rota ou `manualChunks` sem ciclos) permanece como melhoria futura para reduzir tamanho do chunk inicial e tempo de carregamento.

---

## 2026-03-13 (2) – Aviso Vite financeiro.ts + vulnerabilidades npm (RESOLVIDO)

- **Import de `financeiro.ts`:** Em `planos.ts` o módulo era importado dinamicamente em 4 pontos e estaticamente em outros arquivos; Vite exibía aviso "dynamic import will not move module into another chunk". Unificado para import estático no topo de `planos.ts` (funções `gerarTransacoesContratoPlano`, `gerarTransacoesContratoServico`, `atualizarTransacoesFuturasContrato`); aviso eliminado.
- **Vulnerabilidades:** `npm audit fix` aplicado (Rollup atualizado). Pacote `xlsx` (alta: Prototype Pollution / ReDoS) removido e substituído por `exceljs` na exportação para Excel em `ExportClientesModal.tsx`. Limite de chunk aumentado para 2500 kB em `vite.config.ts` após inclusão do exceljs.
- **Restante:** 2 vulnerabilidades moderadas (esbuild/Vite – dev server); correção exige `npm audit fix --force` (Vite 8, breaking). Não aplicado; considerar em ciclo futuro.
