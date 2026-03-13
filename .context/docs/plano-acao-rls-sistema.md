# Plano de ação: RLS em todo o sistema

Objetivo: **sanar na raiz** os erros de permissão (RLS) que aparecem no sistema — por exemplo "Erro ao criar plano. Tente novamente." quando o usuário não tem permissão — auditando, padronizando e corrigindo todas as políticas RLS de forma consistente.

Este plano segue a orquestração da **skill F3F-gerente**: define **quem faz o quê** e em **qual ordem**, sem uma skill executar no lugar da outra. Fonte: [skills-map.md](./skills-map.md) e [.cursor/skills/F3F-gerente/reference.md](../.cursor/skills/F3F-gerente/reference.md).

---

## Ordem das skills (resumo)

| Fase | Skill | Responsabilidade |
|------|--------|-------------------|
| 1 | **F3F-security-performance** | Auditar todas as políticas RLS; reportar inconsistências e tabelas/operações em risco. |
| 2 | **F3F-entidades-centrais** + **F3F-auth-rotas** | Definir a “fonte de verdade”: quem (role/perfil/visibilidade) pode fazer o quê em cada entidade. |
| 3 | **F3F-documentacao** | Registrar estratégia em ADR e/ou doc de referência; atualizar índice. |
| 4 | **F3F-supabase-data-engineer** | Aplicar migrations para alinhar RLS ao modelo definido (e ao relatório da auditoria). |
| 5 | **F3F-frontend** (opcional) | Melhorar tratamento de erro para não esconder causa (ex.: RLS) atrás de mensagem genérica. |
| 6 | **F3F-debugger-erros** | Registrar padrão e solução no troubleshooting-log; sugerir regressão. |
| 7 | **F3F-qa-tester** | Cenários de regressão por perfil (ex.: criar plano como admin vs não-admin). |

---

## Fase 1 – Auditoria RLS (F3F-security-performance)

**Quem:** Skill **F3F-security-performance**.  
**Regra:** Esta skill **não implementa** RLS; apenas **audita e reporta**.

### Entregáveis

1. **Inventário de tabelas com RLS**
   - Listar todas as tabelas com `ENABLE ROW LEVEL SECURITY` (por migration ou MCP).
   - Para cada uma: nome da política, operação (SELECT/INSERT/UPDATE/DELETE), condição (USING / WITH CHECK) e critério de “quem pode” (ex.: `usuarios.role = 'admin'`, `is_admin()`, responsável do cliente, visibilidade global).

2. **Relatório de inconsistências**
   - Tabelas onde **só admin** pode INSERT/UPDATE/DELETE (ex.: `planos`, `servicos`) vs tabelas onde **perfil ou responsável** também pode.
   - Políticas que usam `usuarios.role = 'admin'` vs `is_admin()` vs perfil (ex.: `perfis.slug = 'admin'`) — padronizar critério.
   - Casos em que a **UI permite ação** (ex.: botão "Novo Plano") mas a **RLS bloqueia** para perfis não-admin → documentar para evitar “erro genérico” sem explicação.
   - Políticas permissivas (WITH CHECK sempre true) já apontadas em [auditoria-seguranca-performance.md](./auditoria-seguranca-performance.md) e novas encontradas.
   - Funções usadas em RLS (ex.: `is_admin()`, `is_responsavel_do_cliente()`) e se estão consistentes com o modelo de perfis/roles.

3. **Documento de saída**
   - Atualizar ou criar seção em [auditoria-seguranca-performance.md](./auditoria-seguranca-performance.md) (ou doc dedicado) com:
     - Matriz **Tabela × Operação × Quem pode** (esperado vs atual).
     - Lista de **correções sugeridas** (para a skill Supabase implementar).

**Como usar:** Invocar a skill F3F-security-performance com o pedido: *“Auditar todas as políticas RLS do sistema; listar tabelas, políticas atuais e inconsistências; sugerir matriz Tabela × Operação × Quem pode e correções para F3F-supabase-data-engineer.”*

---

## Fase 2 – Fonte de verdade: quem pode o quê (Entidades + Auth)

**Quem:** **F3F-entidades-centrais** (modelo de entidades e regras de acesso) e **F3F-auth-rotas** (roles, perfis, sessão).  
**Objetivo:** Uma única definição de “quem pode criar/editar/excluir o quê” para que RLS e UI fiquem alinhados.

