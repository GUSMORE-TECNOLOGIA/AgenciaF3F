---
name: F3F-supabase-data-engineer
description: Owns all database operations for F3F (AgenciaF3F). Creates or alters tables, RLS, migrations, and schema conventions. Use MCP Supabase for list_tables, apply_migration, execute_sql, list_migrations, generate_typescript_types, get_advisors, branches, edge functions. Use when creating or changing schema, RLS policies, migrations, or when querying/operating the database via MCP.
---

# F3F Supabase / Engenheiro de dados

Toda operação de **banco de dados** e **MCP Supabase** no F3F é responsabilidade exclusiva desta skill.

## Projeto Supabase (canônico)

**Usar sempre o projeto configurado para este repositório.** URL, project ref e chaves **não** devem ser hardcoded aqui. Consultar:

- **PROJECT_INTEGRATIONS.md** (ou documento equivalente em `.context/docs/`) para referência do projeto e ambiente.
- **Variáveis de ambiente** (`.env`, `.env.local`) para URL e chaves: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (ou `SUPABASE_URL`, `SUPABASE_ANON_KEY` conforme o projeto).

Chaves (Anon Key, Publishable Key, service_role) ficam em **`.env` / `.env.local`** e no dashboard; **nunca** em arquivos versionados. O MCP Supabase configurado para este repositório deve apontar para o **mesmo** projeto definido em PROJECT_INTEGRATIONS.md e .env. Ver também [AGENTS.md](AGENTS.md) quando existir (Repository & deployment).

**Template / outro projeto:** Se este repositório for usado como template ou clonado para **outro** cliente/projeto, substitua todos os refs (Supabase project ID/URL, GitHub org/repo, Vercel) em PROJECT_INTEGRATIONS.md e em .env pelo projeto novo; caso contrário o MCP e as ferramentas podem apontar para o projeto errado.

## 1. Regra de ouro

- **Esquema** (tabelas, colunas, tipos, índices, constraints) → esta skill.
- **RLS** (políticas, segurança por linha) → esta skill.
- **Migrações** (DDL e histórico) → esta skill.
- **Convenções de nomes e tipos** → esta skill (seção 7).
- **Uso do MCP Supabase** → esta skill define quando e como usar cada ferramenta.

## 2. Quando usar esta skill

- Criar ou alterar tabelas, colunas, índices ou constraints.
- Definir ou alterar políticas RLS.
- Escrever ou aplicar migrations.
- Consultar esquema (tabelas, extensões) ou histórico de migrações.
- Gerar tipos TypeScript a partir do esquema.
- Executar SQL no projeto (DDL ou DML) via MCP.
- Obter URL do projeto, chaves, logs ou advisors do Supabase.
- Gerenciar branches do projeto ou edge functions no contexto do banco/backend.

## 3. Uso do MCP Supabase

| Objetivo | Ferramenta MCP |
|----------|----------------|
| Ver tabelas/schemas | `list_tables` |
| Ver extensões | `list_extensions` |
| Ver migrações aplicadas | `list_migrations` |
| Aplicar DDL (nova migração) | `apply_migration` (nome snake_case + SQL) |
| Executar SQL (leitura, DML, RLS, triggers) | `execute_sql` |
| Gerar tipos TS do esquema | `generate_typescript_types` |
| Buscar documentação Supabase | `search_docs` |
| Logs (api, postgres, auth, etc.) | `get_logs` |
| Avisos de segurança/performance | `get_advisors` |
| URL do projeto / chaves | `get_project_url`, `get_publishable_keys` |
| Edge functions | `list_edge_functions`, `get_edge_function`, `deploy_edge_function` |
| Branches (dev/prod) | `create_branch`, `list_branches`, `merge_branch`, `reset_branch`, `rebase_branch`, `delete_branch` |

**Regra:** DDL versionado → `apply_migration`. Consultas, DML pontual, scripts de manutenção → `execute_sql`.

## 4. Workflows principais

### Nova tabela ou alteração de esquema

1. Verificar convenções (seção 7).
2. Redigir SQL da migração (CREATE/ALTER; incluir RLS se necessário).
3. Chamar `apply_migration` com nome em snake_case (ex.: `add_cliente_telefone`, `create_atendimentos`).
4. Rodar `get_advisors` (security/performance) após aplicar.

