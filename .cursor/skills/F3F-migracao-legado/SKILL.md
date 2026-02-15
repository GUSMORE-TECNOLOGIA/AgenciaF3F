---
name: F3F-migracao-legado
description: Analisa sistemas legados/descentralizados e traduz para a arquitetura F3F. Mapeia schema antigo para Supabase central, auth para login único, cadastros duplicados para entidade central (ex.: clientes); refatora UI para React/Vite/Tailwind/shadcn e lógica para Services/Repositories. Gera Mapa de Tradução antes de codar; não replica erros do legado.
---

# F3F Migração e Tradução de Legado

Responsável por **absorver sistemas existentes** (legados ou descentralizados) no ecossistema F3F. O foco não é "portar" o código tal como está, mas **extrair a lógica de negócio** e **implementá-la** usando as skills especialistas do F3F, com schema centralizado, login único e entidade central única. Esta skill **analisa**, produz o **Mapa de Tradução** (De: Legado → Para: F3F) e **orquestra** a execução; a implementação concreta (tabelas, RLS, services, telas) fica com F3F-supabase-data-engineer, F3F-auth-rotas, F3F-entidades-centrais, F3F-backend, F3F-frontend e F3F-ux-designer conforme a [matriz no reference.md](reference.md).

## Regra de ouro

- **Não replicar o erro:** Se o sistema antigo tinha tabelas duplicadas por módulo (ex.: "clientes" em cada sistema), esta skill **deve** mapear esses dados para a **entidade central** (ex.: `clientes` ou `pessoas`). Nunca criar no F3F uma cópia do modelo fragmentado do legado. Alinhar à skill [F3F-entidades-centrais](.cursor/skills/F3F-entidades-centrais/SKILL.md).
- **Análise antes da ação:** Antes de codar, a skill **deve** gerar um **Mapa de Tradução** (De: Legado → Para: F3F): quais tabelas viram o quê, qual login vira Supabase Auth, quais telas viram quais rotas/componentes, qual lógica vira quais services/repositories. O mapa pode ser um doc em `.context/docs/` (ex.: `migracao-<sistema>.md` ou `requisitos/mapa-traducao-<sistema>.md`). Registrar no [reference.md](reference.md) quando houver migração em andamento.
- **Desduplicação obrigatória:** Ao migrar dados, verificar se o registro **já existe** no F3F (ex.: mesma pessoa por CPF ou documento). Se sim, **vincular via ID** (cliente_id, user_id); não criar novo cadastro. Checklist no [reference.md](reference.md).
- **Delegar implementação:** Esta skill **não** cria tabelas, RLS, services nem telas sozinha; usa a [matriz de tradução técnica](reference.md#matriz-de-tradução-técnica) para indicar **qual skill** faz cada parte e em que ordem.

## Quando usar esta skill

- **"Trazer o sistema X para o F3F"**, **"migrar o sistema antigo para o F3F"**, **"absorver o legado Y"**.
- **Analisar** um projeto ou banco legado (Postgres, MySQL, outro) e definir **como** ele será absorvido pelo F3F (schema, auth, entidades, UI, lógica).
- **Gerar o Mapa de Tradução** (documento De: Legado → Para: F3F) antes de qualquer implementação de migração.
- **Planejar migração de dados:** scripts SQL ou ETL que preservem integridade referencial (cliente_id, user_id) e desdupliquem quando necessário.
- **Dúvida** "como mapear a tabela antiga de clientes para o F3F?" ou "o legado usa login próprio; como unificar com Supabase Auth?" → consultar ou produzir via esta skill (e [reference.md](reference.md)).

## Fluxo de trabalho

1. **Análise de schema:** Mapear tabelas antigas para o schema centralizado do Supabase; identificar entidades que viram tabela central (ex.: clientes) e perfil; tabelas que viram módulos com FK para cliente_id. Skill responsável: **F3F-entidades-centrais** (modelo) + **F3F-supabase-data-engineer** (criar tabelas/RLS).
2. **Análise de auth/sessão:** Login/sessão própria do legado → Supabase Auth (login único). Skill responsável: **F3F-auth-rotas** (+ F3F-supabase-data-engineer para tabela de perfil).
3. **Mapeamento de UI:** Telas e componentes antigos (HTML/CSS, Bootstrap, etc.) → React + Vite + Tailwind + shadcn/ui. Especificar rotas e componentes; skill responsável: **F3F-ux-designer** (mockup/copy) + **F3F-frontend** (implementar) + **F3F-componentes** (campos padronizados).
4. **Refatoração de lógica:** Scripts, controllers com queries diretas, regras espalhadas → **Services** e **Repositories** no padrão F3F-backend. Skill responsável: **F3F-backend**.
5. **Plano de dados:** Scripts SQL (ou etapas) para migrar dados preservando integridade referencial (cliente_id); desduplicar antes de inserir quando o F3F já tiver a entidade. Skill responsável: **F3F-supabase-data-engineer** (migrations/scripts) com regras definidas por esta skill e **F3F-entidades-centrais**.
6. **Checklist pós-mapa:** Desduplicação, RLS cobrindo permissões do antigo, limpeza (não trazer código morto nem libs obsoletas). Ver [reference.md](reference.md).

## Conteúdo do reference.md

O [reference.md](reference.md) contém:

- **Matriz de tradução técnica:** Elemento legado → Destino no F3F → Skill responsável (banco, login, cadastro cliente, UI, queries, etc.).
- **Checklist de migração:** Desduplicação (já existe no F3F? vincular por ID); Segurança (RLS cobre permissões do antigo?); Limpeza (código morto e libs obsoletas descartados).
- **Onde salvar o Mapa de Tradução:** convenção (ex.: `.context/docs/migracao/` ou `requisitos/`); F3F-documentacao atualiza o índice.

## Integração com outras skills

- **F3F-entidades-centrais:** Garantir que cadastros duplicados do legado viram um único registro na tabela central e referências por ID. Esta skill define o mapeamento; Entidades valida o modelo; Supabase implementa.
- **F3F-supabase-data-engineer:** Schema central, RLS, migrations e scripts de carga. Esta skill produz o mapa (tabela antiga → tabela F3F); Supabase executa.
- **F3F-auth-rotas:** Login único; mapear usuários legados para Supabase Auth e perfil. Esta skill define "como"; Auth implementa.
- **F3F-backend:** Lógica legada → Services e Repositories. Esta skill identifica o que migrar e para qual módulo; Backend implementa.
- **F3F-frontend / F3F-ux-designer / F3F-componentes:** UI legada → React + Vite + Tailwind + shadcn. Esta skill mapeia tela antiga → rota/componente; UX/Frontend/Componentes implementam.
- **F3F-consultoria-processos:** Se o legado for confuso em regras de negócio, acionar Consultoria primeiro para extrair requisitos; depois esta skill produz o mapa técnico.
- **F3F-limpeza-codigo:** Não trazer código morto nem dependências obsoletas do legado; após migração, Limpeza pode ser acionada para remover resquícios.
- **F3F-documentacao:** Mapa de Tradução e docs de migração devem ser listados no índice (`.context/docs/README.md`). Esta skill produz o conteúdo; Documentação atualiza o índice.

## Referência

- Matriz de tradução, checklist e onde salvar: [reference.md](reference.md).
- Modelo central (entidade única): [F3F-entidades-centrais](.cursor/skills/F3F-entidades-centrais/SKILL.md). Schema e RLS: [F3F-supabase-data-engineer](.cursor/skills/F3F-supabase-data-engineer/SKILL.md).