### Entregáveis

1. **Definição por entidade/cadastro**
   - **Cadastros mestres** (ex.: planos, serviços): apenas `role = 'admin'` (ou perfil admin)? Ou algum outro perfil (ex.: financeiro) pode criar/editar?
   - **Clientes**: responsável, `cliente_responsaveis`, visibilidade global, admin — quando cada um pode SELECT/INSERT/UPDATE/DELETE.
   - **Contratos (cliente_contratos, cliente_planos, cliente_servicos)**: quem pode criar/editar/cancelar (admin, responsável do cliente, perfil financeiro?).
   - **Ocorrências, equipe, financeiro, etc.:** mesmo padrão (uma tabela resumida).

2. **Critério único para “admin” em RLS**
   - Decidir: uso de `usuarios.role = 'admin'` **ou** `is_admin()` (que pode considerar perfil) em todas as políticas que restringem por admin. Documentar no [security.md](./security.md) ou ADR.

3. **Documento de saída**
   - Texto ou tabela em `.context/docs/` (ou ADR) com: **Entidade / Operação / Quem pode**.  
   - Referência para F3F-supabase-data-engineer implementar as políticas e para F3F-frontend esconder ou desabilitar ações que o usuário não pode executar (evitar “erro ao criar plano” sem contexto).

**Como usar:** Invocar F3F-entidades-centrais e F3F-auth-rotas: *“Definir e documentar, por entidade (planos, serviços, clientes, contratos, etc.), quem pode SELECT/INSERT/UPDATE/DELETE; alinhar com perfis e roles atuais; definir uso de role admin vs is_admin() em RLS.”*

---

## Fase 3 – Documentação da estratégia (F3F-documentacao)

**Quem:** **F3F-documentacao**.

### Entregáveis

1. **ADR ou seção em security.md**
   - Estratégia RLS do projeto: princípio (ex.: “por padrão, apenas admin em cadastros mestres; dados por cliente filtrados por responsável/visibilidade”).
   - Onde está a “fonte de verdade” (doc da Fase 2) e o relatório de auditoria (Fase 1).

2. **Índice**
   - Atualizar [.context/docs/README.md](./README.md) com link para este plano e para o ADR/security atualizado.

**Como usar:** Invocar F3F-documentacao: *“Registrar estratégia RLS em ADR ou security.md; atualizar índice da documentação com o plano de ação RLS e referências.”*

---

## Fase 4 – Correções no banco (F3F-supabase-data-engineer)

**Quem:** **F3F-supabase-data-engineer**.  
**Entrada:** Relatório da Fase 1 + definição da Fase 2 + security/ADR da Fase 3.

### Entregáveis

1. **Migrations**
   - Criar/alterar políticas RLS para conformidade com a matriz **Tabela × Operação × Quem pode**.
   - Padronizar uso de `is_admin()` (ou o critério definido) em políticas que dependem de admin.
   - Corrigir políticas permissivas (ex.: `contrato_status_historico`) e funções com `search_path` mutável, se ainda pendente (ver [auditoria-seguranca-performance.md](./auditoria-seguranca-performance.md)).

2. **Consistência**
   - Garantir que tabelas de cadastro mestre (planos, serviços) e demais tabelas sensíveis tenham RLS alinhado ao documento da Fase 2; nenhuma política “WITH CHECK (true)” sem justificativa.

**Como usar:** Invocar F3F-supabase-data-engineer com o relatório da auditoria e o doc da Fase 2: *“Aplicar migrations para corrigir e padronizar RLS conforme matriz e ADR/security; usar is_admin() (ou critério definido) de forma consistente.”*

---

## Fase 5 – Tratamento de erro no frontend (F3F-frontend) [opcional]

**Quem:** **F3F-frontend**.  
**Objetivo:** Reduzir “erro genérico” quando a falha for de permissão (RLS).

### Entregáveis