### Adicionar ou alterar RLS

1. Definir política (quem pode SELECT/INSERT/UPDATE/DELETE e com qual condição).
2. Incluir na mesma migração da tabela ou criar migração só de RLS (ex.: `enable_rls_clientes`).
3. Usar `apply_migration` com o SQL das políticas.
4. Validar com `get_advisors` tipo security.

### Consultar estado do banco

- Tabelas: `list_tables` (ex.: schemas `['public']`).
- Migrações: `list_migrations`.
- Extensões: `list_extensions`.
- Dúvidas: `search_docs`.

### Tipos TypeScript

- Após mudanças de esquema: `generate_typescript_types` e persistir (ex.: `src/types/database.types.ts` ou onde o projeto definir).

### Branches e Edge Functions

- **Branches:** isolar mudanças de esquema em dev; merge/rebase conforme fluxo do time.
- **Edge functions:** listar/obter/deploy via MCP quando a tarefa envolver lógica serverless que acessa dados.

## 5. Checklist antes de aplicar migração

- [ ] Nomes em snake_case; tabelas/colunas seguem convenções (seção 7).
- [ ] Tipos adequados (UUID para IDs, timestamptz para datas).
- [ ] RLS considerado em tabelas com dados por usuário/cliente.
- [ ] Sem dados mock ou secrets; DDL idempotente quando fizer sentido.

## 6. Integração com o F3F

- **Entidades centrais:** tabelas core (usuário, cliente) únicas; módulos referenciam por `user_id` / `cliente_id`. Ver `.context/docs/architecture.md` e `.context/docs/data-flow.md`; skill F3F-entidades-centrais quando existir.
- **Segurança:** RLS alinhado a `.context/docs/security.md`.
- Nenhuma outra skill aplica migrações ou altera RLS/esquema.

## 7. Convenções de nomes e tipos (referência)

### Tabelas

- **snake_case** (ex.: `clientes`, `atendimentos`, `usuarios`).
- Plural para entidades; nome descritivo para junção (ex.: `cliente_responsavel`).
- Por módulo: prefixo ou agrupamento (ex.: `atendimentos`, `configuracoes`).

### Colunas

- **snake_case**: `created_at`, `cliente_id`, `user_id`, `nome_completo`.
- FK: sufixo `_id` (ex.: `cliente_id`, `user_id`).
- Booleanos: `is_`, `has_` ou `ativo`.
- Datas: `timestamptz`; sufixos `_at` (ex.: `created_at`, `updated_at`).

### Migrations

- Nome: **snake_case**, descritivo (ex.: `create_tabela_clientes`, `add_rls_atendimentos`).
- Uma migração = uma mudança lógica.

### Tipos de campos (PostgreSQL)

| Uso | Tipo |
|-----|------|
| ID (PK, FK) | `uuid` |
| Texto curto/longo | `text` ou `varchar(n)` |
| Inteiro | `integer` ou `bigint` |
| Decimal/dinheiro | `numeric(p,s)` |
| Booleano | `boolean` |
| Data/hora com TZ | `timestamptz` |
| Data sem hora | `date` |
| JSON | `jsonb` |

### RLS

- Habilitar RLS em tabelas com dados por usuário/contexto.
- Políticas por operação (SELECT, INSERT, UPDATE, DELETE).
- Usar `auth.uid()` quando o vínculo for por usuário (ex.: `user_id = auth.uid()`).
- Nome de política: `nome_tabela_operacao_escopo` (ex.: `clientes_select_own`).

Exemplo mínimo:

```sql
ALTER TABLE minha_tabela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "minha_tabela_select_own"
  ON minha_tabela FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "minha_tabela_insert_own"
  ON minha_tabela FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

## Referência adicional

- [security.md](.context/docs/security.md) – políticas e RLS.
- [architecture.md](.context/docs/architecture.md) – visão do sistema.
- [data-flow.md](.context/docs/data-flow.md) – fluxo de dados e entidades.
- Documento de integração (PROJECT_INTEGRATIONS.md ou equivalente em `.context/docs/`) – projeto e env.
