---
name: F3F-entidades-centrais
description: "Central entities in F3F (AgenciaF3F): user (Auth + profile) and main business entity (e.g. cliente). Always reference by ID; no duplicate records. Use when defining or changing user/cliente model, central tables, or rules for 'one entity unique'."
---

# F3F Entidades centrais

Responsável por **usuário** (Auth + perfil) e **entidade principal do negócio** (ex.: **cliente** – cadastro único usado por várias áreas). Regra obrigatória: **sempre por ID**; **nunca duplicar cadastro**. Esta skill define o modelo, as tabelas centrais e as regras de uso; implementação de esquema no Supabase (skill F3F-supabase-data-engineer), de services/repositories (skill F3F-backend) e de auth/rotas (skill F3F-auth-rotas) segue as definições daqui. Referências: [project-overview.md](.context/docs/project-overview.md), [data-flow.md](.context/docs/data-flow.md).

## Regra de ouro

- **Uma entidade principal no banco:** existe uma única tabela central para a entidade principal (ex.: `clientes` ou `pessoas`). Módulos/áreas referenciam por `cliente_id` ou `pessoa_id`; não criam tabela própria com cópia de dados.
- **Um usuário no app:** um login (Supabase Auth) → um `user_id`; perfil define o que acessa. Operações sempre vinculadas ao `user_id` quando for dado do logado.
- **Sem cadastros duplicados:** nunca ter dois registros para a mesma pessoa física em contextos diferentes; nunca "usuário do módulo X" e "usuário do módulo Y" como duas contas. Esta skill valida que o modelo e o código respeitam isso.
- **Tabelas centrais:** usuário/perfil e entidade principal vivem em tabelas centrais; módulos têm apenas FKs. Definir e alterar esquema dessas tabelas é decisão desta skill; criar as migrations é com a skill F3F-supabase-data-engineer.

## Quando usar esta skill

- **Implementar ou alterar** o modelo de usuário (Auth + perfil): campos, tabela de perfil, vínculo com Auth.
- **Implementar ou alterar** o modelo da entidade principal (ex.: cliente): tabela única, campos (nome, CPF, endereço, etc.).
- **Garantir** que um novo fluxo ou módulo usa apenas IDs das entidades centrais (sem criar tabela paralela).
- **Migrar** ou consolidar cadastros duplicados existentes em um único registro por pessoa/usuário.
- **Dúvida** "onde cadastro o cliente?", "posso criar tabela própria no módulo X?", "como referencio a entidade?" → consultar ou definir via esta skill.

## Regras

- **Referência por ID:** em tabelas de módulo, usar sempre `user_id` (Auth) ou `cliente_id`/`pessoa_id` (entidade principal); nunca chave "nome + CPF" ou cópia de dados para "evitar join".
- **Cadastro em um só lugar:** o primeiro cadastro da entidade cria o registro central; demais módulos apenas referenciam e eventualmente enriquecem (tabelas do módulo com FK para a entidade central).
- **Registro progressivo:** decisões sobre nome da tabela central, campos obrigatórios e convenção de IDs devem ser documentadas no [reference.md](reference.md).
- **Prevenção de Duplicidade:** Toda tabela central de pessoas/clientes DEVE ter constraint UNIQUE no campo de documento (ex.: CPF). Verificar existência do documento antes de `INSERT`; fluxo de merge ou deduplicação se houver legado.

## Conteúdo do reference.md

O [reference.md](reference.md) contém:

- **Modelo das entidades:** Usuário (Auth + perfil), entidade principal (ex.: cliente); quem é responsável por cadastrar cada um.
- **Tabelas centrais:** onde vivem usuário/perfil e entidade principal; convenção de nomes e FKs.
- **Como referenciar:** uso de `user_id`, `cliente_id`/`pessoa_id` nas tabelas de módulos; quando usar cada um.
- **Código (shared/domain):** onde ficam tipos e entidades de domínio compartilhados; serviços centrais (se houver).

## Integração com outras skills

- **F3F-supabase-data-engineer:** tabelas centrais e RLS são definidas por esta skill (modelo); criação e alteração de schema e políticas ficam com a skill Supabase.
- **F3F-backend:** services e repositories que criam/alteram entidade central seguem o modelo desta skill; Backend implementa a lógica.
- **F3F-auth-rotas:** usuário e perfil vêm do Auth; esta skill define "o que é usuário/perfil no modelo"; Auth implementa login, sessão e proteção de rotas.
- **F3F-novo-modulo:** novo módulo não cria entidade central; só referencia por ID; a skill Novo módulo remete a esta skill para o modelo.
- **F3F-integracoes-vinculos:** contratos entre módulos usam cliente_id/user_id; esta skill define o significado desses IDs; Integrações documenta quem lê/escreve.

## Referência adicional

- Modelo, tabelas centrais, referência por ID: [reference.md](reference.md) (neste diretório).
- Regras de negócio: [project-overview.md](.context/docs/project-overview.md). Fluxo de dados: [data-flow.md](.context/docs/data-flow.md).