1. **Mensagem mais clara em falhas de backend**
   - Em fluxos críticos (ex.: criar/editar plano, serviço, cliente), quando o backend/Supabase retornar erro:
     - Em **desenvolvimento**: logar o erro completo (ex.: `error.message`, `error.code`) e, se for erro de RLS (ex.: “row-level security”), exibir mensagem específica ou incluir no toast/modal.
     - Em **produção**: manter mensagem amigável, mas evitar apenas “Tente novamente.”; quando possível, diferenciar “sem permissão” de “erro de servidor” (sem expor detalhes internos).

2. **Alinhamento com Auth/UI**
   - Se a Fase 2 definir que apenas admin pode criar plano/serviço, considerar esconder ou desabilitar “Novo Plano” / “Novo Serviço” para usuários que não tenham permissão (evitar preencher formulário e só falhar no submit).

**Como usar:** Invocar F3F-frontend: *“Melhorar tratamento de erro em criação/edição de plano (e outros fluxos críticos) para não esconder causa; em dev logar erro completo; opcionalmente esconder/desabilitar ações proibidas por perfil.”*

---

## Fase 6 – Registro e regressão (F3F-debugger-erros + F3F-qa-tester)

**Quem:** **F3F-debugger-erros** (registro no log) e **F3F-qa-tester** (cenários de teste).

### Entregáveis

1. **Troubleshooting-log**
   - Entrada em [.context/docs/troubleshooting-log.md](./troubleshooting-log.md) para o padrão “Erro genérico ao criar/editar recurso por falha de RLS”: causa raiz, como identificar (console/network) e que a correção é RLS + eventual melhoria de mensagem no frontend.

2. **Cenários de regressão**
   - Testes manuais ou E2E (conforme projeto): usuário **admin** consegue criar plano/serviço; usuário **não-admin** (ex.: perfil sem permissão) não consegue e vê mensagem adequada (ou ação escondida). Incluir outros fluxos críticos conforme matriz da Fase 2.

**Como usar:** Invocar F3F-debugger-erros para o log; F3F-qa-tester para cenários por perfil e regressão após as mudanças de RLS.

### Cenários de regressão (QA)

| Cenário | Passos | Resultado esperado |
|--------|--------|--------------------|
| Admin cria plano | Login como admin (role ou perfil Administrador) → Planos → Novo Plano → preencher e Salvar | Plano criado; redirecionamento para lista. |
| Admin cria serviço | Login como admin → Serviços → Novo Serviço → preencher e Salvar | Serviço criado; redirecionamento para lista. |
| Não-admin não vê botão Novo Plano | Login como usuário com perfil sem permissão de editar em Planos → ir em Planos | Botão "Novo Plano" não aparece. |
| Não-admin não vê botão Novo Serviço | Idem para Serviços | Botão "Novo Serviço" não aparece. |
| Não-admin acessa URL direta de novo plano | Sem permissão de editar → acessar /planos/novo → preencher e Salvar | Mensagem clara de permissão (não apenas "Tente novamente"). |
| Perfil admin (slug) cria plano | Usuário com perfil Administrador mas role != 'admin' → Novo Plano → Salvar | Plano criado (RLS usa is_admin()). |

---

## Resumo da sequência

1. **Security** audita e reporta →  
2. **Entidades + Auth** definem “quem pode o quê” →  
3. **Documentação** registra estratégia e índice →  
4. **Supabase** aplica migrations (RLS) →  
5. **Frontend** (opcional) melhora erro e UI por permissão →  
6. **Debugger** registra no troubleshooting-log; **QA** garante regressão.

Nenhuma skill implementa RLS no lugar da **F3F-supabase-data-engineer**; nenhuma skill define o modelo de acesso no lugar de **F3F-entidades-centrais** ou **F3F-auth-rotas**. O **F3F-gerente** apenas orquestra esta ordem e o acompanhamento das fases.

---

## Referências

- [skills-map.md](./skills-map.md) – Quando usar cada skill.
- [.cursor/skills/F3F-gerente/reference.md](../.cursor/skills/F3F-gerente/reference.md) – Ordem multi-skill e regras de fronteira.
- [auditoria-seguranca-performance.md](./auditoria-seguranca-performance.md) – Achados anteriores de RLS e segurança.
- [security.md](./security.md) – Políticas de segurança (a preencher/atualizar na Fase 2–3).
- [troubleshooting-log.md](./troubleshooting-log.md) – Registro de padrões de erro e soluções.
