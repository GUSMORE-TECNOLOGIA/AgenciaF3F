# Referência – F3F Migração e Tradução de Legado

Matriz de tradução técnica, checklist de migração e convenção para o Mapa de Tradução. **Registro progressivo:** migrações em andamento ou concluídas podem ser listadas ao final.

---

## Matriz de tradução técnica

| Elemento legado | Destino no F3F | Skill responsável |
|-----------------|----------------|-------------------|
| Banco de dados (Postgres/MySQL/outro) | Supabase (schema central) | F3F-supabase-data-engineer |
| Login / sessão própria | Supabase Auth (login único) | F3F-auth-rotas |
| Cadastro de "cliente" ou "pessoa" local (por sistema) | Tabela central (ex.: `clientes` ou `pessoas`) (ID único); referência por `cliente_id` / `pessoa_id` | F3F-entidades-centrais (modelo); F3F-supabase-data-engineer (tabela/RLS) |
| Tabelas por módulo no legado | Tabelas no F3F com FK para `cliente_id`/`user_id` (ex.: `atendimentos`, `agendamentos`) | F3F-supabase-data-engineer + F3F-entidades-centrais |
| HTML/CSS/Bootstrap/jQuery | React + Vite + Tailwind + shadcn/ui | F3F-frontend / F3F-ux-designer / F3F-componentes |
| Queries diretas no controller / script | Service → Repository (padrão F3F-backend) | F3F-backend |
| Regras de negócio em controller ou script | Services (casos de uso); entidades de domínio | F3F-backend |
| Permissões/roles no legado | RLS (Supabase) + perfil (Auth/Configurações) | F3F-supabase-data-engineer + F3F-auth-rotas |
| Dados a migrar (carga inicial) | Scripts SQL/migrations preservando `cliente_id`, desduplicação | F3F-supabase-data-engineer (executar); esta skill (definir plano) |

---

## Checklist de migração

Antes de dar por concluída uma migração (ou etapa de migração), conferir:

- [ ] **Desduplicação:** O dado que estou trazendo **já existe** no F3F? (ex.: mesma pessoa por CPF/documento). Se sim, **vincular via ID** (cliente_id, user_id); **não** criar novo registro.
- [ ] **Segurança:** O RLS do novo sistema **cobre** as permissões que existiam no antigo? (ex.: usuário A não vê dados do usuário B). Se necessário, acionar F3F-security-performance para auditoria após migração.
- [ ] **Limpeza:** Códigos mortos ou bibliotecas obsoletas do legado foram **descartados**? Não trazer para o repositório F3F código que não será usado (ou acionar F3F-limpeza-codigo após a migração para remover resquícios).
- [ ] **Mapa de Tradução:** O documento De: Legado → Para: F3F foi produzido e salvo (ex.: `.context/docs/migracao/mapa-<sistema>.md`); índice atualizado (F3F-documentacao).
- [ ] **Entidade única:** Nenhuma tabela migrada replica "cliente" ou "pessoa" como cadastro próprio por módulo; tudo referenciando a tabela central.

---

## Onde salvar o Mapa de Tradução

- **Sugestão:** `.context/docs/migracao/` (ex.: `mapa-traducao-sistema-legado.md`) ou dentro de `requisitos/` se for um doc de requisitos da migração.
- **Conteúdo mínimo:**
  - Nome do sistema legado e escopo (módulo(s), banco, stack).
  - Tabelas legado → tabelas F3F (e FKs para cliente_id/user_id).
  - Login/usuários legado → estratégia Supabase Auth (ex.: migração de usuários, vínculo com cliente_id).
  - Telas/fluxos legado → rotas e componentes F3F (referência a F3F-ux-designer/F3F-frontend).
  - Lógica/scripts legado → services e repositories (referência a F3F-backend).
  - Plano de dados: ordem de carga, desduplicação (ex.: por CPF), scripts ou migrations.
- **Índice:** Todo novo doc em `.context/docs/` deve ser listado no [.context/docs/README.md](.context/docs/README.md) (skill F3F-documentacao).

---

## Migrações (registro progressivo)

Listar aqui migrações em andamento ou concluídas para referência.

| Sistema legado | Escopo | Status | Mapa de Tradução (link) |
|----------------|--------|--------|--------------------------|
| *(ex.: Sistema v1)* | *(módulo; banco + stack)* | *(Planejado / Em andamento / Concluído)* | *(.context/docs/migracao/mapa-xxx.md)* |
| *(outros)* | | | Preencher ao iniciar migração. |

---

## Links

- [F3F-entidades-centrais](.cursor/skills/F3F-entidades-centrais/SKILL.md) – modelo entidade única, sem cadastros duplicados.
- [F3F-supabase-data-engineer](.cursor/skills/F3F-supabase-data-engineer/SKILL.md) – schema, RLS, migrations.
- [F3F-auth-rotas](.cursor/skills/F3F-auth-rotas/SKILL.md) – login único.
- [F3F-backend](.cursor/skills/F3F-backend/SKILL.md) – services e repositories.
- [skills-map.md](.context/docs/skills-map.md) – quando usar a skill Migração.
