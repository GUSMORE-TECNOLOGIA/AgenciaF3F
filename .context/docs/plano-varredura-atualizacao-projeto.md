# Plano de varredura e atualização do projeto AgenciaF3F

Objetivo: **avaliar todo o projeto** (organização de pastas, código, melhores práticas, limpeza) e **atualizá-lo** para uma cara mais profissional, usando as skills F3F na ordem correta.

---

## 1. Avaliação rápida do estado atual (insumos para o plano)

### Estrutura de pastas
- **src/** – Bem organizado: `pages/` (por área: clientes, auth, configuracoes, financeiro, ocorrencias, planos, servicos, atendimento), `components/` (auth, layout, DateRangePicker), `contexts/`, `hooks/`, `lib/validators/`, `services/`, `types/`.
- **Raiz** – Muitos `.md` soltos (APLICAR_MIGRATIONS, CRIAR_USUARIO_ADMIN, FIX_ERRO_431, GITHUB_SETUP, VERCEL_DEPLOY, etc.) e pastas de outros agentes (`.agent/`, `.claude/`, `.codex/`, `.continue/`, `.gemini/`, `.windsurf/`, `.zed/`, `.trae/`, `.cursor/`, `.github/`). Há duplicação de “regras” em vários lugares.
- **Commands/** – Guias úteis (Git, Seguranca, Aplicar_Migration, etc.); relação com `.context/docs/` pode ser consolidada.
- **.context/docs/** – Índice presente (README.md), skills-map, project-overview, architecture, data-flow, security, etc. Falta alinhar “fonte de verdade” (AGENTS.md vs CONVENTIONS.md vs .context).

### Código
- **Services** – Flat em `src/services/` (clientes, equipe, financeiro, supabase, etc.); sem camada de “repositories” explícita; alguns arquivos como `mockData.ts` e `createTeamUser.ts` no mesmo nível.
- **Hooks** – Um por domínio (useClientes, useDashboard, usePlanos, etc.); alinhado ao uso em páginas.
- **Pages** – Componentes de página com subpastas `components/` locais (ex.: clientes/components, configuracoes/components); padrão aceitável; verificar se há duplicação entre páginas.
- **console.log / TODO** – Pequena quantidade reportada (ex.: ClienteResponsaveisTab); varredura completa fica com **Limpeza de código**.

### Documentação
- **AGENTS.md** – Contém “Repository & deployment” e índice; parte do conteúdo é “Documentation Index” (parece mesclado com CONVENTIONS/README).
- **CONVENTIONS.md** – “Project Rules and Guidelines” duplicado/gerado; pode conflitar com AGENTS.md.
- **.context/docs/README.md** – Índice dos guias; skills-map referenciado. Boa base; falta decisão: raiz vs .context como lugar único de “regras do projeto”.

### Integrações e segurança
- **PROJECT_INTEGRATIONS.md** – Presente e crítico; aviso de template já aplicado.
- **Supabase** – Migrations numerosas; RLS e RPCs; auditoria de segurança recomendada (skill **Security & Performance**).
- **Auth** – AuthContext, ProtectedRoute; alinhado à skill **Auth e Rotas**.

---

## 2. Ordem das skills (harmonia – quem faz o quê e em que ordem)

Para **nada dar errado**, seguir esta sequência. Cada fase pode ser executada pela skill indicada (ou por você invocando a skill no chat).

| Fase | Skill(s) | Objetivo |
|------|----------|----------|
| **1** | **F3F-organizar-repositorio** | Definir e aplicar **estrutura de pastas** e “onde cada coisa fica”: docs na raiz vs .context, Commands vs .context/docs, pastas de outros agentes (.agent, .claude, etc.) — manter ou mover/consolidar. Resultado: mapa de diretórios atualizado e, se necessário, movimentação de arquivos. |
| **2** | **F3F-documentacao** | Unificar **fonte de verdade**: AGENTS.md (mandato + Repository & deployment), .context/docs (índice, guias), CONVENTIONS.md (ou absorver em AGENTS/.context). Atualizar .context/docs/README.md com o que existe de fato; remover ou redirecionar duplicados. |
| **3** | **F3F-limpeza-codigo** | **Varredura de código**: código morto, duplicação, TODOs/FIXMEs, `console.log` desnecessários, refatorações óbvias. Usar script find-dead-code se existir. Foco em `src/` e scripts. |
| **4** | **F3F-security-performance** | **Auditoria** (não implementar): RLS Supabase (get_advisors), dados sensíveis no client, possíveis N+1. Reportar itens; depois Supabase/Backend/Frontend corrigem se necessário. |
| **5** | **F3F-backend** (opcional nesta varredura) | Se a organização indicar evolução de `src/services/` (ex.: para camada repositories/services ou módulos), **planejar** com Backend; implementação pode ser em demanda posterior. |
| **6** | **F3F-frontend** / **F3F-componentes** (opcional nesta varredura) | Verificar uso de componentes padronizados (CPF, data, moeda) e consistência de padrões de tela; ajustes pontuais. Prioridade menor que 1–4. |
| **7** | **F3F-qa-tester** (opcional nesta varredura) | Garantir que há (ou planejar) testes para fluxos críticos e que `npm run build` e `npm run test` existem e passam. |
| **8** | **F3F-documentacao** (fechamento) | Atualizar índice final, changelog ou “O que mudou” após a varredura; atualizar skills-map se algo tiver mudado de lugar. |

---

## 3. Plano de execução resumido (checklist)

- [ ] **Fase 1 – Organizar repositório**  
  - Acionar **F3F-organizar-repositorio**.  
  - Decisões: onde ficam os .md da raiz (manter / mover para .context/docs / Commands)? Consolidar CONVENTIONS.md e AGENTS.md? Tratar pastas .agent, .claude, .codex, etc.?  
  - Saída: mapa de diretórios atualizado; arquivos movidos se aplicável.

- [ ] **Fase 2 – Documentação (fonte de verdade)**  
  - Acionar **F3F-documentacao**.  
  - Unificar AGENTS.md (mandato + Repository & deployment); garantir que .context/docs/README.md é o índice dos guias; decidir papel de CONVENTIONS.md.  
  - Saída: AGENTS.md e .context/docs coerentes; sem duplicação de “regras” em vários arquivos.

- [ ] **Fase 3 – Limpeza de código**  
  - Acionar **F3F-limpeza-codigo**.  
  - Varredura em `src/` (e scripts): morto, duplicação, TODO/FIXME, console.log, refatorações óbvias.  
  - Saída: lista de alterações e código mais limpo.

- [ ] **Fase 4 – Security & Performance**  
  - Acionar **F3F-security-performance**.  
  - Auditoria RLS (MCP Supabase get_advisors), dados sensíveis no client, N+1.  
  - Saída: relatório; correções delegadas a Supabase/Backend/Frontend conforme necessário.

- [ ] **Fase 5–7 (opcional nesta varredura)**  
  - Backend: evolução de serviços/repositories (planejamento).  
  - Frontend/Componentes: padrões de UI e campos.  
  - QA: testes e build.

- [ ] **Fase 8 – Documentação (fechamento)**  
  - Acionar **F3F-documentacao**.  
  - Atualizar índice, skills-map se necessário, e um breve “O que mudou” (ou changelog).

---

## 4. Próximo passo recomendado

Começar pela **Fase 1** com a skill **F3F-organizar-repositorio**: definir o mapa de pastas e mover/consolidar o que fizer sentido. Em seguida Fase 2 (Documentação), depois Limpeza (3) e Security (4). Assim o projeto ganha estrutura e documentação coerente antes de refinamentos de código e segurança.

---

*Documento criado pela skill F3F-gerente. Fonte de verdade do mapa de skills: [skills-map.md](./skills-map.md).*
